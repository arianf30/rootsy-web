import {
  FAVORITES_STORAGE_KEY,
  MAX_MENU_FAVORITES,
  WALLPAPER_STORAGE_KEY,
  getMenuItemById,
} from "@/lib/pop-menu-data"

/** Solo ítems con `href` en datos (sale/cajas) para que F2–F6 naveguen al cargar. */
const DEFAULT_IDS = [
  "venta-rapida",
  "cajas",
  "venta-salon",
  "venta-mostrador",
] as const

function itemHasNavigableHref(id: string): boolean {
  const item = getMenuItemById(id)
  return Boolean(item?.href)
}

/**
 * Favoritos persistidos, reordenados para **priorizar entradas con `href`**
 * (si no, F2–F6 y el click del dock no pueden navegar).
 */
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

    const base = cleaned.length ? cleaned : [...DEFAULT_IDS]
    const seen = new Set<string>()
    const out: string[] = []

    for (const id of base) {
      if (out.length >= MAX_MENU_FAVORITES) break
      if (!itemHasNavigableHref(id)) continue
      if (seen.has(id)) continue
      seen.add(id)
      out.push(id)
    }
    for (const id of DEFAULT_IDS) {
      if (out.length >= MAX_MENU_FAVORITES) break
      if (!itemHasNavigableHref(id)) continue
      if (seen.has(id)) continue
      seen.add(id)
      out.push(id)
    }

    const result = out.length ? out : [...DEFAULT_IDS]
    if (JSON.stringify(result) !== JSON.stringify(base)) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(result))
    }
    return result
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
