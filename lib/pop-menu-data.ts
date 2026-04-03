import type { LucideIcon } from "lucide-react"
import {
  Activity,
  ArrowLeftRight,
  Building2,
  ChefHat,
  CreditCard,
  Factory,
  FileCheck,
  FileText,
  LayoutDashboard,
  Monitor,
  PackageSearch,
  PieChart,
  Receipt,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  UtensilsCrossed,
  Vault,
  Zap,
} from "lucide-react"

export const MAX_MENU_FAVORITES = 5

export const FAVORITES_STORAGE_KEY = "rootsy-pop-menu-favorites-v1"

export const WALLPAPER_STORAGE_KEY = "rootsy-pop-menu-wallpaper-v1"

/** Url por defecto (usuarios pueden reemplazar con archivo local en sesión o URL guardada). */
export const DEFAULT_MENU_WALLPAPER =
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920&q=80"

export type MenuBadge =
  | { kind: "count"; value: number }
  | { kind: "pill"; label: string }

export type MenuItemDef = {
  id: string
  name: string
  icon: LucideIcon
  badge?: MenuBadge
  /** Ruta relativa al pop (sin leading slash) o función */
  href?: string | ((popSlug: string) => string)
}

export type MenuSectionDef = {
  id: "operar" | "administrar" | "analizar"
  title: string
  items: MenuItemDef[]
}

export const POP_MENU_SECTIONS: MenuSectionDef[] = [
  {
    id: "operar",
    title: "Operar",
    items: [
      {
        id: "venta-rapida",
        name: "Venta rápida",
        icon: Zap,
        badge: { kind: "pill", label: "HOT" },
        href: (slug) => `/${slug}/sale`,
      },
      {
        id: "venta-salon",
        name: "Venta de salón",
        icon: UtensilsCrossed,
        href: (slug) => `/${slug}/sale`,
      },
      {
        id: "venta-mostrador",
        name: "Venta de mostrador",
        icon: Monitor,
        href: (slug) => `/${slug}/sale`,
      },
      {
        id: "comprar-mercaderia",
        name: "Comprar mercadería",
        icon: ShoppingBag,
      },
      {
        id: "control-stock",
        name: "Control de stock",
        icon: PackageSearch,
        badge: { kind: "count", value: 3 },
      },
      {
        id: "productos-preparados",
        name: "Productos preparados",
        icon: ChefHat,
      },
      {
        id: "fabricacion",
        name: "Fabricación",
        icon: Factory,
      },
      {
        id: "promociones",
        name: "Promociones",
        icon: Sparkles,
        badge: { kind: "pill", label: "NEW" },
      },
      {
        id: "cajas",
        name: "Cajas",
        icon: Vault,
        badge: { kind: "count", value: 2 },
        href: (slug) => `/${slug}/cajas`,
      },
      {
        id: "presupuestos",
        name: "Presupuestos",
        icon: FileText,
      },
    ],
  },
  {
    id: "administrar",
    title: "Administrar",
    items: [
      { id: "operaciones", name: "Operaciones", icon: Activity },
      { id: "movimientos", name: "Movimientos", icon: ArrowLeftRight },
      { id: "clientes", name: "Clientes", icon: Users },
      { id: "proveedores", name: "Proveedores", icon: Truck },
      { id: "gastos", name: "Gastos", icon: Receipt },
      { id: "cuentas-corrientes", name: "Cuentas corrientes", icon: CreditCard },
      {
        id: "cuentas-bancarias",
        name: "Cuentas bancarias",
        icon: Building2,
      },
    ],
  },
  {
    id: "analizar",
    title: "Analizar",
    items: [
      {
        id: "resumen-estadistico",
        name: "Resumen estadístico",
        icon: LayoutDashboard,
      },
      { id: "estadisticas", name: "Estadísticas", icon: PieChart },
      { id: "reportes", name: "Reportes", icon: FileCheck },
    ],
  },
]

const ITEM_MAP = new Map<string, MenuItemDef>()
for (const sec of POP_MENU_SECTIONS) {
  for (const item of sec.items) {
    ITEM_MAP.set(item.id, item)
  }
}

export function getMenuItemById(id: string): MenuItemDef | undefined {
  return ITEM_MAP.get(id)
}

export function resolveMenuHref(item: MenuItemDef, popSlug: string): string | undefined {
  if (!item.href) return undefined
  return typeof item.href === "function" ? item.href(popSlug) : `/${popSlug}/${item.href.replace(/^\//, "")}`
}
