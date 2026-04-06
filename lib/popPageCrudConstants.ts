export type PopPagePermissionMap = Record<string, string>

export type PopPageDefinition = {
  readonly path: string
  readonly permissions: PopPagePermissionMap
}

export const POP_PAGES = {
  accounting: {
    path: "accounting",
    permissions: {
      read: "accounting:read",
      create: "accounting:create",
      update: "accounting:update",
      delete: "accounting:delete",
    },
  },
  articles: {
    path: "articles",
    permissions: {
      read: "articles:read",
      create: "articles:create",
      update: "articles:update",
      delete: "articles:delete",
    },
  },
  "cash-registers": {
    path: "cash-registers",
    permissions: {
      read: "cash_registers:read",
      create: "cash_registers:create",
      update: "cash_registers:update",
      delete: "cash_registers:delete",
    },
  },
  clients: {
    path: "clients",
    permissions: {
      read: "clients:read",
      create: "clients:create",
      update: "clients:update",
      delete: "clients:delete",
    },
  },
  hr: {
    path: "hr",
    permissions: {
      read: "hr:read",
      create: "hr:create",
      update: "hr:update",
      delete: "hr:delete",
    },
  },
  inventory: {
    path: "inventory",
    permissions: {
      read: "inventory:read",
      create: "inventory:create",
      update: "inventory:update",
      delete: "inventory:delete",
    },
  },
  invoices: {
    path: "invoices",
    permissions: {
      read: "invoices:read",
      create: "invoices:create",
      update: "invoices:update",
      delete: "invoices:delete",
    },
  },
  menu: {
    path: "menu",
    permissions: {
      read: "menu:read",
      create: "menu:create",
      update: "menu:update",
      delete: "menu:delete",
    },
  },
  "menu/docs": {
    path: "menu/docs",
    permissions: {
      read: "menu:read",
      create: "menu:create",
      update: "menu:update",
      delete: "menu:delete",
    },
  },
  operations: {
    path: "operations",
    permissions: {
      read: "operations:read",
      create: "operations:create",
      update: "operations:update",
      delete: "operations:delete",
    },
  },
  "payment-methods": {
    path: "payment-methods",
    permissions: {
      read: "payment_methods:read",
      create: "payment_methods:create",
      update: "payment_methods:update",
      delete: "payment_methods:delete",
    },
  },
  printers: {
    path: "printers",
    permissions: {
      read: "printers:read",
      create: "printers:create",
      update: "printers:update",
      delete: "printers:delete",
    },
  },
  sale: {
    path: "sale",
    permissions: {
      read: "sale:read",
      create: "sale:create",
      update: "sale:update",
      delete: "sale:delete",
    },
  },
  settings: {
    path: "settings",
    permissions: {
      read: "settings:read",
      create: "settings:create",
      update: "settings:update",
      delete: "settings:delete",
    },
  },
  suppliers: {
    path: "suppliers",
    permissions: {
      read: "suppliers:read",
      create: "suppliers:create",
      update: "suppliers:update",
      delete: "suppliers:delete",
    },
  },
} as const satisfies Record<string, PopPageDefinition>

export type PopPageKey = keyof typeof POP_PAGES

export const POP_PAGE_KEYS = Object.keys(POP_PAGES) as PopPageKey[]

export function permissionKeysForPage(key: PopPageKey): string[] {
  return Object.values(POP_PAGES[key].permissions)
}

export function allUniquePermissionKeys(): string[] {
  const set = new Set<string>()
  for (const k of POP_PAGE_KEYS) {
    for (const p of permissionKeysForPage(k)) set.add(p)
  }
  return [...set]
}

export function permissionByLabel(
  pageKey: PopPageKey,
  label: string,
): string | undefined {
  const map = POP_PAGES[pageKey].permissions as PopPagePermissionMap
  return map[label]
}
