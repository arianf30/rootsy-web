import { allUniquePermissionKeys } from "@/lib/popPageCrudConstants"

export type HrPermissionCatalogRow = {
  key: string
  resource: string
  action: string
  description: string | null
}

function splitGrantKey(key: string): { resource: string; action: string } {
  const i = key.indexOf(":")
  if (i <= 0) return { resource: key, action: "" }
  return { resource: key.slice(0, i), action: key.slice(i + 1) }
}

export function buildHrPermissionCatalogRows(): HrPermissionCatalogRow[] {
  return allUniquePermissionKeys().map((key) => {
    const { resource, action } = splitGrantKey(key)
    return { key, resource, action, description: null }
  })
}
