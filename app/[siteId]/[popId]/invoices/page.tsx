"use client"

import {
  createArcaInvoiceWithOpenCashRegister,
  getInvoiceFormContext,
  getPopInvoicesArcaTable,
  testArcaInvoiceHomologacion,
  type InvoiceArcaTableRow,
} from "@/app/[siteId]/[popId]/invoices/actions"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Leaf,
  Maximize2,
  Minimize2,
  Plus,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react"

const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
})

function formatCbteFch(s: string) {
  if (!s) return "—"
  if (/^\d{8}$/.test(s)) {
    const y = s.slice(0, 4)
    const m = s.slice(4, 6)
    const d = s.slice(6, 8)
    return `${d}/${m}/${y}`
  }
  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) {
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "short" }).format(d)
  }
  return s
}

const REGIMEN_LABEL: Record<string, string> = {
  fe_general: "FE general",
  fce_mipyme: "FCE MiPyME",
}

function regimenLabel(r: string) {
  return REGIMEN_LABEL[r] ?? r
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  pending_afip: "Pendiente AFIP",
  authorized: "Autorizada",
  rejected: "Rechazada",
  cancelled: "Anulada",
}

function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s
}

function statusPillClass(s: string) {
  if (s === "authorized") {
    return "border-emerald-500/35 bg-emerald-50 text-emerald-900"
  }
  if (s === "rejected" || s === "cancelled") {
    return "border-border bg-muted text-muted-foreground"
  }
  if (s === "pending_afip") {
    return "border-sky-500/35 bg-sky-50 text-sky-900"
  }
  return "border-amber-500/35 bg-amber-50 text-amber-950"
}

function jsonPretty(v: unknown): string {
  try {
    return JSON.stringify(v ?? {}, null, 2)
  } catch {
    return String(v)
  }
}

