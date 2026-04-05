"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import {
  ArrowLeft,
  Bell,
  Check,
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
  type MenuSectionDef,
  getMenuItemById,
  resolveMenuHref,
} from "@/lib/pop-menu-data"
import { cn } from "@/lib/utils"

const MENU_PAGE_SIZE = 12 /** 4×3 (desktop) — más ítems = scroll dentro del contenedor */

type MenuSlide = {
  key: string
  title: string
  items: MenuItemDef[]
}

function buildMenuSlides(sections: MenuSectionDef[]): MenuSlide[] {
  const all = sections.flatMap((s) => s.items)
  return [
    { key: "todos", title: "Todos", items: all },
    ...sections.map((s) => ({
      key: s.id,
      title: s.title,
      items: s.items,
    })),
  ]
}

/**
 * Bloque del menú dentro de la fila: ancho completo hasta máx. 568px centrado.
 * La grilla va dentro (3 cols móvil · 4 cols desktop, filas automáticas).
 */
const MENU_GRID_BLOCK =
  "mx-auto w-full min-w-0 max-w-[min(100%,568px)]"

/** Máscara overlay fila menú: franja superior (px); inferior más ancha para fundir con el dock. */
const MENU_ROW_OVERLAY_TOP_FADE_PX = 12
const MENU_ROW_OVERLAY_BOTTOM_FADE_PX = 32

/**
 * Máscara del bloque foto+velo encima del grid: #000 = capa visible, transparent = “agujero”.
 * Centro transparente; borde superior e inferior con anchos propios (abajo más suave hacia el dock).
 */
function menuRowOverlayMaskStyleLocal(): CSSProperties {
  const top = MENU_ROW_OVERLAY_TOP_FADE_PX
  const bottom = MENU_ROW_OVERLAY_BOTTOM_FADE_PX
  /** Alpha: opaco en máscara = mostrar capa; transparente = no pintar (centro “hueco”). */
  const grad = `linear-gradient(to bottom, #000 0px, transparent ${top}px, transparent calc(100% - ${bottom}px), #000 100%)`

  return {
    maskImage: grad,
    WebkitMaskImage: grad,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskMode: "alpha",
  }
}

/** Wallpaper alineado al viewport (evita desfase entre capas con object-cover en cajas distintas). */
function popMenuWallpaperFixedStyle(wallpaperSrc: string): CSSProperties {
  return {
    backgroundImage: `url(${JSON.stringify(wallpaperSrc)})`,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundAttachment: "fixed",
    backgroundRepeat: "no-repeat",
  }
}

/**
 * Saturación de la foto (misma en fondo de página, panel y overlay enmascarado).
 * 0.62 calma el color para que no compita con la UI.
 */
const POP_MENU_WALLPAPER_SATURATE = 0.62

/** Velo #000 al 80% sobre la foto (página, panel y overlay enmascarado). */
const POP_MENU_WALLPAPER_SCRIM_OPACITY_CLASS = "bg-black/80"

/** Imagen (desaturada) + velo (mismo stack en página, panel y overlay enmascarado). */
function PopMenuWallpaperWithScrim({ wallpaperSrc }: { wallpaperSrc: string }) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          ...popMenuWallpaperFixedStyle(wallpaperSrc),
          filter: `saturate(${POP_MENU_WALLPAPER_SATURATE})`,
        }}
      />
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-[1]",
          POP_MENU_WALLPAPER_SCRIM_OPACITY_CLASS,
        )}
      />
    </>
  )
}

/** Fondo del panel POP: wallpaper + velo. */
function PopMenuPanelSurfaceLayers({
  wallpaperSrc,
}: {
  wallpaperSrc: string
}) {
  return <PopMenuWallpaperWithScrim wallpaperSrc={wallpaperSrc} />
}

/** Fondo global de página: wallpaper + velo (viewport-fixed en la capa imagen). */
function PopMenuViewportBackgroundLayers({
  wallpaperSrc,
}: {
  wallpaperSrc: string
}) {
  return (
    <div className="pointer-events-none relative size-full min-h-0 min-w-0">
      <PopMenuWallpaperWithScrim wallpaperSrc={wallpaperSrc} />
    </div>
  )
}

