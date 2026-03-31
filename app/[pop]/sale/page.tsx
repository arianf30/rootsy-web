"use client"

import Image from "next/image"
import Link from "next/link"
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

const CATEGORIAS = [
  "Entradas",
  "Principales",
  "Postres",
  "Bebidas",
  "Categoria A",
  "Categoria B",
] as const

const PRODUCTOS: Producto[] = [
  {
    id: "lomito",
    nombre: "Lomito Nuevo Origen",
    descripcion: "Con salsa criolla de la casa",
    precio: 640,
    precioOriginal: 860,
    categoria: "Principales",
    imagen:
      "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=340&fit=crop",
    promo: "-25%",
  },
  {
    id: "pizza-casa",
    nombre: "Pizza de la casa",
    descripcion: "Morrones verdes y aceituna",
    precio: 1200,
    categoria: "Principales",
    imagen:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&h=340&fit=crop",
  },
  {
    id: "pizza-rustica",
    nombre: "Pizza rustica dona Nora",
    descripcion: "Con masa madre",
    precio: 1400,
    categoria: "Principales",
    imagen:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=340&fit=crop",
  },
  {
    id: "pizza-napo",
    nombre: "Pizza Napolitana",
    descripcion: "Muzzarella, jamon y tomates",
    precio: 1340,
    categoria: "Principales",
    imagen:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=340&fit=crop",
  },
  {
    id: "hamburguesa",
    nombre: "Hamburguesa Especial",
    descripcion: "Jamon, lechuga, tomate y cheddar",
    precio: 850,
    categoria: "Principales",
    imagen:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=340&fit=crop",
  },
  {
    id: "especial",
    nombre: "Especial de la casa",
    descripcion: "Arian se la come",
    precio: 750,
    precioOriginal: 940,
    categoria: "Principales",
    imagen:
      "https://images.unsplash.com/photo-1550317138-10000687a72b?w=500&h=340&fit=crop",
    promo: "-25%",
  },
  {
    id: "cafe-invierno",
    nombre: "Café con leche",
    descripcion: "Campaña estación — precio lista único",
    precio: 500,
    categoria: "Bebidas",
    imagen:
      "https://images.unsplash.com/photo-1511920170733-2303c14c0048?w=500&h=340&fit=crop",
    promo: "Campaña invierno",
  },
  {
    id: "jugo-natural",
    nombre: "Jugo natural",
    descripcion: "Naranja o pomelo",
    precio: 280,
    precioOriginal: 350,
    categoria: "Bebidas",
    imagen:
      "https://images.unsplash.com/photo-1622597439844-0df16348ac85?w=500&h=340&fit=crop",
  },
]

const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
})

const CLIENTES_HARDCODE = [
  "Blas Paredes",
  "Arián Fernández",
  "Marcos Galperín",
] as const

const COMPROBANTES_OPCIONES = [
  "Factura A",
  "Factura B",
  "Factura C",
  "Recibo",
  "Recibo X",
] as const

const TARJETAS_DEBITO = ["Visa", "Mastercard", "Naranja", "Cabal"] as const
const TARJETAS_CREDITO = [
  "American Express",
  "Visa",
  "Mastercard",
] as const

