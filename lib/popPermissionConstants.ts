export const POP_PERMS = {
  HR_READ: { resource: "hr", action: "read" },
  SALE_READ: { resource: "sale", action: "read" },
  ARTICLE_READ: { resource: "articles", action: "read" },
  ARTICLE_CREATE: { resource: "articles", action: "create" },
  ARTICLE_UPDATE: { resource: "articles", action: "update" },
  ARTICLE_DELETE: { resource: "articles", action: "delete" },

  ACCOUNTING_READ: { resource: "accounting", action: "read" },
  ACCOUNTING_CREATE: { resource: "accounting", action: "create" },
  ACCOUNTING_UPDATE: { resource: "accounting", action: "update" },
  ACCOUNTING_DELETE: { resource: "accounting", action: "delete" },

  ACCOUNTS_READ: { resource: "accounts", action: "read" },
  ACCOUNTS_CREATE: { resource: "accounts", action: "create" },
  ACCOUNTS_UPDATE: { resource: "accounts", action: "update" },
  ACCOUNTS_DELETE: { resource: "accounts", action: "delete" },

  CLIENT_READ: { resource: "clients", action: "read" },
  CLIENT_CREATE: { resource: "clients", action: "create" },
  CLIENT_UPDATE: { resource: "clients", action: "update" },
  CLIENT_DELETE: { resource: "clients", action: "delete" },

  PAYMENT_METHOD_READ: { resource: "payment_methods", action: "read" },
  PAYMENT_METHOD_CREATE: { resource: "payment_methods", action: "create" },
  PAYMENT_METHOD_UPDATE: { resource: "payment_methods", action: "update" },
  PAYMENT_METHOD_DELETE: { resource: "payment_methods", action: "delete" },

  CASH_REGISTER_READ: { resource: "cash_registers", action: "read" },
  CASH_REGISTER_CREATE: { resource: "cash_registers", action: "create" },
  CASH_REGISTER_UPDATE: { resource: "cash_registers", action: "update" },
  CASH_REGISTER_DELETE: { resource: "cash_registers", action: "delete" },
} as const

export function permissionKeysInclude(
  keys: readonly string[],
  resource: string,
  action: string,
): boolean {
  return keys.includes(`${resource}:${action}`)
}

export function permissionRowToKey(row: unknown): string | null {
  if (row == null) return null
  if (typeof row === "string") {
    const t = row.trim()
    return t.includes(":") ? t : null
  }
  if (Array.isArray(row) && row.length >= 2) {
    const a = row[0]
    const b = row[1]
    if (typeof a === "string" && typeof b === "string") return `${a}:${b}`
  }
  if (typeof row === "object") {
    const o = row as Record<string, unknown>
    const r = o.resource ?? o.Resource
    const act = o.action ?? o.Action
    if (typeof r === "string" && typeof act === "string") return `${r}:${act}`
  }
  return null
}

export function permissionRowsToKeys(data: unknown): string[] {
  if (!Array.isArray(data)) return []
  const out: string[] = []
  for (const row of data) {
    const k = permissionRowToKey(row)
    if (k) out.push(k)
  }
  return out
}
