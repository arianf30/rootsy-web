"use client"

import withAuth from "@/hoc/withAuth"
import Image from "next/image"
import Link from "next/link"
import { completeSale } from "@/app/[siteId]/[popId]/sale/completeSale"
import {
  getSaleCatalog,
  type SaleCatalogArticle,
  type SaleCatalogClient,
  type SaleCatalogPaymentMethod,
  type SaleOpenCashSession,
} from "@/app/[siteId]/[popId]/sale/actions"
import {
  DEFAULT_SALE_SITE_ID,
  getSaleInvoiceTypeOptionsForSite,
  type SaleInvoiceTypeOption,
} from "@/lib/saleInvoiceTypes"
import { popMenuHref } from "@/lib/popRoutes"
import { useAuth } from "@/context/AuthContextSupabase"
import { useParams } from "next/navigation"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import {
  ArrowLeft,
  Banknote,
  CircleCheck,
  CircleX,
  LayoutGrid,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  MessageSquare,
  MoreVertical,
  Percent,
  Plus,
  Receipt,
  Rows3,
  Search,
  Tag,
  Trash2,
  User,
  Wifi,
  WifiOff,
} from "lucide-react"
import { usePadronAutofillRazonSocial } from "@/hooks/usePadronAutofillRazonSocial"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

type Producto = {
  id: string
  nombre: string
  descripcion: string
  precio: number
  precioOriginal?: number
  categoria: string
  imagen: string
  promo?: string
}

type ItemCarrito = {
  productoId: string
  cantidad: number
}

type VistaCatalogo =
  | { modo: "categoria"; categoria: string }
  | { modo: "promociones" }
  | { modo: "con_descuento" }

const CATEGORIA_TODOS = "Todos"

