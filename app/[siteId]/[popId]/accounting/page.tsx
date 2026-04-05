"use client"

import {
  createChartAccount,
  getAccountingEntryLines,
  getAccountingFinancialSummaries,
  getAccountingJournalEntries,
  getAccountingLedgerForAccount,
  getAccountingPageData,
  getAccountingTrialBalance,
  type AccountType,
  type ChartAccountRow,
  type CreateChartAccountInput,
  type JournalEntryLineRow,
  type JournalEntrySummaryRow,
  type LedgerMovementRow,
  type TrialBalanceRow,
} from "@/app/[siteId]/[popId]/accounting/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import {
  breadcrumbForAccountRow,
  breadcrumbForCodePrefix,
  codePrefixForLeafGroup,
} from "@/lib/accountingPlanGroupLabels"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  BookMarked,
  FileSpreadsheet,
  Landmark,
  Leaf,
  Maximize2,
  Minimize2,
  Plus,
  ScrollText,
  Wifi,
  WifiOff,
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

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "activo_corriente", label: "Activo corriente" },
  { value: "activo_no_corriente", label: "Activo no corriente" },
  { value: "pasivo_corriente", label: "Pasivo corriente" },
  { value: "pasivo_no_corriente", label: "Pasivo no corriente" },
  { value: "patrimonio_neto", label: "Patrimonio neto" },
  { value: "ingresos", label: "Ingresos" },
  { value: "costos", label: "Costos" },
  { value: "gastos", label: "Gastos" },
]

const SOURCE_TYPE_LABELS: Record<string, string> = {
  sale: "Venta",
  purchase: "Compra",
  manual: "Manual",
  adjustment: "Ajuste",
  payment: "Cobro / pago",
  opening: "Apertura",
  closing: "Cierre",
}

function formatSourceType(s: string): string {
  return SOURCE_TYPE_LABELS[s] ?? s
}

function formatNatureLabel(n: string): string {
  if (n === "acreedora") return "Acreedora"
  if (n === "deudora") return "Deudora"
  return n
}

function formatMoneyAr(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatIsoDate(iso: string) {
  if (!iso) return "—"
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("es", { dateStyle: "short" }).format(d)
}

function defaultMonthRange(): { from: string; to: string } {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(first), to: iso(now) }
}

function defaultCreateForm(): CreateChartAccountInput {
  return {
    code: "",
    name: "",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
    isMovementAccount: true,
  }
}

function formatAccountType(t: AccountType): string {
  return ACCOUNT_TYPES.find((o) => o.value === t)?.label ?? t
}

function compareAccountsByCode(a: ChartAccountRow, b: ChartAccountRow): number {
  return a.code.localeCompare(b.code, undefined, { numeric: true })
}

type AccountSection = {
  key: string
  title: string
  subtitle?: string
  rows: ChartAccountRow[]
}

