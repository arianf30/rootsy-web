import { permissionKeysInclude } from "@/lib/popPermissionConstants"

export function getMenuResourceAction(
  _menuLabel: string,
  menuLink?: string,
): { resource: string; action: string } | null {
  if (!menuLink) return null
  if (menuLink === "section") return null
  if (menuLink === "sale") return { resource: "sale", action: "read" }
  if (menuLink === "operations")
    return { resource: "sale", action: "read" }
  if (menuLink === "settings") return { resource: "settings", action: "read" }
  if (menuLink === "hr") return { resource: "hr", action: "read" }
  if (menuLink === "articles") return { resource: "articles", action: "read" }
  if (menuLink === "clients") return { resource: "clients", action: "read" }
  if (menuLink === "payment-methods")
    return { resource: "payment_methods", action: "read" }
  if (menuLink === "printers") return { resource: "printers", action: "read" }
  if (menuLink === "accounting")
    return { resource: "accounts", action: "read" }
  if (menuLink === "cash-registers")
    return { resource: "cash_registers", action: "read" }
  if (menuLink === "inventory")
    return { resource: "inventory", action: "read" }
  return null
}

export function canAccessMenuItem(
  permissionKeys: readonly string[],
  menuLink?: string,
): boolean {
  const perm = getMenuResourceAction("", menuLink)
  if (!perm) return true
  return permissionKeysInclude(permissionKeys, perm.resource, perm.action)
}
