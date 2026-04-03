"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import {
  ArrowLeft,
  Bell,
  CreditCard,
  HelpCircle,
  Home,
  MapPin,
  Minus,
  Pencil,
  Palette,
  Printer,
  RotateCcw,
  Search,
  Settings,
  Star,
  Upload,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"

import { MenuTruncatedLabel } from "@/components/pop/menu-truncated-label"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  clearWallpaperUrl,
  loadFavoriteIds,
  loadWallpaperUrl,
  saveFavoriteIds,
  saveWallpaperUrl,
} from "@/lib/pop-menu-favorites"
import {
  DEFAULT_MENU_WALLPAPER,
  MAX_MENU_FAVORITES,
  POP_MENU_SECTIONS,
  type MenuItemDef,
  getMenuItemById,
  resolveMenuHref,
} from "@/lib/pop-menu-data"
import { cn } from "@/lib/utils"

const CONFIG_ITEMS: {
  id: string
  name: string
  icon: LucideIcon
}[] = [
  { id: "usuarios", name: "Usuarios", icon: Users },
  { id: "pagos", name: "Formas de pago", icon: CreditCard },
  { id: "personalizar", name: "Personalizar negocio", icon: Palette },
  { id: "impresoras", name: "Impresoras", icon: Printer },
]

const SAMPLE_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Ventas de ayer",
    body: "$ 842.300 cerradas en la sucursal · +6% vs. promedio semanal",
    time: "Hace 2 h",
    tint: "emerald" as const,
  },
  {
    id: "n2",
    title: "Stock bajo",
    body: "Harina 000 (dep. A) por debajo del mínimo · 4 unidades",
    time: "Hace 5 h",
    tint: "amber" as const,
  },
  {
    id: "n3",
    title: "Caja #2",
    body: "Diferencia de arqueo $ 1.200 · pendiente de revisión",
    time: "Ayer",
    tint: "rose" as const,
  },
  {
    id: "n4",
    title: "Promoción",
    body: "“2×1 postres” vence en 48 h",
    time: "Ayer",
    tint: "sky" as const,
  },
]

const MENU_CARD_H =
  "h-[5.5rem] min-h-[5.5rem] sm:h-[7.25rem] sm:min-h-[7.25rem]"

function MenuMiniCard({
  item,
  popSlug,
  isFavorite,
  favoritesFull,
  dockEditing,
  onNavigate,
  onToggleFavorite,
}: {
  item: MenuItemDef
  popSlug: string
  isFavorite: boolean
  favoritesFull: boolean
  dockEditing: boolean
  onNavigate: () => void
  onToggleFavorite: () => void
}) {
  const [hover, setHover] = useState(false)
  const Icon = item.icon
  const href = resolveMenuHref(item, popSlug)

  const onCardMove = useCallback((e: MouseEvent<HTMLElement>) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const max = 8
    el.style.setProperty("--rx", `${-py * max}deg`)
    el.style.setProperty("--ry", `${px * max}deg`)
  }, [])

  const onCardLeave = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
  }, [])

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        onMouseMove={onCardMove}
        onMouseLeave={onCardLeave}
        className={cn(
          "group rootsy-card-tilt relative w-full rounded-2xl",
          "ring-1 ring-white/[0.04] transition-[box-shadow] duration-300",
          "shadow-[0_14px_36px_-14px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.06)]",
          "hover:shadow-[0_22px_48px_-12px_rgba(0,0,0,0.6),0_0_0_1px_rgba(16,185,129,0.22),0_0_36px_-10px_rgba(16,185,129,0.2),inset_0_1px_0_0_rgba(255,255,255,0.1)]",
        )}
      >
        <button
          type="button"
          onClick={onNavigate}
          className={cn(
            MENU_CARD_H,
            "relative z-0 flex w-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-[#121816] p-2.5 text-left transition-[border-color,background-color] duration-200 hover:border-emerald-500/28 hover:bg-[#151c19] sm:p-3",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl motion-reduce:hidden"
            aria-hidden
          >
            <div
              className={cn(
                "absolute top-0 h-full w-[55%] skew-x-[-16deg] bg-linear-to-r from-transparent via-white/30 to-transparent opacity-0 transition-[left,opacity] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                "left-[-60%] group-hover:left-[125%] group-hover:opacity-90",
              )}
            />
          </div>

          <div className="relative z-[1] flex shrink-0 items-start justify-between gap-1">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/[0.08] sm:size-9">
              <Icon className="size-4 text-emerald-200/90" aria-hidden />
            </div>
            <div className="flex min-h-5 shrink-0 flex-col items-end gap-1">
              {item.badge?.kind === "count" ? (
                <span
                  className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white/15 bg-black/40 px-1 text-[9px] font-bold tabular-nums text-white"
                  aria-label={`${item.badge.value} avisos`}
                >
                  {item.badge.value}
                </span>
              ) : null}
              {item.badge?.kind === "pill" ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white",
                    item.badge.label === "HOT"
                      ? "border border-amber-400/45 bg-amber-600/85"
                      : "border border-emerald-400/40 bg-emerald-600/35",
                  )}
                >
                  {item.badge.label}
                </span>
              ) : null}
            </div>
          </div>

          <div className="relative z-[1] mt-auto min-h-0 w-full pt-2">
            <MenuTruncatedLabel
              text={item.name}
              active={hover}
              className="text-left text-[10px] font-semibold leading-snug text-white/88 sm:text-[11px]"
            />
          </div>

          {href ? (
            <span className="sr-only">Abrir {item.name}</span>
          ) : (
            <span className="sr-only">{item.name} (próximamente)</span>
          )}
        </button>

        <button
          type="button"
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos del dock"
          }
          disabled={dockEditing}
          onClick={() => {
            if (dockEditing) return
            onToggleFavorite()
          }}
          className={cn(
            "absolute -right-1.5 -top-1.5 z-30 flex size-7 items-center justify-center rounded-lg border border-white/20 bg-[#0b0f0d]/95 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-[#141a17] disabled:opacity-40",
            !isFavorite && favoritesFull && "opacity-70 hover:opacity-100",
          )}
        >
          <Star
            className={cn(
              "size-3.5",
              isFavorite ? "fill-amber-300 text-amber-200" : "text-white/85",
            )}
          />
        </button>
      </div>
    </div>
  )
}

