import { parseAfipDateToYmd, periodoAfipToYmdFirstDay } from "@/lib/afipDateParse"

export type PadronDocKind = "cuit" | "dni"

export type PadronActividadItem = {
  idActividad: string
  descripcionActividad?: string
  /** YYYY-MM-DD: por actividad o, si falta, fecha global de inicio del padrón */
  inicioActividadesDate?: string
  orden?: number
  periodo?: number
  nomenclador?: number
}

export type PadronLookupOk = {
  razonSocial: string
  domicilioFiscal?: string
  condicionIvaNombre?: string
  docTipoAfip?: number
  /** Actividades informadas por AFIP (elegir rubro en ajustes) */
  fiscalActividadesPadron?: PadronActividadItem[]
  /** Manual: no lo rellenamos desde ARCA */
  fiscalInicioActividadesDate?: string
  /** Manual / libre; no lo rellenamos desde ARCA */
  fiscalIngresosBrutosResumen?: string
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "")
}

export function normalizeCuitDigits(raw: string): string | null {
  const d = onlyDigits(raw.trim())
  if (d.length !== 11) return null
  return d
}

export function normalizeDniDigits(raw: string): string | null {
  const d = onlyDigits(raw.trim())
  if (d.length < 6 || d.length > 9) return null
  return d
}

function mockPadron(kind: PadronDocKind, value: string): PadronLookupOk {
  if (kind === "cuit") {
    return {
      razonSocial: `Contribuyente demo (${value.slice(0, 2)}…${value.slice(-2)})`,
      domicilioFiscal: "CABA (mock)",
      condicionIvaNombre: "Responsable Inscripto (mock)",
      docTipoAfip: 80,
      fiscalActividadesPadron: [
        {
          idActividad: "620100",
          descripcionActividad: "Desarrollo de software (mock)",
          orden: 1,
          inicioActividadesDate: "2018-03-15",
        },
        {
          idActividad: "620200",
          descripcionActividad: "Consultoría informática (mock)",
          orden: 2,
          inicioActividadesDate: "2020-07-01",
        },
      ],
    }
  }
  return {
    razonSocial: `Persona física demo DNI ${value}`,
    condicionIvaNombre: "Consumidor final (mock)",
    docTipoAfip: 96,
  }
}

async function fetchBridge(
  kind: PadronDocKind,
  value: string,
): Promise<PadronLookupOk | { error: string }> {
  const base = process.env.PADRON_BRIDGE_URL?.trim()
  if (!base) return { error: "PADRON_BRIDGE_URL no configurada." }
  const url = base.endsWith("/") ? `${base}lookup` : `${base}/lookup`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, value }),
    cache: "no-store",
  })
  if (!res.ok) {
    return { error: `Padrón: respuesta HTTP ${res.status}` }
  }
  const data = (await res.json()) as Record<string, unknown>
  const rs = data.razonSocial ?? data.razon_social
  if (typeof rs !== "string" || !rs.trim()) {
    return { error: "Respuesta de padrón inválida." }
  }
  const rawActs =
    data.fiscalActividadesPadron ?? data.fiscal_actividades_padron
  let fiscalActividadesPadron: PadronActividadItem[] | undefined
  if (Array.isArray(rawActs)) {
    const parsed: PadronActividadItem[] = rawActs.flatMap((x) => {
      if (!x || typeof x !== "object") return []
      const o = x as Record<string, unknown>
      const id = o.idActividad ?? o.id_actividad
      if (id == null) return []
      const rawInicio =
        o.inicioActividadesDate ??
        o.inicio_actividades_date ??
        o.fechaInicioActividad ??
        o.fechaInicioActividades ??
        o.fecha_inicio_actividad
      const periodoRaw = o.periodo
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
          typeof o.descripcionActividad === "string"
            ? o.descripcionActividad
            : typeof o.descripcion_actividad === "string"
              ? o.descripcion_actividad
              : undefined,
        inicioActividadesDate: ini ?? periodoAfipToYmdFirstDay(periodo),
        orden: typeof o.orden === "number" ? o.orden : undefined,
        periodo,
        nomenclador: typeof o.nomenclador === "number" ? o.nomenclador : undefined,
      }
      return [item]
    })
    fiscalActividadesPadron = parsed.length > 0 ? parsed : undefined
  }
  return {
    razonSocial: rs.trim(),
    domicilioFiscal:
      typeof data.domicilioFiscal === "string"
        ? data.domicilioFiscal
        : typeof data.domicilio_fiscal === "string"
          ? data.domicilio_fiscal
          : undefined,
    condicionIvaNombre:
      typeof data.condicionIvaNombre === "string"
        ? data.condicionIvaNombre
        : typeof data.condicion_iva_nombre === "string"
          ? data.condicion_iva_nombre
          : undefined,
    docTipoAfip:
      typeof data.docTipoAfip === "number"
        ? data.docTipoAfip
        : typeof data.doc_tipo_afip === "number"
          ? data.doc_tipo_afip
          : undefined,
    fiscalActividadesPadron,
  }
}

export async function lookupPadronContribuyente(
  raw: string,
): Promise<PadronLookupOk | { error: string }> {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { error: "Ingresá un CUIT o DNI." }
  }
  const d = onlyDigits(trimmed)
  if (d.length === 11) {
    const cuit = normalizeCuitDigits(trimmed)
    if (!cuit) return { error: "CUIT inválido (11 dígitos)." }
    if (process.env.PADRON_USE_MOCK === "1") {
      return mockPadron("cuit", cuit)
    }
    const { lookupPadronArcaContribuyenteByCuit } = await import(
      "@/lib/arcaPadronContribuyenteServer"
    )
    const arca = await lookupPadronArcaContribuyenteByCuit(cuit)
    if (arca !== null) {
      if ("error" in arca) {
        return arca
      }
      return arca
    }
    const bridge = await fetchBridge("cuit", cuit)
    if ("error" in bridge) {
      if (process.env.NODE_ENV === "development") {
        return mockPadron("cuit", cuit)
      }
      return bridge
    }
    return bridge
  }
  const dni = normalizeDniDigits(trimmed)
  if (!dni) {
    return { error: "DNI inválido (6 a 9 dígitos) o CUIT inválido." }
  }
  if (process.env.PADRON_USE_MOCK === "1") {
    return mockPadron("dni", dni)
  }
  const bridge = await fetchBridge("dni", dni)
  if ("error" in bridge) {
    if (process.env.NODE_ENV === "development") {
      return mockPadron("dni", dni)
    }
    return bridge
  }
  return bridge
}
