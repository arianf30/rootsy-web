import "server-only"

import type {
  PadronActividadItem,
  PadronLookupOk,
} from "@/lib/argentinaPadronLookup"
import {
  parseAfipDateToYmd,
  periodoAfipToYmdFirstDay,
} from "@/lib/afipDateParse"
import { execFileSync } from "child_process"
import { writeFileSync, mkdtempSync, rmSync } from "fs"
import { tmpdir } from "os"
import { join } from "path"
import * as soap from "soap"
import { XMLParser } from "fast-xml-parser"

const WSAA_WSDL = {
  production: "https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL",
  homologation: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL",
} as const

const PADRON_WSDL = {
  production:
    "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5?wsdl",
  homologation:
    "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5?wsdl",
} as const

const PADRON_SERVICE = "ws_sr_constancia_inscripcion"

export function isArcaPadronHomologation(): boolean {
  return process.env.ARCA_PADRON_AFIP_ENV === "homologation"
}

function formatAfipSoapDate(d: Date): string {
  const s = d.toLocaleString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
  return `${s.replace(" ", "T")}-03:00`
}

function buildLoginTicketRequestXml(): string {
  const ttlSec = 600
  const nowSec = Math.floor(Date.now() / 1000)
  const gen = new Date((nowSec - ttlSec) * 1000)
  const exp = new Date((nowSec + ttlSec) * 1000)
  const uniqueId = String(nowSec)
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<loginTicketRequest version="1.0">' +
    "<header>" +
    "<uniqueId>" +
    uniqueId +
    "</uniqueId>" +
    "<generationTime>" +
    formatAfipSoapDate(gen) +
    "</generationTime>" +
    "<expirationTime>" +
    formatAfipSoapDate(exp) +
    "</expirationTime>" +
    "</header>" +
    "<service>" +
    PADRON_SERVICE +
    "</service>" +
    "</loginTicketRequest>"
  )
}

function signTraWithOpenssl(traXml: string, certPem: string, keyPem: string): string {
  const dir = mkdtempSync(join(tmpdir(), "rootsy-afip-"))
  try {
    const traPath = join(dir, "tra.xml")
    const certPath = join(dir, "cert.pem")
    const keyPath = join(dir, "key.pem")
    writeFileSync(traPath, traXml, "utf8")
    writeFileSync(certPath, certPem, "utf8")
    writeFileSync(keyPath, keyPem, "utf8")
    const out = execFileSync(
      "openssl",
      [
        "smime",
        "-sign",
        "-md",
        "sha1",
        "-signer",
        certPath,
        "-inkey",
        keyPath,
        "-in",
        traPath,
        "-outform",
        "DER",
        "-nodetach",
      ],
      {
        encoding: "buffer",
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          OPENSSL_ENABLE_SHA1_SIGNATURES: "1",
        },
      },
    )
    return out.toString("base64")
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

function extractTaCredentials(taXml: string): { token: string; sign: string } {
  const p = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
  })
  const o = p.parse(taXml) as Record<string, unknown>
  const cred = findCredentials(o)
  if (!cred?.token || !cred.sign) {
    throw new Error("Respuesta WSAA sin token o sign.")
  }
  return { token: String(cred.token), sign: String(cred.sign) }
}

function findCredentials(
  o: unknown,
): { token?: string; sign?: string } | null {
  if (!o || typeof o !== "object") return null
  const rec = o as Record<string, unknown>
  if ("credentials" in rec && rec.credentials && typeof rec.credentials === "object") {
    const c = rec.credentials as Record<string, unknown>
    if (typeof c.token === "string" && typeof c.sign === "string") {
      return { token: c.token, sign: c.sign }
    }
  }
  for (const v of Object.values(rec)) {
    const found = findCredentials(v)
    if (found?.token && found?.sign) return found
  }
  return null
}

type DomicilioFiscal = {
  direccion?: string
  localidad?: string
  descripcionProvincia?: string
}

type DatosGenerales = {
  razonSocial?: string
  nombre?: string
  apellido?: string
  domicilioFiscal?: DomicilioFiscal | DomicilioFiscal[]
  caracterizacion?:
    | { descripcionCaracterizacion?: string }
    | Array<{ descripcionCaracterizacion?: string }>
}

function first<T>(v: T | T[] | undefined): T | undefined {
  return Array.isArray(v) ? v[0] : v
}

function unwrapSoapScalar(v: unknown): unknown {
  if (v && typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>
    if ("$value" in o) return unwrapSoapScalar(o.$value)
    if ("value" in o) return unwrapSoapScalar(o.value)
  }
  return v
}