function normalizarBusqueda(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
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

export default function SalePage() {
  const [vistaCatalogo, setVistaCatalogo] = useState<VistaCatalogo>({
    modo: "categoria",
    categoria: "Principales",
  })
  const [modoVista, setModoVista] = useState<"grid" | "lista">("grid")
  const [busqueda, setBusqueda] = useState("")
  const [carrito, setCarrito] = useState<ItemCarrito[]>([
    { productoId: "pizza-casa", cantidad: 2 },
    { productoId: "pizza-rustica", cantidad: 1 },
  ])
  const [nombreCliente, setNombreCliente] = useState<string | null>(null)
  const [clienteModalAbierto, setClienteModalAbierto] = useState(false)
  const [busquedaClienteModal, setBusquedaClienteModal] = useState("")
  const [comprobante, setComprobante] = useState<string | null>(null)
  const [comprobanteModalAbierto, setComprobanteModalAbierto] = useState(false)
  const [metodoPago, setMetodoPago] = useState<string | null>(null)
  const [pagoModalAbierto, setPagoModalAbierto] = useState(false)
  const [modoDescuento, setModoDescuento] = useState<"porcentaje" | "fijo">(
    "porcentaje",
  )
  const [valorDescuentoPorcentaje, setValorDescuentoPorcentaje] = useState(0)
  const [valorDescuentoFijo, setValorDescuentoFijo] = useState(0)
  const [descuentoModalAbierto, setDescuentoModalAbierto] = useState(false)
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

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return PRODUCTOS.filter((p) => {
      const matchVista =
        vistaCatalogo.modo === "categoria"
          ? p.categoria === vistaCatalogo.categoria
          : vistaCatalogo.modo === "promociones"
            ? Boolean(p.promo?.trim())
            : p.precioOriginal != null && p.precioOriginal > p.precio
      const matchQ =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
      return matchVista && matchQ
    })
  }, [busqueda, vistaCatalogo])

  const itemsDetallados = useMemo(() => {
    return carrito
      .map((i) => ({
        ...i,
        producto: PRODUCTOS.find((p) => p.id === i.productoId),
      }))
      .filter((i) => i.producto)
  }, [carrito])

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
    if (!q) return [...CLIENTES_HARDCODE]
    return CLIENTES_HARDCODE.filter((n) =>
      normalizarBusqueda(n).includes(q),
    )
  }, [busquedaClienteModal])

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
    setBusquedaClienteModal("")
    setClienteModalAbierto(true)
  }

  const seleccionarCliente = (nombre: string) => {
    setNombreCliente(nombre)
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

  const toolboxBtnIdle =
    "inline-flex h-full min-h-0 w-full flex-row items-center justify-center gap-2 rounded-none border-0 bg-transparent px-2 py-1 text-foreground/75 shadow-none transition-colors duration-200 hover:bg-muted/45 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  const toolboxBtnActivo =
    "relative text-foreground hover:text-foreground [&_svg]:text-emerald-300/95 after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:z-10 after:h-[3px] after:rounded-full after:bg-linear-to-r after:from-transparent after:via-primary after:to-transparent after:shadow-[0_0_14px_rgba(16,185,129,0.55),0_0_28px_rgba(52,211,153,0.25),0_1px_0_rgba(255,255,255,0.35)_inset] after:content-['']"

  const modalOpcionBase =
    "rounded-xl border px-4 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  const modalOpcionSeleccionada =
    "border-primary/55 bg-primary/12 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
  const modalOpcionIdle =
    "border-foreground/10 bg-secondary hover:bg-muted"

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
                href="/1/menu"
                className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/6 bg-secondary text-foreground/70 transition-all hover:border-foreground/12 hover:bg-muted hover:text-foreground"
                aria-label="Volver"
              >
                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="size-8 overflow-hidden rounded-lg ring-1 ring-border">
                  <img
                    src="https://api.dicebear.com/7.x/shapes/svg?seed=store1&backgroundColor=1a1f1d"
                    alt="Logo punto de venta"
                    className="size-full object-cover"
                  />
                </div>
                <span className="truncate text-sm font-semibold text-foreground/85">
                  Nuevo Origen
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
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=francisco" />
                    <AvatarFallback>FR</AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-card bg-primary" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-foreground/85">
                    Francisco Ruiz
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow">
                    Admin
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_4.5rem]">
            <div className="grid min-h-0 grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-r border-white/10 bg-[#1a2027] px-4 py-4">
                <div className="overflow-hidden rounded-lg border border-white/10">
                  {CATEGORIAS.map((cat) => {
                    const seleccionado =
                      vistaCatalogo.modo === "categoria" &&
                      vistaCatalogo.categoria === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setVistaCatalogo({ modo: "categoria", categoria: cat })
                        }
                        className={`flex h-12 w-full items-center border-b border-white/8 px-3 text-left text-sm font-semibold transition last:border-b-0 ${
                          seleccionado
                            ? "bg-slate-100/14 text-white"
                            : "text-slate-300/80 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3 space-y-2">
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={vistaCatalogo.modo === "promociones"}
                    onClick={() => setVistaCatalogo({ modo: "promociones" })}
                    className={cn(
                      "h-10 w-full rounded-lg text-sm font-medium shadow-none",
                      vistaCatalogo.modo === "promociones"
                        ? "border-2 border-emerald-500/55 bg-emerald-500/8 text-emerald-100 hover:border-emerald-400/65 hover:bg-emerald-500/12 hover:text-emerald-50"
                        : "border border-white/10 bg-white/3 text-slate-400 hover:border-emerald-600/35 hover:bg-white/6 hover:text-slate-200",
                    )}
                  >
                    <Tag className="size-3.5 opacity-90" aria-hidden />
                    Promociones
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-pressed={vistaCatalogo.modo === "con_descuento"}
                    onClick={() =>
                      setVistaCatalogo({ modo: "con_descuento" })
                    }
                    className={cn(
                      "h-10 w-full rounded-lg text-sm font-medium shadow-none",
                      vistaCatalogo.modo === "con_descuento"
                        ? "border-2 border-amber-500/55 bg-amber-500/8 text-amber-100 hover:border-amber-400/65 hover:bg-amber-500/12 hover:text-amber-50"
                        : "border border-white/10 bg-white/3 text-slate-400 hover:border-amber-600/35 hover:bg-white/6 hover:text-slate-200",
                    )}
                  >
                    <Percent className="size-3.5 opacity-90" aria-hidden />
                    Con descuento
                  </Button>
                </div>
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
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar o escanear producto..."
                      className="h-10 border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/35"
                    />
                  </div>
                  <span className="shrink-0 text-sm font-medium text-white/60">
                    {productosFiltrados.length} productos mostrados
                  </span>
                </div>

                <div
                  className={cn(
                    "min-h-0",
                    productosFiltrados.length === 0
                      ? "relative overflow-hidden p-0"
                      : "game-scroll overflow-y-auto p-3",
                  )}
                >
                  {productosFiltrados.length === 0 ? (
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

            <div className="grid h-full min-h-0 grid-cols-4 divide-x divide-white/25 border-t border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
              <button
                type="button"
                onClick={onClienteToolbarClick}
                className={cn(
                  toolboxBtnIdle,
                  nombreCliente && toolboxBtnActivo,
                )}
              >
                <User className="size-4.5 shrink-0 text-foreground/80" aria-hidden />
                <span className="min-w-0 max-w-[calc(100%-1.75rem)] truncate text-left text-sm font-semibold leading-tight">
                  {nombreCliente ?? "Cliente"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setComprobanteModalAbierto(true)}
                className={cn(
                  toolboxBtnIdle,
                  comprobante && toolboxBtnActivo,
                )}
              >
                <Receipt className="size-4.5 shrink-0 text-foreground/80" aria-hidden />
                <span className="min-w-0 max-w-[calc(100%-1.75rem)] truncate text-left text-sm font-semibold leading-tight">
                  {comprobante ?? "Comprobante"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPagoModalAbierto(true)}
                className={cn(
                  toolboxBtnIdle,
                  metodoPago && toolboxBtnActivo,
                )}
              >
                <Banknote className="size-4.5 shrink-0 text-foreground/80" aria-hidden />
                <span className="min-w-0 max-w-[calc(100%-1.75rem)] truncate text-left text-sm font-semibold leading-tight">
                  {metodoPago ?? "Efectivo"}
                </span>
              </button>
              <button
                type="button"
                onClick={abrirModalDescuento}
                className={cn(
                  toolboxBtnIdle,
                  hayDescuento && toolboxBtnActivo,
                )}
              >
                <Percent className="size-4.5 shrink-0 text-foreground/80" aria-hidden />
                <span className="min-w-0 max-w-[calc(100%-1.75rem)] truncate text-left text-sm font-semibold leading-tight">
                  {hayDescuento
                    ? modoDescuento === "porcentaje"
                      ? `${valorDescuentoPorcentaje}%`
                      : `Fijo ${fmt.format(valorDescuentoFijo)}`
                    : "Descuento"}
                </span>
              </button>
            </div>
          </section>

          <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-[#f3f5f7] text-[#121417]">
            <div className="flex min-h-0 flex-col">
              <div className="game-scroll min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
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

                  return (
                    <div key={itemId} className="space-y-1.5">
                      <div
                        onClick={() => toggleItemDetalle(itemId)}
                        className={cn(
                          "cursor-pointer rounded-xl border bg-white px-3 py-2.5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_8px_18px_rgba(15,23,42,0.06)]",
                          abierto
                            ? "border-2 border-[#7d8fa3]"
                            : "border border-[#dce3eb]",
                        )}
                      >
                        <div className="grid grid-cols-[56px_minmax(0,1fr)_90px_28px] items-center gap-2">
                        <div className="flex items-center gap-1 rounded-lg bg-white px-1 py-1 ring-1 ring-[#d5dbe2]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              cambiarCantidad(itemId, -1)
                            }}
                            className="inline-flex size-5 items-center justify-center rounded bg-[#eef2f6] text-[#324255] hover:bg-[#dfe6ee]"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="w-4 text-center text-sm font-bold text-[#1d232b]">
                            {item.cantidad}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              cambiarCantidad(itemId, 1)
                            }}
                            className="inline-flex size-5 items-center justify-center rounded bg-[#eef2f6] text-[#324255] hover:bg-[#dfe6ee]"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        <div className="min-w-0">
                          <CartItemTitleMarquee
                            text={item.producto?.nombre ?? ""}
                            active={abierto}
                            className="text-sm font-semibold text-[#151a20]"
                          />
                          <div className="mt-0.5 flex min-w-0 items-center gap-1">
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-xs text-[#5d6978]">
                                {item.producto?.descripcion}
                              </p>
                            </div>
                            {tieneComentario ? (
                              <span className="inline-flex shrink-0 items-center rounded-full border border-sky-200 bg-sky-50 px-1.5 py-0 text-[10px] font-semibold text-sky-700">
                                C
                              </span>
                            ) : null}
                            {tieneDescuento ? (
                              <span className="inline-flex max-w-22 shrink-0 items-center justify-center truncate rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[10px] font-semibold text-emerald-700 tabular-nums">
                                {modoItemDescuento === "porcentaje"
                                  ? `${Math.min(100, Math.max(0, Number.isFinite(descuentoNumero) ? descuentoNumero : 0))}%`
                                  : fmt.format(descuento)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right">
                          {tieneDescuento ? (
                            <p className="text-[11px] text-[#7a8796] line-through">
                              {fmt.format(precioBaseItem)}
                            </p>
                          ) : null}
                          <p className="text-sm font-bold text-[#151a20]">
                            {fmt.format(precioBaseItem - descuento)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            quitarDelCarrito(itemId)
                          }}
                          className="inline-flex size-7 items-center justify-center rounded text-[#7a8796] hover:bg-[#e5ebf2] hover:text-[#1f2a36]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                        </div>
                      </div>

                      {abierto ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="rounded-lg border border-slate-300/90 bg-slate-200/90 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-400/50 bg-slate-100 text-slate-800 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
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
                                <Percent className="size-3.5" />
                              ) : (
                                <Banknote className="size-3.5" />
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
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 gap-2 border border-[#b91c1c]/40 bg-white text-[#b91c1c] shadow-sm hover:border-[#9f1239]/55 hover:bg-[#fff1f2] hover:text-[#9f1239] dark:border-[#b91c1c]/40 dark:bg-white dark:text-[#b91c1c] dark:hover:border-[#9f1239]/55 dark:hover:bg-[#fff1f2] dark:hover:text-[#9f1239]"
                  >
                    <CircleX className="size-4 shrink-0" aria-hidden />
                    Descartar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 gap-2 border border-emerald-600/45 bg-white text-emerald-700 shadow-sm hover:border-emerald-700/60 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-600/45 dark:bg-white dark:text-emerald-700 dark:hover:border-emerald-700/60 dark:hover:bg-emerald-50 dark:hover:text-emerald-800"
                  >
                    <CircleCheck className="size-4 shrink-0" aria-hidden />
                    Vender
                  </Button>
                </div>
              </div>

              <div className="relative flex h-18 min-h-18 w-full shrink-0 items-center justify-between overflow-hidden border-t border-emerald-500/35 px-4 backdrop-blur-xl">
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

                <span className="relative z-10 shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-200/90">
                  Total
                </span>
                <div className="relative z-10 ml-auto flex min-w-max flex-col items-end justify-center text-right leading-none">
                  {hayDescuento ? (
                    <p className="mb-1 text-[11px] text-white/35 line-through tabular-nums">
                      {fmt.format(subtotal)}
                    </p>
                  ) : null}
                  <p className="whitespace-nowrap text-[clamp(1.35rem,2.2vw,1.9rem)] font-black tabular-nums text-white drop-shadow-[0_0_24px_rgba(52,211,153,0.35)]">
                    {fmt.format(total)}
                  </p>
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
        <DialogContent className="border-border/80 bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cliente para esta venta</DialogTitle>
            <DialogDescription className="sr-only">
              Buscá por nombre o elegí un cliente de la lista.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busquedaClienteModal}
              onChange={(e) => setBusquedaClienteModal(e.target.value)}
              placeholder="Buscar cliente..."
              className="pl-9"
              autoComplete="off"
            />
          </div>
          <ul
            className="game-scroll max-h-60 space-y-2 overflow-y-auto pr-1"
            role="listbox"
            aria-label="Clientes"
          >
            {clientesFiltradosModal.length === 0 ? (
              <li className="rounded-lg border border-dashed border-foreground/15 px-3 py-6 text-center text-sm text-muted-foreground">
                No hay resultados para esa búsqueda.
              </li>
            ) : (
              clientesFiltradosModal.map((nombre) => {
                const seleccionado = nombreCliente === nombre
                return (
                  <li key={nombre}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={seleccionado}
                      onClick={() => seleccionarCliente(nombre)}
                      className={cn(
                        "flex w-full items-center gap-3 text-left",
                        modalOpcionBase,
                        seleccionado
                          ? modalOpcionSeleccionada
                          : modalOpcionIdle,
                      )}
                    >
                      <User className="size-5 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">{nombre}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
          {nombreCliente ? (
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setNombreCliente(null)
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
        <DialogContent className="border-border/80 bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tipo de comprobante</DialogTitle>
            <DialogDescription>
              Seleccioná el comprobante que vas a emitir en esta venta.
            </DialogDescription>
          </DialogHeader>
          <ul
            className="grid gap-2"
            role="listbox"
            aria-label="Tipos de comprobante"
          >
            {COMPROBANTES_OPCIONES.map((c) => {
              const seleccionado = comprobante === c
              return (
                <li key={c}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={seleccionado}
                    onClick={() => setComprobante(c)}
                    className={cn(
                      "w-full text-left",
                      modalOpcionBase,
                      seleccionado
                        ? modalOpcionSeleccionada
                        : modalOpcionIdle,
                    )}
                  >
                    <span className="block text-sm font-semibold">{c}</span>
                  </button>
                  {c === "Recibo X" ? (
                    <p className="mt-1 px-1 text-xs text-muted-foreground">
                      No requiere ARCA
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setComprobante(null)
                setComprobanteModalAbierto(false)
              }}
            >
              Quitar selección
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setComprobanteModalAbierto(false)}
            >
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pagoModalAbierto} onOpenChange={setPagoModalAbierto}>
        <DialogContent className="border-border/80 bg-card text-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Método de pago</DialogTitle>
            <DialogDescription>
              Elegí forma de pago: efectivo o tarjetas por débito y crédito.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <button
              type="button"
              className={cn(
                "w-full text-left",
                modalOpcionBase,
                metodoPago === "Efectivo"
                  ? modalOpcionSeleccionada
                  : modalOpcionIdle,
              )}
              onClick={() => {
                setMetodoPago("Efectivo")
                setPagoModalAbierto(false)
              }}
            >
              Efectivo
            </button>
            <Separator className="bg-border/80" />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Débito
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TARJETAS_DEBITO.map((t) => {
                  const valor = `Débito · ${t}`
                  const seleccionado = metodoPago === valor
                  return (
                    <button
                      key={`deb-${t}`}
                      type="button"
                      className={cn(
                        "min-w-0 px-4 py-3 text-center",
                        modalOpcionBase,
                        seleccionado
                          ? modalOpcionSeleccionada
                          : modalOpcionIdle,
                      )}
                      onClick={() => {
                        setMetodoPago(valor)
                        setPagoModalAbierto(false)
                      }}
                    >
                      <span className="block w-full truncate">{t}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <Separator className="bg-border/80" />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Crédito
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {TARJETAS_CREDITO.map((t) => {
                  const valor = `Crédito · ${t}`
                  const seleccionado = metodoPago === valor
                  return (
                    <button
                      key={`cred-${t}`}
                      type="button"
                      className={cn(
                        "min-w-0 px-4 py-3 text-center",
                        modalOpcionBase,
                        seleccionado
                          ? modalOpcionSeleccionada
                          : modalOpcionIdle,
                      )}
                      onClick={() => {
                        setMetodoPago(valor)
                        setPagoModalAbierto(false)
                      }}
                    >
                      <span className="block w-full truncate">{t}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setMetodoPago(null)
                setPagoModalAbierto(false)
              }}
            >
              Quitar selección
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
        <DialogContent className="border-border/80 bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descuento</DialogTitle>
            <DialogDescription>
              Elegí % o monto fijo con el interruptor y escribí el valor. Se
              aplica sobre el subtotal de la venta (después de descuentos por
              ítem).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={cn(
                  "inline-flex size-10 shrink-0 items-center justify-center rounded-xl border text-foreground/80 transition",
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
                className="h-10 min-w-0 flex-1"
              />
            </div>
            {descuentoDraftModo === "fijo" && subtotal > 0 ? (
              <p className="text-xs text-muted-foreground">
                Máximo aplicable: {fmt.format(subtotal)}. Si superás ese monto,
                pasa a 100 %.
              </p>
            ) : null}
            {descuentoDraftModo === "fijo" && subtotal === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay subtotal: agregá productos para aplicar un monto fijo.
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={quitarDescuento}
            >
              Quitar descuento
            </Button>
            <Button
              type="button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={aplicarDescuentoModal}
            >
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
