"use client"

import {
  createInventoryAdjustment,
  deleteInventoryMovement,
  getArticleInventoryBalance,
  getPopInventoryPageData,
  type InventoryBalanceRow,
  type InventoryCostLayerRow,
  type InventoryLayerAllocationRow,
  type InventoryMovementRow,
} from "@/app/[siteId]/[popId]/inventory/actions"
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
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Boxes,
  ClipboardList,
  Layers,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
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

const MOVEMENT_LABELS: Record<string, string> = {
  sale: "Venta",
  purchase_receipt: "Compra / ingreso",
  adjustment: "Ajuste",
  return_customer: "Devolución cliente",
  return_supplier: "Devolución proveedor",
  transfer_in: "Transferencia entrada",
  transfer_out: "Transferencia salida",
  initial: "Saldo inicial",
}

function formatQty(n: number) {
  const t = Math.round(n * 1e6) / 1e6
  if (Number.isInteger(t)) return String(t)
  return t.toLocaleString("es", { maximumFractionDigits: 6 })
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

function shortUuid(id: string) {
  if (!id) return "—"
  return id.length > 12 ? `${id.slice(0, 8)}…` : id
}

function formatMoneyAr(n: number) {
  const t = Math.round(n * 1e4) / 1e4
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(t)
}

function InventoryPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [ledgerTimeZone, setLedgerTimeZone] = useState("")
  const [movements, setMovements] = useState<InventoryMovementRow[]>([])
  const [costLayers, setCostLayers] = useState<InventoryCostLayerRow[]>([])
  const [layerAllocations, setLayerAllocations] = useState<
    InventoryLayerAllocationRow[]
  >([])
  const [balances, setBalances] = useState<InventoryBalanceRow[]>([])
  const [articleOptions, setArticleOptions] = useState<
    { id: string; name: string; costPrice: number }[]
  >([])
  const [canCreate, setCanCreate] = useState(false)
  const [canPostAdjustmentAccounting, setCanPostAdjustmentAccounting] =
    useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createBanner, setCreateBanner] = useState<string | null>(null)
  const [createArticleId, setCreateArticleId] = useState("")
  const [createAddStock, setCreateAddStock] = useState(true)
  const [createQty, setCreateQty] = useState("1")
  const [createNote, setCreateNote] = useState("")
  const [createStockLoading, setCreateStockLoading] = useState(false)
  const [createStockError, setCreateStockError] = useState<string | null>(null)
  const [createOnHand, setCreateOnHand] = useState<number | null>(null)

  const [deleteRow, setDeleteRow] = useState<InventoryMovementRow | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteBanner, setDeleteBanner] = useState<string | null>(null)

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getPopInventoryPageData(popId)
    if (!res.success) {
      setError(res.error || "Error")
      setLedgerTimeZone(res.ledgerTimeZone ?? "")
      setMovements([])
      setCostLayers([])
      setLayerAllocations([])
      setBalances([])
      setArticleOptions([])
      setCanCreate(false)
      setCanPostAdjustmentAccounting(false)
      setCanDelete(false)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setPopName(res.popName)
    setLedgerTimeZone(res.ledgerTimeZone ?? "")
    setMovements(res.movements)
    setCostLayers(res.costLayers)
    setLayerAllocations(res.layerAllocations)
    setBalances(res.balances)
    setArticleOptions(res.articles)
    setCanCreate(res.canCreate)
    setCanPostAdjustmentAccounting(res.canPostAdjustmentAccounting)
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
    const first = articleOptions[0]
    setCreateArticleId(first?.id ?? "")
    setCreateAddStock(true)
    setCreateQty("1")
    setCreateNote("")
    setCreateStockError(null)
    setCreateOnHand(null)
    setCreateOpen(true)
  }

  useEffect(() => {
    if (!createOpen || !popId || !siteId) {
      if (!createOpen) {
        setCreateStockLoading(false)
        setCreateStockError(null)
        setCreateOnHand(null)
      }
      return
    }
    if (!createArticleId) {
      setCreateStockLoading(false)
      setCreateStockError(null)
      setCreateOnHand(null)
      return
    }
    let cancelled = false
    setCreateStockLoading(true)
    setCreateStockError(null)
    setCreateOnHand(null)
    void (async () => {
      const res = await getArticleInventoryBalance(popId, {
        articleId: createArticleId,
        siteId,
      })
      if (cancelled) return
      setCreateStockLoading(false)
      if (!res.success) {
        setCreateStockError(res.error)
        return
      }
      setCreateOnHand(res.onHand)
    })()
    return () => {
      cancelled = true
    }
  }, [createOpen, createArticleId, popId, siteId])

  useEffect(() => {
    if (
      !createOpen ||
      createAddStock ||
      createOnHand === null ||
      createStockLoading
    ) {
      return
    }
    const maxS = Math.min(10000, Math.max(0, Math.floor(createOnHand)))
    const q = parseInt(createQty, 10)
    if (Number.isFinite(q) && q > maxS) {
      setCreateQty(String(maxS))
    }
  }, [
    createOpen,
    createAddStock,
    createOnHand,
    createStockLoading,
    createQty,
  ])

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId) return
    setCreateSaving(true)
    setCreateBanner(null)
    const q = parseInt(createQty, 10)
    if (!Number.isFinite(q) || q < 1 || q > 10000) {
      setCreateSaving(false)
      setCreateBanner(
        q === 0
          ? "Indicá una cantidad mayor que cero para aplicar el ajuste."
          : "La cantidad debe ser un número entero entre 1 y 10000.",
      )
      return
    }
    const res = await createInventoryAdjustment(popId, {
      articleId: createArticleId,
      quantityDelta: createAddStock ? q : -q,
      note: createNote,
      siteId,
    })
    setCreateSaving(false)
    if (!res.success) {
      setCreateBanner(res.error)
      return
    }
    setCreateOpen(false)
    await load()
  }

  const submitDelete = async () => {
    if (!popId || !siteId || !deleteRow) return
    setDeleteBusy(true)
    setDeleteBanner(null)
    const res = await deleteInventoryMovement(popId, deleteRow.id)
    setDeleteBusy(false)
    if (!res.success) {
      setDeleteBanner(res.error)
      return
    }
    setDeleteRow(null)
    await load()
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

  const createParsedQty = parseInt(createQty, 10)
  const createQtyValid =
    Number.isFinite(createParsedQty) &&
    createParsedQty >= 1 &&
    createParsedQty <= 10000
  const createMaxSubtract =
    createOnHand === null ? 0 : Math.min(10000, Math.floor(createOnHand))
  const createModalCanSubmit =
    createQtyValid &&
    (createAddStock ||
      (createOnHand !== null && createParsedQty <= createMaxSubtract))
  const createStockAfterPreview =
    createOnHand !== null && !createStockLoading && Number.isFinite(createParsedQty)
      ? Math.round(
          (createOnHand +
            (createAddStock ? createParsedQty : -createParsedQty)) *
            1e6,
        ) / 1e6
      : null

  if (!popId || !siteId) {
    return (
      <div className="rootsy-app-light min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">Store ID not found</p>
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
                  <ClipboardList className="size-5" aria-hidden />
                </span>
                Inventario
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
              {canCreate ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  onClick={() => openCreate()}
                  disabled={
                    articleOptions.length === 0 || !canPostAdjustmentAccounting
                  }
                  title={
                    !canPostAdjustmentAccounting
                      ? "Se requieren permisos de inventario y de cuentas (crear y actualizar asientos)."
                      : undefined
                  }
                >
                  <Plus className="size-4" aria-hidden />
                  <span>Nuevo ajuste</span>
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="inline-flex size-9 items-center justify-center rounded-xl border border-foreground/10 bg-secondary text-foreground/70 transition-colors hover:border-primary/25 hover:text-foreground"
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
              >
                {isFullscreen ? (
                  <Minimize2 className="size-4.5" />
                ) : (
                  <Maximize2 className="size-4.5" />
                )}
              </button>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="flex items-center gap-2">
                <Avatar className="size-9 border border-border">
                  <AvatarImage src={userAvatarSrc} alt="" />
                  <AvatarFallback className="bg-muted text-xs font-bold text-primary">
                    {headerUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[120px] truncate text-sm font-medium text-foreground/90 sm:inline">
                  {headerUserName}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="animate-pulse text-sm text-muted-foreground">
              Cargando inventario…
            </p>
          ) : error ? (
            <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                En esta pantalla solo se registran{" "}
                <strong className="text-foreground">ajustes de stock</strong> (sobrantes o faltantes),
                con un asiento contable en el plan del punto de venta. El saldo por artículo es la
                suma de los movimientos. Compras, ventas, saldos iniciales y devoluciones se
                gestionan en otras secciones. Las tablas{" "}
                <strong className="text-foreground">inventory_cost_layers</strong> e{" "}
                <strong className="text-foreground">inventory_layer_allocations</strong> reflejan
                capas FIFO cuando apliquen a otros flujos.
              </p>
              {canCreate && !canPostAdjustmentAccounting ? (
                <p className="max-w-2xl rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                  Para cargar ajustes con asiento necesitás permisos de{" "}
                  <strong className="font-semibold">cuentas</strong> (crear y actualizar asientos)
                  además de inventario.
                </p>
              ) : null}

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                  <Layers className="size-4 text-primary" aria-hidden />
                  Capas de costo (FIFO)
                </h2>
                <p className="mb-3 max-w-2xl text-xs text-muted-foreground">
                  Cada ingreso con costo puede crear una capa: cantidad recibida, restante para
                  consumir y costo unitario. Orden de venta: primero la capa más antigua (
                  <span className="font-mono">received_at</span>).
                </p>
                <div className="overflow-x-auto rounded-xl border border-border bg-card/80 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Artículo</TableHead>
                        <TableHead className="text-right tabular-nums">Recibido</TableHead>
                        <TableHead className="text-right tabular-nums">Restante</TableHead>
                        <TableHead className="text-right">Costo unit.</TableHead>
                        <TableHead>Ingreso</TableHead>
                        <TableHead>Mov. origen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costLayers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            Sin capas todavía. Se crearán al registrar compras/ingresos con costo
                            vinculado a movimientos de stock.
                          </TableCell>
                        </TableRow>
                      ) : (
                        costLayers.map((row) => (
                          <TableRow
                            key={row.id}
                            className="border-border/80 hover:bg-muted/30"
                          >
                            <TableCell className="font-medium text-foreground">
                              {row.articleName}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatQty(row.quantityReceived)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono tabular-nums",
                                row.quantityRemaining <= 0
                                  ? "text-muted-foreground"
                                  : "text-foreground",
                              )}
                            >
                              {formatQty(row.quantityRemaining)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm tabular-nums">
                              {formatMoneyAr(row.unitCost)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                              {formatDateTime(row.receivedAt)}
                            </TableCell>
                            <TableCell
                              className="font-mono text-xs text-muted-foreground"
                              title={row.sourceMovementId ?? undefined}
                            >
                              {row.sourceMovementId
                                ? shortUuid(row.sourceMovementId)
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                  <Boxes className="size-4 text-primary" aria-hidden />
                  Imputaciones FIFO (salidas)
                </h2>
                <p className="mb-3 max-w-2xl text-xs text-muted-foreground">
                  Cada fila es una porción tomada de una capa al registrar una salida (p. ej.
                  venta). Un mismo movimiento puede tener varias filas si mezcla capas.
                </p>
                <div className="overflow-x-auto rounded-xl border border-border bg-card/80 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Artículo</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Costo unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead>Capa</TableHead>
                        <TableHead>Mov. stock</TableHead>
                        <TableHead>Tipo mov.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {layerAllocations.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-10 text-center text-muted-foreground"
                          >
                            Sin imputaciones. Aparecerán cuando las ventas/egresos generen consumo
                            FIFO contra capas.
                          </TableCell>
                        </TableRow>
                      ) : (
                        layerAllocations.map((row) => (
                          <TableRow
                            key={row.id}
                            className="border-border/80 hover:bg-muted/30"
                          >
                            <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                              {formatDateTime(row.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {row.articleName}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {formatQty(row.quantity)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm tabular-nums">
                              {formatMoneyAr(row.unitCost)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm tabular-nums">
                              {formatMoneyAr(row.lineCost)}
                            </TableCell>
                            <TableCell
                              className="font-mono text-xs text-muted-foreground"
                              title={row.layerId}
                            >
                              {shortUuid(row.layerId)}
                            </TableCell>
                            <TableCell
                              className="font-mono text-xs text-muted-foreground"
                              title={row.inventoryMovementId}
                            >
                              {shortUuid(row.inventoryMovementId)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {row.movementType
                                ? MOVEMENT_LABELS[row.movementType] ?? row.movementType
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-foreground/70">
                  Saldos (artículos activos)
                </h2>
                <div className="overflow-x-auto rounded-xl border border-border bg-card/80 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Artículo</TableHead>
                        <TableHead className="text-right tabular-nums">
                          Saldo
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {balances.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={2}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No hay artículos activos en este punto.
                          </TableCell>
                        </TableRow>
                      ) : (
                        balances.map((b) => (
                          <TableRow
                            key={b.articleId}
                            className="border-border/80 hover:bg-muted/30"
                          >
                            <TableCell className="font-medium text-foreground">
                              {b.articleName}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono tabular-nums",
                                b.onHand < 0
                                  ? "text-destructive"
                                  : "text-foreground",
                              )}
                            >
                              {formatQty(b.onHand)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-foreground/70">
                  Últimos movimientos
                </h2>
                <div className="overflow-x-auto rounded-xl border border-border bg-card/80 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Fecha</TableHead>
                        <TableHead>Artículo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Δ cantidad</TableHead>
                        <TableHead>Nota</TableHead>
                        <TableHead>Usuario</TableHead>
                        {canDelete ? <TableHead className="w-[72px]" /> : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={canDelete ? 7 : 6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            Todavía no hay movimientos de stock.
                          </TableCell>
                        </TableRow>
                      ) : (
                        movements.map((m) => (
                          <TableRow
                            key={m.id}
                            className="border-border/80 hover:bg-muted/30"
                          >
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatDateTime(m.createdAt)}
                            </TableCell>
                            <TableCell className="font-medium text-foreground">
                              {m.articleName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono tabular-nums",
                                m.quantityDelta < 0
                                  ? "text-destructive"
                                  : "text-forest",
                              )}
                            >
                              {m.quantityDelta > 0 ? "+" : ""}
                              {formatQty(m.quantityDelta)}
                            </TableCell>
                            <TableCell
                              className="max-w-[160px] truncate text-muted-foreground"
                              title={m.note}
                            >
                              {m.note || "—"}
                            </TableCell>
                            <TableCell
                              className="text-muted-foreground"
                              title={m.createdBy ?? undefined}
                            >
                              {shortUserId(m.createdBy)}
                            </TableCell>
                            {canDelete ? (
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-destructive hover:bg-destructive/10"
                                  aria-label="Eliminar movimiento"
                                  onClick={() => {
                                    setDeleteBanner(null)
                                    setDeleteRow(m)
                                  }}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,640px)] overflow-y-auto border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Nuevo ajuste de inventario</DialogTitle>
          </DialogHeader>
          {createBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {createBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
            <div className="space-y-2">
              <Label htmlFor="inv-article">Artículo</Label>
              <select
                id="inv-article"
                required
                value={createArticleId}
                onChange={(e) => setCreateArticleId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {articleOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <p className="min-h-5 text-xs text-muted-foreground">
                {createStockLoading ? (
                  <span>Consultando stock…</span>
                ) : createStockError ? (
                  <span className="text-destructive">{createStockError}</span>
                ) : createOnHand !== null ? (
                  <span>Stock actual: {formatQty(createOnHand)}</span>
                ) : null}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-qty">Cantidad (0 a 10000; el ajuste exige al menos 1)</Label>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div
                  className="inline-flex h-10 shrink-0 rounded-lg border border-input bg-muted p-0.5"
                  role="group"
                  aria-label="Tipo de ajuste"
                >
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-0 text-sm font-medium transition-colors",
                      !createAddStock
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setCreateAddStock(false)}
                  >
                    Restar stock
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-0 text-sm font-medium transition-colors",
                      createAddStock
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => setCreateAddStock(true)}
                  >
                    Sumar stock
                  </button>
                </div>
                <Input
                  id="inv-qty"
                  type="number"
                  min={0}
                  max={
                    createAddStock
                      ? 10000
                      : Math.min(
                          10000,
                          Math.max(0, Math.floor(createOnHand ?? 0)),
                        )
                  }
                  step={1}
                  inputMode="numeric"
                  value={createQty}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === "") {
                      setCreateQty("")
                      return
                    }
                    const n = parseInt(v, 10)
                    if (Number.isNaN(n)) return
                    if (createAddStock) {
                      setCreateQty(
                        String(Math.min(10000, Math.max(0, n))),
                      )
                      return
                    }
                    const cap = Math.min(
                      10000,
                      Math.max(0, Math.floor(createOnHand ?? 0)),
                    )
                    setCreateQty(String(Math.min(cap, Math.max(0, n))))
                  }}
                  className="min-w-0 flex-1 bg-background font-mono sm:max-w-44"
                />
              </div>
              {createOnHand !== null && !createStockLoading ? (
                <p className="text-xs text-muted-foreground">
                  Tras el ajuste:{" "}
                  {createStockAfterPreview === null
                    ? "—"
                    : formatQty(createStockAfterPreview)}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                El importe del asiento se calcula al confirmar: primero capas FIFO (si existen);
                si no hay o falta cubrir cantidad, se usa el precio de costo del artículo. La fecha
                del asiento es la fecha calendario actual en la zona horaria del punto de venta
                {ledgerTimeZone ? ` (${ledgerTimeZone}).` : "."}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-note">Motivo / detalle</Label>
              <Textarea
                id="inv-note"
                rows={2}
                required
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
                placeholder="Ej. Ajuste por inventario físico abril"
                className="bg-background"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createSaving ||
                  createStockLoading ||
                  createStockError != null ||
                  !createModalCanSubmit
                }
              >
                {createSaving ? "Aplicando…" : "Confirmar ajuste"}
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
          data-rootsy-light-shell="true"
          showCloseButton
          className="border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>¿Eliminar movimiento?</DialogTitle>
          </DialogHeader>
          {deleteBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {deleteBanner}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">
            Se borrará el registro del libro de movimientos. El saldo del artículo se recalculará.
            Usá esta acción solo para correcciones.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteRow(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void submitDelete()}
            >
              {deleteBusy ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(InventoryPage)
