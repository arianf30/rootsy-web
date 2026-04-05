"use client"

import {
  getOperationsSales,
  type OperationSaleRow,
} from "@/app/[siteId]/[popId]/operations/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Maximize2,
  Minimize2,
  Wifi,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"

const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
})

function formatDateTime(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d)
}

function formatQty(n: number) {
  const t = Math.round(n * 1e6) / 1e6
  if (Number.isInteger(t)) return String(t)
  return t.toLocaleString("es-AR", { maximumFractionDigits: 6 })
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  completed: "Completada",
  cancelled: "Anulada",
}

function statusLabel(s: string) {
  return STATUS_LABEL[s] ?? s
}

function OperationsPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [sales, setSales] = useState<OperationSaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getOperationsSales(popId)
    if (!res.success) {
      setError(res.error || "Error")
      setSales([])
      setPopName(res.popName ?? "")
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setSales(res.sales)
    setPopName(res.popName)
    setError(null)
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
    const onFs = () =>
      setIsFullscreen(Boolean(document.fullscreenElement))
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

  if (!popId || !siteId) {
    return (
      <div className="min-h-screen bg-[#070a09] p-10 text-sm text-slate-300">
        Punto de venta no encontrado
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a09] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.12),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.08),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[38px_38px] opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={popMenuHref(siteId, popId)}
              className="group inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label="Volver al menú"
            >
              <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                Operaciones
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-white">
                Ventas
              </h1>
              <p className="truncate text-sm text-white/50">
                {popName || (loading ? "…" : "—")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                isOnline
                  ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
                  : "border-rose-400/35 bg-rose-500/12 text-rose-200",
              )}
            >
              {isOnline ? (
                <Wifi className="size-3" aria-hidden />
              ) : (
                <WifiOff className="size-3" aria-hidden />
              )}
              {isOnline ? "Online" : "Offline"}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void toggleFullscreen()}
              className="text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
              <Avatar className="size-8">
                <AvatarImage src={userAvatarSrc} alt="" />
                <AvatarFallback className="bg-emerald-500/20 text-[10px] text-emerald-200">
                  {headerUserName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-[10rem] truncate text-xs font-medium text-white/85 sm:inline">
                {headerUserName}
              </span>
            </div>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c1210]/90 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <ClipboardList className="size-4 text-emerald-400/90" aria-hidden />
            <span className="text-sm font-semibold text-white/90">
              Registro de ventas
            </span>
            <span className="text-xs text-white/45">
              {loading ? "Cargando…" : `${sales.length} operaciones`}
            </span>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-10 text-white/60" />
                  <TableHead className="text-white/75">Fecha</TableHead>
                  <TableHead className="text-white/75">Estado</TableHead>
                  <TableHead className="text-white/75">Cliente</TableHead>
                  <TableHead className="text-right text-white/75">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-white/45"
                    >
                      Cargando ventas…
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-white/45"
                    >
                      No hay ventas registradas en este punto.
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => {
                    const open = expandedId === sale.id
                    return (
                      <Fragment key={sale.id}>
                        <TableRow
                          className={cn(
                            "border-white/10",
                            open ? "bg-white/[0.04]" : "hover:bg-white/[0.03]",
                          )}
                        >
                          <TableCell className="align-middle">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-white/70 hover:bg-white/10 hover:text-white"
                              aria-expanded={open}
                              aria-label={
                                open
                                  ? "Ocultar detalle de la venta"
                                  : "Ver detalle de la venta"
                              }
                              onClick={() =>
                                setExpandedId((id) =>
                                  id === sale.id ? null : sale.id,
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
                          <TableCell className="text-sm text-white/90 tabular-nums">
                            {formatDateTime(sale.soldAt)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex rounded-md border px-2 py-0.5 text-xs font-medium",
                                sale.status === "completed"
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                                  : sale.status === "cancelled"
                                    ? "border-white/15 bg-white/5 text-white/55"
                                    : "border-amber-500/35 bg-amber-500/12 text-amber-100",
                              )}
                            >
                              {statusLabel(sale.status)}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-sm text-white/85">
                            {sale.customerName ?? "—"}
                          </TableCell>
                          <TableCell className="text-right text-sm font-semibold tabular-nums text-emerald-200">
                            {fmt.format(sale.total)}
                          </TableCell>
                        </TableRow>
                        {open ? (
                          <TableRow className="border-white/10 bg-black/20 hover:bg-black/25">
                            <TableCell colSpan={5} className="p-0">
                              <div className="space-y-4 px-4 py-4 sm:px-6">
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                                      Subtotal (neto)
                                    </p>
                                    <p className="text-sm font-medium tabular-nums text-white/90">
                                      {fmt.format(sale.subtotal)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                                      IVA
                                    </p>
                                    <p className="text-sm font-medium tabular-nums text-white/90">
                                      {fmt.format(sale.taxTotal)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                                      Descuentos
                                    </p>
                                    <p className="text-sm font-medium tabular-nums text-white/90">
                                      {fmt.format(sale.discountTotal)}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">
                                      Moneda
                                    </p>
                                    <p className="text-sm font-medium text-white/90">
                                      {sale.currency}
                                    </p>
                                  </div>
                                </div>

                                {sale.payments.length > 0 ? (
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                                      Cobros
                                    </p>
                                    <ul className="space-y-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                                      {sale.payments.map((p, i) => (
                                        <li
                                          key={`${sale.id}-p-${i}`}
                                          className="flex justify-between text-sm text-white/85"
                                        >
                                          <span>{p.methodName}</span>
                                          <span className="tabular-nums">
                                            {fmt.format(p.amount)}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}

                                <div>
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                                    Ítems
                                  </p>
                                  <div className="overflow-x-auto rounded-lg border border-white/10">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                          <TableHead className="text-white/65">
                                            Producto
                                          </TableHead>
                                          <TableHead className="text-right text-white/65">
                                            Cant.
                                          </TableHead>
                                          <TableHead className="text-right text-white/65">
                                            P. unit.
                                          </TableHead>
                                          <TableHead className="text-right text-white/65">
                                            IVA %
                                          </TableHead>
                                          <TableHead className="text-right text-white/65">
                                            Desc.
                                          </TableHead>
                                          <TableHead className="text-right text-white/65">
                                            Línea
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {sale.lineItems.length === 0 ? (
                                          <TableRow className="border-white/10">
                                            <TableCell
                                              colSpan={6}
                                              className="text-center text-white/45"
                                            >
                                              Sin líneas en el comprobante.
                                            </TableCell>
                                          </TableRow>
                                        ) : (
                                          sale.lineItems.map((line, li) => (
                                            <TableRow
                                              key={`${sale.id}-line-${li}`}
                                              className="border-white/10"
                                            >
                                              <TableCell className="max-w-[220px]">
                                                <span className="font-medium text-white/90">
                                                  {line.nameSnapshot}
                                                </span>
                                                {line.comment ? (
                                                  <span className="mt-0.5 block text-xs text-white/45">
                                                    {line.comment}
                                                  </span>
                                                ) : null}
                                              </TableCell>
                                              <TableCell className="text-right text-sm tabular-nums text-white/85">
                                                {formatQty(line.quantity)}
                                              </TableCell>
                                              <TableCell className="text-right text-sm tabular-nums text-white/85">
                                                {fmt.format(line.unitPrice)}
                                              </TableCell>
                                              <TableCell className="text-right text-sm tabular-nums text-white/85">
                                                {line.iva > 0
                                                  ? `${line.iva}%`
                                                  : "—"}
                                              </TableCell>
                                              <TableCell className="text-right text-sm tabular-nums text-white/85">
                                                {fmt.format(line.lineDiscount)}
                                              </TableCell>
                                              <TableCell className="text-right text-sm font-medium tabular-nums text-emerald-200/95">
                                                {fmt.format(line.lineTotal)}
                                              </TableCell>
                                            </TableRow>
                                          ))
                                        )}
                                      </TableBody>
                                    </Table>
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
    </div>
  )
}

export default withAuth(OperationsPage)