function buildAccountSections(accounts: ChartAccountRow[]): AccountSection[] {
  if (accounts.length === 0) return []
  const idByRow = new Map(accounts.map((a) => [a.id, a]))
  const childrenByParent = new Map<string, ChartAccountRow[]>()
  for (const a of accounts) {
    if (a.parentId) {
      const list = childrenByParent.get(a.parentId) ?? []
      list.push(a)
      childrenByParent.set(a.parentId, list)
    }
  }
  for (const list of childrenByParent.values()) {
    list.sort(compareAccountsByCode)
  }
  const sections: AccountSection[] = []
  const parentIdsOrdered = [...childrenByParent.keys()].sort((a, b) => {
    const pa = idByRow.get(a)
    const pb = idByRow.get(b)
    if (!pa && !pb) return 0
    if (!pa) return 1
    if (!pb) return -1
    return compareAccountsByCode(pa, pb)
  })
  for (const pid of parentIdsOrdered) {
    const parent = idByRow.get(pid)
    const children = childrenByParent.get(pid) ?? []
    sections.push({
      key: `db-parent-${pid}`,
      title: parent
        ? breadcrumbForCodePrefix(parent.code)
        : "Padre no encontrado en el plan",
      subtitle: parent
        ? undefined
        : "Hay subcuentas que referencian un padre que no está en este listado.",
      rows: children,
    })
  }
  const rootsWithDbChildren = new Set(childrenByParent.keys())
  const rootsWithoutDbChildren = accounts.filter(
    (a) => a.parentId == null && !rootsWithDbChildren.has(a.id),
  )
  const prefixGroups = new Map<string, ChartAccountRow[]>()
  const singletonRoots: ChartAccountRow[] = []
  for (const a of rootsWithoutDbChildren) {
    const pfx = codePrefixForLeafGroup(a.code)
    if (pfx) {
      const list = prefixGroups.get(pfx) ?? []
      list.push(a)
      prefixGroups.set(pfx, list)
    } else {
      singletonRoots.push(a)
    }
  }
  for (const list of prefixGroups.values()) {
    list.sort(compareAccountsByCode)
  }
  const prefixKeys = [...prefixGroups.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )
  for (const pfx of prefixKeys) {
    const rows = prefixGroups.get(pfx) ?? []
    sections.push({
      key: `prefix-${pfx}`,
      title: breadcrumbForCodePrefix(pfx),
      subtitle: rows[0]
        ? formatAccountType(rows[0].accountType)
        : undefined,
      rows,
    })
  }
  singletonRoots.sort(compareAccountsByCode)
  for (const a of singletonRoots) {
    sections.push({
      key: `single-${a.id}`,
      title: breadcrumbForAccountRow(a),
      subtitle: formatAccountType(a.accountType),
      rows: [a],
    })
  }
  const orphanRows = accounts.filter(
    (r) => r.parentId != null && !idByRow.has(r.parentId),
  )
  orphanRows.sort(compareAccountsByCode)
  if (orphanRows.length > 0) {
    sections.push({
      key: "orphan-parent-ref",
      title: "Subcuentas con padre ausente",
      subtitle:
        "El parent_id no coincide con ninguna cuenta cargada para este punto de venta.",
      rows: orphanRows,
    })
  }
  return sections
}

function AccountingPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [accounts, setAccounts] = useState<ChartAccountRow[]>([])
  const [canCreate, setCanCreate] = useState(false)
  const [journalEntryCount, setJournalEntryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createBanner, setCreateBanner] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(defaultCreateForm)

  const [journalFrom, setJournalFrom] = useState("")
  const [journalTo, setJournalTo] = useState("")
  const [ledgerFrom, setLedgerFrom] = useState("")
  const [ledgerTo, setLedgerTo] = useState("")
  const [ledgerAccountCode, setLedgerAccountCode] = useState("")

  const [reportFrom, setReportFrom] = useState("")
  const [reportTo, setReportTo] = useState("")

  const [journalEntries, setJournalEntries] = useState<JournalEntrySummaryRow[]>(
    [],
  )
  const [journalBusy, setJournalBusy] = useState(false)
  const [journalDetailOpen, setJournalDetailOpen] = useState(false)
  const [journalDetailLines, setJournalDetailLines] = useState<
    JournalEntryLineRow[]
  >([])
  const [journalDetailTitle, setJournalDetailTitle] = useState("")
  const [journalDetailLoading, setJournalDetailLoading] = useState(false)
  const [journalDetailError, setJournalDetailError] = useState<string | null>(
    null,
  )

  const [ledgerRows, setLedgerRows] = useState<LedgerMovementRow[]>([])
  const [ledgerAccountName, setLedgerAccountName] = useState("")
  const [ledgerNature, setLedgerNature] = useState("")
  const [ledgerBusy, setLedgerBusy] = useState(false)
  const [ledgerError, setLedgerError] = useState<string | null>(null)

  const [trialRows, setTrialRows] = useState<TrialBalanceRow[]>([])
  const [financialSummaries, setFinancialSummaries] = useState<
    { label: string; total: number }[]
  >([])
  const [reportsBusy, setReportsBusy] = useState(false)

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const accountSections = useMemo(
    () => buildAccountSections(accounts),
    [accounts],
  )

  useEffect(() => {
    const { from, to } = defaultMonthRange()
    setJournalFrom(from)
    setJournalTo(to)
    setLedgerFrom(from)
    setLedgerTo(to)
    setReportFrom(from)
    setReportTo(to)
  }, [])

  const loadJournal = useCallback(async () => {
    if (!popId) return
    setJournalBusy(true)
    const res = await getAccountingJournalEntries(
      popId,
      journalFrom || null,
      journalTo || null,
    )
    setJournalBusy(false)
    if (res.success) {
      setJournalEntries(res.entries)
    }
  }, [popId, journalFrom, journalTo])

  const loadReports = useCallback(async () => {
    if (!popId) return
    setReportsBusy(true)
    const [tb, fs] = await Promise.all([
      getAccountingTrialBalance(popId, reportFrom || null, reportTo || null),
      getAccountingFinancialSummaries(
        popId,
        reportFrom || null,
        reportTo || null,
      ),
    ])
    setReportsBusy(false)
    if (tb.success) {
      setTrialRows(tb.rows)
    }
    if (fs.success) {
      setFinancialSummaries(fs.summaries.map((s) => ({ label: s.label, total: s.total })))
    }
  }, [popId, reportFrom, reportTo])

  const loadLedger = useCallback(async () => {
    if (!popId) return
    setLedgerBusy(true)
    setLedgerError(null)
    const res = await getAccountingLedgerForAccount(
      popId,
      ledgerAccountCode,
      ledgerFrom || null,
      ledgerTo || null,
    )
    setLedgerBusy(false)
    if (res.success) {
      setLedgerRows(res.rows)
      setLedgerAccountName(res.accountName)
      setLedgerNature(res.nature === "deudora" ? "Deudora" : "Acreedora")
    } else {
      setLedgerRows([])
      setLedgerAccountName("")
      setLedgerNature("")
      setLedgerError(res.error)
    }
  }, [popId, ledgerAccountCode, ledgerFrom, ledgerTo])

  const openJournalDetail = useCallback(
    async (entry: JournalEntrySummaryRow) => {
      if (!popId) return
      setJournalDetailOpen(true)
      setJournalDetailTitle(
        `Asiento n.º ${entry.entryNumber} · ${formatIsoDate(entry.entryDate)}`,
      )
      setJournalDetailLoading(true)
      setJournalDetailLines([])
      setJournalDetailError(null)
      const res = await getAccountingEntryLines(popId, entry.id)
      setJournalDetailLoading(false)
      if (res.success) {
        setJournalDetailLines(res.lines)
      } else {
        setJournalDetailError(res.error)
      }
    },
    [popId],
  )

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getAccountingPageData(popId)
    if (!res.success) {
      setError(res.error || "Error")
      setAccounts([])
      setCanCreate(false)
      setJournalEntryCount(0)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setPopName(res.popName)
    setAccounts(res.accounts)
    setCanCreate(res.canCreate)
    setJournalEntryCount(res.journalEntryCount)
    setError(null)
  }, [popId, siteId])

  const booksInit = useRef(false)
  useEffect(() => {
    if (
      !popId ||
      !journalFrom ||
      !journalTo ||
      loading ||
      error ||
      booksInit.current
    ) {
      return
    }
    booksInit.current = true
    void loadJournal()
    void loadReports()
  }, [
    popId,
    journalFrom,
    journalTo,
    loading,
    error,
    loadJournal,
    loadReports,
  ])

  useEffect(() => {
    if (!popId || !siteId) {
      setLoading(false)
      setError("No se encontró el punto de venta.")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await load()
      } catch {
        if (!cancelled) setError("Error inesperado")
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
    setCreateForm(defaultCreateForm())
    setCreateOpen(true)
  }

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId) return
    setCreateSaving(true)
    setCreateBanner(null)
    const res = await createChartAccount(popId, createForm)
    setCreateSaving(false)
    if (!res.success) {
      setCreateBanner(res.error)
      return
    }
    setCreateOpen(false)
    await load()
  }

  const headerUserName = useMemo(() => {
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "Usuario"
  }, [user?.email, user?.user_metadata?.full_name])

  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=e8f5ef`

  if (!popId || !siteId) {
    return (
      <div className="rootsy-app-light min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">No se encontró el punto de venta.</p>
      </div>
    )
  }

  return (
    <div className="rootsy-app-light relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 motion-reduce:opacity-50"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.75_0.12_155/0.35),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,oklch(0.85_0.08_140/0.2),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(oklch(0.92_0.02_130/0.35)_1px,transparent_1px),linear-gradient(90deg,oklch(0.92_0.02_130/0.35)_1px,transparent_1px)] bg-size-[48px_48px] opacity-40" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-rootsy-hairline bg-card/90 shadow-sm backdrop-blur-xl">
          <div className="grid h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={popMenuHref(siteId, popId)}
                className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/10 bg-secondary text-foreground/70 transition-all hover:border-primary/25 hover:bg-muted hover:text-foreground"
                aria-label="Volver al menú"
              >
                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="size-8 overflow-hidden rounded-lg ring-1 ring-border">
                  <img
                    src={popLogoSrc}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <span className="truncate text-sm font-semibold text-foreground/90">
                  {popName || (loading ? "…" : "—")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-[1.65rem] font-black tracking-tight text-foreground">
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Landmark className="size-5" aria-hidden />
                </span>
                Contabilidad
              </h1>
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                  isOnline
                    ? "border-primary/30 bg-primary/10 text-forest"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
              >
                {isOnline ? (
                  <Wifi className="size-3" aria-hidden />
                ) : (
                  <WifiOff className="size-3" aria-hidden />
                )}
                {isOnline ? "En línea" : "Sin conexión"}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              {canCreate ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  onClick={() => openCreate()}
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Nueva cuenta</span>
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4.5" />
                ) : (
                  <Maximize2 className="size-4.5" />
                )}
              </button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <Avatar className="size-10 ring-1 ring-border">
                  <AvatarImage src={userAvatarSrc} alt="" />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {headerUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-foreground/90">
                    {headerUserName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-meadow">
                    <Leaf className="size-3" aria-hidden />
                    Contabilidad
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Plan de cuentas
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Las cuentas existentes son solo lectura. El encabezado de
                    cada caja es la jerarquía en texto (Activo &gt; Activo
                    corriente &gt; …); los códigos completos están en la tabla.
                  </p>
                </div>
                {accounts.length === 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-md shadow-primary/5 backdrop-blur-sm">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            Todavía no hay cuentas en este punto.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {accountSections.map((section) => (
                      <div
                        key={section.key}
                        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md shadow-primary/10"
                      >
                        <div className="border-b border-border bg-muted/45 px-4 py-3 sm:px-5">
                          <h3 className="text-sm font-medium leading-relaxed text-foreground sm:text-[0.95rem]">
                            {section.title}
                          </h3>
                          {section.subtitle ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {section.subtitle}
                            </p>
                          ) : null}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border bg-muted/25 hover:bg-muted/25">
                              <TableHead className="font-semibold">
                                Código
                              </TableHead>
                              <TableHead className="font-semibold">
                                Nombre
                              </TableHead>
                              <TableHead className="font-semibold">
                                Tipo
                              </TableHead>
                              <TableHead className="font-semibold">
                                Naturaleza
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                Nivel
                              </TableHead>
                              <TableHead className="font-semibold">
                                Movimiento
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.rows.map((r) => (
                              <TableRow
                                key={r.id}
                                className="border-border/80 hover:bg-muted/30"
                              >
                                <TableCell className="font-mono text-sm tabular-nums">
                                  {r.code}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {r.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatAccountType(r.accountType)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatNatureLabel(r.nature)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {r.level}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {r.isMovementAccount ? "Sí" : "No"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Libros y reportes
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Solo se listan asientos con estado <strong className="text-foreground">publicado</strong>
                    . Los importes se expresan en la moneda del plan (ARS). Total
                    de asientos en el punto:{" "}
                    <span className="font-mono text-foreground">{journalEntryCount}</span>.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-foreground">
                      <ScrollText className="size-5 text-primary" aria-hidden />
                      <h3 className="font-semibold">Libro diario</h3>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      disabled={journalBusy}
                      onClick={() => void loadJournal()}
                    >
                      {journalBusy ? "Cargando…" : "Actualizar"}
                    </Button>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Listado cronológico de asientos en el rango elegido.
                  </p>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Desde</Label>
                      <Input
                        type="date"
                        value={journalFrom}
                        onChange={(e) => setJournalFrom(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hasta</Label>
                      <Input
                        type="date"
                        value={journalTo}
                        onChange={(e) => setJournalTo(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>N.º</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead className="w-[88px]" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {journalBusy && journalEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-muted-foreground">
                              Cargando asientos…
                            </TableCell>
                          </TableRow>
                        ) : journalEntries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-muted-foreground">
                              No hay asientos publicados en este rango.
                            </TableCell>
                          </TableRow>
                        ) : (
                          journalEntries.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="whitespace-nowrap text-sm">
                                {formatIsoDate(e.entryDate)}
                              </TableCell>
                              <TableCell className="font-mono text-sm tabular-nums">
                                {e.entryNumber}
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate text-sm">
                                {e.description}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatSourceType(e.sourceType)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(e.totalDebit)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(e.totalCredit)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => void openJournalDetail(e)}
                                >
                                  Ver líneas
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2 text-foreground">
                    <BookMarked className="size-5 text-primary" aria-hidden />
                    <h3 className="font-semibold">Mayor general</h3>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Movimientos de una cuenta imputable en el período. El saldo
                    acumulado respeta la naturaleza de la cuenta (deudora /
                    acreedora).
                  </p>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1 lg:col-span-2">
                      <Label className="text-xs">Código de cuenta</Label>
                      <Input
                        placeholder="Ej. 1.1.1.01"
                        value={ledgerAccountCode}
                        onChange={(e) => setLedgerAccountCode(e.target.value)}
                        className="bg-background font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Desde</Label>
                      <Input
                        type="date"
                        value={ledgerFrom}
                        onChange={(e) => setLedgerFrom(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hasta</Label>
                      <Input
                        type="date"
                        value={ledgerTo}
                        onChange={(e) => setLedgerTo(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="mb-4 rounded-lg"
                    disabled={ledgerBusy}
                    onClick={() => void loadLedger()}
                  >
                    {ledgerBusy ? "Cargando…" : "Ver movimientos"}
                  </Button>
                  {ledgerError ? (
                    <p className="mb-4 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      {ledgerError}
                    </p>
                  ) : null}
                  {ledgerAccountName ? (
                    <p className="mb-2 text-sm text-foreground">
                      <span className="font-semibold">{ledgerAccountName}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · Naturaleza: {ledgerNature}
                      </span>
                    </p>
                  ) : null}
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>N.º asiento</TableHead>
                          <TableHead>Ref. asiento</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ledgerRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-muted-foreground">
                              {ledgerAccountCode.trim()
                                ? "Sin movimientos o indicá un código válido y pulsá «Ver movimientos»."
                                : "Ingresá un código de cuenta y el rango de fechas."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          ledgerRows.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="whitespace-nowrap text-sm">
                                {formatIsoDate(r.entryDate)}
                              </TableCell>
                              <TableCell className="font-mono text-sm tabular-nums">
                                {r.entryNumber}
                              </TableCell>
                              <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                                {r.entryDescription}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(r.debitAmount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(r.creditAmount)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(r.runningBalance)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-foreground">
                      <FileSpreadsheet className="size-5 text-primary" aria-hidden />
                      <h3 className="font-semibold">Estados y sumas y saldos</h3>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-lg"
                      disabled={reportsBusy}
                      onClick={() => void loadReports()}
                    >
                      {reportsBusy ? "Cargando…" : "Actualizar"}
                    </Button>
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Resúmenes por tipo de cuenta y sumas y saldos según movimientos
                    publicados en el rango (saldo = debe − haber ajustado por
                    naturaleza).
                  </p>
                  <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Desde</Label>
                      <Input
                        type="date"
                        value={reportFrom}
                        onChange={(e) => setReportFrom(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Hasta</Label>
                      <Input
                        type="date"
                        value={reportTo}
                        onChange={(e) => setReportTo(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {financialSummaries.map((s) => (
                      <div
                        key={s.label}
                        className="flex flex-col rounded-xl border border-border/60 bg-muted/20 px-3 py-2"
                      >
                        <span className="text-xs text-muted-foreground">{s.label}</span>
                        <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                          {formatMoneyAr(s.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Sumas y saldos
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Cuenta</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Debe</TableHead>
                          <TableHead className="text-right">Haber</TableHead>
                          <TableHead className="text-right">Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trialRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-muted-foreground">
                              No hay movimientos publicados en el rango o aún no hay
                              datos.
                            </TableCell>
                          </TableRow>
                        ) : (
                          trialRows.map((r, idx) => (
                            <TableRow key={`${r.accountCode}-${idx}`}>
                              <TableCell className="font-mono text-sm">{r.accountCode}</TableCell>
                              <TableCell className="text-sm">{r.accountName}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatAccountType(r.accountType)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(r.sumDebit)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(r.sumCredit)}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm tabular-nums">
                                {formatMoneyAr(r.balance)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Situación patrimonial: activo, pasivo y patrimonio neto son
                    totales por tipo de cuenta. Resultados: ingresos, costos y
                    gastos por separado; el resultado del ejercicio se obtiene con
                    el criterio contable que defina tu equipo.
                  </p>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <Dialog
        open={journalDetailOpen}
        onOpenChange={(o) => {
          if (!o) {
            setJournalDetailOpen(false)
            setJournalDetailError(null)
          }
        }}
      >
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,560px)] overflow-y-auto border-border bg-card text-foreground sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Líneas del asiento</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{journalDetailTitle}</p>
          {journalDetailError ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {journalDetailError}
            </p>
          ) : null}
          {journalDetailLoading ? (
            <p className="text-sm text-muted-foreground">Cargando líneas…</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cuenta</TableHead>
                    <TableHead className="text-right">Debe</TableHead>
                    <TableHead className="text-right">Haber</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journalDetailLines.length === 0 && !journalDetailError ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-muted-foreground">
                        Sin líneas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    journalDetailLines.map((ln) => (
                      <TableRow key={ln.id}>
                        <TableCell>
                          <span className="font-mono text-xs">{ln.accountCode}</span>{" "}
                          <span className="text-sm">{ln.accountName}</span>
                          {ln.lineDescription ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {ln.lineDescription}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {ln.debitAmount > 0 ? formatMoneyAr(ln.debitAmount) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums">
                          {ln.creditAmount > 0 ? formatMoneyAr(ln.creditAmount) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Nueva cuenta</DialogTitle>
          </DialogHeader>
          {createBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {createBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
            <div className="space-y-2">
              <Label htmlFor="acc-code">Código</Label>
              <Input
                id="acc-code"
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, code: e.target.value }))
                }
                required
                className="bg-background font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-name">Nombre</Label>
              <Input
                id="acc-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-type">Tipo de cuenta</Label>
              <select
                id="acc-type"
                value={createForm.accountType}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    accountType: e.target.value as AccountType,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ACCOUNT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-nature">Naturaleza</Label>
              <select
                id="acc-nature"
                value={createForm.nature}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    nature: e.target.value as CreateChartAccountInput["nature"],
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="deudora">Deudora</option>
                <option value="acreedora">Acreedora</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-level">Nivel</Label>
              <Input
                id="acc-level"
                type="number"
                min={1}
                value={createForm.level}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    level: Number(e.target.value),
                  }))
                }
                className="bg-background"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createForm.isMovementAccount}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    isMovementAccount: e.target.checked,
                  }))
                }
                className="size-4 rounded border-input"
              />
              Cuenta de movimiento
            </label>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createSaving}>
                {createSaving ? "Guardando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(AccountingPage)
