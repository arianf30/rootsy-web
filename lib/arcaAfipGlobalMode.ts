export function isArcaAfipHomologationFromEnv(): boolean {
  const raw = process.env.ROOTSY_ARCA_AFIP_MODE?.trim().toLowerCase()
  if (!raw) return false
  return (
    raw === "homologacion" ||
    raw === "homologación" ||
    raw === "homologation"
  )
}
