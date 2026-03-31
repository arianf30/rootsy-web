"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import useEmblaCarousel from 'embla-carousel-react'
import {
  Search,
  Settings,
  HelpCircle,
  ShoppingCart,
  Monitor,
  UtensilsCrossed,
  ShoppingBag,
  Factory,
  Package,
  Users,
  Truck,
  CreditCard,
  Sparkles,
  BookOpen,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  ArrowLeftRight,
  ClipboardList,
  Receipt,
  FileBarChart,
  Wallet,
  FileCheck,
  MessageSquare,
  Bell,
  Banknote,
  Archive,
  Building2,
  UserCog,
  Printer,
  Cog,
  X,
  MapPin,
  Home
} from "lucide-react"

const menuSections = {
  operar: {
    title: "Operar",
    items: [
      { name: "Vender", icon: ShoppingCart, badge: "HOT" },
      { name: "Mostrador", icon: Monitor },
      { name: "Mesas", icon: UtensilsCrossed, badge: "12" },
      { name: "Comprar", icon: ShoppingBag },
      { name: "Fabricación", icon: Factory },
      { name: "Stock", icon: Package, badge: "3" },
      { name: "Clientes", icon: Users },
      { name: "Proveedores", icon: Truck },
      { name: "Cuentas Ctes", icon: CreditCard },
      { name: "Promociones", icon: Sparkles, badge: "5" },
      { name: "Recetas", icon: BookOpen },
    ]
  },
  administrar: {
    title: "Administrar",
    items: [
      { name: "Presupuestos", icon: FileText },
      { name: "Resumen", icon: BarChart3, badge: "NEW" },
      { name: "Estadísticas", icon: PieChart },
      { name: "Operaciones", icon: Activity },
      { name: "Movimientos", icon: ArrowLeftRight },
      { name: "Inventario", icon: ClipboardList },
      { name: "Gastos", icon: Receipt },
      { name: "Facturas", icon: FileBarChart, badge: "2" },
      { name: "Reportes", icon: FileCheck },
      { name: "Cheques", icon: Wallet },
      { name: "Órdenes", icon: FileText },
    ]
  },
  configurar: {
    title: "Configurar",
    items: [
      { name: "Mensajes", icon: MessageSquare },
      { name: "Alertas", icon: Bell, badge: "8" },
      { name: "Pagos", icon: Banknote },
      { name: "Cajas", icon: Archive },
      { name: "Cuentas", icon: Building2 },
      { name: "RRHH", icon: UserCog },
      { name: "Impresora", icon: Printer },
      { name: "Ajustes", icon: Cog },
    ]
  }
}

const dockItems = [
  { name: "Inicio", icon: Home },
  { name: "Vender", icon: ShoppingCart },
  { name: "Mesas", icon: UtensilsCrossed },
  { name: "Stock", icon: Package },
  { name: "Resumen", icon: BarChart3 },
  { name: "Ajustes", icon: Cog },
]

type SectionKey = keyof typeof menuSections