function articleToProducto(a: SaleCatalogArticle): Producto {
  return {
    id: a.id,
    nombre: a.name,
    descripcion: a.description.trim() ? a.description : "—",
    precio: a.salePrice,
    categoria: a.categoryName.trim() ? a.categoryName : "—",
    imagen: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(a.id)}&backgroundColor=1a1f1d`,
  }
}

const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
})

function normalizarBusqueda(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
}

function IconoLimpiarBusqueda({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-[14px] shrink-0", className)}
      aria-hidden
    >
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  )
}

function CartItemTitleMarquee({
  text,
  active,
  className,
}: {
  text: string
  active: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const prevActiveRef = useRef(false)
  const [truncated, setTruncated] = useState(false)
  const [marqueeKey, setMarqueeKey] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduceMotion(mq.matches)
    const fn = () => setReduceMotion(mq.matches)
    mq.addEventListener("change", fn)
    return () => mq.removeEventListener("change", fn)
  }, [])

  const syncMeasure = useCallback(() => {
    const c = containerRef.current
    const g = ghostRef.current
    if (!c || !g || !text) {
      setTruncated(false)
      return
    }
    setTruncated(g.scrollWidth > c.clientWidth + 1)
  }, [text])

  useLayoutEffect(() => {
    if (!active || !text) {
      setTruncated(false)
      prevActiveRef.current = active
      return
    }
    if (active && !prevActiveRef.current) {
      setMarqueeKey((k) => k + 1)
    }
    prevActiveRef.current = active
    syncMeasure()
    const id = requestAnimationFrame(syncMeasure)
    return () => cancelAnimationFrame(id)
  }, [active, text, syncMeasure])

  useEffect(() => {
    if (!active || !text) return
    const c = containerRef.current
    if (!c || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(syncMeasure)
    ro.observe(c)
    return () => ro.disconnect()
  }, [active, text, syncMeasure])

  if (!text) return null

  const durationSec = Math.min(28, Math.max(12, text.length * 0.42))
  const marqueeStyle = {
    "--rootsy-cart-marquee-duration": `${durationSec}s`,
  } as CSSProperties

  const ghost = (
    <span
      ref={ghostRef}
      className={cn(
        "pointer-events-none absolute top-0 left-0 max-w-none whitespace-nowrap opacity-0",
        className,
      )}
      aria-hidden
    >
      {text}
    </span>
  )

  const segment = (duplicate: boolean) => (
    <span
      className="inline-flex shrink-0 items-center"
      aria-hidden={duplicate ? true : undefined}
    >
      <span className={className}>{text}</span>
      <span className="inline-flex h-5 min-w-10 shrink-0 items-center justify-center px-1 text-sm font-medium text-[#8a9aaf]">
        ·
      </span>
    </span>
  )

  if (!active) {
    return (
      <div ref={containerRef} className="relative min-w-0 overflow-hidden">
        {ghost}
        <p className={cn("line-clamp-1", className)}>{text}</p>
      </div>
    )
  }

  if (reduceMotion && truncated) {
    return (
      <div ref={containerRef} className="relative min-w-0 overflow-hidden">
        {ghost}
        <p className={cn("wrap-break-word", className)}>{text}</p>
      </div>
    )
  }

  if (!truncated) {
    return (
      <div ref={containerRef} className="relative min-w-0 overflow-hidden">
        {ghost}
        <p className={cn("line-clamp-1", className)}>{text}</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative min-w-0 overflow-hidden">
      {ghost}
      <div className="rootsy-cart-item-marquee-fade overflow-hidden">
        <div
          key={marqueeKey}
          className="rootsy-cart-title-marquee-track"
          style={marqueeStyle}
        >
          {segment(false)}
          {segment(true)}
        </div>
      </div>
    </div>
  )
}

function SalePage() {
  const params = useParams()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined
  const { user } = useAuth()

  const [catalogArticles, setCatalogArticles] = useState<SaleCatalogArticle[]>(
    [],
  )
  const [saleClients, setSaleClients] = useState<SaleCatalogClient[]>([])
  const [salePaymentMethods, setSalePaymentMethods] = useState<
    SaleCatalogPaymentMethod[]
  >([])
  const [canReadClients, setCanReadClients] = useState(false)
  const [canReadPaymentMethods, setCanReadPaymentMethods] = useState(false)
  const [invoiceTypeSiteId, setInvoiceTypeSiteId] = useState<string>(
    DEFAULT_SALE_SITE_ID,
  )
  const [saleCategoryNames, setSaleCategoryNames] = useState<string[]>([])
  const [popName, setPopName] = useState("")
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const categoriasNav = useMemo(
    () => [CATEGORIA_TODOS, ...saleCategoryNames],
    [saleCategoryNames],
  )

  const loadCatalog = useCallback(async () => {
    if (!popId || !siteId) {
      setCatalogLoading(false)
      setCatalogError("Punto de venta no encontrado")
      return
    }
    setCatalogLoading(true)
    setCatalogError(null)
    const res = await getSaleCatalog(popId)
    if (!res.success) {
      setCatalogArticles([])
      setSaleClients([])
      setSalePaymentMethods([])
      setCanReadClients(false)
      setCanReadPaymentMethods(false)
      setCanCreateSale(false)
      setCanReadCashRegisters(false)
      setOpenCashSession(null)
      setSaleCategoryNames([])
      setPopName("")
      setCatalogError(res.error)
      setCatalogLoading(false)
      return
    }
    setCatalogArticles(res.articles)
    setSaleClients(res.clients)
    setSalePaymentMethods(res.paymentMethods)
    setCanReadClients(res.canReadClients)
    setCanReadPaymentMethods(res.canReadPaymentMethods)
    setCanCreateSale(res.canCreateSale)
    setCanReadCashRegisters(res.canReadCashRegisters)
    setOpenCashSession(res.openCashSession)
    setInvoiceTypeSiteId(res.invoiceTypeSiteId)
    setSaleCategoryNames(
      [...new Set(res.categories.map((c) => c.name).filter(Boolean))],
    )
    setPopName(res.popName)
    setCatalogError(null)
    setCatalogLoading(false)
  }, [popId, siteId])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (!canReadPaymentMethods || salePaymentMethods.length === 0) return
    setMetodoPagoSeleccionado((prev) => {
      if (prev && salePaymentMethods.some((m) => m.id === prev.id)) {
        return prev
      }
      const efectivo = salePaymentMethods.find((m) => m.kind === "cash")
      return efectivo ? { id: efectivo.id, label: efectivo.name } : null
    })
  }, [canReadPaymentMethods, salePaymentMethods])

  const productosCatalogo = useMemo(
    () => catalogArticles.map(articleToProducto),
    [catalogArticles],
  )

  const [vistaCatalogo, setVistaCatalogo] = useState<VistaCatalogo>({
    modo: "categoria",
    categoria: CATEGORIA_TODOS,
  })
  const [modoVista, setModoVista] = useState<"grid" | "lista">("grid")
  const [busqueda, setBusqueda] = useState("")
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{
    id: string
    name: string
    taxId: string | null
  } | null>(null)
  const [fiscalDocVenta, setFiscalDocVenta] = useState("")
  const ventaPadron = usePadronAutofillRazonSocial(popId, fiscalDocVenta, {
    enabled: Boolean(popId),
  })
  const [clienteModalAbierto, setClienteModalAbierto] = useState(false)
  const [busquedaClienteModal, setBusquedaClienteModal] = useState("")
  const [comprobante, setComprobante] = useState<string | null>(null)
  const [comprobanteModalAbierto, setComprobanteModalAbierto] = useState(false)
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<{
    id: string
    label: string
  } | null>(null)
  const [pagoModalAbierto, setPagoModalAbierto] = useState(false)
  const [modoDescuento, setModoDescuento] = useState<"porcentaje" | "fijo">(
    "porcentaje",
  )
  const [valorDescuentoPorcentaje, setValorDescuentoPorcentaje] = useState(0)
  const [valorDescuentoFijo, setValorDescuentoFijo] = useState(0)
  const [descuentoModalAbierto, setDescuentoModalAbierto] = useState(false)
  const [descartarConfirmOpen, setDescartarConfirmOpen] = useState(false)
  const [venderConfirmOpen, setVenderConfirmOpen] = useState(false)
  const [ventaSubmitting, setVentaSubmitting] = useState(false)
  const [ventaError, setVentaError] = useState<string | null>(null)
  const [canCreateSale, setCanCreateSale] = useState(false)
  const [canReadCashRegisters, setCanReadCashRegisters] = useState(false)
  const [openCashSession, setOpenCashSession] =
    useState<SaleOpenCashSession | null>(null)
  const [descuentoDraftModo, setDescuentoDraftModo] = useState<
    "porcentaje" | "fijo"
  >("porcentaje")
  const [descuentoDraftTexto, setDescuentoDraftTexto] = useState("")
  const [itemDetalleAbiertoId, setItemDetalleAbiertoId] = useState<string | null>(
    null,
  )
  const [itemComentarios, setItemComentarios] = useState<Record<string, string>>({})
  const [itemDescuentoModo, setItemDescuentoModo] = useState<
    Record<string, "porcentaje" | "fijo">
  >({})
  const [itemDescuentoDraft, setItemDescuentoDraft] = useState<
    Record<string, string>
  >({})
  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const busquedaProductosInputRef = useRef<HTMLInputElement>(null)
  const busquedaClienteInputRef = useRef<HTMLInputElement>(null)
  const vistaAntesBusquedaRef = useRef<VistaCatalogo | null>(null)
  const busquedaTrimPrevRef = useRef("")

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const hayBusqueda = q.length > 0
    return productosCatalogo.filter((p) => {
      const matchVista = hayBusqueda
        ? true
        : vistaCatalogo.modo === "categoria"
          ? vistaCatalogo.categoria === CATEGORIA_TODOS ||
            p.categoria === vistaCatalogo.categoria
          : vistaCatalogo.modo === "promociones"
            ? Boolean(p.promo?.trim())
            : p.precioOriginal != null && p.precioOriginal > p.precio
      const matchQ =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
      return matchVista && matchQ
    })
  }, [busqueda, vistaCatalogo, productosCatalogo])

  useEffect(() => {
    const trimmed = busqueda.trim()
    const prevTrimmed = busquedaTrimPrevRef.current
    const wasEmpty = prevTrimmed.length === 0
    const isEmpty = trimmed.length === 0

    if (!isEmpty && wasEmpty) {
      vistaAntesBusquedaRef.current = vistaCatalogo
    }

    if (isEmpty && !wasEmpty) {
      const saved = vistaAntesBusquedaRef.current
      if (saved != null) {
        setVistaCatalogo(saved)
        vistaAntesBusquedaRef.current = null
      }
    }

    if (!isEmpty) {
      setVistaCatalogo((prev) => {
        if (prev.modo === "categoria" && prev.categoria === CATEGORIA_TODOS) {
          return prev
        }
        return { modo: "categoria", categoria: CATEGORIA_TODOS }
      })
    }

    busquedaTrimPrevRef.current = trimmed
  }, [busqueda, vistaCatalogo])

  const itemsDetallados = useMemo(() => {
    return carrito
      .map((i) => ({
        ...i,
        producto: productosCatalogo.find((p) => p.id === i.productoId),
      }))
      .filter((i) => i.producto)
  }, [carrito, productosCatalogo])

  const subtotalBruto = useMemo(
    () =>
      itemsDetallados.reduce(
        (acc, i) => acc + (i.producto?.precio ?? 0) * i.cantidad,
        0,
      ),
    [itemsDetallados],
  )

  const itemDescuentoMontos = useMemo(() => {
    const descuentos: Record<string, number> = {}
    itemsDetallados.forEach((item) => {
      const itemId = item.productoId
      const precioBase = (item.producto?.precio ?? 0) * item.cantidad
      const raw = (itemDescuentoDraft[itemId] ?? "").trim().replace(",", ".")
      const n = Number.parseFloat(raw)
      if (!Number.isFinite(n) || n <= 0) {
        descuentos[itemId] = 0
        return
      }
      const modo = itemDescuentoModo[itemId] ?? "porcentaje"
      descuentos[itemId] =
        modo === "porcentaje"
          ? precioBase * (Math.min(100, Math.max(0, n)) / 100)
          : Math.min(Math.max(0, n), precioBase)
    })
    return descuentos
  }, [itemsDetallados, itemDescuentoDraft, itemDescuentoModo])

  const descuentoItemsMonto = useMemo(
    () => Object.values(itemDescuentoMontos).reduce((acc, n) => acc + n, 0),
    [itemDescuentoMontos],
  )

  const subtotal = subtotalBruto - descuentoItemsMonto

  const descuentoMonto = useMemo(() => {
    if (modoDescuento === "porcentaje") {
      return subtotal * (valorDescuentoPorcentaje / 100)
    }
    return Math.min(valorDescuentoFijo, subtotal)
  }, [modoDescuento, subtotal, valorDescuentoPorcentaje, valorDescuentoFijo])

  const total = subtotal - descuentoMonto

  const hayDescuento = descuentoMonto > 0

  const hayItemsEnPedido = itemsDetallados.length > 0

  const hayContenidoVenta = useMemo(() => {
    if (carrito.length > 0) return true
    if (clienteSeleccionado != null) return true
    if (comprobante != null) return true
    if (hayDescuento) return true
    if (descuentoItemsMonto > 0) return true
    if (Object.values(itemComentarios).some((c) => c?.trim())) return true
    return false
  }, [
    carrito.length,
    clienteSeleccionado,
    comprobante,
    hayDescuento,
    descuentoItemsMonto,
    itemComentarios,
  ])

  const puedeRegistrarVenta = useMemo(
    () =>
      hayItemsEnPedido &&
      metodoPagoSeleccionado != null &&
      canCreateSale &&
      canReadCashRegisters &&
      openCashSession != null,
    [
      hayItemsEnPedido,
      metodoPagoSeleccionado?.id,
      canCreateSale,
      canReadCashRegisters,
      openCashSession,
    ],
  )

  const limpiarVenta = useCallback(() => {
    setCarrito([])
    setClienteSeleccionado(null)
    setFiscalDocVenta("")
    setComprobante(null)
    setModoDescuento("porcentaje")
    setValorDescuentoPorcentaje(0)
    setValorDescuentoFijo(0)
    setItemDetalleAbiertoId(null)
    setItemComentarios({})
    setItemDescuentoModo({})
    setItemDescuentoDraft({})
    setMetodoPagoSeleccionado(() => {
      const efectivo = salePaymentMethods.find((m) => m.kind === "cash")
      return efectivo ? { id: efectivo.id, label: efectivo.name } : null
    })
    setDescartarConfirmOpen(false)
    setVenderConfirmOpen(false)
    setVentaError(null)
  }, [salePaymentMethods])

  const confirmarVenta = useCallback(async () => {
    if (!popId || !siteId || !metodoPagoSeleccionado) return
    setVentaError(null)
    setVentaSubmitting(true)
    try {
      const hasFiscalOverride =
        Boolean(fiscalDocVenta.trim()) ||
        Boolean(ventaPadron.razonSocial.trim())
      const fiscalCustomer = hasFiscalOverride
        ? {
            name:
              ventaPadron.razonSocial.trim() ||
              clienteSeleccionado?.name ||
              "",
            taxId:
              fiscalDocVenta.trim() ||
              clienteSeleccionado?.taxId ||
              null,
          }
        : null
      const res = await completeSale(popId, {
        siteId,
        lines: carrito.map((i) => ({
          articleId: i.productoId,
          quantity: i.cantidad,
          itemDiscountMode: itemDescuentoModo[i.productoId] ?? "porcentaje",
          itemDiscountDraft: itemDescuentoDraft[i.productoId] ?? "",
          comment: itemComentarios[i.productoId],
        })),
        clientId: clienteSeleccionado?.id ?? null,
        paymentMethodId: metodoPagoSeleccionado.id,
        generalDiscountMode: modoDescuento === "porcentaje" ? "porcentaje" : "fijo",
        valorDescuentoPorcentaje,
        valorDescuentoFijo,
        invoiceTypeLabel: comprobante,
        fiscalCustomer,
      })
      if (!res.success) {
        setVentaError(res.error)
        return
      }
      setVenderConfirmOpen(false)
      limpiarVenta()
    } finally {
      setVentaSubmitting(false)
    }
  }, [
    popId,
    siteId,
    carrito,
    itemDescuentoModo,
    itemDescuentoDraft,
    itemComentarios,
    clienteSeleccionado,
    metodoPagoSeleccionado,
    modoDescuento,
    valorDescuentoPorcentaje,
    valorDescuentoFijo,
    comprobante,
    fiscalDocVenta,
    ventaPadron.razonSocial,
    limpiarVenta,
  ])

  useEffect(() => {
    if (modoDescuento !== "fijo") return
    if (valorDescuentoFijo > subtotal) {
      setValorDescuentoFijo(Math.max(0, subtotal))
    }
  }, [modoDescuento, subtotal, valorDescuentoFijo])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    syncFullscreen()
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () => document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])

  const clientesFiltradosModal = useMemo(() => {
    const q = normalizarBusqueda(busquedaClienteModal.trim())
    if (!q) return saleClients
    return saleClients.filter((c) =>
      normalizarBusqueda(c.name).includes(q),
    )
  }, [busquedaClienteModal, saleClients])

  const invoiceTypeOptions = useMemo((): readonly SaleInvoiceTypeOption[] => {
    return getSaleInvoiceTypeOptionsForSite(invoiceTypeSiteId)
  }, [invoiceTypeSiteId])

  const paymentMethodGroups = useMemo(() => {
    const order = [
      "cash",
      "card_debit",
      "card_credit",
      "transfer",
      "other",
    ] as const
    const sectionLabel: Record<(typeof order)[number], string> = {
      cash: "Efectivo",
      card_debit: "Débito",
      card_credit: "Crédito",
      transfer: "Transferencia",
      other: "Otros",
    }
    const buckets: Record<string, SaleCatalogPaymentMethod[]> = {}
    for (const k of order) buckets[k] = []
    for (const m of salePaymentMethods) {
      const k = order.includes(m.kind as (typeof order)[number])
        ? (m.kind as (typeof order)[number])
        : "other"
      buckets[k].push(m)
    }
    return order
      .filter((k) => buckets[k].length > 0)
      .map((kind) => ({
        kind,
        title: sectionLabel[kind],
        items: buckets[kind],
      }))
  }, [salePaymentMethods])

  const agregarAlCarrito = (productoId: string) => {
    setCarrito((prev) => {
      const existe = prev.find((i) => i.productoId === productoId)
      if (existe) {
        return prev.map((i) =>
          i.productoId === productoId ? { ...i, cantidad: i.cantidad + 1 } : i,
        )
      }
      return [...prev, { productoId, cantidad: 1 }]
    })
  }

  const cambiarCantidad = (productoId: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.productoId === productoId
            ? { ...i, cantidad: Math.max(1, i.cantidad + delta) }
            : i,
        )
        .filter((i) => i.cantidad > 0),
    )
  }

  const quitarDelCarrito = (productoId: string) => {
    setCarrito((prev) => prev.filter((i) => i.productoId !== productoId))
  }

  const onClienteToolbarClick = () => {
    if (!canReadClients) return
    setBusquedaClienteModal("")
    setClienteModalAbierto(true)
  }

  const seleccionarCliente = (c: SaleCatalogClient) => {
    setClienteSeleccionado({
      id: c.id,
      name: c.name,
      taxId: c.taxId,
    })
    setFiscalDocVenta(c.taxId ?? "")
    setClienteModalAbierto(false)
  }

  const abrirModalDescuento = () => {
    if (hayDescuento) {
      if (modoDescuento === "porcentaje") {
        setDescuentoDraftModo("porcentaje")
        setDescuentoDraftTexto(
          valorDescuentoPorcentaje > 0
            ? String(valorDescuentoPorcentaje)
            : "",
        )
      } else {
        setDescuentoDraftModo("fijo")
        setDescuentoDraftTexto(
          valorDescuentoFijo > 0 ? String(valorDescuentoFijo) : "",
        )
      }
    } else {
      setDescuentoDraftModo("porcentaje")
      setDescuentoDraftTexto("")
    }
    setDescuentoModalAbierto(true)
  }

  const aplicarDescuentoModal = () => {
    const raw = descuentoDraftTexto.trim().replace(",", ".")
    const n = Number.parseFloat(raw)
    if (!Number.isFinite(n) || n < 0) {
      setModoDescuento("porcentaje")
      setValorDescuentoPorcentaje(0)
      setValorDescuentoFijo(0)
      setDescuentoModalAbierto(false)
      return
    }
    if (descuentoDraftModo === "porcentaje") {
      const pct = Math.min(100, Math.max(0, n))
      setModoDescuento("porcentaje")
      setValorDescuentoPorcentaje(pct)
      setValorDescuentoFijo(0)
    } else {
      if (subtotal > 0 && n > subtotal) {
        setModoDescuento("porcentaje")
        setValorDescuentoPorcentaje(100)
        setValorDescuentoFijo(0)
      } else {
        const tope = Math.min(n, subtotal)
        setModoDescuento("fijo")
        setValorDescuentoFijo(Math.max(0, tope))
        setValorDescuentoPorcentaje(0)
      }
    }
    setDescuentoModalAbierto(false)
  }

  const quitarDescuento = () => {
    setModoDescuento("porcentaje")
    setValorDescuentoPorcentaje(0)
    setValorDescuentoFijo(0)
    setDescuentoModalAbierto(false)
  }

  const toggleItemDetalle = (itemId: string) => {
    setItemDetalleAbiertoId((prev) => (prev === itemId ? null : itemId))
  }

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen()
  }

  const toolboxBarClass =
    "border-t border-white/10 bg-[#0b100e]/92 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-xl sm:p-2.5"
  const toolboxSlotClass = (configurado: boolean) =>
    cn(
      "group flex h-full min-h-[4.5rem] w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-[background-color,border-color,box-shadow] duration-150 sm:min-h-[4.75rem] sm:gap-3 sm:px-3",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b100e]",
      configurado
        ? "border-emerald-500/30 bg-emerald-500/[0.09] shadow-[inset_0_1px_0_rgba(167,243,208,0.08)] hover:border-emerald-400/35 hover:bg-emerald-500/12"
        : "border-white/[0.06] bg-white/[0.02] hover:border-white/12 hover:bg-white/[0.05]",
    )
  const toolboxIconWrap = (configurado: boolean) =>
    cn(
      "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 sm:size-10",
      configurado
        ? "bg-emerald-500/20 text-emerald-200"
        : "bg-white/[0.06] text-foreground/45 group-hover:bg-white/10 group-hover:text-foreground/75",
    )

  const modalOpcionBase =
    "rounded-xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  const modalOpcionSeleccionada =
    "border-primary/55 bg-primary/12 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
  const modalOpcionIdle =
    "border-foreground/10 bg-secondary hover:bg-muted"

  const ventaDialogSurface =
    "gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
  const ventaDialogMaxViewport =
    "max-h-[calc(100vh-100px)] flex flex-col overflow-hidden"
  const ventaDialogSurfaceMd = cn(
    ventaDialogSurface,
    ventaDialogMaxViewport,
    "sm:max-w-md",
  )
  const ventaDialogSurfaceLg = cn(
    ventaDialogSurface,
    ventaDialogMaxViewport,
    "sm:max-w-2xl",
  )
  const ventaDialogHeader =
    "space-y-1.5 border-b border-border/50 bg-muted/25 px-6 pb-4 pt-5 text-left"
  const ventaDialogBody = "px-6 py-4"
  const ventaDialogFooter =
    "border-t border-border/50 bg-muted/15 px-6 py-3.5 sm:justify-between"
  const ventaDialogPrimaryBtn =
    "h-10 bg-emerald-600 font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700"
  const ventaDialogGhostBtn = "h-10 text-muted-foreground hover:text-foreground"

  const headerUserName = useMemo(() => {
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "Usuario"
  }, [user?.email, user?.user_metadata?.full_name])

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
    <div className="relative h-screen overflow-hidden bg-[#070a09] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.14),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.1),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[38px_38px] opacity-20" />
      </div>

      <div className="relative z-10 grid h-full grid-rows-[4.5rem_minmax(0,1fr)]">
        <header className="border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
          <div className="grid h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={
                  siteId && popId ? popMenuHref(siteId, popId) : "/home"
                }
                className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/6 bg-secondary text-foreground/70 transition-all hover:border-foreground/12 hover:bg-muted hover:text-foreground"
                aria-label="Volver"
              >
                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="size-8 overflow-hidden rounded-lg ring-1 ring-border">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId)}&backgroundColor=1a1f1d`}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <span className="truncate text-sm font-semibold text-foreground/85">
                  {popName || (catalogLoading ? "…" : "—")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-[1.85rem] font-black tracking-tight text-foreground">
                Vender
              </h1>
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
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Mas opciones"
              >
                <MoreVertical className="size-4.5" />
              </button>
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
                  <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-card bg-primary" />
                </div>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-foreground/85">
                    {headerUserName}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow">
                    Ventas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(4.75rem,auto)]">
            <div className="grid min-h-0 grid-cols-[280px_minmax(0,1fr)]">
              <aside className="flex min-h-0 min-w-0 flex-col border-r border-white/10 bg-[#1a2027]">
                <nav
                  className="game-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 py-4"
                  aria-label="Filtros del catálogo"
                >
                  <div>
                    <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Categorías
                    </p>
                    <ul className="flex flex-col gap-0.5 p-0" role="list">
                      {categoriasNav.map((cat) => {
                        const seleccionado =
                          vistaCatalogo.modo === "categoria" &&
                          vistaCatalogo.categoria === cat
                        return (
                          <li key={cat}>
                            <button
                              type="button"
                              onClick={() =>
                                setVistaCatalogo({
                                  modo: "categoria",
                                  categoria: cat,
                                })
                              }
                              className={cn(
                                "relative flex min-h-11 w-full items-center rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2027]",
                                seleccionado
                                  ? "bg-white/10 text-white before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-emerald-400 before:content-['']"
                                  : "text-slate-400 hover:bg-white/6 hover:text-slate-100",
                              )}
                            >
                              {cat}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <div>
                    <p className="mb-2.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                      Listados rápidos
                    </p>
                    <ul className="flex flex-col gap-0.5 p-0" role="list">
                      <li>
                        <button
                          type="button"
                          aria-pressed={vistaCatalogo.modo === "promociones"}
                          onClick={() =>
                            setVistaCatalogo({ modo: "promociones" })
                          }
                          className={cn(
                            "relative flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2027]",
                            vistaCatalogo.modo === "promociones"
                              ? "bg-emerald-500/12 text-emerald-100 before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-emerald-400 before:content-['']"
                              : "text-slate-400 hover:bg-white/6 hover:text-slate-100",
                          )}
                        >
                          <Tag className="size-4 shrink-0 opacity-80" aria-hidden />
                          Promociones
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          aria-pressed={vistaCatalogo.modo === "con_descuento"}
                          onClick={() =>
                            setVistaCatalogo({ modo: "con_descuento" })
                          }
                          className={cn(
                            "relative flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium transition-colors duration-150",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a2027]",
                            vistaCatalogo.modo === "con_descuento"
                              ? "bg-amber-500/12 text-amber-100 before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-amber-400 before:content-['']"
                              : "text-slate-400 hover:bg-white/6 hover:text-slate-100",
                          )}
                        >
                          <Percent className="size-4 shrink-0 opacity-80" aria-hidden />
                          Con descuento
                        </button>
                      </li>
                    </ul>
                  </div>
                </nav>
              </aside>

              <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-[#20262e]">
                <div className="flex min-w-0 items-center gap-3 border-b border-white/10 px-4 py-3">
                  <div className="relative flex h-10 shrink-0 items-center rounded-lg border border-white/12 bg-black/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(16,185,129,0.06)]">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-1 left-1 w-10 rounded-md border border-emerald-300/35 bg-linear-to-b from-emerald-300/22 via-emerald-400/16 to-emerald-500/12 shadow-[0_0_18px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] transition-transform duration-300 ease-out"
                      style={{
                        transform:
                          modoVista === "lista"
                            ? "translateX(2.5rem)"
                            : "translateX(0)",
                      }}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-1 bottom-0 h-px bg-linear-to-r from-transparent via-emerald-300/55 to-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setModoVista("grid")}
                      className={cn(
                        "relative z-10 flex h-8 w-10 items-center justify-center rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-0",
                        modoVista === "grid"
                          ? "text-white drop-shadow-[0_0_10px_rgba(110,231,183,0.6)]"
                          : "text-slate-300/80 hover:text-white/95",
                      )}
                      aria-label="Vista en grilla"
                      aria-pressed={modoVista === "grid"}
                    >
                      <LayoutGrid className="size-4.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoVista("lista")}
                      className={cn(
                        "relative z-10 flex h-8 w-10 items-center justify-center rounded-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-0",
                        modoVista === "lista"
                          ? "text-white drop-shadow-[0_0_10px_rgba(110,231,183,0.6)]"
                          : "text-slate-300/80 hover:text-white/95",
                      )}
                      aria-label="Vista en columna"
                      aria-pressed={modoVista === "lista"}
                    >
                      <Rows3 className="size-4.5" />
                    </button>
                  </div>
                  <div className="relative min-w-0 flex-1 max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      ref={busquedaProductosInputRef}
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar o escanear producto..."
                      className={cn(
                        "h-10 border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/35",
                        busqueda.length > 0 && "pr-9",
                      )}
                    />
                    {busqueda.length > 0 ? (
                      <button
                        type="button"
                        aria-label="Limpiar búsqueda"
                        className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-[color,background-color] duration-150 hover:bg-white/[0.07] hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/70 focus-visible:ring-offset-0 active:bg-white/11"
                        onClick={() => {
                          setBusqueda("")
                          busquedaProductosInputRef.current?.focus()
                        }}
                      >
                        <IconoLimpiarBusqueda />
                      </button>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-white/60">
                    {productosFiltrados.length} productos mostrados
                  </span>
                </div>

                <div
                  className={cn(
                    "min-h-0",
                    catalogLoading && !catalogError
                      ? "flex flex-1 flex-col p-6"
                      : catalogError
                        ? "flex flex-1 flex-col p-6"
                        : productosFiltrados.length === 0
                          ? "relative overflow-hidden p-0"
                          : "game-scroll overflow-y-auto p-3",
                  )}
                >
                  {catalogLoading && !catalogError ? (
                    <div className="flex min-h-[200px] flex-1 items-center justify-center">
                      <p className="text-sm text-slate-400">
                        Cargando productos…
                      </p>
                    </div>
                  ) : catalogError ? (
                    <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center gap-2 text-center">
                      <p className="max-w-md text-sm text-rose-300">
                        {catalogError}
                      </p>
                    </div>
                  ) : productosFiltrados.length === 0 ? (
                    <div
                      aria-live="polite"
                      className="rootsy-hero-slide-in-right pointer-events-none absolute right-[-50px] bottom-[-25px] z-10"
                    >
                      <Image
                        src="/empty-products-mascot.png"
                        alt=""
                        width={260}
                        height={260}
                        className="h-auto w-full max-w-[260px] object-contain opacity-95"
                      />
                    </div>
                  ) : (
                    <div
                      className={
                        modoVista === "grid"
                          ? "grid grid-cols-3 gap-3"
                          : "flex flex-col gap-2"
                      }
                    >
                      {productosFiltrados.map((p) => {
                        const descuentoPct =
                          p.precioOriginal != null &&
                          p.precioOriginal > p.precio
                            ? Math.round(
                                ((p.precioOriginal - p.precio) /
                                  p.precioOriginal) *
                                  100,
                              )
                            : null
                        const promoTrim = p.promo?.trim() ?? ""
                        const mostrarBadgeOferta =
                          descuentoPct != null || promoTrim.length > 0

                        return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => agregarAlCarrito(p.id)}
                          className={cn(
                            "group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-[#252b34] text-left",
                            "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_0_1px_rgba(0,0,0,0.45),0_1px_2px_rgba(0,0,0,0.22),0_6px_16px_rgba(0,0,0,0.28),0_16px_40px_rgba(0,0,0,0.38)]",
                            "before:pointer-events-none before:absolute before:inset-y-4 before:left-0 before:z-10 before:w-0.5 before:rounded-full before:bg-emerald-400 before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-90",
                            modoVista === "lista"
                              ? "flex min-h-[152px] items-stretch"
                              : "grid h-[318px] grid-rows-[152px_1fr]",
                          )}
                        >
                          <div
                            className={cn(
                              "relative overflow-hidden bg-[#0f1416]",
                              modoVista === "grid"
                                ? "h-full w-full"
                                : "h-[152px] w-48 shrink-0",
                            )}
                          >
                            <Image
                              src={p.imagen}
                              alt={p.nombre}
                              fill
                              className="h-full w-full transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                              unoptimized
                              sizes={modoVista === "grid" ? "33vw" : "280px"}
                              style={{
                                objectFit: "cover",
                                objectPosition: "center",
                              }}
                            />
                            {mostrarBadgeOferta ? (
                              <div
                                className="pointer-events-none absolute inset-x-0 top-0 z-15 p-3"
                                aria-hidden
                              >
                                <Badge className="w-fit border border-emerald-400/40 bg-emerald-950/85 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-100 shadow-sm backdrop-blur-sm">
                                  OFERTA
                                </Badge>
                              </div>
                            ) : null}
                            <span
                              className="pointer-events-none absolute right-2 bottom-2 z-20 flex size-9 items-center justify-center rounded-full border border-emerald-300/45 bg-emerald-500 text-emerald-950 opacity-0 shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-[opacity,transform] duration-200 translate-y-1 scale-95 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
                              aria-hidden
                            >
                              <Plus className="size-4.5" strokeWidth={2.5} aria-hidden />
                            </span>
                          </div>
                          <div
                            className={
                              modoVista === "grid"
                                ? "grid h-full min-h-0 gap-2 p-5 grid-rows-[minmax(0,1fr)_auto]"
                                : "flex min-h-0 min-w-0 flex-1 flex-col justify-between gap-2 p-5"
                            }
                          >
                            <div className="min-h-0 self-start">
                              <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground">
                                {p.nombre}
                              </h3>
                              <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                                {p.descripcion}
                              </p>
                            </div>

                            <div
                              className={
                                modoVista === "grid" ? "self-end" : "shrink-0"
                              }
                            >
                              {p.precioOriginal != null &&
                              p.precioOriginal > p.precio ? (
                                <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span className="text-sm font-semibold text-muted-foreground line-through">
                                    {fmt.format(p.precioOriginal)}
                                  </span>
                                  {descuentoPct != null ? (
                                    <span className="inline-flex h-6 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 text-[10px] font-bold uppercase tracking-wider leading-none text-emerald-200">
                                      −{descuentoPct}%
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                              <span className="block text-[clamp(1.16rem,1.9vw,1.5rem)] leading-none font-extrabold tracking-tight text-white">
                                {fmt.format(p.precio)}
                              </span>
                            </div>
                          </div>
                        </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div
              role="toolbar"
              aria-label="Configuración de la venta"
              className={cn("grid h-full min-h-0 grid-cols-2 gap-2 lg:grid-cols-4", toolboxBarClass)}
            >
              <button
                type="button"
                disabled={!canReadClients}
                onClick={onClienteToolbarClick}
                className={cn(
                  toolboxSlotClass(Boolean(clienteSeleccionado)),
                  !canReadClients && "opacity-45",
                )}
                aria-label={
                  !canReadClients
                    ? "No tenés permiso para ver clientes. Pedí acceso de lectura en tu rol."
                    : clienteSeleccionado
                      ? `Cliente: ${clienteSeleccionado.name}. Abrir para cambiar.`
                      : "Cliente sin elegir. Abrir para seleccionar."
                }
              >
                <span className={toolboxIconWrap(Boolean(clienteSeleccionado))}>
                  <User className="size-4.5 sm:size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                    Cliente
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold leading-snug",
                      clienteSeleccionado
                        ? "text-foreground"
                        : "text-foreground/55",
                    )}
                  >
                    {!canReadClients
                      ? "Sin permiso"
                      : (clienteSeleccionado?.name ?? "Elegir cliente")}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setComprobanteModalAbierto(true)}
                className={toolboxSlotClass(Boolean(comprobante))}
                aria-label={
                  comprobante
                    ? `Comprobante: ${comprobante}. Abrir para cambiar.`
                    : "Comprobante sin elegir. Abrir para seleccionar."
                }
              >
                <span className={toolboxIconWrap(Boolean(comprobante))}>
                  <Receipt className="size-4.5 sm:size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                    Comprobante
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold leading-snug",
                      comprobante ? "text-foreground" : "text-foreground/55",
                    )}
                  >
                    {comprobante ?? "Elegir tipo"}
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={!canReadPaymentMethods}
                onClick={() => {
                  if (!canReadPaymentMethods) return
                  setPagoModalAbierto(true)
                }}
                className={cn(
                  toolboxSlotClass(Boolean(metodoPagoSeleccionado)),
                  !canReadPaymentMethods && "opacity-45",
                )}
                aria-label={
                  !canReadPaymentMethods
                    ? "No tenés permiso para ver medios de pago. Pedí acceso de lectura en tu rol."
                    : metodoPagoSeleccionado
                      ? `Pago: ${metodoPagoSeleccionado.label}. Abrir para cambiar.`
                      : "Medio de pago sin elegir. Abrir para seleccionar."
                }
              >
                <span
                  className={toolboxIconWrap(Boolean(metodoPagoSeleccionado))}
                >
                  <Banknote className="size-4.5 sm:size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                    Pago
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold leading-snug",
                      metodoPagoSeleccionado
                        ? "text-foreground"
                        : "text-foreground/55",
                    )}
                  >
                    {!canReadPaymentMethods
                      ? "Sin permiso"
                      : (metodoPagoSeleccionado?.label ?? "Elegir medio")}
                  </span>
                </span>
              </button>
              <button
                type="button"
                onClick={abrirModalDescuento}
                className={toolboxSlotClass(hayDescuento)}
                aria-label={
                  hayDescuento
                    ? `Descuento aplicado: ${
                        modoDescuento === "porcentaje"
                          ? `${valorDescuentoPorcentaje} por ciento`
                          : `${fmt.format(valorDescuentoFijo)} fijo`
                      }. Abrir para editar.`
                    : "Sin descuento en la venta. Abrir para configurar."
                }
              >
                <span className={toolboxIconWrap(hayDescuento)}>
                  <Percent className="size-4.5 sm:size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground/45">
                    Descuento
                  </span>
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold leading-snug",
                      hayDescuento ? "text-foreground" : "text-foreground/55",
                    )}
                  >
                    {hayDescuento
                      ? modoDescuento === "porcentaje"
                        ? `${valorDescuentoPorcentaje}%`
                        : `Fijo ${fmt.format(valorDescuentoFijo)}`
                      : "Sin descuento"}
                  </span>
                </span>
              </button>
            </div>
          </section>

          <aside
            className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-[#eef1f5] text-[#121417]"
            aria-label="Carrito de la venta"
          >
            <div className="flex min-h-0 flex-col">
              <div
                className="game-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3 sm:p-3.5"
                role="region"
                aria-label="Ítems agregados"
              >
                <div className="mb-1 flex items-baseline justify-between gap-2 px-0.5">
                  <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    Tu pedido
                  </h2>
                  <span className="text-[11px] font-medium tabular-nums text-slate-400">
                    {itemsDetallados.length}{" "}
                    {itemsDetallados.length === 1 ? "línea" : "líneas"}
                  </span>
                </div>
                {itemsDetallados.map((item) => {
                  const itemId = item.productoId
                  const abierto = itemDetalleAbiertoId === itemId
                  const comentario = itemComentarios[itemId] ?? ""
                  const descuento = itemDescuentoMontos[itemId] ?? 0
                  const modoItemDescuento = itemDescuentoModo[itemId] ?? "porcentaje"
                  const descuentoRaw = itemDescuentoDraft[itemId] ?? ""
                  const descuentoNumero = Number.parseFloat(
                    descuentoRaw.trim().replace(",", "."),
                  )
                  const precioBaseItem = (item.producto?.precio ?? 0) * item.cantidad
                  const tieneComentario = comentario.trim().length > 0
                  const tieneDescuento = descuento > 0
                  const nombreProducto = item.producto?.nombre ?? "Producto"

                  return (
                    <div key={itemId} className="space-y-2">
                      <div
                        role="button"
                        tabIndex={0}
                        aria-expanded={abierto}
                        aria-controls={
                          abierto ? `cart-item-${itemId}-opciones` : undefined
                        }
                        aria-label={
                          abierto
                            ? `${nombreProducto}, ${item.cantidad} unidades. Opciones visibles. Clic para cerrar.`
                            : `${nombreProducto}, ${item.cantidad} unidades. Clic para descuento y comentario.`
                        }
                        onClick={() => toggleItemDetalle(itemId)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            toggleItemDetalle(itemId)
                          }
                        }}
                        className={cn(
                          "cursor-pointer rounded-xl border bg-white px-3 py-2.5 text-left shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_4px_14px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow] duration-150",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef1f5]",
                          abierto
                            ? "border-slate-300 ring-1 ring-slate-300/60 shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_6px_20px_rgba(15,23,42,0.07)]"
                            : "border-slate-200/90 hover:border-slate-300 hover:shadow-[0_1px_0_rgba(255,255,255,0.95)_inset,0_6px_18px_rgba(15,23,42,0.06)]",
                        )}
                      >
                        <div className="grid grid-cols-[56px_minmax(0,1fr)_minmax(4.5rem,auto)_2rem] items-center gap-2 sm:grid-cols-[56px_minmax(0,1fr)_5.5rem_2rem]">
                          <div
                            className="flex items-center gap-0.5 rounded-lg bg-slate-50 px-1 py-1 ring-1 ring-slate-200/90"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            role="group"
                            aria-label={`Cantidad de ${nombreProducto}`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                cambiarCantidad(itemId, -1)
                              }}
                              aria-label={`Quitar una unidad de ${nombreProducto}`}
                              className="inline-flex size-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
                            >
                              <Minus className="size-3" aria-hidden />
                            </button>
                            <span className="min-w-5 text-center text-sm font-bold tabular-nums text-slate-900">
                              {item.cantidad}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                cambiarCantidad(itemId, 1)
                              }}
                              aria-label={`Agregar una unidad de ${nombreProducto}`}
                              className="inline-flex size-6 items-center justify-center rounded-md bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
                            >
                              <Plus className="size-3" aria-hidden />
                            </button>
                          </div>
                          <div className="min-w-0">
                            <CartItemTitleMarquee
                              text={nombreProducto}
                              active={abierto}
                              className="text-sm font-semibold text-slate-900"
                            />
                            <div className="mt-0.5 flex min-w-0 items-center gap-1">
                              <div className="min-w-0 flex-1">
                                <p className="line-clamp-1 text-xs text-slate-500">
                                  {item.producto?.descripcion}
                                </p>
                              </div>
                              {tieneComentario ? (
                                <span
                                  className="inline-flex shrink-0 items-center rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] font-semibold text-sky-800"
                                  title="Tiene comentario para cocina"
                                >
                                  <span className="sr-only">Comentario</span>
                                  <MessageSquare
                                    className="size-3 sm:hidden"
                                    aria-hidden
                                  />
                                  <span aria-hidden className="hidden sm:inline">
                                    Nota
                                  </span>
                                </span>
                              ) : null}
                              {tieneDescuento ? (
                                <span className="inline-flex max-w-22 shrink-0 items-center justify-center truncate rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-semibold text-emerald-800 tabular-nums">
                                  {modoItemDescuento === "porcentaje"
                                    ? `${Math.min(100, Math.max(0, Number.isFinite(descuentoNumero) ? descuentoNumero : 0))}%`
                                    : fmt.format(descuento)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-right">
                            {tieneDescuento ? (
                              <p className="text-[11px] tabular-nums text-slate-400 line-through">
                                {fmt.format(precioBaseItem)}
                              </p>
                            ) : null}
                            <p className="text-sm font-bold tabular-nums text-slate-900">
                              {fmt.format(precioBaseItem - descuento)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              quitarDelCarrito(itemId)
                            }}
                            aria-label={`Quitar ${nombreProducto} del carrito`}
                            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50"
                          >
                            <Trash2 className="size-4" aria-hidden />
                          </button>
                        </div>
                      </div>

                      {abierto ? (
                        <div
                          id={`cart-item-${itemId}-opciones`}
                          role="region"
                          aria-label={`Opciones de ${nombreProducto}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-xl border border-slate-200/95 bg-white px-2.5 py-2 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_16px_rgba(15,23,42,0.06)]"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-400/50 bg-slate-100 text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
                              aria-label="Cambiar tipo de descuento"
                              onClick={(e) => {
                                e.stopPropagation()
                                setItemDescuentoModo((prev) => ({
                                  ...prev,
                                  [itemId]:
                                    (prev[itemId] ?? "porcentaje") === "porcentaje"
                                      ? "fijo"
                                      : "porcentaje",
                                }))
                              }}
                            >
                              {modoItemDescuento === "porcentaje" ? (
                                <Percent className="size-3.5" aria-hidden />
                              ) : (
                                <Banknote className="size-3.5" aria-hidden />
                              )}
                            </button>
                            <Input
                              value={itemDescuentoDraft[itemId] ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value
                                if (!/^\d*$/.test(raw)) return
                                if (raw === "") {
                                  setItemDescuentoDraft((prev) => ({
                                    ...prev,
                                    [itemId]: "",
                                  }))
                                  return
                                }
                                if (
                                  modoItemDescuento === "fijo" &&
                                  Number(raw) > precioBaseItem
                                ) {
                                  setItemDescuentoModo((prev) => ({
                                    ...prev,
                                    [itemId]: "porcentaje",
                                  }))
                                  setItemDescuentoDraft((prev) => ({
                                    ...prev,
                                    [itemId]: "100",
                                  }))
                                  return
                                }
                                const nextValue =
                                  modoItemDescuento === "porcentaje"
                                    ? String(Math.min(100, Number(raw)))
                                    : raw
                                setItemDescuentoDraft((prev) => ({
                                  ...prev,
                                  [itemId]: nextValue,
                                }))
                              }}
                              placeholder="descuento"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              className="h-8 w-26 border border-slate-300 bg-white! text-[#121417] shadow-none text-xs placeholder:text-slate-500"
                            />
                            <div className="relative min-w-0 flex-1">
                              <MessageSquare className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-500" />
                              <Input
                                value={comentario}
                                onChange={(e) =>
                                  setItemComentarios((prev) => ({
                                    ...prev,
                                    [itemId]: e.target.value,
                                  }))
                                }
                                placeholder="agregá un comentario..."
                                className="h-8 border border-slate-300 bg-white! pl-8 text-[#121417] text-xs shadow-none placeholder:text-slate-500"
                              />
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex min-h-0 flex-col">
              <div className="border-t border-[#d9dee4] bg-[#f8fafc] p-3 text-[#121417]">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!hayContenidoVenta}
                    onClick={() => setDescartarConfirmOpen(true)}
                    className="h-11 gap-2 border-rose-200/90 bg-white font-medium text-rose-700 shadow-none hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc] disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <CircleX className="size-4 shrink-0" aria-hidden />
                    Descartar
                  </Button>
                  <Button
                    type="button"
                    disabled={!puedeRegistrarVenta || ventaSubmitting}
                    onClick={() => {
                      setVentaError(null)
                      setVenderConfirmOpen(true)
                    }}
                    title={
                      !hayItemsEnPedido
                        ? "Agregá productos al pedido."
                        : !metodoPagoSeleccionado
                          ? "Elegí un medio de pago para continuar."
                          : !canCreateSale
                            ? "No tenés permiso para registrar ventas."
                            : !canReadCashRegisters
                              ? "Se requiere permiso para ver cajas y asociar la venta a una sesión."
                              : !openCashSession
                                ? "Abrí una sesión de caja en Cajas antes de cobrar."
                                : undefined
                    }
                    className="h-11 gap-2 border-0 bg-emerald-600 font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-emerald-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8fafc] active:bg-emerald-700 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <CircleCheck className="size-4 shrink-0 opacity-95" aria-hidden />
                    Vender
                  </Button>
                </div>
              </div>

              <div
                role="region"
                aria-label="Total a cobrar de esta venta"
                className="relative flex min-h-19 w-full shrink-0 flex-col justify-center overflow-hidden border-t border-emerald-500/35 px-4 py-3.5 backdrop-blur-xl sm:min-h-20 sm:px-5 sm:py-4"
              >
                <div
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(145deg,#07120e_0%,#0c1f17_42%,#061009_100%)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_-20%,rgba(52,211,153,0.28),transparent_52%)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_50%,rgba(16,185,129,0.12),transparent_45%)]"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-emerald-400/55 to-transparent"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/12 to-transparent"
                  aria-hidden
                />

                <div className="relative z-10 flex w-full items-end justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200/80">
                      Total a cobrar
                    </p>
                    {hayDescuento ? (
                      <p className="mt-1 max-w-44 text-[10px] leading-snug text-white/40">
                        Incluye descuento general sobre el subtotal.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 shrink-0 flex-col items-end text-right">
                    {hayDescuento ? (
                      <>
                        <p className="text-[11px] tabular-nums text-white/38 line-through decoration-white/25">
                          {fmt.format(subtotal)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium tabular-nums text-emerald-300/95">
                          −{fmt.format(descuentoMonto)}
                        </p>
                        <div
                          className="my-1.5 h-px w-12 max-w-full bg-linear-to-r from-emerald-400/50 to-transparent"
                          aria-hidden
                        />
                      </>
                    ) : null}
                    <p
                      className="whitespace-nowrap text-[clamp(1.25rem,2.1vw,1.85rem)] font-black tabular-nums tracking-tight text-white drop-shadow-[0_0_20px_rgba(52,211,153,0.32)]"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {fmt.format(total)}
                    </p>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/32">
                      Pesos argentinos
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </main>
      </div>

      <Dialog
        open={clienteModalAbierto}
        onOpenChange={(open) => {
          setClienteModalAbierto(open)
          if (open) setBusquedaClienteModal("")
        }}
      >
        <DialogContent className={cn(ventaDialogSurfaceMd, "text-foreground")}>
          <DialogHeader className={ventaDialogHeader}>
            <DialogTitle className="text-base font-semibold tracking-tight">
              Cliente para esta venta
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Buscá por nombre o elegí un cliente de la lista.
            </DialogDescription>
          </DialogHeader>
          <div className={ventaDialogBody}>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={busquedaClienteInputRef}
                value={busquedaClienteModal}
                onChange={(e) => setBusquedaClienteModal(e.target.value)}
                placeholder="Nombre del cliente…"
                className={cn(
                  "h-11 rounded-lg pl-9",
                  busquedaClienteModal.length > 0 && "pr-9",
                )}
                autoComplete="off"
              />
              {busquedaClienteModal.length > 0 ? (
                <button
                  type="button"
                  aria-label="Limpiar búsqueda"
                  className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color] duration-150 hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-muted"
                  onClick={() => {
                    setBusquedaClienteModal("")
                    busquedaClienteInputRef.current?.focus()
                  }}
                >
                  <IconoLimpiarBusqueda />
                </button>
              ) : null}
            </div>
            <div className="mb-3 rounded-xl border border-border/50 bg-muted/15 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                CUIT / DNI (padrón AFIP)
              </p>
              <Input
                value={fiscalDocVenta}
                onChange={(e) => setFiscalDocVenta(e.target.value)}
                placeholder="Ej. 20-12345678-9 o DNI"
                className="h-10 rounded-lg"
                autoComplete="off"
              />
              <div className="mt-2 flex min-h-6 items-center gap-2 text-sm">
                {ventaPadron.busy ? (
                  <>
                    <Loader2
                      className="size-4 shrink-0 animate-spin text-primary"
                      aria-hidden
                    />
                    <span className="text-muted-foreground">Consultando…</span>
                  </>
                ) : ventaPadron.error ? (
                  <span className="text-destructive">{ventaPadron.error}</span>
                ) : ventaPadron.razonSocial ? (
                  <span className="font-medium text-foreground">
                    {ventaPadron.razonSocial}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    La razón social aparece al validar el documento.
                  </span>
                )}
              </div>
            </div>
            <ul
              className="game-scroll max-h-[min(50vh,16rem)] space-y-2 overflow-y-auto rounded-xl border border-border/40 bg-muted/20 p-2 pr-1"
              role="listbox"
              aria-label="Clientes"
            >
              {clientesFiltradosModal.length === 0 ? (
                <li className="rounded-lg border border-dashed border-border/60 bg-background/50 px-4 py-8 text-center text-sm text-muted-foreground">
                  No hay resultados para esa búsqueda.
                </li>
              ) : (
                clientesFiltradosModal.map((c) => {
                  const seleccionado = clienteSeleccionado?.id === c.id
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={seleccionado}
                        onClick={() => seleccionarCliente(c)}
                        className={cn(
                          "flex min-h-11 w-full items-center gap-3 text-left",
                          modalOpcionBase,
                          seleccionado
                            ? modalOpcionSeleccionada
                            : modalOpcionIdle,
                        )}
                      >
                        <User className="size-5 shrink-0 text-primary" aria-hidden />
                        <span className="min-w-0">
                          <span className="block font-medium">{c.name}</span>
                          {c.taxId ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {c.taxId}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
          {clienteSeleccionado ? (
            <DialogFooter className={ventaDialogFooter}>
              <Button
                type="button"
                variant="ghost"
                className={ventaDialogGhostBtn}
                onClick={() => {
                  setClienteSeleccionado(null)
                  setFiscalDocVenta("")
                  setClienteModalAbierto(false)
                }}
              >
                Quitar cliente
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={comprobanteModalAbierto}
        onOpenChange={setComprobanteModalAbierto}
      >
        <DialogContent className={cn(ventaDialogSurfaceMd, "text-foreground")}>
          <DialogHeader className={cn(ventaDialogHeader, "shrink-0")}>
            <DialogTitle className="text-base font-semibold tracking-tight">
              Tipo de comprobante
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Seleccioná el comprobante que vas a emitir en esta venta.
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              ventaDialogBody,
              "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            )}
          >
            <ul
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              role="listbox"
              aria-label="Tipos de comprobante"
            >
              {invoiceTypeOptions.map((opt) => {
                const label = opt.label
                const seleccionado = comprobante === label
                return (
                  <li key={label} className="min-w-0">
                    <button
                      type="button"
                      role="option"
                      aria-selected={seleccionado}
                      onClick={() => setComprobante(label)}
                      className={cn(
                        "flex min-h-18 w-full flex-col items-stretch justify-center text-left",
                        modalOpcionBase,
                        seleccionado
                          ? modalOpcionSeleccionada
                          : modalOpcionIdle,
                      )}
                    >
                      <span className="block text-sm font-semibold leading-snug">
                        {label}
                      </span>
                      <span className="mt-1 block font-mono text-[11px] leading-snug text-muted-foreground">
                        ARCA · CbteTipo {opt.arcaCbteTipo}
                        {opt.arcaRegimen === "fce_mipyme" ? " · FCE MiPyME" : ""}
                      </span>
                      {opt.note ? (
                        <span className="mt-2 block border-t border-border/40 pt-2 text-xs leading-snug text-muted-foreground">
                          {opt.note}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <DialogFooter className={cn(ventaDialogFooter, "shrink-0")}>
            <Button
              type="button"
              variant="ghost"
              className={ventaDialogGhostBtn}
              onClick={() => {
                setComprobante(null)
                setComprobanteModalAbierto(false)
              }}
            >
              Quitar selección
            </Button>
            <Button
              type="button"
              className={ventaDialogPrimaryBtn}
              onClick={() => setComprobanteModalAbierto(false)}
            >
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pagoModalAbierto} onOpenChange={setPagoModalAbierto}>
        <DialogContent className={cn(ventaDialogSurfaceLg, "text-foreground")}>
          <DialogHeader className={cn(ventaDialogHeader, "shrink-0")}>
            <DialogTitle className="text-base font-semibold tracking-tight">
              Método de pago
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Elegí un medio configurado para este punto de venta (efectivo,
              tarjetas, transferencia u otros).
            </DialogDescription>
          </DialogHeader>
          <div
            className={cn(
              ventaDialogBody,
              "min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain",
            )}
          >
            {paymentMethodGroups.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                No hay medios de pago activos configurados para este punto de
                venta.
              </p>
            ) : (
              paymentMethodGroups.map((g, gi) => (
                <div key={g.kind}>
                  {gi > 0 ? (
                    <Separator className="mb-4 bg-border/60" />
                  ) : null}
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {g.title}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {g.items.map((m) => {
                      const seleccionado = metodoPagoSeleccionado?.id === m.id
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className={cn(
                            "flex min-h-12 min-w-0 items-center justify-center px-2 py-2 text-center text-sm font-medium leading-snug",
                            modalOpcionBase,
                            seleccionado
                              ? modalOpcionSeleccionada
                              : modalOpcionIdle,
                          )}
                          onClick={() => {
                            setMetodoPagoSeleccionado({
                              id: m.id,
                              label: m.name,
                            })
                            setPagoModalAbierto(false)
                          }}
                        >
                          <span className="line-clamp-3 w-full">{m.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter className={cn(ventaDialogFooter, "shrink-0")}>
            <Button
              type="button"
              className={cn(ventaDialogPrimaryBtn, "w-full sm:w-auto")}
              onClick={() => setPagoModalAbierto(false)}
            >
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={descuentoModalAbierto}
        onOpenChange={setDescuentoModalAbierto}
      >
        <DialogContent className={cn(ventaDialogSurfaceMd, "text-foreground")}>
          <DialogHeader className={ventaDialogHeader}>
            <DialogTitle className="text-base font-semibold tracking-tight">
              Descuento en la venta
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Alterná % o monto fijo con el botón e ingresá el valor. Se aplica
              sobre el subtotal (después de descuentos por ítem).
            </DialogDescription>
          </DialogHeader>
          <div className={ventaDialogBody}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Valor
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border text-foreground/80 transition",
                  "border-foreground/10 bg-muted/50 hover:bg-muted hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                )}
                aria-label="Cambiar tipo de descuento"
                onClick={() =>
                  setDescuentoDraftModo((m) =>
                    m === "porcentaje" ? "fijo" : "porcentaje",
                  )
                }
              >
                {descuentoDraftModo === "porcentaje" ? (
                  <Percent className="size-4 text-primary" aria-hidden />
                ) : (
                  <Banknote className="size-4 text-primary" aria-hidden />
                )}
              </button>
              <Input
                id="desc-valor"
                value={descuentoDraftTexto}
                onChange={(e) => {
                  const raw = e.target.value
                  if (!/^\d*$/.test(raw)) return
                  if (raw === "") {
                    setDescuentoDraftTexto("")
                    return
                  }
                  if (
                    descuentoDraftModo === "fijo" &&
                    subtotal > 0 &&
                    Number(raw) > subtotal
                  ) {
                    setDescuentoDraftModo("porcentaje")
                    setDescuentoDraftTexto("100")
                    return
                  }
                  const nextValue =
                    descuentoDraftModo === "porcentaje"
                      ? String(Math.min(100, Number(raw)))
                      : raw
                  setDescuentoDraftTexto(nextValue)
                }}
                placeholder="descuento"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                className="h-11 min-w-0 flex-1 rounded-lg"
              />
            </div>
            {descuentoDraftModo === "fijo" && subtotal > 0 ? (
              <p className="mt-3 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Máximo aplicable: {fmt.format(subtotal)}. Si superás ese monto,
                pasa a 100 %.
              </p>
            ) : null}
            {descuentoDraftModo === "fijo" && subtotal === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                No hay subtotal: agregá productos para aplicar un monto fijo.
              </p>
            ) : null}
          </div>
          <DialogFooter className={ventaDialogFooter}>
            <Button
              type="button"
              variant="ghost"
              className={ventaDialogGhostBtn}
              onClick={quitarDescuento}
            >
              Quitar descuento
            </Button>
            <Button
              type="button"
              className={ventaDialogPrimaryBtn}
              onClick={aplicarDescuentoModal}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={descartarConfirmOpen} onOpenChange={setDescartarConfirmOpen}>
        <AlertDialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar la venta?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Se quitarán los productos del pedido, el cliente, el tipo de comprobante, los
              descuentos y los comentarios de línea. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              onClick={limpiarVenta}
              className="border-0 bg-rose-600 text-white hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={venderConfirmOpen}
        onOpenChange={(open) => {
          setVenderConfirmOpen(open)
          if (!open) setVentaError(null)
        }}
      >
        <AlertDialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar venta?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-muted-foreground">
                <p>
                  Total a cobrar:{" "}
                  <span className="font-semibold text-foreground tabular-nums">
                    {fmt.format(total)}
                  </span>
                  . Se guardará la venta, el movimiento de stock (FIFO) y el asiento contable
                  (cobro, ventas, IVA si aplica y costo de mercaderías).
                </p>
                {ventaError ? (
                  <p className="text-sm text-rose-600">{ventaError}</p>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border" disabled={ventaSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={ventaSubmitting}
              onClick={(e) => {
                e.preventDefault()
                void confirmarVenta()
              }}
              className="border-0 bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {ventaSubmitting ? "Guardando…" : "Confirmar venta"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default withAuth(SalePage)