function pickFechaInicioFromRecordKeys(raw: Record<string, unknown>): string | undefined {
  for (const [k, v] of Object.entries(raw)) {
    const kl = k.toLowerCase()
    if (kl.includes("fechasolicitud")) continue
    if (kl.includes("fechahora")) continue
    if (kl.includes("fechacontrato")) continue
    if (kl.includes("fechafallecimiento")) continue
    if (kl.includes("fechanacimiento")) continue
    const looksRelevant =
      (kl.includes("fecha") && (kl.includes("inicio") || kl.includes("activ"))) ||
      kl.includes("fechaalta") ||
      kl.includes("fechaaltamonotributo")
    if (!looksRelevant) continue
    const y = parseAfipDateToYmd(unwrapSoapScalar(v))
    if (y) return y
  }
  return undefined
}

function normalizeActividadRaw(
  raw: Record<string, unknown>,
): PadronActividadItem | null {
  const idRaw = unwrapSoapScalar(raw.idActividad)
  if (idRaw == null) return null
  const idActividad = String(idRaw)
  const rawInicio =
    unwrapSoapScalar(raw.fechaInicioActividad) ??
    unwrapSoapScalar(raw.fechaInicioActividades) ??
    unwrapSoapScalar(raw.fechaInicio) ??
    unwrapSoapScalar(raw.fechaInicioActividadMonotributo) ??
    unwrapSoapScalar(raw.fecha_inicio_actividad) ??
    unwrapSoapScalar(raw.fecha_inicio_actividades)
  const periodoUnwrapped = unwrapSoapScalar(raw.periodo)
  const periodo =
    typeof periodoUnwrapped === "number"
      ? periodoUnwrapped
      : typeof periodoUnwrapped === "string" && /^\d+$/.test(periodoUnwrapped)
        ? Number(periodoUnwrapped)
        : undefined
  let inicioActividadesDate =
    parseAfipDateToYmd(rawInicio) ?? pickFechaInicioFromRecordKeys(raw)
  if (!inicioActividadesDate && periodo !== undefined) {
    inicioActividadesDate = periodoAfipToYmdFirstDay(periodo)
  }
  return {
    idActividad,
    descripcionActividad:
      typeof raw.descripcionActividad === "string"
        ? raw.descripcionActividad.trim()
        : undefined,
    inicioActividadesDate,
    orden: typeof raw.orden === "number" ? raw.orden : undefined,
    periodo,
    nomenclador: typeof raw.nomenclador === "number" ? raw.nomenclador : undefined,
  }
}

function findFechaInicioInObject(o: Record<string, unknown>): string | undefined {
  const keys = [
    "fechaInicioActividades",
    "fechaInicioActividad",
    "fechaInicio",
    "fechaInicioActividadMonotributo",
    "fecha_inicio_actividades",
    "fecha_inicio_actividad",
  ]
  for (const k of keys) {
    const y = parseAfipDateToYmd(unwrapSoapScalar(o[k]))
    if (y) return y
  }
  return pickFechaInicioFromRecordKeys(o)
}

function deepFindFechaInicioActividades(
  root: unknown,
  depth: number,
  visited: WeakSet<object>,
): string | undefined {
  if (depth <= 0 || root == null) return undefined
  if (typeof root !== "object") return undefined
  if (Array.isArray(root)) {
    for (const el of root) {
      const y = deepFindFechaInicioActividades(el, depth - 1, visited)
      if (y) return y
    }
    return undefined
  }
  if (visited.has(root)) return undefined
  visited.add(root)
  const rec = root as Record<string, unknown>
  const direct = findFechaInicioInObject(rec)
  if (direct) return direct
  for (const v of Object.values(rec)) {
    const y = deepFindFechaInicioActividades(v, depth - 1, visited)
    if (y) return y
  }
  return undefined
}

function extractGlobalFechaInicio(pr: Record<string, unknown>): string | undefined {
  for (const block of [
    pr.datosGenerales,
    pr.datosMonotributo,
    pr.datosRegimenGeneral,
  ]) {
    if (!block || typeof block !== "object") continue
    const rec = block as Record<string, unknown>
    const y = findFechaInicioInObject(rec)
    if (y) return y
    const deep = deepFindFechaInicioActividades(block, 12, new WeakSet())
    if (deep) return deep
  }
  return undefined
}

function unwrapPersonaReturnRoot(personaReturn: unknown): Record<string, unknown> {
  if (!personaReturn || typeof personaReturn !== "object") {
    return {}
  }
  let r = personaReturn as Record<string, unknown>
  if (!r.datosGenerales) {
    const inner = r.personaReturn
    if (inner && typeof inner === "object") {
      const ir = inner as Record<string, unknown>
      if (ir.datosGenerales) r = ir
    }
  }
  if (!r.datosGenerales) {
    const persona = r.persona
    if (persona && typeof persona === "object") {
      const pr = persona as Record<string, unknown>
      if (pr.datosGenerales) r = pr
    }
  }
  return r
}