export default function MenuPage() {
  const router = useRouter()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [time, setTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [particles, setParticles] = useState<Array<{
    width: number
    height: number
    left: number
    top: number
    opacity: number
    duration: number
    delay: number
  }>>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const sections: SectionKey[] = ["operar", "administrar", "configurar"]
  const activeSection = sections[selectedIndex]
  const currentSection = menuSections[activeSection]

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
    skipSnaps: false,
    dragFree: false
  })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index)
  }, [emblaApi])

  useEffect(() => {
    setIsMounted(true)
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)

    setParticles(
      Array.from({ length: 12 }, () => ({
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.2 + 0.05,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5
      }))
    )

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getFilteredItems = (sectionKey: SectionKey) => {
    const section = menuSections[sectionKey]
    return searchQuery
      ? section.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      : section.items
  }

  return (
    <div ref={containerRef} className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-[150px] transition-all duration-[2000ms] ease-out"
          style={{
            background: 'radial-gradient(circle, color-mix(in srgb, var(--rootsy-particle) 50%, transparent) 0%, transparent 70%)',
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] rounded-full bg-emerald-600/5 blur-[120px]" />
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: particle.width + 'px',
              height: particle.height + 'px',
              left: particle.left + '%',
              top: particle.top + '%',
              background: 'var(--rootsy-particle)',
              opacity: particle.opacity,
              animationDuration: particle.duration + 's',
              animationDelay: particle.delay + 's',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,10,9,0.7)_100%)]" />
      </div>

      <header className="relative z-20 border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-8 py-5">
          {/* Left */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="group flex items-center justify-center w-12 h-12 rounded-xl border border-foreground/[0.06] bg-secondary transition-all hover:border-foreground/[0.12] hover:bg-muted active:scale-95"
            >
              <Home className="h-5 w-5 text-foreground/50 transition-colors group-hover:text-foreground/80" />
            </Link>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 overflow-hidden rounded-2xl ring-1 ring-border">
                <img
                  src="https://api.dicebear.com/7.x/shapes/svg?seed=store1&backgroundColor=1a1f1d"
                  alt="Logo sucursal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-base font-bold tracking-tight text-foreground">Sucursal Centro</span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Av. Principal 1234, Buenos Aires
                </span>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 flex justify-center max-w-[280px] mx-8">
            {showSearch ? (
              <div className="relative w-full animate-in zoom-in-95 duration-200">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="h-10 w-full rounded-xl border border-border bg-secondary py-0 pl-11 pr-10 text-sm text-foreground transition-all placeholder:text-foreground/30 focus:border-foreground/20 focus:bg-muted focus:outline-none"
                />
                <button
                  onClick={() => { setShowSearch(false); setSearchQuery("") }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 transition-colors hover:text-foreground/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="group flex h-10 w-full items-center gap-3 rounded-xl border border-foreground/[0.06] bg-secondary px-4 transition-all hover:border-foreground/10 hover:bg-muted"
              >
                <Search className="h-4 w-4 text-foreground/30 group-hover:text-foreground/50" />
                <span className="flex-1 text-left text-sm text-foreground/30">Buscar...</span>
                <kbd className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-foreground/25">⌘K</kbd>
              </button>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-muted">
                <Bell className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
              </button>
              <button className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-muted">
                <Settings className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
              </button>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-11 w-11 overflow-hidden rounded-xl ring-1 ring-border">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"
                    alt="Avatar"
                    className="size-full bg-secondary object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">María García</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow">Admin</span>
              </div>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex flex-col items-end">
              <span className="text-lg font-bold tabular-nums text-foreground">
                {isMounted && time ? time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
              <span className="text-xs uppercase tracking-wide text-foreground/30">
                {isMounted && time ? time.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' }) : '---'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-28 pt-4">
        <div className="flex flex-col items-center w-full">
          {/* Section Tabs */}
          <div className="mb-[32px] flex w-48 items-center justify-between rounded-xl border border-border bg-muted px-4 py-2.5 backdrop-blur-xl">
            <span className="text-sm font-bold tracking-wide text-foreground">
              {currentSection.title}
            </span>
            <div className="flex items-center gap-1.5">
              {sections.map((sectionKey, index) => (
                <button
                  key={sectionKey}
                  onClick={() => scrollTo(index)}
                  className={`rounded-full transition-all duration-300 ${selectedIndex === index
                    ? 'size-2 bg-primary'
                    : 'size-1.5 bg-foreground/25 hover:bg-foreground/50'
                    }`}
                  aria-label={menuSections[sectionKey].title}
                />
              ))}
            </div>
          </div>

          {/* Embla Carousel */}
          <div className="w-full overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {sections.map((sectionKey) => {
                const items = getFilteredItems(sectionKey)

                return (
                  <div key={sectionKey} className="flex-[0_0_100%] min-w-0 px-8">
                    <div className="grid grid-cols-6 gap-x-0 gap-y-8 max-w-4xl mx-auto min-h-[280px] py-6 px-6 select-none">
                      {items.map((item) => {
                        const Icon = item.icon

                        return (
                          <button
                            key={item.name}
                            onClick={() => {
                              if (item.name === "Vender") router.push("/1/sale")
                            }}
                            className="group flex flex-col items-center justify-self-center gap-2.5 w-24 transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            <div className="relative">
                              <div className="absolute inset-1 rounded-[20px] bg-emerald-500/40 blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

                              <div className="relative w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-emerald-500/90 to-teal-600/90 flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:shadow-emerald-500/20 transition-all overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-500" />
                                <div className="absolute inset-[1px] rounded-[19px] border border-white/20" />
                                <Icon className="relative h-8 w-8 text-white drop-shadow-sm group-hover:scale-110 transition-transform duration-200" />
                              </div>

                              {item.badge && (
                                <div className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center shadow-sm ${item.badge === 'HOT' || item.badge === 'NEW'
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse'
                                  : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                                  }`}>
                                  {item.badge}
                                </div>
                              )}
                            </div>

                            <span className="text-center text-xs font-medium leading-tight text-foreground/70 drop-shadow-sm transition-colors group-hover:text-foreground">
                              {item.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-2.5 backdrop-blur-2xl">
          {dockItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                className="group relative flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95"
              >
                <div className="absolute -bottom-2 left-1/2 h-2 w-8 -translate-x-1/2 rounded-full bg-primary/30 opacity-0 blur-md transition-opacity group-hover:opacity-100" />

                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/80 to-teal-600/80 flex items-center justify-center group-hover:from-emerald-500 group-hover:to-teal-600 transition-all overflow-hidden shadow-md group-hover:shadow-emerald-500/30">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-500" />
                  <div className="absolute inset-[1px] rounded-[10px] border border-white/20" />
                  <Icon className="relative h-6 w-6 text-white drop-shadow-sm" />
                </div>

                <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 scale-90 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-all group-hover:scale-100 group-hover:opacity-100">
                  {item.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Help Button */}
      <button className="group absolute bottom-4 right-4 z-20 flex size-12 items-center justify-center rounded-full border border-border bg-muted backdrop-blur-xl transition-all hover:bg-muted/80 active:scale-95">
        <HelpCircle className="size-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
      </button>
    </div>
  )
}
