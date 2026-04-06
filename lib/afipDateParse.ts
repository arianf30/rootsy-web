/** Normaliza fechas típicas AFIP/ARCA a `YYYY-MM-DD`. */
export function parseAfipDateToYmd(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>
    if ("$value" in o) return parseAfipDateToYmd(o.$value)
    if ("value" in o) return parseAfipDateToYmd(o.value)
  }
  if (typeof v === "string") {
    const s = v.trim()
    if (!s) return undefined
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
    if (/^\d{8}$/.test(s)) {
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }
    return undefined
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    const s = String(Math.trunc(v))
    if (s.length === 8) {
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }
  }
  return undefined
}

/**
 * `periodo` en actividades AFIP suele ser YYYYMM (p. ej. 201803 → inicio aproximado del período).
 */
export function periodoAfipToYmdFirstDay(periodo: unknown): string | undefined {
  if (typeof periodo !== "number" || !Number.isFinite(periodo)) return undefined
  const n = Math.trunc(periodo)
  const s = String(n)
  if (s.length !== 6) return undefined
  const y = Number(s.slice(0, 4))
  const m = Number(s.slice(4, 6))
  if (y < 1900 || y > 2100 || m < 1 || m > 12) return undefined
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-01`
}