function extractActividadesPadron(pr: Record<string, unknown>): PadronActividadItem[] {
  const map = new Map<string, PadronActividadItem>()
  const addOne = (raw: unknown) => {
    if (!raw || typeof raw !== "object") return
    const n = normalizeActividadRaw(raw as Record<string, unknown>)
    if (!n) return
    const prev = map.get(n.idActividad)
    map.set(n.idActividad, {
      ...prev,
      ...n,
      descripcionActividad: n.descripcionActividad ?? prev?.descripcionActividad,
      inicioActividadesDate: n.inicioActividadesDate ?? prev?.inicioActividadesDate,
      orden: n.orden ?? prev?.orden,
      periodo: n.periodo ?? prev?.periodo,
      nomenclador: n.nomenclador ?? prev?.nomenclador,
    })
  }
  const walk = (imp: unknown) => {
    const arr = Array.isArray(imp) ? imp : imp != null ? [imp] : []
    for (const it of arr) addOne(it)
  }
  const dm = pr.datosMonotributo
  const dr = pr.datosRegimenGeneral
  if (dm && typeof dm === "object") {
    const o = dm as Record<string, unknown>
    walk(o.actividad)
    if (o.actividadMonotributista) addOne(o.actividadMonotributista)
  }
  if (dr && typeof dr === "object") {
    walk((dr as Record<string, unknown>).actividad)
  }
  return [...map.values()].sort(
    (a, b) => (a.orden ?? 999) - (b.orden ?? 999),
  )
}

function mapPersonaToPadron(personaReturn: unknown): PadronLookupOk {
  const prLoose = unwrapPersonaReturnRoot(personaReturn)
  const pr = prLoose as {
    datosGenerales?: DatosGenerales
    errorConstancia?: { error?: string[] | string }
  }
  if (pr.errorConstancia?.error) {
    const e = pr.errorConstancia.error
    const msg = Array.isArray(e) ? e.join(", ") : String(e)
    throw new Error(msg || "ARCA: error en constancia.")
  }
  const dg = pr.datosGenerales
  if (!dg) {
    throw new Error("ARCA: respuesta sin datos del contribuyente.")
  }
  let razonSocial = dg.razonSocial?.trim()
  if (!razonSocial) {
    const n = dg.nombre?.trim()
    const a = dg.apellido?.trim()
    razonSocial = [n, a].filter(Boolean).join(" ").trim()
  }
  if (!razonSocial) {
    throw new Error("ARCA: respuesta sin razón social.")
  }
  const dom = first(dg.domicilioFiscal)
  const domicilioFiscal = dom
    ? [dom.direccion, dom.localidad, dom.descripcionProvincia]
        .filter(Boolean)
        .join(", ")
    : undefined
  const car = first(dg.caracterizacion)
  const condicionIvaNombre = car?.descripcionCaracterizacion?.trim()

  const fiscalActividadesRaw = extractActividadesPadron(prLoose)
  const globalFecha = extractGlobalFechaInicio(prLoose)
  const fiscalActividadesPadron =
    fiscalActividadesRaw.length > 0
      ? fiscalActividadesRaw.map((a) => ({
          ...a,
          inicioActividadesDate: a.inicioActividadesDate ?? globalFecha,
        }))
      : undefined

  return {
    razonSocial,
    domicilioFiscal: domicilioFiscal || undefined,
    condicionIvaNombre: condicionIvaNombre || undefined,
    docTipoAfip: 80,
    fiscalActividadesPadron,
  }
}

export async function loginWsaaAndGetPersonaV2(params: {
  certPem: string
  keyPem: string
  cuitRepresentada: string
  idPersonaCuit: string
}): Promise<PadronLookupOk> {
  const homo = isArcaPadronHomologation()
  const wsaaUrl = homo ? WSAA_WSDL.homologation : WSAA_WSDL.production
  const padronUrl = homo ? PADRON_WSDL.homologation : PADRON_WSDL.production

  const tra = buildLoginTicketRequestXml()
  let cmsB64: string
  try {
    cmsB64 = signTraWithOpenssl(tra, params.certPem, params.keyPem)
  } catch {
    throw new Error(
      "No se pudo firmar el ticket WSAA (OpenSSL). Verificá que .crt y .key sean PEM válidos y que OpenSSL esté en el PATH.",
    )
  }

  const wsaaClient = await soap.createClientAsync(wsaaUrl, {
    disableCache: true,
  })
  const [loginRes] = await wsaaClient.loginCmsAsync({ in0: cmsB64 })
  const taXml = loginRes?.loginCmsReturn as string | undefined
  if (!taXml || typeof taXml !== "string") {
    throw new Error("WSAA: respuesta vacía.")
  }
  const { token, sign } = extractTaCredentials(taXml)

  const padronClient = await soap.createClientAsync(padronUrl, {
    disableCache: true,
  })
  const cuitRep = Number(params.cuitRepresentada.replace(/\D/g, ""))
  const idP = Number(params.idPersonaCuit.replace(/\D/g, ""))
  const [gpRes] = await padronClient.getPersona_v2Async({
    token,
    sign,
    cuitRepresentada: cuitRep,
    idPersona: idP,
  })
  const personaReturn = gpRes?.personaReturn
  return mapPersonaToPadron(personaReturn)
}
