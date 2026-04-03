import {
  FAVORITES_STORAGE_KEY,
  MAX_MENU_FAVORITES,
  WALLPAPER_STORAGE_KEY,
  getMenuItemById,
} from "@/lib/pop-menu-data"

const DEFAULT_IDS = [
  "venta-rapida",
  "cajas",
  "control-stock",
  "clientes",
  "resumen-estadistico",
] as const

export function loadFavoriteIds(): string[] {
  if (typeof window === "undefined") return [...DEFAULT_IDS]
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!raw) return [...DEFAULT_IDS]
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [...DEFAULT_IDS]
    const cleaned = parsed
      .filter(
        (x): x is string =>
          typeof x === "string" && getMenuItemById(x) !== undefined,
      )
      .slice(0, MAX_MENU_FAVORITES)
    return cleaned.length ? cleaned : [...DEFAULT_IDS]
  } catch {
    return [...DEFAULT_IDS]
  }
}

export function saveFavoriteIds(ids: string[]): void {
  if (typeof window === "undefined") return
  const unique = [
    ...new Set(ids.filter((id) => getMenuItemById(id) !== undefined)),
  ].slice(0, MAX_MENU_FAVORITES)
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(unique))
}

export function loadWallpaperUrl(): string | null {
  if (typeof window === "undefined") return null
  try {
    const u = localStorage.getItem(WALLPAPER_STORAGE_KEY)
    return u && (u.startsWith("http") || u.startsWith("data:")) ? u : null
  } catch {
    return null
  }
}

export function saveWallpaperUrl(url: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem(WALLPAPER_STORAGE_KEY, url)
}

export function clearWallpaperUrl(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(WALLPAPER_STORAGE_KEY)
}