/** Overlay recortado: mismo stack que el fondo global. */
function PopMenuRowOverlayBackground({ wallpaperSrc }: { wallpaperSrc: string }) {
  return (
    <div className="pointer-events-none relative size-full min-h-0 min-w-0">
      <PopMenuWallpaperWithScrim wallpaperSrc={wallpaperSrc} />
    </div>
  )
}

function MenuGridScrollArea({
  needsScroll,
  slideTitle,
  children,
}: {
  needsScroll: boolean
  slideTitle: string
  children: ReactNode
}) {
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [barVisible, setBarVisible] = useState(false)

  const flashScrollbar = useCallback(() => {
    setBarVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setBarVisible(false), 950)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  if (!needsScroll) {
    return (
      <div
        className={cn(
          "mx-auto w-full pb-8 pt-2.5 sm:pb-10 sm:pt-2.5",
          MENU_GRID_BLOCK,
        )}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative mx-auto flex min-h-0 w-full min-w-0 flex-1 basis-0 flex-col",
        MENU_GRID_BLOCK,
      )}
    >
      <div
        onScroll={flashScrollbar}
        className={cn(
          "rootsy-menu-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip overscroll-y-contain scroll-smooth",
          barVisible && "rootsy-menu-scroll--active",
        )}
        role="region"
        aria-label={`${slideTitle}: desplazá para ver más accesos`}
      >
        {/* px-2: aire lateral cuando el scrollbar corre el contenido (p. ej. tab Todos) */}
        <div className="px-2 pb-8 pt-2.5 sm:pb-10 sm:pt-2.5">
          {children}
        </div>
      </div>
    </div>
  )
}

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
  const Icon = item.icon
  const href = resolveMenuHref(item, popSlug)
  const shortLabel = item.tileLabel ?? item.name
  const fullLabel = item.name
  const labelHoverSwap = shortLabel !== fullLabel

  /** Base tipográfica del rótulo; sombra suave estilo HUD / card gaming. */
  const labelTileClass =
    "text-pretty text-left text-xs font-semibold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] sm:text-sm"
  const labelLeadingShort = "leading-snug"
  const labelLeadingFull = "leading-[1.15] sm:leading-tight"

  return (
    <div className="relative h-full w-full rounded-2xl hover:z-20">
      <div className="relative h-full rounded-2xl">
        <button
          type="button"
          onClick={onNavigate}
          title={labelHoverSwap ? fullLabel : undefined}
          className={cn(
            "group/menu-tile relative z-0 grid h-full min-h-0 w-full grid-cols-2 grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-[rgb(20_25_22_/0.72)] via-[rgb(17_22_20_/0.66)] to-[rgb(14_18_16_/0.6)] p-2.5 text-left backdrop-blur-[2px] sm:p-3",
            "shadow-[0_12px_32px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_0_rgba(255,255,255,0.06),inset_0_-1px_0_0_rgba(0,0,0,0.26)]",
            "transition-[transform,box-shadow,background-color,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            "hover:border-white/16 hover:from-[rgb(22_28_24_/0.78)] hover:via-[rgb(18_24_21_/0.72)] hover:to-[rgb(15_20_17_/0.66)]",
            "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_24px_-10px_rgba(52,211,153,0.09),0_22px_44px_-16px_rgba(0,0,0,0.72)]",
            "sm:hover:-translate-y-0.5 sm:hover:scale-[1.042]",
            "active:scale-[0.98] active:translate-y-0",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a09]",
            "motion-reduce:transition-colors motion-reduce:sm:hover:scale-100 motion-reduce:sm:hover:translate-y-0 motion-reduce:hover:shadow-[0_12px_32px_-14px_rgba(0,0,0,0.75)]",
          )}
        >
          {/* Luz ambiental + viñeta tipo “gaming card” */}
          <div
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
            aria-hidden
          >
            <div
              className={cn(
                "absolute -left-1/3 -top-2/3 h-[140%] w-[85%] rounded-full bg-white/[0.035] motion-reduce:opacity-90",
                "blur-3xl motion-reduce:blur-none",
                "transition-[opacity,background-color] duration-300 group-hover/menu-tile:bg-emerald-400/[0.05] group-hover/menu-tile:opacity-100",
              )}
            />
            <div
              className={cn(
                "absolute -bottom-1/4 -right-1/4 h-3/5 w-3/5 rounded-full bg-white/[0.025] blur-2xl motion-reduce:blur-none",
                "opacity-0 transition-opacity duration-300 group-hover/menu-tile:opacity-100",
              )}
            />
            <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-45 group-hover/menu-tile:via-emerald-400/12 motion-reduce:opacity-30" />
          </div>

          {/* Borde superior “iluminado” tipo highlight de tile seleccionada (PS5 / Xbox) */}
          <div
            className="pointer-events-none absolute inset-x-2.5 top-0 z-[2] h-px rounded-full bg-linear-to-r from-transparent via-white/55 to-transparent opacity-0 transition-opacity duration-300 group-hover/menu-tile:opacity-100 motion-reduce:opacity-0"
            aria-hidden
          />

          <div className="relative z-[1] justify-self-start">
            {/* Bloom detrás del ícono */}
            <div
              className={cn(
                "pointer-events-none absolute left-1/2 top-1/2 -z-10 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.10] motion-reduce:opacity-75",
                "blur-md motion-reduce:blur-sm",
                "transition-[opacity,transform,filter] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/menu-tile:bg-emerald-400/[0.14] group-hover/menu-tile:opacity-100 group-hover/menu-tile:blur-lg sm:size-10",
              )}
              aria-hidden
            />
            <div
              className={cn(
                "relative flex size-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-white/[0.14] to-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_6px_16px_-4px_rgba(0,0,0,0.72)] ring-1 ring-white/12 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] sm:size-9",
                "sm:group-hover/menu-tile:scale-110 sm:group-hover/menu-tile:shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_0_16px_-4px_rgba(52,211,153,0.18),0_8px_20px_-6px_rgba(0,0,0,0.82)]",
                "sm:group-hover/menu-tile:ring-emerald-400/12",
                "motion-reduce:sm:group-hover/menu-tile:scale-100",
              )}
            >
              <Icon
                className="size-4 text-emerald-100/95 drop-shadow-[0_0_5px_rgba(52,211,153,0.22)] transition-[filter,transform] duration-300 sm:group-hover/menu-tile:scale-110 sm:group-hover/menu-tile:drop-shadow-[0_0_8px_rgba(110,231,183,0.32)] motion-reduce:sm:group-hover/menu-tile:scale-100"
                aria-hidden
              />
            </div>
          </div>
          <div className="relative z-[1] flex min-h-5 min-w-0 shrink-0 flex-col items-end justify-self-end gap-1">
            {item.badge?.kind === "count" ? (
              <span
                className="flex min-h-5 min-w-5 items-center justify-center rounded-full border border-white/20 bg-black/50 px-1 text-[9px] font-bold tabular-nums text-white shadow-[0_0_12px_rgba(255,255,255,0.08)] ring-1 ring-white/10"
                aria-label={`${item.badge.value} avisos`}
              >
                {item.badge.value}
              </span>
            ) : null}
            {item.badge?.kind === "pill" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white shadow-lg ring-1",
                  item.badge.label === "HOT"
                    ? "border border-amber-400/35 bg-linear-to-b from-amber-600/85 to-amber-800/90 shadow-md shadow-amber-950/20 ring-amber-200/15"
                    : "border border-emerald-400/30 bg-linear-to-b from-emerald-600/75 to-emerald-900/85 shadow-md shadow-emerald-950/25 ring-emerald-200/12",
                )}
              >
                {item.badge.label}
              </span>
            ) : null}
          </div>

          <div className="relative z-[1] col-span-2 row-start-2 flex min-h-0 w-full flex-col justify-end self-stretch pt-2">
            {labelHoverSwap ? (
              <div className="relative isolate h-[2.5rem] w-full sm:h-[2.75rem]">
                <p
                  className={cn(
                    labelTileClass,
                    labelLeadingShort,
                    "absolute bottom-0 left-0 right-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
                    "group-hover/menu-tile:pointer-events-none group-hover/menu-tile:opacity-0",
                    "motion-reduce:opacity-100 motion-reduce:group-hover/menu-tile:opacity-100",
                  )}
                  lang="es"
                  aria-hidden
                >
                  {shortLabel}
                </p>
                <p
                  className={cn(
                    labelTileClass,
                    labelLeadingFull,
                    "absolute bottom-0 left-0 right-0 opacity-0 transition-opacity duration-200 ease-out motion-reduce:transition-none",
                    "group-hover/menu-tile:opacity-100 motion-reduce:hidden",
                  )}
                  lang="es"
                  aria-hidden
                >
                  {fullLabel}
                </p>
              </div>
            ) : (
              <div className="relative h-[2.5rem] w-full sm:h-[2.75rem]">
                <p
                  className={cn(
                    labelTileClass,
                    labelLeadingShort,
                    "absolute bottom-0 left-0 right-0",
                  )}
                  lang="es"
                >
                  {fullLabel}
                </p>
              </div>
            )}
          </div>

          {href ? (
            <span className="sr-only">Abrir {fullLabel}</span>
          ) : (
            <span className="sr-only">{fullLabel} (próximamente)</span>
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
  const containerRef = useRef<HTMLDivElement>(null)
  const wallpaperInputRef = useRef<HTMLInputElement>(null)
  const menuSearchInputDesktopRef = useRef<HTMLInputElement>(null)
  const menuSearchInputMobileRef = useRef<HTMLInputElement>(null)
  const menuButtonsRowRef = useRef<HTMLDivElement>(null)

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

  const menuSlides = useMemo(() => buildMenuSlides(POP_MENU_SECTIONS), [])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    /** "start": cada slide ocupa 100% del viewport; "center" en móvil suele desplazar/peek y recorta bordes. */
    align: "start",
    containScroll: "trimSnaps",
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

  /** Tab activa antes de buscar; al haber texto se usa "Todos" (búsqueda global) y al vaciar se restaura. */
  const preSearchSlideIndexRef = useRef(0)
  const prevSearchTrimmedRef = useRef("")

  useEffect(() => {
    const q = searchQuery.trim()
    const prevTrimmed = prevSearchTrimmedRef.current

    if (q) {
      if (prevTrimmed === "") {
        preSearchSlideIndexRef.current = selectedIndex
      }
      scrollTo(0)
    } else if (prevTrimmed !== "") {
      scrollTo(preSearchSlideIndexRef.current)
    }

    prevSearchTrimmedRef.current = q
  }, [searchQuery, scrollTo, selectedIndex])

  useEffect(() => {
    setFavoriteIds(loadFavoriteIds())
    const w = loadWallpaperUrl()
    if (w) setWallpaperSrc(w)
    setFavoritesHydrated(true)
  }, [])

  useEffect(() => {
    if (!favoritesHydrated) return
    saveFavoriteIds(favoriteIds)
  }, [favoriteIds, favoritesHydrated])

  useEffect(() => {
    if (!settingsOpen) setSettingsView("main")
  }, [settingsOpen])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "F1") return
      if (settingsOpen || notificationsOpen) return

      const target = e.target
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        if (!target.hasAttribute("data-pop-menu-search")) return
      }

      e.preventDefault()
      setShowSearch((open) => !open)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [notificationsOpen, settingsOpen])

  useLayoutEffect(() => {
    if (!showSearch) return
    const mq = window.matchMedia("(min-width: 768px)")
    const el = mq.matches
      ? menuSearchInputDesktopRef.current
      : menuSearchInputMobileRef.current
    queueMicrotask(() => el?.focus())
  }, [showSearch])

  const getSlideItems = useCallback(
    (slideIndex: number) => {
      const slide = menuSlides[slideIndex]
      if (!slide) return []
      const q = searchQuery.trim().toLowerCase()
      if (!q) return slide.items
      return slide.items.filter((item) => {
        const n = item.name.toLowerCase()
        const t = item.tileLabel?.toLowerCase() ?? ""
        return n.includes(q) || (t !== "" && t.includes(q))
      })
    },
    [menuSlides, searchQuery],
  )

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      if (prev.includes(id)) {
        setFavToast(null)
        return prev.filter((x) => x !== id)
      }
      if (prev.length >= MAX_MENU_FAVORITES) {
        setFavToast(
          "Máximo 5 favoritos. Elimina uno desde Editar, o con la estrella del botón.",
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
      className="fixed inset-0 max-w-[100dvw] overflow-x-clip overflow-y-hidden bg-black"
    >
      <input
        ref={wallpaperInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleWallpaperFile(e.target.files)}
      />

      {/* Fondo pantalla completo (100% × 100%) */}
      <div className="pointer-events-none absolute inset-0 z-0 size-full min-h-0 min-w-0">
        <PopMenuViewportBackgroundLayers wallpaperSrc={wallpaperSrc} />
      </div>

      {/* Grid: fila 1 = header · fila 2 = resto del viewport (panel + subgrid) */}
      <div className="relative z-10 grid h-full max-h-dvh min-h-0 w-full min-w-0 max-w-[100dvw] grid-rows-[auto_minmax(0,1fr)]">
      <header
        className="relative z-20 shrink-0 border-b border-rootsy-hairline backdrop-blur-2xl backdrop-saturate-110"
        style={{
          background:
            "linear-gradient(to bottom, rgb(255 255 255 / 0.1), rgb(12 15 14 / 0.24))",
        }}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4 sm:px-8 sm:py-5 md:grid md:grid-cols-3 md:items-center md:justify-items-stretch md:gap-2 lg:gap-3">
          <div className="flex min-w-0 items-center justify-self-stretch gap-2 sm:gap-4 lg:gap-6">
            <Link
              href="/"
              className="group flex size-11 shrink-0 items-center justify-center rounded-xl border border-foreground/[0.06] bg-secondary transition-all hover:border-foreground/[0.12] hover:bg-muted active:scale-95 sm:size-12"
            >
              <Home className="size-5 text-foreground/50 transition-colors group-hover:text-foreground/80" />
            </Link>

            <div className="hidden h-6 w-px shrink-0 bg-border sm:block" />

            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <div className="size-11 shrink-0 overflow-hidden rounded-2xl ring-1 ring-border sm:size-14">
                <img
                  src="https://api.dicebear.com/7.x/shapes/svg?seed=store1&backgroundColor=1a1f1d"
                  alt="Logo sucursal"
                  className="size-full object-cover"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-bold tracking-tight text-foreground sm:text-base">
                  Sucursal Centro
                </span>
                <span
                  className="hidden min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground sm:flex"
                  title="Av. Principal 1234, Buenos Aires"
                >
                  <MapPin className="size-3.5 shrink-0" />
                  <span className="truncate">
                    Av. Principal 1234, Buenos Aires
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="hidden min-w-0 w-full flex-col justify-center md:flex md:px-1">
            {showSearch ? (
              <div className="relative w-full animate-in zoom-in-95 duration-200">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/30" />
                <input
                  ref={menuSearchInputDesktopRef}
                  type="search"
                  data-pop-menu-search
                  placeholder="Buscar sección…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-full border border-border bg-secondary py-0 pl-11 pr-10 text-sm text-foreground transition-all placeholder:text-foreground/30 focus:border-foreground/20 focus:bg-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
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
                aria-keyshortcuts="F1"
                title="Buscar secciones (F1)"
              >
                <Search className="size-4 text-foreground/30 group-hover:text-foreground/50" />
                <span className="flex-1 text-left text-sm text-foreground/30">
                  Buscar sección…
                </span>
                <kbd className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[10px] text-foreground/25">
                  F1
                </kbd>
              </button>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-3 lg:gap-6">
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

            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
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
              <div className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-sm font-semibold text-foreground">
                  María García
                </span>
                <span className="truncate text-[10px] font-semibold uppercase tracking-wider text-meadow">
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
                ref={menuSearchInputMobileRef}
                type="search"
                data-pop-menu-search
                placeholder="Buscar sección…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-full border border-border bg-secondary py-0 pl-10 pr-10 text-sm focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-ms-clear]:hidden"
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
              aria-keyshortcuts="F1"
              title="Buscar secciones (F1)"
            >
              <Search className="size-4" />
              Buscar sección…
            </button>
          )}
        </div>
      </header>

      <div className="rootsy-pop-menu-panel relative flex h-full min-h-0 w-full min-w-0 max-w-[100dvw] flex-col overflow-x-clip overflow-y-hidden">
        {/* Solo wallpaper en el panel */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden
        >
          <PopMenuPanelSurfaceLayers wallpaperSrc={wallpaperSrc} />
        </div>

        {/* Subgrid: tabs (alto contenido) · grid menú (1fr, scroll) · dock (alto contenido) */}
        <div className="relative z-[1] grid min-h-0 min-w-0 w-full max-w-full flex-1 grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="relative z-10 shrink-0 p-4">
            <nav
              className="flex w-full min-w-0 max-w-full justify-center"
              aria-label="Vista del menú: todos los accesos o por grupo"
            >
              <div className="flex w-full min-w-0 max-w-full flex-wrap items-center justify-center gap-0.5 rounded-2xl border border-border/80 bg-muted/45 px-1.5 py-1 shadow-lg backdrop-blur-2xl sm:w-auto sm:flex-nowrap sm:gap-1 sm:px-2 sm:py-1.5">
                {menuSlides.map((slide, index) => (
                  <button
                    key={slide.key}
                    type="button"
                    onClick={() => scrollTo(index)}
                    className={cn(
                      "rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:px-3.5 sm:py-2 sm:text-sm",
                      selectedIndex === index
                        ? "bg-primary/18 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    {slide.title}
                  </button>
                ))}
              </div>
            </nav>

            {favToast ? (
              <p
                className="mx-auto mt-3 max-w-lg rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-100 sm:text-sm"
                role="status"
              >
                {favToast}
              </p>
            ) : null}
          </div>

          <div
            ref={menuButtonsRowRef}
            className="relative min-h-0 min-w-0 max-w-full overflow-hidden"
          >
            <div
              className="pointer-events-none absolute inset-0 z-[15] overflow-hidden"
              style={menuRowOverlayMaskStyleLocal()}
              aria-hidden
            >
              <PopMenuRowOverlayBackground wallpaperSrc={wallpaperSrc} />
            </div>
            {/* Grid por debajo del overlay (mismos toques; overlay solo visual) */}
            <div
              className="relative z-10 h-full min-h-0 w-full min-w-0 max-w-full overflow-x-clip"
              ref={emblaRef}
            >
              <div className="flex h-full min-h-0 w-full min-w-0 max-w-full">
                {menuSlides.map((slide, slideIndex) => {
                  const items = getSlideItems(slideIndex)
                  const needsScroll = items.length > MENU_PAGE_SIZE
                  return (
                    <div
                      key={slide.key}
                      className="box-border flex h-full min-h-0 min-w-0 max-w-full flex-[0_0_100%] flex-shrink-0 flex-col overflow-x-clip px-4 sm:px-10 md:px-11"
                    >
                      <MenuGridScrollArea
                        needsScroll={needsScroll}
                        slideTitle={slide.title}
                      >
                        <div className="min-w-0 w-full sm:px-1 md:px-1.5">
                          <div className="grid w-full min-w-0 grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-3">
                            {items.map((item) => (
                              <div
                                key={item.id}
                                className="aspect-square min-h-0 w-full min-w-0"
                              >
                                <MenuMiniCard
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
                              </div>
                            ))}
                          </div>
                        </div>
                      </MenuGridScrollArea>
                      {items.length === 0 ? (
                        <p className="mt-16 text-center text-sm text-muted-foreground">
                          No hay ítems en {slide.title}
                          {searchQuery.trim()
                            ? ` para “${searchQuery}”.`
                            : "."}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Dock: solo 2 hijos directos — capa de fondo + barra de controles */}
          <div className="relative z-20 shrink-0">
            <div
              className="pointer-events-none absolute inset-0 -z-10"
              aria-hidden
            />
            <div className="pointer-events-none flex flex-col items-center px-3 pb-4 pt-3 sm:pb-5">
              <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border/80 bg-muted/95 px-2 py-2 shadow-lg backdrop-blur-2xl sm:px-4 sm:py-2.5">
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
                  <span className="sr-only sm:hidden">
                    {dockEditing ? "Listo" : "Editar favoritos del dock"}
                  </span>
                  {dockEditing ? (
                    <>
                      <Check className="size-3.5 sm:hidden" aria-hidden />
                      <Pencil
                        className="hidden size-3.5 sm:block"
                        aria-hidden
                      />
                    </>
                  ) : (
                    <Pencil className="size-3.5" aria-hidden />
                  )}
                  <span className="hidden sm:inline">
                    {dockEditing ? "Listo" : "Editar"}
                  </span>
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
            </div>
          </div>
        </div>
      </div>
      </div>

      <button
        type="button"
        className="group absolute bottom-4 right-4 z-30 hidden size-12 items-center justify-center rounded-full border border-border bg-muted/95 backdrop-blur-xl transition-all hover:bg-muted active:scale-95 sm:flex"
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
