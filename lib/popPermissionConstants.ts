export const POP_PERMS = {
  HR_READ: { resource: "hr", action: "read" },
  ARTICLE_READ: { resource: "articles", action: "read" },
  ARTICLE_CREATE: { resource: "articles", action: "create" },
  ARTICLE_UPDATE: { resource: "articles", action: "update" },
  ARTICLE_DELETE: { resource: "articles", action: "delete" },
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