function shortId(id: string | null) {
  if (!id) return "—"
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function InvoicesPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [invoices, setInvoices] = useState<InvoiceArcaTableRow[]>([])
  const [formCtx, setFormCtx] = useState<Awaited<
    ReturnType<typeof getInvoiceFormContext>
  > | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTab, setComposeTab] = useState<"caja" | "homologacion">("caja")
  const [composeBanner, setComposeBanner] = useState<string | null>(null)
  const [cashBusy, setCashBusy] = useState(false)
  const [testBusy, setTestBusy] = useState(false)
  const [issuedHighlight, setIssuedHighlight] = useState<{
    mode: "homologacion" | "guardada"
    cae: string
    caeFchVto: string
    cbteNro: number
    ptoVta: number
    impTotal: number
    invoiceId?: string
  } | null>(null)

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const [res, ctx] = await Promise.all([
      getPopInvoicesArcaTable(popId),
      getInvoiceFormContext(popId),
    ])
    if (!res.success) {
      setError(res.error || "Error")
      setInvoices([])
      setPopName(res.popName ?? "")
      setFormCtx(null)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setInvoices(res.invoices)
    setPopName(res.popName)
    setError(null)
    if (ctx.success) {
      setFormCtx(ctx)
    } else {
      setFormCtx(null)
    }
  }, [popId, siteId])

  useEffect(() => {
    if (!popId || !siteId) {
      setLoading(false)
      setError("Punto de venta no encontrado")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await load()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [load, popId, siteId])

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }, [])

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const up = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])

  const headerUserName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "Usuario"
  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=e8f5ef`

  const canEmit =
    formCtx?.success === true && formCtx.canCreateInvoice === true

  const cashReady =
    formCtx?.success &&
    formCtx.cashSession &&
    formCtx.cashSession.hasCertificates &&
    formCtx.cashSession.ptoVta != null

  const submitHomolog = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId) return
    setTestBusy(true)
    setComposeBanner(null)
    const fd = new FormData(e.target as HTMLFormElement)
    const res = await testArcaInvoiceHomologacion(popId, fd)
    setTestBusy(false)
    if (!res.success) {
      setComposeBanner(res.error)
      return
    }
    setComposeOpen(false)
    setIssuedHighlight({
      mode: "homologacion",
      cae: res.cae,
      caeFchVto: res.caeFchVto,
      cbteNro: res.cbteNro,
      ptoVta: res.ptoVta,
      impTotal: res.impTotal,
    })
    await load()
  }

  const submitCash = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId) return
    setCashBusy(true)
    setComposeBanner(null)
    const fd = new FormData(e.target as HTMLFormElement)
    const res = await createArcaInvoiceWithOpenCashRegister(popId, fd)
    setCashBusy(false)
    if (!res.success) {
      setComposeBanner(res.error)
      return
    }
    setComposeOpen(false)
    setIssuedHighlight({
      mode: "guardada",
      cae: res.cae,
      caeFchVto: res.caeFchVto,
      cbteNro: res.cbteNro,
      ptoVta: res.ptoVta,
      impTotal: res.impTotal,
      invoiceId: res.invoiceId,
    })
    setExpandedId(res.invoiceId)
    await load()
  }

  if (!popId || !siteId) {
    return (
      <div className="rootsy-app-light min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">Punto de venta no encontrado</p>
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
                  <FileText className="size-5" aria-hidden />
                </span>
                Facturas
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
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              {canEmit ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  onClick={() => {
                    setComposeBanner(null)
                    setComposeOpen(true)
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Nueva factura</span>
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={
                  isFullscreen
                    ? "Salir de pantalla completa"
                    : "Pantalla completa"
                }
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4.5" />
                ) : (
                  <Maximize2 className="size-4.5" />
                )}
              </button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="size-10 ring-1 ring-border">
                    <AvatarImage src={userAvatarSrc} alt="" />
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {headerUserName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                </div>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-foreground/90">
                    {headerUserName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-meadow">
                    <Leaf className="size-3" aria-hidden />
                    ARCA / AFIP
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">
              Cargando comprobantes…
            </p>
          ) : error ? (
            <div
              role="alert"
              className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Comprobantes electrónicos
                  </h2>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    Facturas emitidas vía ARCA / AFIP para este punto de venta.
                    Expandí una fila para ver detalle, importes y payloads.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1 font-medium text-foreground/80">
                    {invoices.length}{" "}
                    {invoices.length === 1 ? "comprobante" : "comprobantes"}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-md shadow-primary/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <FileText className="size-4 text-primary" aria-hidden />
                  <span className="text-sm font-semibold text-foreground">
                    Listado
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {invoices.length} facturas
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                        <TableHead className="w-10" />
                        <TableHead className="font-semibold text-foreground">
                          Tipo
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Fecha
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Pto. / Nº
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Receptor
                        </TableHead>
                        <TableHead className="text-right font-semibold text-foreground">
                          Total
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          CAE
                        </TableHead>
                        <TableHead className="font-semibold text-foreground">
                          Estado
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow className="border-border">
                          <TableCell
                            colSpan={8}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No hay comprobantes ARCA registrados en este punto.
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((inv) => {
                          const open = expandedId === inv.id
                          const justIssued =
                            issuedHighlight?.invoiceId === inv.id
                          return (
                            <Fragment key={inv.id}>
                              <TableRow
                                className={cn(
                                  "border-border transition-[box-shadow,background-color]",
                                  justIssued
                                    ? "bg-primary/8 shadow-[inset_0_0_0_2px_oklch(0.55_0.15_155/0.45)]"
                                    : open
                                      ? "bg-muted/50"
                                      : "hover:bg-muted/30",
                                )}
                              >
                                <TableCell className="align-middle">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:bg-muted hover:text-foreground"
                                    aria-expanded={open}
                                    aria-label={
                                      open
                                        ? "Ocultar detalle del comprobante"
                                        : "Ver detalle del comprobante"
                                    }
                                    onClick={() =>
                                      setExpandedId((id) =>
                                        id === inv.id ? null : inv.id,
                                      )
                                    }
                                  >
                                    {open ? (
                                      <ChevronDown className="size-4" />
                                    ) : (
                                      <ChevronRight className="size-4" />
                                    )}
                                  </Button>
                                </TableCell>
                                <TableCell className="max-w-[140px] text-sm text-foreground">
                                  <span className="font-medium">
                                    {inv.tipoLabel}
                                  </span>
                                  <span className="mt-0.5 block text-[10px] text-muted-foreground">
                                    Cbte. {inv.arcaCbteTipo}
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm tabular-nums text-foreground">
                                  {formatCbteFch(inv.cbteFch)}
                                </TableCell>
                                <TableCell className="text-sm tabular-nums text-foreground/90">
                                  {inv.ptoVta} — {inv.cbteNro}
                                </TableCell>
                                <TableCell className="max-w-[180px] truncate text-sm text-foreground/90">
                                  {inv.receptorRazonSocial || "—"}
                                </TableCell>
                                <TableCell className="text-right text-sm font-semibold tabular-nums text-primary">
                                  {fmt.format(inv.impTotal)}
                                </TableCell>
                                <TableCell className="max-w-[100px] truncate font-mono text-xs text-muted-foreground">
                                  {inv.cae ?? "—"}
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={cn(
                                      "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                                      statusPillClass(inv.status),
                                    )}
                                  >
                                    {statusLabel(inv.status)}
                                  </span>
                                </TableCell>
                              </TableRow>
                              {open ? (
                                <TableRow className="border-border bg-muted/25 hover:bg-muted/30">
                                  <TableCell colSpan={8} className="p-0">
                                    <div className="space-y-4 px-4 py-4 sm:px-6">
                                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Régimen
                                          </p>
                                          <p className="text-sm font-medium text-foreground">
                                            {regimenLabel(inv.arcaRegimen)}
                                          </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Venta (id)
                                          </p>
                                          <p
                                            className="font-mono text-sm font-medium text-foreground"
                                            title={inv.saleId ?? undefined}
                                          >
                                            {shortId(inv.saleId)}
                                          </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Doc. receptor
                                          </p>
                                          <p className="text-sm font-medium tabular-nums text-foreground">
                                            {inv.docTipo != null
                                              ? `Tipo ${inv.docTipo}`
                                              : "—"}{" "}
                                            {inv.docNro || ""}
                                          </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Moneda / cotiz.
                                          </p>
                                          <p className="text-sm font-medium text-foreground">
                                            {inv.monId}{" "}
                                            <span className="tabular-nums">
                                              {inv.monCotiz}
                                            </span>
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Neto
                                          </p>
                                          <p className="text-sm font-medium tabular-nums text-foreground">
                                            {fmt.format(inv.impNeto)}
                                          </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            IVA
                                          </p>
                                          <p className="text-sm font-medium tabular-nums text-foreground">
                                            {fmt.format(inv.impIva)}
                                          </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Tributos
                                          </p>
                                          <p className="text-sm font-medium tabular-nums text-foreground">
                                            {fmt.format(inv.impTrib)}
                                          </p>
                                        </div>
                                        <div className="rounded-lg border border-border bg-card px-3 py-2">
                                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Vto. CAE
                                          </p>
                                          <p className="text-sm font-medium tabular-nums text-foreground">
                                            {inv.caeFchVto
                                              ? formatCbteFch(inv.caeFchVto)
                                              : "—"}
                                          </p>
                                        </div>
                                      </div>

                                      {inv.arcaResultado || inv.arcaObservaciones ? (
                                        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            Resultado AFIP
                                          </p>
                                          {inv.arcaResultado ? (
                                            <p className="text-sm text-foreground">
                                              {inv.arcaResultado}
                                            </p>
                                          ) : null}
                                          {inv.arcaObservaciones ? (
                                            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                                              {inv.arcaObservaciones}
                                            </p>
                                          ) : null}
                                        </div>
                                      ) : null}

                                      <div className="grid gap-3 lg:grid-cols-2">
                                        <div>
                                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Payload solicitud
                                          </p>
                                          <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/60 p-3 text-[10px] leading-relaxed text-foreground/80">
                                            {jsonPretty(inv.payloadRequest)}
                                          </pre>
                                        </div>
                                        <div>
                                          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Payload respuesta
                                          </p>
                                          <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-muted/60 p-3 text-[10px] leading-relaxed text-foreground/80">
                                            {jsonPretty(inv.payloadResponse)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : null}
                            </Fragment>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={composeOpen}
        onOpenChange={(o) => {
          setComposeOpen(o)
          if (!o) setComposeBanner(null)
        }}
      >
        <DialogContent className="max-h-[min(90vh,720px)] gap-0 overflow-hidden border-border bg-card p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Nueva factura ARCA
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Factura B consumidor final. Elegí si emitís con la caja abierta o
              una prueba en homologación sin guardar.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(70vh,560px)] overflow-y-auto px-6 py-4">
            {composeBanner ? (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {composeBanner}
              </div>
            ) : null}

            <Tabs
              value={composeTab}
              onValueChange={(v) => {
                setComposeTab(v === "homologacion" ? "homologacion" : "caja")
                setComposeBanner(null)
              }}
            >
              <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/80 p-1">
                <TabsTrigger
                  value="caja"
                  className="rounded-lg text-xs font-semibold sm:text-sm"
                >
                  Con caja abierta
                </TabsTrigger>
                <TabsTrigger
                  value="homologacion"
                  className="rounded-lg text-xs font-semibold sm:text-sm"
                >
                  Prueba homologación
                </TabsTrigger>
              </TabsList>

              <TabsContent value="caja" className="mt-4 space-y-4">
                {formCtx?.success && formCtx.cashSession ? (
                  <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
                    <p className="font-medium text-foreground">
                      {formCtx.cashSession.cashRegisterName || "Caja"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Punto de venta AFIP:{" "}
                      <span className="font-mono tabular-nums text-foreground">
                        {formCtx.cashSession.ptoVta ?? "—"}
                      </span>
                    </p>
                  </div>
                ) : null}

                {!cashReady ? (
                  <div
                    className="rounded-xl border border-amber-500/35 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100"
                    role="status"
                  >
                    <p className="font-medium">No podés emitir con la caja aún</p>
                    <p className="mt-1 text-xs opacity-90">
                      Abrí una sesión de caja, cargá certificado y clave ARCA, y
                      definí el punto de venta en la configuración de la caja.
                    </p>
                  </div>
                ) : null}

                <form className="space-y-3" onSubmit={submitCash}>
                  <div className="space-y-1.5">
                    <Label htmlFor="cash-importe">Importe total (ARS)</Label>
                    <Input
                      id="cash-importe"
                      name="importeTotal"
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej. 1210"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="cash-docTipo">Tipo doc. receptor</Label>
                      <Input
                        id="cash-docTipo"
                        name="docTipo"
                        type="number"
                        defaultValue={99}
                        min={0}
                        className="rounded-xl font-mono tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cash-docNro">Nº documento</Label>
                      <Input
                        id="cash-docNro"
                        name="docNro"
                        type="text"
                        defaultValue="0"
                        className="rounded-xl font-mono tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="cash-razon">Razón social receptor</Label>
                    <Textarea
                      id="cash-razon"
                      name="receptorRazonSocial"
                      rows={2}
                      defaultValue="Consumidor Final"
                      className="min-h-[72px] resize-y rounded-xl"
                    />
                  </div>
                  <DialogFooter className="gap-2 pt-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setComposeOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={!cashReady || cashBusy}
                      className="rounded-xl bg-primary"
                    >
                      {cashBusy ? "Emitiendo…" : "Emitir y guardar"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>

              <TabsContent value="homologacion" className="mt-4 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Usá certificados de <strong className="font-medium">homologación</strong>{" "}
                  AFIP. No se guarda ningún registro en Rootsy.
                </p>
                <form
                  key={composeOpen ? "homolog-open" : "homolog-closed"}
                  className="space-y-3"
                  onSubmit={submitHomolog}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="h-crt">Certificado (.crt)</Label>
                      <Input
                        id="h-crt"
                        name="crt"
                        type="file"
                        accept=".crt,.pem,text/*"
                        required
                        className="cursor-pointer rounded-xl text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="h-key">Clave privada (.key)</Label>
                      <Input
                        id="h-key"
                        name="key"
                        type="file"
                        accept=".key,.pem,text/*"
                        required
                        className="cursor-pointer rounded-xl text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-xs file:font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="h-pto">Punto de venta</Label>
                    <Input
                      id="h-pto"
                      name="ptoVta"
                      type="number"
                      min={0}
                      max={99999}
                      required
                      className="rounded-xl font-mono tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="h-importe">Importe total (ARS)</Label>
                    <Input
                      id="h-importe"
                      name="importeTotal"
                      type="text"
                      inputMode="decimal"
                      placeholder="Ej. 1210"
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="h-docTipo">Tipo doc. receptor</Label>
                      <Input
                        id="h-docTipo"
                        name="docTipo"
                        type="number"
                        defaultValue={99}
                        min={0}
                        className="rounded-xl font-mono tabular-nums"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="h-docNro">Nº documento</Label>
                      <Input
                        id="h-docNro"
                        name="docNro"
                        type="text"
                        defaultValue="0"
                        className="rounded-xl font-mono tabular-nums"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="h-razon">Razón social receptor</Label>
                    <Textarea
                      id="h-razon"
                      name="receptorRazonSocial"
                      rows={2}
                      defaultValue="Consumidor Final"
                      className="min-h-[72px] resize-y rounded-xl"
                    />
                  </div>
                  <DialogFooter className="gap-2 pt-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setComposeOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={testBusy}
                      className="rounded-xl bg-primary"
                    >
                      {testBusy ? "Probando…" : "Emitir prueba"}
                    </Button>
                  </DialogFooter>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet
        open={issuedHighlight != null}
        onOpenChange={(o) => {
          if (!o) setIssuedHighlight(null)
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden border-l border-border bg-linear-to-b from-card via-card to-primary/5 p-0 sm:max-w-md"
        >
          {issuedHighlight ? (
            <>
              <SheetHeader className="relative border-b border-border px-6 pb-4 pt-6">
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -right-8 -top-12 size-40 rounded-full bg-primary/15 blur-2xl" />
                  <div className="absolute -bottom-6 left-1/4 size-32 rounded-full bg-emerald-400/10 blur-2xl" />
                </div>
                <div className="relative flex items-start gap-3">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/25">
                    <CheckCircle2 className="size-7" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <SheetTitle className="text-xl font-bold tracking-tight">
                      {issuedHighlight.mode === "homologacion"
                        ? "Prueba autorizada"
                        : "Factura autorizada"}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                      {issuedHighlight.mode === "homologacion" ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Sparkles className="size-3.5 text-amber-600" />
                          Homologación AFIP — no se guardó en Rootsy
                        </span>
                      ) : (
                        "El comprobante quedó registrado y aparece en el listado."
                      )}
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
                <div className="rounded-2xl border border-border bg-card/90 p-4 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    CAE
                  </p>
                  <p className="mt-1 break-all font-mono text-lg font-semibold tracking-tight text-foreground">
                    {issuedHighlight.cae}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 rounded-lg text-xs"
                      onClick={() => {
                        void navigator.clipboard.writeText(issuedHighlight.cae)
                      }}
                    >
                      Copiar CAE
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Punto / Número
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
                      {issuedHighlight.ptoVta} — {issuedHighlight.cbteNro}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/50 px-3 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Vto. CAE
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                      {formatCbteFch(issuedHighlight.caeFchVto)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/8 px-4 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">
                    Total factura
                  </p>
                  <p className="mt-1 text-3xl font-black tabular-nums tracking-tight text-primary">
                    {fmt.format(issuedHighlight.impTotal)}
                  </p>
                </div>
              </div>

              <div className="border-t border-border bg-card/95 px-6 py-4">
                <Button
                  type="button"
                  className="w-full rounded-xl bg-primary"
                  onClick={() => setIssuedHighlight(null)}
                >
                  Entendido
                </Button>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default withAuth(InvoicesPage)
