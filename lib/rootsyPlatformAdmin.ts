export const ROOTSY_PLATFORM_ADMIN_USER_ID =
  "fb98be09-be06-4b81-bf50-339b78570783" as const

export function isRootsyPlatformAdmin(userId: string | undefined | null): boolean {
  return userId === ROOTSY_PLATFORM_ADMIN_USER_ID
}