export default function MenuPage() {
  const router = useRouter()
  const params = useParams()
  const popSlug =
    typeof params?.pop === "string"
      ? params.pop
      : Array.isArray(params?.pop)
        ? params.pop[0] ?? "1"
        : "1"

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
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
  const wallpaperInputRef = useRef<HTMLInputElement>(null)

  const [wallpaperSrc, setWallpaperSrc] = useState(DEFAULT_MENU_WALLPAPER)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsView, setSettingsView] = useState<"main" | "wallpaper">(
    "main",
  )
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoritesHydrated, setFavoritesHydrated] = useState(false)
  const [dockEditing, setDockEditing] = useState(false)
  const [favToast, setFavToast] = useState<string | null>(null)

  const sections = POP_MENU_SECTIONS

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

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  useEffect(() => {
    setFavoriteIds(loadFavoriteIds())
    const w = loadWallpaperUrl()
    if (w) setWallpaperSrc(w)
    setFavoritesHydrated(true)

    setParticles(
      Array.from({ length: 10 }, () => ({
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.12 + 0.04,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      })),
    )
  }, [])

  useEffect(() => {
    if (!favoritesHydrated) return
    saveFavoriteIds(favoriteIds)
  }, [favoriteIds, favoritesHydrated])

  useEffect(() => {
    if (!settingsOpen) setSettingsView("main")
  }, [settingsOpen])

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

  const getFilteredItems = (sectionIndex: number) => {
    const section = sections[sectionIndex]
    if (!searchQuery.trim()) return section.items
    const q = searchQuery.toLowerCase()
    return section.items.filter((item) => item.name.toLowerCase().includes(q))
  }

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(id)) {
        setFavToast(null)
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= MAX_MENU_FAVORITES) {
        setFavToast(
          "Máximo 5 favoritos (como el dock del iPhone). Eliminá uno desde Editar o la estrella.",
        )
        window.setTimeout(() => setFavToast(null), 4200)
        return prev
      }
      setFavToast(null)
      return [...prev, id]
    })
  }, [])

  const removeFavoriteFromDock = useCallback((id: string) => {
    setFavoriteIds((prev) => prev.filter((x) => x !== id))
  }, [])

  const handleWallpaperFile = (files: FileList | null) => {
    const file = files?.[0]
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (typeof dataUrl === "string") {
        if (dataUrl.length < 1_400_000) {
          saveWallpaperUrl(dataUrl)
        }
        setWallpaperSrc(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  const resetWallpaper = () => {
    clearWallpaperUrl()
    setWallpaperSrc(DEFAULT_MENU_WALLPAPER)
  }

  const favoritesFull =
    favoriteIds.length >= MAX_MENU_FAVORITES && favoritesHydrated

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex flex-col overflow-hidden bg-background"
    >
      <input
        ref={wallpaperInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleWallpaperFile(e.target.files)}
      />

      <div className="pointer-events-none fixed inset-0 z-0">
        <img
          src={wallpaperSrc}
          alt=""
          className="size-full object-cover"
        />
        <div
          className="absolute inset-0 bg-background/80 dark:bg-[#070a09]/86"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-linear-to-b from-background/50 via-transparent to-background/90"
          aria-hidden
        />
        <div
          className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07] blur-[150px] transition-all duration-[2000ms] ease-out"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--rootsy-particle) 45%, transparent) 0%, transparent 70%)",
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        {particles.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: "var(--rootsy-particle)",
              opacity: particle.opacity,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <header className="relative z-20 border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <Link
              href="/"
              className="group flex size-11 shrink-0 items-center justify-center rounded-xl border border-foreground/[0.06] bg-secondary transition-all hover:border-foreground/[0.12] hover:bg-muted active:scale-95 sm:size-12"
            >
              <Home className="size-5 text-foreground/50 transition-colors group-hover:text-foreground/80" />
            </Link>

            <div className="hidden h-6 w-px bg-border sm:block" />

            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="size-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border sm:size-14">
                <img
                  src="https://api.dicebear.com/7.x/shapes/svg?seed=store1&backgroundColor=1a1f1d"
                  alt="Logo sucursal"
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex flex-col gap-0.5">
                <span className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
                  Sucursal Centro
                </span>
                <span className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
                  <MapPin className="size-3.5 shrink-0" />
                  Av. Principal 1234, Buenos Aires
                </span>
              </div>
            </div>
          </div>

          <div className="mx-2 hidden min-w-0 max-w-[min(420px,32vw)] flex-1 justify-center md:flex">
            {showSearch ? (
              <div className="relative w-full animate-in zoom-in-95 duration-200">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/30" />
                <input
                  type="search"
                  placeholder="Buscar sección…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="h-10 w-full rounded-full border border-border bg-secondary py-0 pl-11 pr-10 text-sm text-foreground transition-all placeholder:text-foreground/30 focus:border-foreground/20 focus:bg-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 transition-colors hover:text-foreground/60"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="group flex h-10 w-full items-center gap-3 rounded-full border border-foreground/[0.06] bg-secondary px-4 transition-all hover:border-foreground/10 hover:bg-muted"
              >
                <Search className="size-4 text-foreground/30 group-hover:text-foreground/50" />
                <span className="flex-1 text-left text-sm text-foreground/30">
                  Buscar sección…
                </span>
                <kbd className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-foreground/25">
                  ⌘K
                </kbd>
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-6">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(true)
                  setSettingsOpen(false)
                }}
                className="group flex size-10 items-center justify-center rounded-xl transition-all hover:bg-muted"
                aria-label="Notificaciones"
              >
                <Bell className="size-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(true)
                  setNotificationsOpen(false)
                }}
                className="group flex size-10 items-center justify-center rounded-xl transition-all hover:bg-muted"
                aria-label="Configuración"
              >
                <Settings className="size-5 text-muted-foreground transition-colors group-hover:text-foreground/70" />
              </button>
            </div>

            <div className="hidden h-6 w-px bg-border sm:block" />

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative shrink-0">
                <div className="size-10 overflow-hidden rounded-xl ring-1 ring-border sm:size-11">
                  <img
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"
                    alt=""
                    className="size-full bg-secondary object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-primary" />
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-semibold text-foreground">
                  María García
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow">
                  Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/40 px-4 pb-3 md:hidden">
          {showSearch ? (
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/30" />
              <input
                type="search"
                placeholder="Buscar sección…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="h-10 w-full rounded-full border border-border bg-secondary py-0 pl-10 pr-10 text-sm focus:outline-none"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground/40"
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery("")
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSearch(true)}
              className="flex h-10 w-full items-center gap-2 rounded-full border border-foreground/10 bg-secondary px-3 text-sm text-foreground/40"
            >
              <Search className="size-4" />
              Buscar sección…
            </button>
          )}
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto overflow-x-hidden pb-28 pt-4 sm:pb-32">
        <nav
          className="mb-6 flex justify-center px-4 sm:mb-8"
          aria-label="Grupos del menú"
        >
          <div className="flex items-center gap-1 rounded-2xl border border-border/80 bg-muted/95 px-2 py-2 shadow-lg backdrop-blur-2xl sm:gap-1.5 sm:px-3 sm:py-2.5">
            {sections.map((sec, index) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => scrollTo(index)}
                className={cn(
                  "rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-5 sm:py-2.5 sm:text-sm",
                  selectedIndex === index
                    ? "bg-primary/18 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                {sec.title}
              </button>
            ))}
          </div>
        </nav>

        {favToast ? (
          <p
            className="mx-auto mb-4 max-w-lg rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100 sm:text-sm"
            role="status"
          >
            {favToast}
          </p>
        ) : null}

        <div className="w-full min-w-0 flex-1" ref={emblaRef}>
          <div className="flex">
            {sections.map((section, sectionIndex) => {
              const items = getFilteredItems(sectionIndex)
              return (
                <div
                  key={section.id}
                  className="min-w-0 flex-[0_0_100%] px-3 sm:px-8"
                >
                  <div
                    className={cn(
                      "mx-auto grid w-full max-w-[min(100%,23.75rem)] grid-cols-4 gap-1.5 [perspective:1400px] sm:max-w-[min(100%,31.5rem)] sm:gap-3",
                      "[grid-auto-rows:5.5rem] sm:[grid-auto-rows:7.25rem]",
                    )}
                  >
                    {items.map((item) => (
                      <MenuMiniCard
                        key={item.id}
                        item={item}
                        popSlug={popSlug}
                        isFavorite={favoriteIds.includes(item.id)}
                        favoritesFull={favoritesFull}
                        dockEditing={dockEditing}
                        onNavigate={() => {
                          const to = resolveMenuHref(item, popSlug)
                          if (to) router.push(to)
                        }}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                      />
                    ))}
                  </div>
                  {items.length === 0 ? (
                    <p className="mt-16 text-center text-sm text-muted-foreground">
                      No hay ítems en {section.title} para “{searchQuery}”.
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 flex justify-center px-3 pb-4 pt-6 sm:pb-5">
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-muted/95 px-2 py-2 shadow-lg backdrop-blur-2xl sm:px-4 sm:py-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:h-9 sm:text-xs",
                dockEditing && "bg-primary/15 text-primary",
              )}
              onClick={() => setDockEditing((e) => !e)}
            >
              <Pencil className="size-3.5" />
              {dockEditing ? "Listo" : "Editar"}
            </Button>
            <div className="mx-1 h-6 w-px bg-border/80" />
            <div className="flex items-center gap-2 sm:gap-3">
              {favoriteIds.slice(0, MAX_MENU_FAVORITES).map((id) => {
                const item = getMenuItemById(id)
                if (!item) return null
                const Icon = item.icon
                const href = resolveMenuHref(item, popSlug)
                return (
                  <div key={id} className="relative">
                    {dockEditing ? (
                      <button
                        type="button"
                        aria-label={`Quitar ${item.name} del dock`}
                        className="absolute -right-1 -top-1 z-30 flex size-5 items-center justify-center rounded-full border border-rose-300/80 bg-rose-600 text-white shadow-md"
                        onClick={() => removeFavoriteFromDock(id)}
                      >
                        <Minus className="size-3" strokeWidth={2.5} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        if (dockEditing) return
                        if (href) router.push(href)
                      }}
                      className={cn(
                        "group relative flex flex-col items-center gap-1 transition-all duration-200 hover:scale-110 hover:-translate-y-1 active:scale-95",
                        dockEditing && "rootsy-dock-edit-wiggle",
                      )}
                    >
                      <div className="relative flex size-11 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-emerald-500/85 to-teal-600/90 shadow-md ring-1 ring-white/15 sm:size-12">
                        <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/25 to-transparent opacity-0 transition-all duration-500 group-hover:opacity-100" />
                        <Icon className="relative size-6 text-white drop-shadow" />
                      </div>
                      <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/85 px-2 py-1 text-[10px] font-medium text-white opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 sm:block">
                        {item.name}
                      </div>
                    </button>
                  </div>
                )
              })}
              {Array.from({
                length: Math.max(
                  0,
                  MAX_MENU_FAVORITES - favoriteIds.length,
                ),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex size-11 items-center justify-center rounded-xl border border-dashed border-foreground/15 bg-muted/30 sm:size-12"
                  aria-hidden
                />
              ))}
            </div>
          </div>
          <p className="max-w-xs text-center text-[10px] text-muted-foreground">
            Favoritos: hasta {MAX_MENU_FAVORITES}. Estrella en cada tarjeta para
            agregar; en Editar, tocá menos para quitar.
          </p>
        </div>
      </div>

      <button
        type="button"
        className="group absolute bottom-4 right-4 z-20 flex size-11 items-center justify-center rounded-full border border-border bg-muted/95 backdrop-blur-xl transition-all hover:bg-muted active:scale-95 sm:size-12"
        aria-label="Ayuda"
      >
        <HelpCircle className="size-5 text-muted-foreground group-hover:text-foreground/80" />
      </button>

      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0b0f0e] text-white",
            "[&_[data-slot=sheet-close]]:border-white/10 [&_[data-slot=sheet-close]]:text-white/75 [&_[data-slot=sheet-close]]:hover:bg-white/8 [&_[data-slot=sheet-close]]:hover:text-white",
          )}
        >
          {settingsView === "main" ? (
            <>
              <SheetHeader className="border-b border-white/[0.06] pb-4 text-left">
                <SheetTitle className="text-xl font-bold tracking-tight text-white">
                  Configuración
                </SheetTitle>
                <SheetDescription className="text-sm text-slate-400">
                  Ajustes del punto de venta
                </SheetDescription>
              </SheetHeader>
              <nav className="flex flex-1 flex-col gap-1 px-1 pb-4 pt-2">
                {CONFIG_ITEMS.map((row) => {
                  const Ic = row.icon
                  return (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => {
                        if (row.id === "personalizar") {
                          setSettingsView("wallpaper")
                          return
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-left text-white transition-colors hover:border-white/[0.08] hover:bg-white/[0.05]"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
                        <Ic className="size-5 text-emerald-200/90" />
                      </span>
                      <span className="text-sm font-semibold">{row.name}</span>
                    </button>
                  )
                })}
                <div className="mt-auto border-t border-white/[0.08] pt-4">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
                      <HelpCircle className="size-5" />
                    </span>
                    <span className="text-sm font-semibold">Necesito ayuda</span>
                  </button>
                </div>
              </nav>
            </>
          ) : (
            <>
              <SheetHeader className="space-y-3 border-b border-white/[0.06] pb-4 text-left">
                <button
                  type="button"
                  onClick={() => setSettingsView("main")}
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <ArrowLeft className="size-3.5" />
                  Volver
                </button>
                <SheetTitle className="text-xl font-bold tracking-tight text-white">
                  Personalizar negocio
                </SheetTitle>
                <SheetDescription className="text-sm text-slate-400">
                  Imagen de fondo del menú (wallpaper). Probá cómo se ve con el
                  contraste y las tarjetas.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 px-1 pb-6 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-center gap-2 border-emerald-500/35 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/18 hover:text-white"
                  onClick={() => wallpaperInputRef.current?.click()}
                >
                  <Upload className="size-4" />
                  Elegir imagen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full justify-center gap-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
                  onClick={() => {
                    resetWallpaper()
                  }}
                >
                  <RotateCcw className="size-4" />
                  Restaurar fondo predeterminado
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent
          side="right"
          className={cn(
            "flex w-full max-w-md flex-col border-l border-white/[0.08] bg-[#0b0f0e] text-white",
            "[&_[data-slot=sheet-close]]:border-white/10 [&_[data-slot=sheet-close]]:text-white/75 [&_[data-slot=sheet-close]]:hover:bg-white/8 [&_[data-slot=sheet-close]]:hover:text-white",
          )}
        >
          <SheetHeader className="border-b border-white/[0.06] pb-4 text-left">
            <SheetTitle className="text-xl font-bold tracking-tight text-white">
              Notificaciones
            </SheetTitle>
            <SheetDescription className="text-sm text-slate-400">
              Alertas y/o novedades del negocio
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-1 pb-6 pt-2">
            {SAMPLE_NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "rounded-2xl border p-4 shadow-sm",
                  n.tint === "emerald" &&
                    "border-emerald-400/25 bg-emerald-500/[0.09]",
                  n.tint === "amber" &&
                    "border-amber-400/25 bg-amber-500/[0.08]",
                  n.tint === "rose" && "border-rose-400/25 bg-rose-500/[0.08]",
                  n.tint === "sky" && "border-sky-400/25 bg-sky-500/[0.08]",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{n.title}</p>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {n.time}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  {n.body}
                </p>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
