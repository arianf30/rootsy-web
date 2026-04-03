/**
 * Constantes fiscales Argentina alineadas a **ARCA / facturación electrónica** (WSFE y
 * régimen MiPyME FCE). Los códigos numéricos son los que exige el servicio de autorización
 * de comprobantes (p. ej. `CbteTipo`, alícuotas de IVA en detalle).
 *
 * Fuente de verdad operativa: tablas devueltas por **FEParamGetTiposCbte** y
 * **FEParamGetTiposIva** en el ambiente correspondiente; ARCA publica equivalencias en
 * https://www.afip.gob.ar/ws/documentacion/ws-factura-electronica.asp y en el micrositio FCE.
 */

export const ARCA_ARG_SITE_ID = "arg" as const

export type ArcaIvaAlicuotaCategory = "gravado" | "exento" | "no_gravado"

export type ArcaIvaAlicuotaDef = {
  /** Id de alícuota / condición de IVA en WSFE (detalle `Iva`, `AlicIva`, etc.). */
  readonly arcaAlicuotaId: number
  readonly ratePercent: number
  readonly label: string
  readonly category: ArcaIvaAlicuotaCategory
}

/**
 * Alícuotas y condiciones de IVA usadas en facturación electrónica (códigos `Id` típicos
 * devueltos por FEParamGetTiposIva). `ratePercent` es 0 para exento / no gravado / 0 %.
 */
export const ARCA_IVA_ALICUOTAS_ARG: readonly ArcaIvaAlicuotaDef[] = [
  {
    arcaAlicuotaId: 1,
    ratePercent: 0,
    label: "No gravado",
    category: "no_gravado",
  },
  {
    arcaAlicuotaId: 2,
    ratePercent: 0,
    label: "Exento",
    category: "exento",
  },
  {
    arcaAlicuotaId: 3,
    ratePercent: 0,
    label: "0 %",
    category: "gravado",
  },
  {
    arcaAlicuotaId: 4,
    ratePercent: 10.5,
    label: "10,5 %",
    category: "gravado",
  },
  {
    arcaAlicuotaId: 5,
    ratePercent: 21,
    label: "21 %",
    category: "gravado",
  },
  {
    arcaAlicuotaId: 6,
    ratePercent: 27,
    label: "27 %",
    category: "gravado",
  },
  {
    arcaAlicuotaId: 8,
    ratePercent: 5,
    label: "5 %",
    category: "gravado",
  },
  {
    arcaAlicuotaId: 9,
    ratePercent: 2.5,
    label: "2,5 %",
    category: "gravado",
  },
] as const

export const ARCA_IVA_ALICUOTAS_BY_SITE: Record<
  string,
  readonly ArcaIvaAlicuotaDef[]
> = {
  arg: ARCA_IVA_ALICUOTAS_ARG,
}

export function getArcaIvaAlicuotasForSite(
  siteId: string,
): readonly ArcaIvaAlicuotaDef[] {
  return (
    ARCA_IVA_ALICUOTAS_BY_SITE[siteId] ??
    ARCA_IVA_ALICUOTAS_BY_SITE[ARCA_ARG_SITE_ID]
  )
}

export function findArcaIvaAlicuotaById(
  siteId: string,
  arcaAlicuotaId: number,
): ArcaIvaAlicuotaDef | undefined {
  return getArcaIvaAlicuotasForSite(siteId).find(
    (a) => a.arcaAlicuotaId === arcaAlicuotaId,
  )
}

/**
 * Coincidencia por porcentaje gravado (p. ej. artículo con IVA 21 → Id 5).
 * No aplica a exento / no gravado (puede haber varios Id con tasa 0).
 */
export function findArcaIvaAlicuotaByRatePercent(
  siteId: string,
  ratePercent: number,
): ArcaIvaAlicuotaDef | undefined {
  const list = getArcaIvaAlicuotasForSite(siteId)
  return list.find(
    (a) =>
      a.category === "gravado" &&
      Math.abs(a.ratePercent - ratePercent) < 0.001,
  )
}
