import { DEFAULT_SALE_SITE_ID } from "@/lib/saleInvoiceTypes"

export function siteIdFromPopSettings(settings: unknown): string {
  if (settings == null || typeof settings !== "object") {
    return DEFAULT_SALE_SITE_ID
  }
  const s = settings as Record<string, unknown>
  const v = s.site_id
  if (typeof v === "string" && v.trim()) return v.trim()
  return DEFAULT_SALE_SITE_ID
}

export function siteIdFromPopRow(row: {
  site_id?: string | null
  settings?: unknown
}): string {
  const col = row.site_id
  if (typeof col === "string" && col.trim()) return col.trim()
  return siteIdFromPopSettings(row.settings)
}

export function popScopedHref(
  siteId: string,
  popId: string,
  pathname: string,
): string {
  const p = pathname.startsWith("/") ? pathname.slice(1) : pathname
  return `/${siteId}/${popId}/${p}`
}

export function popMenuHref(siteId: string, popId: string): string {
  return popScopedHref(siteId, popId, "menu")
}
