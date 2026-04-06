"use client"

import {
  addCashMovement,
  closeCashSession,
  createCashRegister,
  deleteCashRegister,
  getCashRegisterSummary,
  getCashRegistersPageData,
  openCashSession,
  updateCashRegister,
  uploadCashRegisterArcaCertificates,
  type CashRegisterRow,
  type CashRegisterSummaryData,
  type ClosingSnapshot,
} from "@/app/[siteId]/[popId]/cash-registers/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  DoorClosed,
  DoorOpen,
  FileDown,
  FileSpreadsheet,
  FileText,
  Gamepad2,
  Maximize2,
  Minimize2,
  MinusCircle,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatDateTime(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("es", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}

function shortUserId(id: string | null) {
  if (!id) return "—"
  return id.length > 14 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id
}

function sessionOpenedLabel(
  sessionId: string,
  sessions: { id: string; openedAt: string }[],
): string {
  const s = sessions.find((x) => x.id === sessionId)
  return s ? formatDateTime(s.openedAt) : shortUserId(sessionId)
}

const dialogConsoleClass =
  "border border-cyan-500/25 bg-zinc-950/98 text-zinc-100 shadow-[0_0_80px_-12px_rgba(34,211,238,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-2xl"

const fieldClass =
  "border-zinc-700/90 bg-zinc-950/90 text-cyan-50 placeholder:text-zinc-600 focus-visible:border-cyan-500/60 focus-visible:ring-cyan-500/25"

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500"

const btnGhostConsole =
  "border border-zinc-600/80 bg-zinc-900/80 text-zinc-200 hover:border-cyan-500/40 hover:bg-zinc-800 hover:text-cyan-100"

const btnPrimaryConsole =
  "border border-cyan-400/40 bg-gradient-to-b from-cyan-500/90 to-cyan-600/90 text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:from-cyan-400 hover:to-cyan-500 hover:shadow-[0_0_32px_rgba(34,211,238,0.5)]"

function CashRegistersPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [registers, setRegisters] = useState<CashRegisterRow[]>([])
  const [paymentMethods, setPaymentMethods] = useState<
    { id: string; name: string; sortOrder: number; kind: string }[]
  >([])
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createBanner, setCreateBanner] = useState<string | null>(null)
  const [createName, setCreateName] = useState("")
  const [createSort, setCreateSort] = useState(0)

  const [editRow, setEditRow] = useState<CashRegisterRow | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editBanner, setEditBanner] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editSort, setEditSort] = useState(0)
  const [editActive, setEditActive] = useState(true)
  const [editArcaPtoVta, setEditArcaPtoVta] = useState("")
  const [editArcaExpiresAt, setEditArcaExpiresAt] = useState("")
  const editCrtRef = useRef<HTMLInputElement>(null)
  const editKeyRef = useRef<HTMLInputElement>(null)

  const [deleteRow, setDeleteRow] = useState<CashRegisterRow | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteBanner, setDeleteBanner] = useState<string | null>(null)

  const [openRow, setOpenRow] = useState<CashRegisterRow | null>(null)
  const [openSaving, setOpenSaving] = useState(false)
  const [openBanner, setOpenBanner] = useState<string | null>(null)
  const [openingCash, setOpeningCash] = useState("0")
  const [openingNote, setOpeningNote] = useState("")

  const [closeRow, setCloseRow] = useState<CashRegisterRow | null>(null)
  const [closeSaving, setCloseSaving] = useState(false)
  const [closeBanner, setCloseBanner] = useState<string | null>(null)
  const [closeCash, setCloseCash] = useState("")
  const [closePm, setClosePm] = useState<Record<string, string>>({})
  const [closeNote, setCloseNote] = useState("")

  const [moveRow, setMoveRow] = useState<CashRegisterRow | null>(null)
  const [moveKind, setMoveKind] = useState<"deposit" | "withdrawal">("deposit")
  const [moveSaving, setMoveSaving] = useState(false)
  const [moveBanner, setMoveBanner] = useState<string | null>(null)
  const [moveAmount, setMoveAmount] = useState("")
  const [moveNote, setMoveNote] = useState("")

  const [summaryRow, setSummaryRow] = useState<CashRegisterRow | null>(null)
  const [summaryData, setSummaryData] = useState<CashRegisterSummaryData | null>(
    null,
  )
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getCashRegistersPageData(popId)
    if (!res.success) {
      setError(res.error || "Error")
      setRegisters([])
      setPaymentMethods([])
      setCanCreate(false)
      setCanUpdate(false)
      setCanDelete(false)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setPopName(res.popName)
    setRegisters(res.registers)
    setPaymentMethods(res.paymentMethods)
    setCanCreate(res.canCreate)
    setCanUpdate(res.canUpdate)
    setCanDelete(res.canDelete)
    setError(null)
  }, [popId, siteId])

  useEffect(() => {
    if (!popId || !siteId) {
      setLoading(false)
      setError("Store ID not found")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await load()
      } catch {
        if (!cancelled) setError("Unexpected error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId, siteId, load])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    sync()
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen()
  }

  const openCreate = () => {
    setCreateBanner(null)
    setCreateName("")
    setCreateSort(0)
    setCreateOpen(true)
  }

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId) return
    setCreateSaving(true)
    setCreateBanner(null)
    const res = await createCashRegister(popId, {
      name: createName,
      sortOrder: createSort,
    })
    setCreateSaving(false)
    if (!res.success) {
      setCreateBanner(res.error)
      return
    }
    setCreateOpen(false)
    await load()
  }

  const startEdit = (r: CashRegisterRow) => {
    setEditBanner(null)
    setEditRow(r)
    setEditName(r.name)
    setEditSort(r.sortOrder)
    setEditActive(r.isActive)
    setEditArcaPtoVta(r.arcaPtoVta != null ? String(r.arcaPtoVta) : "")
    setEditArcaExpiresAt(r.arcaCertificateExpiresAt ?? "")
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !editRow) return
    setEditSaving(true)
    setEditBanner(null)
    const ptoRaw = editArcaPtoVta.trim()
    const ptoParsed = ptoRaw === "" ? null : Number(ptoRaw)
    if (
      ptoParsed != null &&
      (!Number.isFinite(ptoParsed) ||
        ptoParsed < 0 ||
        ptoParsed > 99999)
    ) {
      setEditBanner("Punto de venta inválido (0–99999 o vacío).")
      setEditSaving(false)
      return
    }
    const crt = editCrtRef.current?.files?.[0]
    const key = editKeyRef.current?.files?.[0]
    if ((crt && !key) || (!crt && key)) {
      setEditBanner("Subí ambos archivos (.crt y .key) o ninguno.")
      setEditSaving(false)
      return
    }
    if (crt && key) {
      const fd = new FormData()
      fd.append("crt", crt)
      fd.append("key", key)
      const exp = editArcaExpiresAt.trim().slice(0, 10)
      if (exp.length > 0) fd.append("expiresAt", exp)
      const up = await uploadCashRegisterArcaCertificates(popId, editRow.id, fd)
      if (!up.success) {
        setEditBanner(up.error)
        setEditSaving(false)
        return
      }
      if (editCrtRef.current) editCrtRef.current.value = ""
      if (editKeyRef.current) editKeyRef.current.value = ""
    }
    const res = await updateCashRegister(popId, editRow.id, {
      name: editName,
      sortOrder: editSort,
      isActive: editActive,
      arcaPtoVta: ptoParsed,
      arcaCertificateSecretName: editRow.arcaCertificateSecretName ?? null,
      arcaCertificateLastFour: editRow.arcaCertificateLastFour ?? null,
      arcaCertificateExpiresAt: editArcaExpiresAt.trim().slice(0, 10) || null,
    })
    setEditSaving(false)
    if (!res.success) {
      setEditBanner(res.error)
      return
    }
    setEditRow(null)
    await load()
  }

  const submitDelete = async () => {
    if (!popId || !siteId || !deleteRow) return
    setDeleteBusy(true)
    setDeleteBanner(null)
    const res = await deleteCashRegister(popId, deleteRow.id)
    setDeleteBusy(false)
    if (!res.success) {
      setDeleteBanner(res.error)
      return
    }
    setDeleteRow(null)
    await load()
  }

  const startOpen = (r: CashRegisterRow) => {
    setOpenBanner(null)
    setOpeningCash("0")
    setOpeningNote("")
    setOpenRow(r)
  }

  const submitOpen = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !openRow) return
    setOpenSaving(true)
    setOpenBanner(null)
    const res = await openCashSession(
      popId,
      openRow.id,
      Number(openingCash),
      openingNote,
    )
    setOpenSaving(false)
    if (!res.success) {
      setOpenBanner(res.error)
      return
    }
    setOpenRow(null)
    await load()
  }

  const startClose = (r: CashRegisterRow) => {
    if (!r.openSessionId) return
    setCloseBanner(null)
    setCloseNote("")
    setCloseCash(
      r.cashBalance != null ? String(r.cashBalance) : "",
    )
    const next: Record<string, string> = {}
    for (const pm of paymentMethods) {
      if (pm.kind !== "cash") next[pm.id] = "0"
    }
    setClosePm(next)
    setCloseRow(r)
  }

  const submitClose = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !closeRow?.openSessionId) return
    setCloseSaving(true)
    setCloseBanner(null)
    const pm: Record<string, number> = {}
    for (const [k, v] of Object.entries(closePm)) {
      const n = Number(v)
      if (Number.isFinite(n)) pm[k] = n
    }
    const snapshot: ClosingSnapshot = {
      cash: Number(closeCash),
      payment_methods: pm,
      note: closeNote.trim() || undefined,
    }
    const res = await closeCashSession(
      popId,
      closeRow.openSessionId,
      snapshot,
    )
    setCloseSaving(false)
    if (!res.success) {
      setCloseBanner(res.error)
      return
    }
    setCloseRow(null)
    await load()
  }

  const startMove = (r: CashRegisterRow, kind: "deposit" | "withdrawal") => {
    if (!r.openSessionId) return
    setMoveKind(kind)
    setMoveBanner(null)
    setMoveAmount("")
    setMoveNote("")
    setMoveRow(r)
  }

  const submitMove = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !moveRow?.openSessionId) return
    setMoveSaving(true)
    setMoveBanner(null)
    const res = await addCashMovement(popId, moveRow.openSessionId, {
      kind: moveKind,
      amount: Number(moveAmount),
      note: moveNote,
    })
    setMoveSaving(false)
    if (!res.success) {
      setMoveBanner(res.error)
      return
    }
    setMoveRow(null)
    await load()
  }

  const openSummary = async (r: CashRegisterRow) => {
    if (!popId || !siteId) return
    setSummaryRow(r)
    setSummaryData(null)
    setSummaryError(null)
    setSummaryLoading(true)
    const res = await getCashRegisterSummary(popId, r.id)
    setSummaryLoading(false)
    if (!res.success) {
      setSummaryError(res.error)
      return
    }
    setSummaryData(res.data)
  }

  const headerUserName = useMemo(() => {
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "User"
  }, [user?.email, user?.user_metadata?.full_name])

  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=e8f5ef`

  useEffect(() => {
    if (!closeRow || paymentMethods.length === 0) return
    setClosePm((prev) => {
      const next = { ...prev }
      for (const pm of paymentMethods) {
        if (pm.kind === "cash") continue
        if (next[pm.id] === undefined) next[pm.id] = "0"
      }
      return next
    })
  }, [closeRow, paymentMethods])

  if (!popId || !siteId) {
    return (
      <div className="min-h-screen bg-[#030308] p-10 text-zinc-400">
        <p className="text-sm font-mono">Store ID not found</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030308] text-zinc-100 antialiased selection:bg-cyan-500/35">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(56,189,248,0.14),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_100%,rgba(147,51,234,0.08),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] opacity-[0.35]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-white/[0.08] bg-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="grid h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={popMenuHref(siteId, popId)}
                className="group inline-flex size-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/90 text-zinc-300 transition-all hover:border-cyan-500/50 hover:bg-zinc-800 hover:text-cyan-200 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                aria-label="Back to menu"
              >
                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
              <div className="h-6 w-px bg-gradient-to-b from-transparent via-zinc-600 to-transparent" />
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="size-8 overflow-hidden rounded-md border border-zinc-600/80 ring-1 ring-white/5">
                  <img
                    src={popLogoSrc}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <span className="truncate text-sm font-medium tracking-wide text-zinc-300">
                  {popName || (loading ? "…" : "—")}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3">
              <h1 className="flex items-center gap-2.5 text-xl font-black tracking-tight sm:text-[1.65rem]">
                <span className="relative inline-flex size-10 items-center justify-center rounded-lg border border-cyan-500/35 bg-gradient-to-b from-zinc-800/90 to-black text-cyan-300 shadow-[0_0_28px_rgba(34,211,238,0.25),inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <Gamepad2 className="size-5" aria-hidden />
                  <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
                </span>
                <span className="bg-gradient-to-r from-white via-zinc-100 to-cyan-300/90 bg-clip-text text-transparent">
                  Cash registers
                </span>
              </h1>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
                  isOnline
                    ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
                    : "border-red-500/40 bg-red-950/40 text-red-300",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isOnline
                      ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                      : "bg-red-400",
                  )}
                  aria-hidden
                />
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              {canCreate ? (
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5 rounded-lg font-semibold",
                    btnPrimaryConsole,
                  )}
                  onClick={() => openCreate()}
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Add register</span>
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/80 text-zinc-400 transition-colors hover:border-cyan-500/40 hover:text-cyan-200"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4.5" />
                ) : (
                  <Maximize2 className="size-4.5" />
                )}
              </button>
              <div className="hidden h-6 w-px bg-zinc-700/80 sm:block" />
              <div className="flex items-center gap-3">
                <Avatar className="size-10 border border-zinc-600/80 ring-2 ring-black/50">
                  <AvatarImage src={userAvatarSrc} alt="" />
                  <AvatarFallback className="bg-zinc-800 text-xs font-bold text-cyan-300">
                    {headerUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-zinc-200">
                    {headerUserName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/90">
                    <Zap className="size-3" aria-hidden />
                    Terminal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="animate-pulse font-mono text-sm text-cyan-500/70">
              Loading terminal…
            </p>
          ) : error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-950/40 px-4 py-3 font-mono text-sm text-red-200">
              {error}
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-zinc-950/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm sm:p-5">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Open a cash session to track physical cash in the drawer. Close
                  with counted cash and final totals per payment method. Sales
                  and other flows will feed this later; balances today are opening
                  cash plus deposits minus withdrawals.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
                {registers.length === 0 ? (
                  <p className="font-mono text-sm text-zinc-500">
                    No registers configured — add a terminal to begin.
                  </p>
                ) : (
                  registers.map((r) => (
                    <div
                      key={r.id}
                      className="group relative overflow-hidden rounded-xl border border-zinc-700/70 bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-black p-[1px] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.05)]"
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
                      <div className="rounded-[11px] bg-gradient-to-b from-zinc-900/98 to-black p-5">
                        <div className="mb-4 flex flex-row items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold tracking-tight text-white">
                              {r.name}
                            </h3>
                            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.15em] text-zinc-500">
                              Unit · sort {r.sortOrder}
                              {!r.isActive ? " · offline" : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-9 border border-transparent text-zinc-400 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-200"
                              onClick={() => void openSummary(r)}
                              aria-label="Ver resumen de caja"
                              title="Resumen"
                            >
                              <FileText className="size-4" />
                            </Button>
                            {canUpdate ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 border border-transparent text-zinc-400 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-200"
                                onClick={() => startEdit(r)}
                                aria-label="Edit"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            ) : null}
                            {canDelete ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-9 text-zinc-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                                onClick={() => setDeleteRow(r)}
                                aria-label="Delete"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
                          <span className={labelClass}>Session</span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-2 rounded border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
                              r.openSessionId
                                ? "border-emerald-500/35 bg-emerald-950/40 text-emerald-300"
                                : "border-zinc-600 bg-zinc-900/80 text-zinc-500",
                            )}
                          >
                            <span
                              className={cn(
                                "size-1.5 rounded-full",
                                r.openSessionId
                                  ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                                  : "bg-zinc-600",
                              )}
                              aria-hidden
                            />
                            {r.openSessionId ? "Live" : "Standby"}
                          </span>
                        </div>

                        {r.openSessionId ? (
                          <div className="space-y-4">
                            {r.openSessionTotals ? (
                              <>
                                <div className="relative overflow-hidden rounded-lg border border-cyan-500/25 bg-black/70 px-4 py-4 shadow-[inset_0_2px_32px_rgba(34,211,238,0.07)]">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className={labelClass}>
                                      Efectivo teórico en cajón
                                    </span>
                                    <span className="font-mono text-[10px] text-cyan-600/80">
                                      EN VIVO
                                    </span>
                                  </div>
                                  <div className="font-mono text-3xl font-light tabular-nums tracking-wide text-cyan-300 [text-shadow:0_0_24px_rgba(34,211,238,0.35)]">
                                    {formatMoney(
                                      r.openSessionTotals.efectivoTeoricoEnCajon,
                                    )}
                                  </div>
                                  <p className="mt-2 font-mono text-[10px] leading-relaxed text-zinc-500">
                                    Apertura + ventas en efectivo + ingresos al
                                    cajón − retiros
                                  </p>
                                  <div className="mt-3 grid gap-2 border-t border-white/[0.06] pt-3 font-mono text-[11px] text-zinc-400 sm:grid-cols-2">
                                    <div>
                                      <span className="text-zinc-600">
                                        Apertura{" "}
                                      </span>
                                      <span className="tabular-nums text-zinc-300">
                                        {formatMoney(
                                          r.openSessionTotals.openingCash,
                                        )}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-600">
                                        + Ventas efectivo{" "}
                                      </span>
                                      <span className="tabular-nums text-emerald-400/90">
                                        {formatMoney(
                                          r.openSessionTotals.ventasEfectivo,
                                        )}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-600">
                                        + Ingresos cajón{" "}
                                      </span>
                                      <span className="tabular-nums text-emerald-400/90">
                                        {formatMoney(
                                          r.openSessionTotals.ingresosCajon,
                                        )}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-zinc-600">
                                        − Retiros{" "}
                                      </span>
                                      <span className="tabular-nums text-rose-400/90">
                                        {formatMoney(
                                          r.openSessionTotals.egresosCajon,
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {r.openSessionTotals.totalCobradoTurno !=
                                null ? (
                                  <>
                                    <div className="rounded-lg border border-violet-500/25 bg-violet-950/25 px-4 py-4 shadow-[inset_0_2px_24px_rgba(139,92,246,0.08)]">
                                      <span className={labelClass}>
                                        Total cobrado en el turno
                                      </span>
                                      <p className="mt-0.5 text-[11px] text-zinc-500">
                                        Suma de ventas completadas (todas las
                                        formas de pago en esta caja)
                                      </p>
                                      <div className="mt-2 font-mono text-3xl font-light tabular-nums tracking-wide text-violet-200">
                                        {formatMoney(
                                          r.openSessionTotals.totalCobradoTurno,
                                        )}
                                      </div>
                                    </div>
                                    {r.openSessionTotals.cobrosPorMedio &&
                                    r.openSessionTotals.cobrosPorMedio.length >
                                      0 ? (
                                      <div className="rounded-lg border border-white/[0.08] bg-black/50 px-3 py-3">
                                        <span className={labelClass}>
                                          Cobros por medio de pago (turno)
                                        </span>
                                        <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto font-mono text-xs">
                                          {r.openSessionTotals.cobrosPorMedio.map(
                                            (row, idx) => (
                                              <li
                                                key={`${row.name}-${idx}`}
                                                className="flex items-baseline justify-between gap-2 border-b border-white/[0.04] pb-1.5 last:border-0 last:pb-0"
                                              >
                                                <span className="min-w-0 truncate text-zinc-400">
                                                  {row.name}
                                                  <span className="ml-1 text-zinc-600">
                                                    ({row.kind})
                                                  </span>
                                                </span>
                                                <span className="shrink-0 tabular-nums text-emerald-300/90">
                                                  {formatMoney(row.total)}
                                                </span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>
                                    ) : null}
                                  </>
                                ) : (
                                  <p className="rounded-lg border border-zinc-700/50 bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500">
                                    Sin permiso de lectura de ventas (
                                    <code className="text-zinc-400">
                                      sale:read
                                    </code>
                                    ): no se muestra el total cobrado ni el
                                    desglose por medio. El efectivo teórico
                                    arriba sigue el arqueo de caja.
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="relative overflow-hidden rounded-lg border border-cyan-500/25 bg-black/70 px-4 py-4">
                                <span className={labelClass}>
                                  Saldo cajón (sin detalle completo)
                                </span>
                                <div className="mt-2 font-mono text-3xl font-light tabular-nums text-cyan-300">
                                  {r.cashBalance != null
                                    ? formatMoney(r.cashBalance)
                                    : "—.--"}
                                </div>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {canCreate ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className={cn(
                                      "gap-1 rounded-lg font-semibold",
                                      btnGhostConsole,
                                    )}
                                    onClick={() => startMove(r, "deposit")}
                                  >
                                    <Plus className="size-3.5" />
                                    Deposit
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className={cn(
                                      "gap-1 rounded-lg font-semibold",
                                      btnGhostConsole,
                                    )}
                                    onClick={() => startMove(r, "withdrawal")}
                                  >
                                    <MinusCircle className="size-3.5" />
                                    Withdraw
                                  </Button>
                                </>
                              ) : null}
                              {canUpdate ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  className={cn(
                                    "gap-1 rounded-lg font-semibold",
                                    btnPrimaryConsole,
                                  )}
                                  onClick={() => startClose(r)}
                                >
                                  <DoorClosed className="size-3.5" />
                                  Cerrar caja
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          canCreate &&
                          r.isActive && (
                            <Button
                              type="button"
                              size="sm"
                              className={cn(
                                "w-full gap-2 rounded-lg py-6 font-bold",
                                btnPrimaryConsole,
                              )}
                              onClick={() => startOpen(r)}
                            >
                              <DoorOpen className="size-4" />
                              Initialize session
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(dialogConsoleClass, "sm:max-w-md")}
        >
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Add cash register
            </DialogTitle>
          </DialogHeader>
          {createBanner ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
              {createBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
            <div className="space-y-2">
              <Label htmlFor="cr-name" className={labelClass}>
                Name
              </Label>
              <Input
                id="cr-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr-sort" className={labelClass}>
                Sort order
              </Label>
              <Input
                id="cr-sort"
                type="number"
                value={createSort}
                onChange={(e) => setCreateSort(Number(e.target.value))}
                className={fieldClass}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className={btnGhostConsole}
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSaving}
                className={btnPrimaryConsole}
              >
                {createSaving ? "Saving…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editRow !== null} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(dialogConsoleClass, "sm:max-w-md")}
        >
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Editar caja registradora
            </DialogTitle>
          </DialogHeader>
          {editBanner ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
              {editBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitEdit(e)}>
            <div className="space-y-2">
              <Label htmlFor="e-cr-name" className={labelClass}>
                Name
              </Label>
              <Input
                id="e-cr-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className={fieldClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-cr-sort" className={labelClass}>
                Sort order
              </Label>
              <Input
                id="e-cr-sort"
                type="number"
                value={editSort}
                onChange={(e) => setEditSort(Number(e.target.value))}
                className={fieldClass}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="size-4 rounded border-zinc-600 bg-zinc-900 accent-cyan-500"
              />
              Active
            </label>
            <div className="space-y-4 border-t border-zinc-700/80 pt-4">
              <p className={labelClass}>Facturación electrónica (ARCA)</p>
              <p className="text-xs leading-relaxed text-zinc-500">
                Punto de venta AFIP y el par certificado / clave privada. Los
                archivos se suben al bucket privado y solo los usa el servidor
                (service role).
              </p>
              <div className="space-y-2">
                <Label htmlFor="e-arca-pto" className={labelClass}>
                  Punto de venta
                </Label>
                <Input
                  id="e-arca-pto"
                  type="number"
                  min={0}
                  max={99999}
                  value={editArcaPtoVta}
                  onChange={(e) => setEditArcaPtoVta(e.target.value)}
                  placeholder="Vacío o 0–99999"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-arca-exp" className={labelClass}>
                  Vencimiento del certificado (opcional)
                </Label>
                <Input
                  id="e-arca-exp"
                  type="date"
                  value={editArcaExpiresAt}
                  onChange={(e) => setEditArcaExpiresAt(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-arca-crt" className={labelClass}>
                  Certificado (.crt)
                </Label>
                <Input
                  id="e-arca-crt"
                  ref={editCrtRef}
                  type="file"
                  accept=".crt,.pem,.key,text/plain,text/*"
                  className={cn(fieldClass, "py-2")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="e-arca-key" className={labelClass}>
                  Clave privada (.key)
                </Label>
                <Input
                  id="e-arca-key"
                  ref={editKeyRef}
                  type="file"
                  accept=".crt,.pem,.key,text/plain,text/*"
                  className={cn(fieldClass, "py-2")}
                />
              </div>
              <p className="text-xs text-zinc-600">
                Dejá ambos archivos vacíos si no querés reemplazar el par
                guardado.
              </p>
              {editRow?.arcaCrtUploadedAt ? (
                <p className="text-xs text-cyan-400/90">
                  Última subida:{" "}
                  <span className="text-zinc-400">.crt</span>{" "}
                  {formatDateTime(editRow.arcaCrtUploadedAt)} ·{" "}
                  <span className="text-zinc-400">.key</span>{" "}
                  {editRow.arcaKeyUploadedAt
                    ? formatDateTime(editRow.arcaKeyUploadedAt)
                    : "—"}
                </p>
              ) : (
                <p className="text-xs text-zinc-600">
                  Aún no hay certificados en el bucket para esta caja.
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className={btnGhostConsole}
                onClick={() => setEditRow(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={editSaving}
                className={btnPrimaryConsole}
              >
                {editSaving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteRow !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteRow(null)
            setDeleteBanner(null)
          }
        }}
      >
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(dialogConsoleClass, "sm:max-w-md")}
        >
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Delete cash register?
            </DialogTitle>
          </DialogHeader>
          {deleteBanner ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
              {deleteBanner}
            </p>
          ) : null}
          <p className="text-sm text-zinc-400">
            This will remove{" "}
            <strong className="text-cyan-200">
              {deleteRow?.name || "this register"}
            </strong>{" "}
            and its history. The register must be closed.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className={btnGhostConsole}
              onClick={() => setDeleteRow(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              className="border border-red-500/50 bg-red-950/80 font-semibold text-red-100 hover:bg-red-900"
              onClick={() => void submitDelete()}
            >
              {deleteBusy ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openRow !== null} onOpenChange={(o) => !o && setOpenRow(null)}>
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(dialogConsoleClass, "sm:max-w-md")}
        >
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Open register
            </DialogTitle>
          </DialogHeader>
          {openBanner ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
              {openBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitOpen(e)}>
            <div className="space-y-2">
              <Label htmlFor="op-cash" className={labelClass}>
                Opening cash counted
              </Label>
              <Input
                id="op-cash"
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                min={0}
                step="0.01"
                className={cn(fieldClass, "font-mono text-lg")}
                required
              />
              <p className="text-xs text-zinc-500">
                Count the physical cash in the drawer. Other payment channels
                are usually not tracked at open unless you later reconcile them
                at close.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-note" className={labelClass}>
                Note (optional)
              </Label>
              <Textarea
                id="op-note"
                value={openingNote}
                onChange={(e) => setOpeningNote(e.target.value)}
                placeholder="e.g. vouchers left from previous shift, irregularities…"
                rows={3}
                className={cn(fieldClass, "resize-y")}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className={btnGhostConsole}
                onClick={() => setOpenRow(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={openSaving}
                className={btnPrimaryConsole}
              >
                {openSaving ? "Opening…" : "Open"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={closeRow !== null} onOpenChange={(o) => !o && setCloseRow(null)}>
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(dialogConsoleClass, "sm:max-w-lg")}
        >
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              Cerrar caja (cierre de arqueo)
            </DialogTitle>
          </DialogHeader>
          {closeBanner ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
              {closeBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitClose(e)}>
            <p className="text-sm leading-relaxed text-zinc-400">
              Contá el <strong className="text-zinc-300">efectivo físico</strong>{" "}
              que hay en el cajón y cargalo abajo: es lo que permite ver faltantes
              o sobrantes frente al efectivo teórico del turno. Para tarjetas,
              transferencias y otros medios digitales, el sistema ya tiene los
              importes por venta: podés cargar el total que informe tu liquidación
              o dejarlo en 0 si asumís que coincide; sirve para registrar
              diferencias con el adquirente o el banco.
            </p>
            <div className="space-y-2">
              <Label htmlFor="cl-cash" className={labelClass}>
                Efectivo contado al cierre
              </Label>
              <Input
                id="cl-cash"
                type="number"
                value={closeCash}
                onChange={(e) => setCloseCash(e.target.value)}
                min={0}
                step="0.01"
                required
                className={cn(fieldClass, "font-mono")}
              />
            </div>
            {paymentMethods.filter((pm) => pm.kind !== "cash").length > 0 ? (
              <div className="space-y-3">
                <Label className={labelClass}>
                  Otros medios (conteo / liquidación del turno)
                </Label>
                <p className="text-xs text-zinc-500">
                  Opcional: totales esperados o informados por cierre; el efectivo
                  va arriba.
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/30 p-3">
                  {paymentMethods
                    .filter((pm) => pm.kind !== "cash")
                    .map((pm) => (
                    <div key={pm.id} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-300">
                        {pm.name}
                      </span>
                      <Input
                        type="number"
                        value={closePm[pm.id] ?? "0"}
                        onChange={(e) =>
                          setClosePm((m) => ({
                            ...m,
                            [pm.id]: e.target.value,
                          }))
                        }
                        min={0}
                        step="0.01"
                        className={cn(fieldClass, "w-32 font-mono")}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                No payment methods found for this store (or permission is
                missing). You can still close with cash only.
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="cl-note" className={labelClass}>
                Nota de cierre (faltantes, sobrantes, referencias)
              </Label>
              <Textarea
                id="cl-note"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Ej. diferencia con liquidación, retiros justificados…"
                rows={3}
                className={cn(fieldClass, "resize-y")}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className={btnGhostConsole}
                onClick={() => setCloseRow(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={closeSaving}
                className={btnPrimaryConsole}
              >
                {closeSaving ? "Cerrando…" : "Cerrar caja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={summaryRow !== null}
        onOpenChange={(o) => {
          if (!o) {
            setSummaryRow(null)
            setSummaryData(null)
            setSummaryError(null)
          }
        }}
      >
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(
            dialogConsoleClass,
            "flex !h-[min(92vh,880px)] !max-h-[min(92vh,880px)] !w-[min(96vw,1100px)] !max-w-[min(96vw,1100px)] flex-col gap-0 overflow-hidden p-0 sm:!max-w-[min(96vw,1100px)]",
          )}
        >
          <div className="flex shrink-0 flex-col gap-1 border-b border-white/[0.08] px-5 py-4 pr-14">
            <DialogTitle className="bg-gradient-to-r from-white to-violet-200/90 bg-clip-text text-left text-lg font-bold tracking-tight text-transparent">
              Arqueo de caja · {summaryRow?.name ?? "—"}
            </DialogTitle>
            <DialogDescription className="text-left text-xs text-zinc-500">
              Totales por forma de pago según ventas registradas en esta caja,
              efectivo teórico del turno abierto, movimientos de cajón y cierres
              contados.
            </DialogDescription>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled
                className={cn(btnGhostConsole, "pointer-events-none opacity-50")}
                title="Próximamente"
              >
                <Printer className="size-3.5" aria-hidden />
                Imprimir
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled
                className={cn(btnGhostConsole, "pointer-events-none opacity-50")}
                title="Próximamente"
              >
                <FileSpreadsheet className="size-3.5" aria-hidden />
                Excel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled
                className={cn(btnGhostConsole, "pointer-events-none opacity-50")}
                title="Próximamente"
              >
                <FileDown className="size-3.5" aria-hidden />
                PDF
              </Button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {summaryLoading ? (
              <p className="animate-pulse font-mono text-sm text-violet-400/80">
                Cargando resumen…
              </p>
            ) : summaryError ? (
              <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
                {summaryError}
              </p>
            ) : summaryData ? (
              <div className="space-y-8">
                <section className="rounded-lg border border-cyan-500/25 bg-black/45 p-4">
                  <h4 className={cn(labelClass, "mb-1 text-cyan-300/90")}>
                    Arqueo de caja
                  </h4>
                  <p className="mb-4 text-xs text-zinc-500">
                    Los importes por medio de pago suman las{" "}
                    <strong className="text-zinc-400">ventas completadas</strong>{" "}
                    hechas con esta caja. El efectivo en cajón del turno actual es:{" "}
                    <strong className="text-zinc-400">
                      apertura + ventas en efectivo + ingresos al cajón − retiros
                    </strong>
                    . Los totales de tarjeta/transferencia suelen coincidir con el
                    sistema; igual podés contrastarlos al cerrar si tu adquirente
                    informa diferencias.
                  </p>
                  {!summaryData.arqueo ? (
                    <p className="font-mono text-sm text-zinc-500">
                      Sin datos de arqueo (falta permiso de lectura de ventas).
                    </p>
                  ) : (
                    <>
                      <div className="mb-4 overflow-x-auto rounded border border-zinc-800/80">
                        <table className="w-full min-w-[420px] border-collapse font-mono text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-[10px] uppercase tracking-widest text-zinc-500">
                              <th className="px-3 py-2">Medio de pago</th>
                              <th className="px-3 py-2">Tipo</th>
                              <th className="px-3 py-2 text-right">
                                Total ventas (caja)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {summaryData.arqueo.ventasPorMedioPago.length ===
                            0 ? (
                              <tr>
                                <td
                                  colSpan={3}
                                  className="px-3 py-3 text-zinc-600"
                                >
                                  Sin ventas completadas aún en esta caja.
                                </td>
                              </tr>
                            ) : (
                              summaryData.arqueo.ventasPorMedioPago.map((row) => (
                                <tr
                                  key={row.paymentMethodId}
                                  className="border-b border-zinc-800/50 text-zinc-200"
                                >
                                  <td className="px-3 py-2">{row.name}</td>
                                  <td className="px-3 py-2 text-zinc-500">
                                    {row.kind}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums">
                                    {formatMoney(row.totalVentas)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                      {summaryData.arqueo.sesionAbierta ? (
                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-3">
                          <p className={cn(labelClass, "mb-2 text-emerald-400/90")}>
                            Turno abierto (efectivo físico)
                          </p>
                          <div className="grid gap-2 font-mono text-sm sm:grid-cols-2">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                                Efectivo al abrir
                              </p>
                              <p className="text-cyan-200 tabular-nums">
                                {formatMoney(
                                  summaryData.arqueo.sesionAbierta.openingCash,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                                + Ventas efectivo (turno)
                              </p>
                              <p className="text-emerald-300/90 tabular-nums">
                                {formatMoney(
                                  summaryData.arqueo.sesionAbierta.ventasEfectivo,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                                + Ingresos al cajón
                              </p>
                              <p className="text-emerald-300/90 tabular-nums">
                                {formatMoney(
                                  summaryData.arqueo.sesionAbierta.ingresosCajon,
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                                − Retiros del cajón
                              </p>
                              <p className="text-rose-300/90 tabular-nums">
                                {formatMoney(
                                  summaryData.arqueo.sesionAbierta.egresosCajon,
                                )}
                              </p>
                            </div>
                            <div className="sm:col-span-2 border-t border-white/10 pt-2">
                              <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                                = Efectivo teórico en cajón (para comparar al
                                contar)
                              </p>
                              <p className="text-lg font-semibold text-white tabular-nums">
                                {formatMoney(
                                  summaryData.arqueo.sesionAbierta
                                    .efectivoTeoricoEnCajon,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-600">
                          No hay sesión abierta: el desglose de efectivo del turno
                          aparece cuando la caja está abierta.
                        </p>
                      )}
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <p className={cn(labelClass, "mb-2 text-zinc-500")}>
                          Movimientos de cajón (todas las sesiones)
                        </p>
                        <div className="grid gap-3 font-mono text-sm sm:grid-cols-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                              Ingresos (depósitos)
                            </p>
                            <p className="text-lg text-emerald-300 tabular-nums">
                              {formatMoney(summaryData.totals.depositTotal)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                              Egresos (retiros)
                            </p>
                            <p className="text-lg text-rose-300 tabular-nums">
                              {formatMoney(summaryData.totals.withdrawalTotal)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
                              Neto ingresos − retiros
                            </p>
                            <p className="text-lg text-cyan-300 tabular-nums">
                              {formatMoney(summaryData.totals.netCashMovements)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </section>

                <section className="rounded-lg border border-white/[0.07] bg-black/40 p-4">
                  <h4 className={cn(labelClass, "mb-1 text-zinc-400")}>
                    Ventas recientes (detalle)
                  </h4>
                  <p className="mb-3 text-xs text-zinc-600">
                    Cada venta guarda la sesión de caja abierta al facturar. Solo
                    se listan ventas de esta caja registradora.
                  </p>
                  {!summaryData.salesIncluded ? (
                    <p className="font-mono text-sm text-zinc-500">
                      No tenés permiso para ver ventas (`sale:read`). Pedí acceso
                      o revisá con un usuario autorizado.
                    </p>
                  ) : summaryData.sales.length === 0 ? (
                    <p className="font-mono text-sm text-zinc-600">
                      No hay ventas registradas con esta caja.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded border border-zinc-800/80">
                      <table className="w-full min-w-[760px] border-collapse font-mono text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-[10px] uppercase tracking-widest text-zinc-500">
                            <th className="px-2 py-2">Fecha venta</th>
                            <th className="px-2 py-2">Sesión (apertura)</th>
                            <th className="px-2 py-2 text-right">Total</th>
                            <th className="px-2 py-2">Estado</th>
                            <th className="px-2 py-2">Cliente / nombre</th>
                            <th className="px-2 py-2">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.sales.map((s) => (
                            <tr
                              key={s.id}
                              className="border-b border-zinc-800/50 text-zinc-300"
                            >
                              <td className="whitespace-nowrap px-2 py-2">
                                {formatDateTime(s.soldAt)}
                              </td>
                              <td className="whitespace-nowrap px-2 py-2 text-zinc-500">
                                {sessionOpenedLabel(
                                  s.cashRegisterSessionId,
                                  summaryData.sessions,
                                )}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums text-emerald-300/90">
                                {s.currency}{" "}
                                {formatMoney(s.total)}
                              </td>
                              <td className="px-2 py-2 capitalize text-zinc-400">
                                {s.status}
                              </td>
                              <td className="max-w-[200px] truncate px-2 py-2 text-zinc-500">
                                {s.customerName ?? "—"}
                              </td>
                              <td
                                className="px-2 py-2 text-zinc-500"
                                title={s.createdBy ?? undefined}
                              >
                                {shortUserId(s.createdBy)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {summaryData.aggregatedClosingLines.length > 0 ? (
                  <section className="rounded-lg border border-white/[0.07] bg-black/40 p-4">
                    <h4 className={cn(labelClass, "mb-1 text-zinc-400")}>
                      Totales por medio de pago (suma de arqueos al cierre)
                    </h4>
                    <p className="mb-3 text-xs text-zinc-600">
                      Son montos contados al cerrar cada sesión, no flujo del
                      período.
                    </p>
                    <div className="overflow-x-auto rounded border border-zinc-800/80">
                      <table className="w-full border-collapse font-mono text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-[10px] uppercase tracking-widest text-zinc-500">
                            <th className="px-3 py-2">Medio</th>
                            <th className="px-3 py-2 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.aggregatedClosingLines.map((row) => (
                            <tr
                              key={row.label}
                              className="border-b border-zinc-800/50 text-zinc-200"
                            >
                              <td className="px-3 py-2">{row.label}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatMoney(row.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ) : null}

                <section>
                  <h4 className={cn(labelClass, "mb-3 text-zinc-400")}>
                    Sesiones
                  </h4>
                  <div className="overflow-x-auto rounded border border-zinc-800/80">
                    <table className="w-full min-w-[720px] border-collapse font-mono text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-[10px] uppercase tracking-widest text-zinc-500">
                          <th className="px-2 py-2">Apertura</th>
                          <th className="px-2 py-2">Estado</th>
                          <th className="px-2 py-2 text-right">Apertura $</th>
                          <th className="px-2 py-2 text-right">Dep.</th>
                          <th className="px-2 py-2 text-right">Ret.</th>
                          <th className="px-2 py-2">Cierre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.sessions.map((s) => (
                          <tr
                            key={s.id}
                            className="border-b border-zinc-800/50 text-zinc-300"
                          >
                            <td className="whitespace-nowrap px-2 py-2">
                              {formatDateTime(s.openedAt)}
                            </td>
                            <td className="px-2 py-2">
                              {s.status === "open" ? (
                                <span className="text-emerald-400">Abierta</span>
                              ) : (
                                <span className="text-zinc-500">Cerrada</span>
                              )}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums">
                              {formatMoney(s.openingCash)}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums text-emerald-400/90">
                              {formatMoney(s.movementDeposits)}
                            </td>
                            <td className="px-2 py-2 text-right tabular-nums text-rose-400/90">
                              {formatMoney(s.movementWithdrawals)}
                            </td>
                            <td className="whitespace-nowrap px-2 py-2 text-zinc-500">
                              {s.closedAt
                                ? formatDateTime(s.closedAt)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {summaryData.closingBlocks.map((block) => (
                  <section
                    key={block.sessionId}
                    className="rounded-lg border border-violet-500/20 bg-violet-950/20 p-4"
                  >
                    <h4 className={cn(labelClass, "mb-3 text-violet-300/90")}>
                      Arqueo al cierre · sesión{" "}
                      {formatDateTime(block.openedAt)}
                    </h4>
                    <div className="overflow-x-auto rounded border border-zinc-800/80">
                      <table className="w-full border-collapse font-mono text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-[10px] uppercase tracking-widest text-zinc-500">
                            <th className="px-3 py-2">Medio</th>
                            <th className="px-3 py-2 text-right">Contado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {block.lines.map((line) => (
                            <tr
                              key={`${block.sessionId}-${line.label}`}
                              className="border-b border-zinc-800/50 text-zinc-200"
                            >
                              <td className="px-3 py-2">{line.label}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {formatMoney(line.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}

                <section>
                  <h4 className={cn(labelClass, "mb-3 text-zinc-400")}>
                    Movimientos (depósitos y retiros)
                  </h4>
                  {summaryData.movements.length === 0 ? (
                    <p className="font-mono text-sm text-zinc-600">
                      No hay movimientos registrados en esta caja.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded border border-zinc-800/80">
                      <table className="w-full min-w-[640px] border-collapse font-mono text-xs">
                        <thead>
                          <tr className="border-b border-zinc-800 bg-zinc-950/80 text-left text-[10px] uppercase tracking-widest text-zinc-500">
                            <th className="px-2 py-2">Fecha</th>
                            <th className="px-2 py-2">Tipo</th>
                            <th className="px-2 py-2 text-right">Monto</th>
                            <th className="px-2 py-2">Nota</th>
                            <th className="px-2 py-2">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summaryData.movements.map((m) => (
                            <tr
                              key={m.id}
                              className="border-b border-zinc-800/50 text-zinc-300"
                            >
                              <td className="whitespace-nowrap px-2 py-2">
                                {formatDateTime(m.createdAt)}
                              </td>
                              <td className="px-2 py-2">
                                {m.kind === "deposit" ? (
                                  <span className="text-emerald-400">
                                    Ingreso
                                  </span>
                                ) : (
                                  <span className="text-rose-400">Retiro</span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-right tabular-nums">
                                {formatMoney(m.amount)}
                              </td>
                              <td className="max-w-[200px] truncate px-2 py-2 text-zinc-500">
                                {m.note ?? "—"}
                              </td>
                              <td
                                className="px-2 py-2 text-zinc-500"
                                title={m.createdBy ?? undefined}
                              >
                                {shortUserId(m.createdBy)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={moveRow !== null} onOpenChange={(o) => !o && setMoveRow(null)}>
        <DialogContent
          data-cash-console-dialog
          showCloseButton
          className={cn(dialogConsoleClass, "sm:max-w-md")}
        >
          <DialogHeader>
            <DialogTitle className="bg-gradient-to-r from-white to-cyan-200/90 bg-clip-text text-lg font-bold tracking-tight text-transparent">
              {moveKind === "deposit" ? "Deposit cash" : "Withdraw cash"}
            </DialogTitle>
          </DialogHeader>
          {moveBanner ? (
            <p className="rounded-lg border border-red-500/30 bg-red-950/50 px-3 py-2 font-mono text-sm text-red-200">
              {moveBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitMove(e)}>
            <div className="space-y-2">
              <Label htmlFor="mv-amt" className={labelClass}>
                Amount
              </Label>
              <Input
                id="mv-amt"
                type="number"
                value={moveAmount}
                onChange={(e) => setMoveAmount(e.target.value)}
                min={0}
                step="0.01"
                required
                className={cn(fieldClass, "font-mono text-lg")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mv-note" className={labelClass}>
                Note (optional)
              </Label>
              <Input
                id="mv-note"
                value={moveNote}
                onChange={(e) => setMoveNote(e.target.value)}
                className={fieldClass}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className={btnGhostConsole}
                onClick={() => setMoveRow(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={moveSaving}
                className={btnPrimaryConsole}
              >
                {moveSaving ? "Saving…" : "Confirm"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(CashRegistersPage)
