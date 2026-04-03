export const POP_PERMS = {
  HR_READ: { resource: "hr", action: "read" },
} as const

export function permissionKeysInclude(
  keys: readonly string[],
  resource: string,
  action: string,
): boolean {
  return keys.includes(`${resource}:${action}`)
}
