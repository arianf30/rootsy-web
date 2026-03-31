"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Banknote,
  CircleCheck,
  CircleX,
  LayoutGrid,
  Minus,
  MoreVertical,
  Percent,
  Plus,
  Receipt,
  Rows3,
  Search,
  ShoppingCart,
  Trash2,
  User,
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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

export default function SalePage() {
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Principales")
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

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return PRODUCTOS.filter((p) => {
      const matchCat = p.categoria === categoriaActiva
      const matchQ =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.descripcion.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [busqueda, categoriaActiva])

  const itemsDetallados = useMemo(() => {
    return carrito
      .map((i) => ({
        ...i,
        producto: PRODUCTOS.find((p) => p.id === i.productoId),
      }))
      .filter((i) => i.producto)
  }, [carrito])

  const subtotal = useMemo(
    () =>
      itemsDetallados.reduce(
        (acc, i) => acc + (i.producto?.precio ?? 0) * i.cantidad,
        0,
      ),
    [itemsDetallados],
  )

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
      const tope = Math.min(n, subtotal)
      setModoDescuento("fijo")
      setValorDescuentoFijo(Math.max(0, tope))
      setValorDescuentoPorcentaje(0)
    }
    setDescuentoModalAbierto(false)
  }

  const quitarDescuento = () => {
    setModoDescuento("porcentaje")
    setValorDescuentoPorcentaje(0)
    setValorDescuentoFijo(0)
    setDescuentoModalAbierto(false)
  }

  const toolboxBtnClass =
    "inline-flex h-11 min-w-[7.5rem] flex-col items-center justify-center gap-0.5 border-foreground/10 bg-secondary px-3 py-1.5 text-center text-foreground/85 hover:bg-muted sm:min-w-[8.25rem] sm:flex-row sm:gap-2 sm:py-2 sm:text-left"
  const toolboxBtnActivo =
    "border-primary/45 bg-primary/12 text-foreground shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)] hover:bg-primary/16"

  return (
    <div className="relative h-screen overflow-hidden bg-[#070a09] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.14),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.1),transparent_36%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[38px_38px] opacity-20" />
      </div>

      <div className="relative z-10 grid h-full grid-rows-[4.5rem_minmax(0,1fr)]">
        <header className="border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
          <div className="grid h-18 grid-cols-[280px_minmax(0,1fr)_380px] items-center px-4">
            <div className="flex items-center gap-3">
              <Link
                href="/1/menu"
                className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/10 bg-secondary text-foreground/70 transition-all hover:bg-muted hover:text-foreground"
                aria-label="Volver"
              >
                <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
              </Link>
            </div>

            <h1 className="text-center text-[2rem] font-black tracking-tight text-foreground">
              Vender
            </h1>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Mas opciones"
              >
                <MoreVertical className="size-4.5" />
              </button>
              <div className="rounded-full border border-foreground/10 bg-secondary px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground/75">
                    Nuevo Origen
                  </span>
                  <Avatar className="size-7 ring-1 ring-border">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=francisco" />
                    <AvatarFallback>FR</AvatarFallback>
                  </Avatar>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="grid min-h-0 grid-cols-[minmax(0,1fr)_380px]">
          <section className="grid min-h-0 grid-rows-[minmax(0,1fr)_4.5rem]">
            <div className="grid min-h-0 grid-cols-[280px_minmax(0,1fr)]">
              <aside className="border-r border-white/10 bg-[#1a2027] px-4 py-4">
                <div className="mb-4 inline-flex rounded-lg border border-white/12 bg-black/20 p-1">
                  <button
                    type="button"
                    onClick={() => setModoVista("grid")}
                    className={`inline-flex h-9 w-10 items-center justify-center rounded-md transition ${
                      modoVista === "grid"
                        ? "bg-white/14 text-white"
                        : "text-slate-300/80 hover:bg-white/8 hover:text-white"
                    }`}
                    aria-label="Vista en grilla"
                  >
                    <LayoutGrid className="size-4.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVista("lista")}
                    className={`inline-flex h-9 w-10 items-center justify-center rounded-md transition ${
                      modoVista === "lista"
                        ? "bg-white/14 text-white"
                        : "text-slate-300/80 hover:bg-white/8 hover:text-white"
                    }`}
                    aria-label="Vista en columna"
                  >
                    <Rows3 className="size-4.5" />
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-white/10">
                  {CATEGORIAS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoriaActiva(cat)}
                      className={`flex h-12 w-full items-center border-b border-white/8 px-3 text-left text-sm font-semibold transition last:border-b-0 ${
                        categoriaActiva === cat
                          ? "bg-slate-100/14 text-white"
                          : "text-slate-300/80 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <Button
                  type="button"
                  className="mt-3 h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Promociones
                </Button>
              </aside>

              <section className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-[#20262e]">
                <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
                  <div className="relative w-full max-w-md">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Buscar o escanear producto..."
                      className="h-10 border-white/10 bg-black/20 pl-9 text-white placeholder:text-white/35"
                    />
                  </div>
                  <span className="text-sm font-medium text-white/60">
                    {productosFiltrados.length} productos mostrados
                  </span>
                </div>

                <div
                  className={`game-scroll min-h-0 overflow-y-auto p-3 ${
                    modoVista === "grid"
                      ? "grid grid-cols-3 gap-3"
                      : "flex flex-col gap-2"
                  }`}
                >
                  {productosFiltrados.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => agregarAlCarrito(p.id)}
                      className={`group relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all duration-300 hover:shadow-md ${
                        modoVista === "lista"
                          ? "flex min-h-[152px] items-stretch"
                          : "grid h-[318px] grid-rows-[152px_1fr]"
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r from-transparent via-emerald-400/65 to-transparent" />
                      <div
                        className={`relative ${
                          modoVista === "grid"
                            ? "h-full w-full overflow-hidden bg-[#0f1416]"
                            : "h-full w-48 shrink-0 overflow-hidden"
                        }`}
                      >
                        <Image
                          src={p.imagen}
                          alt={p.nombre}
                          fill
                          className="h-full w-full"
                          unoptimized
                          sizes={modoVista === "grid" ? "33vw" : "280px"}
                          style={{ objectFit: "cover", objectPosition: "center" }}
                        />
                        {p.promo ? (
                          <Badge className="absolute left-3 top-3 border-0 bg-destructive text-[10px] font-bold tracking-wider text-white">
                            OFERTA
                          </Badge>
                        ) : null}
                      </div>
                      <div
                        className={`grid gap-2 p-5 ${
                          modoVista === "grid"
                            ? "h-full grid-rows-[minmax(0,1fr)_auto]"
                            : "h-full flex-1 grid-rows-[minmax(0,1fr)_auto]"
                        }`}
                      >
                        <div className="self-start">
                          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground">
                            {p.nombre}
                          </h3>
                          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                            {p.descripcion}
                          </p>
                        </div>

                        <div className="self-end">
                          {p.precioOriginal ? (
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="text-sm font-semibold text-muted-foreground line-through">
                                {fmt.format(p.precioOriginal)}
                              </span>
                              <span className="inline-flex h-6 items-center justify-center rounded-full bg-destructive/12 px-2 text-[10px] font-bold uppercase tracking-wider leading-none text-destructive ring-1 ring-destructive/25">
                                Oferta -
                                {Math.round(
                                  ((p.precioOriginal - p.precio) / p.precioOriginal) * 100,
                                )}
                                %
                              </span>
                            </div>
                          ) : null}
                          <span className="mt-1 block text-[clamp(1.16rem,1.9vw,1.5rem)] leading-none font-extrabold tracking-tight text-white">
                            {fmt.format(p.precio)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex h-full min-h-0 items-center justify-center border-t border-rootsy-hairline bg-card/98 px-3 backdrop-blur-2xl">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClienteToolbarClick}
                  className={`${toolboxBtnClass} ${nombreCliente ? toolboxBtnActivo : ""}`}
                >
                  <User className="size-4 shrink-0" aria-hidden />
                  <span className="max-w-36 truncate text-center text-xs font-semibold leading-tight sm:text-left">
                    {nombreCliente ?? "Cliente"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setComprobanteModalAbierto(true)}
                  className={`${toolboxBtnClass} ${comprobante ? toolboxBtnActivo : ""}`}
                >
                  <Receipt className="size-4 shrink-0" aria-hidden />
                  <span className="max-w-36 truncate text-center text-xs font-semibold leading-tight sm:text-left">
                    {comprobante ?? "Comprobante"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPagoModalAbierto(true)}
                  className={`${toolboxBtnClass} ${metodoPago ? toolboxBtnActivo : ""}`}
                >
                  <Banknote className="size-4 shrink-0" aria-hidden />
                  <span className="max-w-36 truncate text-center text-xs font-semibold leading-tight sm:text-left">
                    {metodoPago ?? "Efectivo"}
                  </span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={abrirModalDescuento}
                  className={`${toolboxBtnClass} ${hayDescuento ? toolboxBtnActivo : ""}`}
                >
                  <Percent className="size-4 shrink-0" aria-hidden />
                  <span className="max-w-36 truncate text-center text-xs font-semibold leading-tight sm:text-left">
                    {hayDescuento
                      ? modoDescuento === "porcentaje"
                        ? `${valorDescuentoPorcentaje}%`
                        : `Fijo ${fmt.format(valorDescuentoFijo)}`
                      : "Descuento"}
                  </span>
                </Button>
              </div>
            </div>
          </section>

          <aside className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-[#f3f5f7] text-[#121417]">
            <div className="flex min-h-0 flex-col">
              <div className="flex h-14 items-center gap-2 border-b border-[#d9dee4] px-4">
                <ShoppingCart className="size-4.5 text-[#3b4a59]" />
                <p className="font-semibold">Resumen de la venta</p>
              </div>

              <div className="game-scroll min-h-0 flex-1 overflow-y-auto">
                {itemsDetallados.map((item) => (
                  <div
                    key={item.productoId}
                    className="grid grid-cols-[56px_minmax(0,1fr)_90px_28px] items-center gap-2 border-b border-[#e2e7ec] px-3 py-2"
                  >
                    <div className="flex items-center gap-1 rounded-lg bg-white px-1 py-1 ring-1 ring-[#d5dbe2]">
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.productoId, -1)}
                        className="inline-flex size-5 items-center justify-center rounded bg-[#eef2f6] text-[#324255] hover:bg-[#dfe6ee]"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-4 text-center text-sm font-bold text-[#1d232b]">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => cambiarCantidad(item.productoId, 1)}
                        className="inline-flex size-5 items-center justify-center rounded bg-[#eef2f6] text-[#324255] hover:bg-[#dfe6ee]"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-[#151a20]">
                        {item.producto?.nombre}
                      </p>
                      <p className="line-clamp-1 text-xs text-[#5d6978]">
                        {item.producto?.descripcion}
                      </p>
                    </div>
                    <p className="text-right text-sm font-bold text-[#151a20]">
                      {fmt.format((item.producto?.precio ?? 0) * item.cantidad)}
                    </p>
                    <button
                      type="button"
                      onClick={() => quitarDelCarrito(item.productoId)}
                      className="inline-flex size-7 items-center justify-center rounded text-[#7a8796] hover:bg-[#e5ebf2] hover:text-[#1f2a36]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
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
          <ul className="game-scroll max-h-60 space-y-2 overflow-y-auto pr-1">
            {clientesFiltradosModal.length === 0 ? (
              <li className="rounded-lg border border-dashed border-foreground/15 px-3 py-6 text-center text-sm text-muted-foreground">
                No hay resultados para esa búsqueda.
              </li>
            ) : (
              clientesFiltradosModal.map((nombre) => (
                <li key={nombre}>
                  <button
                    type="button"
                    onClick={() => seleccionarCliente(nombre)}
                    className="flex w-full items-center gap-3 rounded-xl border border-foreground/10 bg-secondary px-4 py-3 text-left text-sm font-semibold transition hover:bg-muted"
                  >
                    <User className="size-5 shrink-0 text-primary" aria-hidden />
                    <span className="min-w-0">{nombre}</span>
                  </button>
                </li>
              ))
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
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      seleccionado
                        ? "border-primary/55 bg-primary/12 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.25)]"
                        : "border-foreground/10 bg-secondary hover:bg-muted"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{c}</span>
                    {c === "Recibo X" ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        No requiere ARCA
                      </span>
                    ) : null}
                  </button>
                </li>
              )
            })}
          </ul>
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
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
            <Button
              type="button"
              variant="outline"
              className="h-12 w-full border-foreground/15"
              onClick={() => {
                setMetodoPago("Efectivo")
                setPagoModalAbierto(false)
              }}
            >
              Efectivo
            </Button>
            <Separator className="bg-border/80" />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Débito
              </p>
              <div className="flex flex-wrap gap-2">
                {TARJETAS_DEBITO.map((t) => (
                  <Button
                    key={`deb-${t}`}
                    type="button"
                    variant="outline"
                    className="min-w-26 border-foreground/15"
                    onClick={() => {
                      setMetodoPago(`Débito · ${t}`)
                      setPagoModalAbierto(false)
                    }}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <Separator className="bg-border/80" />
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Crédito
              </p>
              <div className="flex flex-wrap gap-2">
                {TARJETAS_CREDITO.map((t) => (
                  <Button
                    key={`cred-${t}`}
                    type="button"
                    variant="outline"
                    className="min-w-26 border-foreground/15"
                    onClick={() => {
                      setMetodoPago(`Crédito · ${t}`)
                      setPagoModalAbierto(false)
                    }}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => {
                setMetodoPago(null)
                setPagoModalAbierto(false)
              }}
            >
              Usar efectivo por defecto
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
              Aplicá un descuento por porcentaje o un monto fijo sobre el
              subtotal.
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={descuentoDraftModo}
            onValueChange={(v) =>
              setDescuentoDraftModo(v as "porcentaje" | "fijo")
            }
            className="grid gap-3"
          >
            <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-secondary/80 px-3 py-2">
              <RadioGroupItem value="porcentaje" id="desc-pct" />
              <Label htmlFor="desc-pct" className="cursor-pointer font-medium">
                Porcentaje
              </Label>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-foreground/10 bg-secondary/80 px-3 py-2">
              <RadioGroupItem value="fijo" id="desc-fijo" />
              <Label htmlFor="desc-fijo" className="cursor-pointer font-medium">
                Monto fijo
              </Label>
            </div>
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="desc-valor">
              {descuentoDraftModo === "porcentaje"
                ? "Porcentaje (%)"
                : "Monto fijo (ARS)"}
            </Label>
            <Input
              id="desc-valor"
              value={descuentoDraftTexto}
              onChange={(e) => setDescuentoDraftTexto(e.target.value)}
              placeholder={
                descuentoDraftModo === "porcentaje" ? "Ej. 10" : "Ej. 500"
              }
              inputMode="decimal"
              autoComplete="off"
              max={
                descuentoDraftModo === "fijo" && subtotal > 0
                  ? subtotal
                  : undefined
              }
            />
            {descuentoDraftModo === "fijo" && subtotal > 0 ? (
              <p className="text-xs text-muted-foreground">
                Máximo aplicable: {fmt.format(subtotal)}. Si la venta baja de
                precio, el descuento fijo se ajusta solo hasta ese tope.
              </p>
            ) : null}
            {descuentoDraftModo === "fijo" && subtotal === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay subtotal: agregá productos para aplicar un monto fijo.
              </p>
            ) : null}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <Button type="button" variant="ghost" onClick={quitarDescuento}>
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
