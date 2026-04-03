"use client"

import withAuth from "@/hoc/withAuth"
import { getPopMenuData } from "@/app/[pop]/menu/actions"
import { canAccessMenuItem } from "@/lib/menuPermissions"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import useEmblaCarousel from "embla-carousel-react"
import type { LucideIcon } from "lucide-react"
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
  Home,
} from "lucide-react"

export type MenuItemLink =
  | "sale"
  | "settings"
  | "hr"
  | "articles"
  | "section"

type MenuItemDef = {
  name: string
  icon: LucideIcon
  badge?: string
  link: MenuItemLink
}

type MenuSectionDef = {
  title: string
  items: MenuItemDef[]
}

const menuSectionsRaw: Record<string, MenuSectionDef> = {
  operar: {
    title: "Operar",
    items: [
      { name: "Vender", icon: ShoppingCart, badge: "HOT", link: "sale" },
      { name: "Mostrador", icon: Monitor, link: "section" },
      { name: "Mesas", icon: UtensilsCrossed, badge: "12", link: "section" },
      { name: "Comprar", icon: ShoppingBag, link: "section" },
      { name: "Fabricación", icon: Factory, link: "section" },
      { name: "Stock", icon: Package, badge: "3", link: "articles" },
      { name: "Clientes", icon: Users, link: "section" },
      { name: "Proveedores", icon: Truck, link: "section" },
      { name: "Cuentas Ctes", icon: CreditCard, link: "section" },
      { name: "Promociones", icon: Sparkles, badge: "5", link: "section" },
      { name: "Recetas", icon: BookOpen, link: "section" },
    ],
  },
  administrar: {
    title: "Administrar",
    items: [
      { name: "Presupuestos", icon: FileText, link: "section" },
      { name: "Resumen", icon: BarChart3, badge: "NEW", link: "section" },
      { name: "Estadísticas", icon: PieChart, link: "section" },
      { name: "Operaciones", icon: Activity, link: "section" },
      { name: "Movimientos", icon: ArrowLeftRight, link: "section" },
      { name: "Inventario", icon: ClipboardList, link: "section" },
      { name: "Gastos", icon: Receipt, link: "section" },
      { name: "Facturas", icon: FileBarChart, badge: "2", link: "section" },
      { name: "Reportes", icon: FileCheck, link: "section" },
      { name: "Cheques", icon: Wallet, link: "section" },
      { name: "Órdenes", icon: FileText, link: "section" },
    ],
  },
  configurar: {
    title: "Configurar",
    items: [
      { name: "Mensajes", icon: MessageSquare, link: "section" },
      { name: "Alertas", icon: Bell, badge: "8", link: "section" },
      { name: "Pagos", icon: Banknote, link: "section" },
      { name: "Cajas", icon: Archive, link: "section" },
      { name: "Cuentas", icon: Building2, link: "section" },
      { name: "RRHH", icon: UserCog, link: "hr" },
      { name: "Impresora", icon: Printer, link: "section" },
      { name: "Ajustes", icon: Cog, link: "settings" },
    ],
  },
}

const dockItemsRaw: Array<{
  name: string
  icon: LucideIcon
  link?: MenuItemLink
  href?: "home"
}> = [
  { name: "Inicio", icon: Home, href: "home" },
  { name: "Vender", icon: ShoppingCart, link: "sale" },
  { name: "Mesas", icon: UtensilsCrossed, link: "section" },
  { name: "Stock", icon: Package, link: "articles" },
  { name: "Resumen", icon: BarChart3, link: "section" },
  { name: "Ajustes", icon: Cog, link: "settings" },
]

function routeForMenuLink(
  popId: string,
  link: MenuItemLink | undefined,
): string | null {
  if (!link || link === "section") return null
  return `/${popId}/${link}`
}

