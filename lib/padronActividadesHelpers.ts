import type { PadronActividadItem } from "@/lib/argentinaPadronLookup"
import { parseAfipDateToYmd, periodoAfipToYmdFirstDay } from "@/lib/afipDateParse"

export function parsePadronActividadesJson(
  raw: string | null | undefined,
): PadronActividadItem[] {
  if (!raw?.trim()) return []
  try {
    const o = JSON.parse(raw) as unknown
    if (!Array.isArray(o)) return []
    return o.flatMap((x) => {
      if (!x || typeof x !== "object") return []
      const r = x as Record<string, unknown>
      const id = r.idActividad
      if (id == null) return []
      const rawInicio =
        r.inicioActividadesDate ??
        r.inicio_actividades_date ??
        r.fechaInicioActividad ??
        r.fechaInicioActividades
      const periodoRaw = r.periodo
      const periodo =
        typeof periodoRaw === "number"
          ? periodoRaw
          : typeof periodoRaw === "string" && /^\d+$/.test(periodoRaw)
            ? Number(periodoRaw)
            : undefined
      const ini = parseAfipDateToYmd(rawInicio)
      const item: PadronActividadItem = {
        idActividad: String(id),
        descripcionActividad:
          typeof r.descripcionActividad === "string"
            ? r.descripcionActividad
            : undefined,
        inicioActividadesDate: ini ?? periodoAfipToYmdFirstDay(periodo),
        orden: typeof r.orden === "number" ? r.orden : undefined,
        periodo,
        nomenclador:
          typeof r.nomenclador === "number" ? r.nomenclador : undefined,
      }
      return [item]
    })
  } catch {
    return []
  }
}