function MenuPage() {
  const router = useRouter()
  const params = useParams()
  const popId = typeof params?.pop === "string" ? params.pop : ""

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [time, setTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [particles, setParticles] = useState<
    Array<{
      width: number
      height: number
      left: number
      top: number
      opacity: number
      duration: number
      delay: number
    }>
  >([])
  const containerRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [popName, setPopName] = useState("")
  const [popAddress, setPopAddress] = useState<string | null>(null)
  const [popImageUrl, setPopImageUrl] = useState<string | null>(null)
  const [permissionKeys, setPermissionKeys] = useState<string[]>([])
  const [userFullName, setUserFullName] = useState("")
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null)
  const [userRoleLabel, setUserRoleLabel] = useState("")

  useEffect(() => {
    if (!popId) {
      setLoading(false)
      setError("No se encontró el punto de venta.")
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await getPopMenuData(popId)
        if (cancelled) return
        if (!result.success) {
          setError(result.error || "Error al cargar")
          if (result.redirect) {
            setTimeout(() => router.push(result.redirect!), 1800)
          }
          setLoading(false)
          return
        }
        setPopName(result.pop.name)
        setPopAddress(result.pop.address)
        setPopImageUrl(result.pop.imageUrl)
        setPermissionKeys(result.permissionKeys)
        setUserFullName(result.user.fullName)
        setUserImageUrl(result.user.imageUrl)
        setUserRoleLabel(result.user.roleLabel)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError("Error al cargar el menú.")
          setLoading(false)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId, router])

  const filteredMenuSections = useMemo(() => {
    const out: Record<string, MenuSectionDef> = {}
    for (const [key, section] of Object.entries(menuSectionsRaw)) {
      const items = section.items.filter((item) =>
        canAccessMenuItem(permissionKeys, item.link),
      )
      if (items.length > 0) {
        out[key] = { ...section, items }
      }
    }
    return out
  }, [permissionKeys])

  const sections = useMemo(
    () => Object.keys(filteredMenuSections) as (keyof typeof filteredMenuSections)[],
    [filteredMenuSections],
  )

  const activeSectionKey = sections[selectedIndex] ?? sections[0]
  const currentSection =
    activeSectionKey && filteredMenuSections[activeSectionKey]
      ? filteredMenuSections[activeSectionKey]
      : { title: "", items: [] as MenuItemDef[] }

  useEffect(() => {
    if (selectedIndex >= sections.length) {
      setSelectedIndex(0)
    }
  }, [sections.length, selectedIndex])

  const dockItems = useMemo(() => {
    return dockItemsRaw.filter((d) => {
      if (d.href === "home") return true
      return canAccessMenuItem(permissionKeys, d.link)
    })
  }, [permissionKeys])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  })

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (emblaApi && sections.length > 0) {
      emblaApi.reInit()
    }
  }, [emblaApi, sections.length, filteredMenuSections])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

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
        delay: Math.random() * 5,
      })),
    )

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePos({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        })
      }
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const getFilteredItems = (sectionKey: string) => {
    const section = filteredMenuSections[sectionKey]
    if (!section) return []
    return searchQuery
      ? section.items.filter((item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : section.items
  }

  const popLogoSrc =
    popImageUrl?.trim() ||
    `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=1a1f1d`

  const userAvatarSrc =
    userImageUrl?.trim() ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userFullName || "user")}`

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando menú…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/home" className="text-sm text-primary underline">
          Volver al inicio
        </Link>
      </div>
    )
  }

  if (sections.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="max-w-md text-sm text-muted-foreground">
          No tenés permisos de lectura para ninguna sección de este punto de
          venta. Pedile a un administrador que ajuste tu rol.
        </p>
        <Link
          href="/home"
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Ir al inicio
        </Link>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col overflow-hidden bg-background"
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-10 blur-[150px] transition-all duration-[2000ms] ease-out"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--rootsy-particle) 50%, transparent) 0%, transparent 70%)",
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] rounded-full bg-emerald-600/5 blur-[120px]" />
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: particle.width + "px",
              height: particle.height + "px",
              left: particle.left + "%",
              top: particle.top + "%",
              background: "var(--rootsy-particle)",
              opacity: particle.opacity,
              animationDuration: particle.duration + "s",
              animationDelay: particle.delay + "s",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,10,9,0.7)_100%)]" />
      </div>

      <header className="relative z-20 border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-6">
            <Link
              href="/home"
              className="group flex items-center justify-center w-12 h-12 rounded-xl border border-foreground/[0.06] bg-secondary transition-all hover:border-foreground/[0.12] hover:bg-muted active:scale-95"
            >
              <Home className="h-5 w-5 text-foreground/50 transition-colors group-hover:text-foreground/80" />
            </Link>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 overflow-hidden rounded-2xl ring-1 ring-border">
                <img
                  src={popLogoSrc}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-base font-bold tracking-tight text-foreground truncate">
                  {popName}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {popAddress || "Sin dirección"}
                  </span>
                </span>
              </div>
            </div>
          </div>

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
                  type="button"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 transition-colors hover:text-foreground/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="group flex h-10 w-full items-center gap-3 rounded-xl border border-foreground/[0.06] bg-secondary px-4 transition-all hover:border-foreground/10 hover:bg-muted"
              >
                <Search className="h-4 w-4 text-foreground/30 group-hover:text-foreground/50" />
                <span className="flex-1 text-left text-sm text-foreground/30">
                  Buscar...
                </span>
                <kbd className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-foreground/25">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-muted"
              >
                <Bell className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
              </button>
              <button
                type="button"
                className="group flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-muted"
              >
                <Settings className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
              </button>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex items-center gap-3 min-w-0 max-w-[200px]">
              <div className="relative shrink-0">
                <div className="h-11 w-11 overflow-hidden rounded-xl ring-1 ring-border">
                  <img
                    src={userAvatarSrc}
                    alt=""
                    className="size-full bg-secondary object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">
                  {userFullName}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow truncate">
                  {userRoleLabel}
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-border" />

            <div className="flex flex-col items-end shrink-0">
              <span className="text-lg font-bold tabular-nums text-foreground">
                {isMounted && time
                  ? time.toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "--:--"}
              </span>
              <span className="text-xs uppercase tracking-wide text-foreground/30">
                {isMounted && time
                  ? time.toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })
                  : "---"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-28 pt-4">
        <div className="flex flex-col items-center w-full">
          <div className="mb-[32px] flex w-48 items-center justify-between rounded-xl border border-border bg-muted px-4 py-2.5 backdrop-blur-xl">
            <span className="text-sm font-bold tracking-wide text-foreground">
              {currentSection.title}
            </span>
            <div className="flex items-center gap-1.5">
              {sections.map((sectionKey, index) => (
                <button
                  key={sectionKey}
                  type="button"
                  onClick={() => scrollTo(index)}
                  className={`rounded-full transition-all duration-300 ${
                    selectedIndex === index
                      ? "size-2 bg-primary"
                      : "size-1.5 bg-foreground/25 hover:bg-foreground/50"
                  }`}
                  aria-label={filteredMenuSections[sectionKey]?.title ?? sectionKey}
                />
              ))}
            </div>
          </div>

          <div className="w-full overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {sections.map((sectionKey) => {
                const items = getFilteredItems(sectionKey)

                return (
                  <div key={sectionKey} className="flex-[0_0_100%] min-w-0 px-8">
                    <div className="grid grid-cols-6 gap-x-0 gap-y-8 max-w-4xl mx-auto min-h-[280px] py-6 px-6 select-none">
                      {items.map((item) => {
                        const Icon = item.icon
                        const target = routeForMenuLink(popId, item.link)

                        return (
                          <button
                            key={item.name}
                            type="button"
                            onClick={() => {
                              if (target) router.push(target)
                            }}
                            disabled={!target}
                            className="group flex flex-col items-center justify-self-center gap-2.5 w-24 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:pointer-events-none"
                          >
                            <div className="relative">
                              <div className="absolute inset-1 rounded-[20px] bg-emerald-500/40 blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

                              <div className="relative w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-emerald-500/90 to-teal-600/90 flex items-center justify-center shadow-md shadow-emerald-900/10 group-hover:shadow-emerald-500/20 transition-all overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-500" />
                                <div className="absolute inset-[1px] rounded-[19px] border border-white/20" />
                                <Icon className="relative h-8 w-8 text-white drop-shadow-sm group-hover:scale-110 transition-transform duration-200" />
                              </div>

                              {item.badge && (
                                <div
                                  className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-semibold flex items-center justify-center shadow-sm ${
                                    item.badge === "HOT" || item.badge === "NEW"
                                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white animate-pulse"
                                      : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
                                  }`}
                                >
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

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted px-4 py-2.5 backdrop-blur-2xl">
          {dockItems.map((item) => {
            const Icon = item.icon
            const target =
              item.href === "home"
                ? "/home"
                : item.link
                  ? routeForMenuLink(popId, item.link)
                  : null

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  if (target) router.push(target)
                }}
                disabled={!target}
                className="group relative flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
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

      <button
        type="button"
        className="group absolute bottom-4 right-4 z-20 flex size-12 items-center justify-center rounded-full border border-border bg-muted backdrop-blur-xl transition-all hover:bg-muted/80 active:scale-95"
      >
        <HelpCircle className="size-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
      </button>
    </div>
  )
}

export default withAuth(MenuPage)
