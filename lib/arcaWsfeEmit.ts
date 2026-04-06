import "server-only"

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

const WSFE_WSDL = {
  production: "https://servicios1.afip.gov.ar/wsfev1/service.asmx?WSDL",
  homologation: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx?WSDL",
} as const

const WSFE_SERVICE = "wsfe"

function formatAfipSoapDate(d: Date): string {
  const s = d.toLocaleString("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
  })
  return `${s.replace(" ", "T")}-03:00`
}

function buildLoginTicketRequestXml(service: string): string {
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
    service +
    "</service>" +
    "</loginTicketRequest>"
  )
}

function signTraWithOpenssl(
  traXml: string,
  certPem: string,
  keyPem: string,
): string {
  const dir = mkdtempSync(join(tmpdir(), "rootsy-wsaa-"))
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
  if (
    "credentials" in rec &&
    rec.credentials &&
    typeof rec.credentials === "object"
  ) {
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

async function wsaaLogin(
  certPem: string,
  keyPem: string,
  homologation: boolean,
): Promise<{ token: string; sign: string }> {
  const wsaaUrl = homologation ? WSAA_WSDL.homologation : WSAA_WSDL.production
  const tra = buildLoginTicketRequestXml(WSFE_SERVICE)
  const cmsB64 = signTraWithOpenssl(tra, certPem, keyPem)
  const wsaaClient = await soap.createClientAsync(wsaaUrl, {
    disableCache: true,
  })
  const [loginRes] = await wsaaClient.loginCmsAsync({ in0: cmsB64 })
  const taXml = loginRes?.loginCmsReturn as string | undefined
  if (!taXml || typeof taXml !== "string") {
    throw new Error("WSAA: respuesta vacía.")
  }
  return extractTaCredentials(taXml)
}

function unwrapSoap(v: unknown): unknown {
  if (v && typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>
    if ("$value" in o) return unwrapSoap(o.$value)
    if ("value" in o) return unwrapSoap(o.value)
  }
  return v
}

function num(v: unknown): number {
  const n = Number(unwrapSoap(v))
  return Number.isFinite(n) ? n : 0
}

function str(v: unknown): string {
  const u = unwrapSoap(v)
  return u == null ? "" : String(u)
}

export type ArcaEmitFacturaBInput = {
  certPem: string
  keyPem: string
  /** 11 dígitos sin guiones */
  cuitEmisor: string
  ptoVta: number
  /** Solo 6 (Factura B) en esta implementación */
  cbteTipo: number
  impTotal: number
  homologation: boolean
  docTipo: number
  docNro: string
  receptorRazonSocial: string
}

export type ArcaEmitResult = {
  ok: true
  cae: string
  caeFchVto: string
  cbteNro: number
  resultado: string
  impTotal: number
  impNeto: number
  impIva: number
  cbteFch: string
  requestPayload: Record<string, unknown>
  responsePayload: Record<string, unknown>
} | {
  ok: false
  error: string
  requestPayload?: Record<string, unknown>
  responsePayload?: Record<string, unknown>
}

function yyyymmddFromDate(d: Date): number {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return y * 10000 + m * 100 + day
}

/**
 * Emite una Factura B (CbteTipo 6) consumidor final vía WSFE v1 (FECAESolicitar).
 */
export async function emitArcaFacturaBConsumidorFinal(
  input: ArcaEmitFacturaBInput,
): Promise<ArcaEmitResult> {
  const {
    certPem,
    keyPem,
    cuitEmisor,
    ptoVta,
    cbteTipo,
    impTotal: impTotalIn,
    homologation,
    docTipo,
    docNro,
    receptorRazonSocial,
  } = input

  if (cbteTipo !== 6) {
    return {
      ok: false,
      error:
        "Por ahora solo se emite Factura B (tipo 6). Elegí Factura B en el formulario.",
    }
  }

  const cuitNum = Number(String(cuitEmisor).replace(/\D/g, ""))
  if (!Number.isFinite(cuitNum) || String(cuitNum).length !== 11) {
    return { ok: false, error: "CUIT del emisor inválido (11 dígitos)." }
  }

  const impTotal = Math.round(impTotalIn * 100) / 100
  if (impTotal <= 0 || impTotal > 999_999_999.99) {
    return { ok: false, error: "Importe total inválido." }
  }

  const impNeto = Math.round((impTotal / 1.21) * 100) / 100
  const impIva = Math.round((impTotal - impNeto) * 100) / 100

  let token: string
  let sign: string
  try {
    const ta = await wsaaLogin(certPem, keyPem, homologation)
    token = ta.token
    sign = ta.sign
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error WSAA"
    return { ok: false, error: `WSAA: ${msg}` }
  }

  const wsfeUrl = homologation ? WSFE_WSDL.homologation : WSFE_WSDL.production
  let client: soap.Client
  try {
    client = await soap.createClientAsync(wsfeUrl, { disableCache: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error SOAP"
    return { ok: false, error: `No se pudo conectar con WSFE: ${msg}` }
  }

  const auth = {
    Token: token,
    Sign: sign,
    Cuit: cuitNum,
  }

  let ultimo = 0
  try {
    const [ultRes] = await client.FECompUltimoAutorizadoAsync({
      Auth: auth,
      PtoVta: ptoVta,
      CbteTipo: cbteTipo,
    })
    const raw = ultRes?.FECompUltimoAutorizadoResult ?? ultRes
    const cbteNroRaw = (raw as Record<string, unknown>)?.CbteNro
    ultimo = num(cbteNroRaw)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error al consultar último número"
    return { ok: false, error: `FECompUltimoAutorizado: ${msg}` }
  }

  const siguiente = ultimo + 1
  const hoy = new Date()
  const cbteFch = yyyymmddFromDate(hoy)

  const det: Record<string, unknown> = {
    Concepto: 1,
    DocTipo: docTipo,
    DocNro: docTipo === 99 ? 0 : Number(String(docNro).replace(/\D/g, "")) || 0,
    CbteDesde: siguiente,
    CbteHasta: siguiente,
    CbteFch: cbteFch,
    ImpTotal: impTotal,
    ImpTotConc: 0,
    ImpNeto: impNeto,
    ImpOpEx: 0,
    ImpIVA: impIva,
    ImpTrib: 0,
    FchServDesde: cbteFch,
    FchServHasta: cbteFch,
    MonId: "PES",
    MonCotiz: 1,
    Iva: {
      AlicIva: {
        Id: 5,
        BaseImp: impNeto,
        Importe: impIva,
      },
    },
  }

  const feCAEReq = {
    FeCabReq: {
      CantReg: 1,
      PtoVta: ptoVta,
      CbteTipo: cbteTipo,
    },
    FeDetReq: [det],
  }

  const requestPayload = {
    Auth: { ...auth, Cuit: cuitNum },
    FeCAEReq: feCAEReq,
  }

  try {
    const [fecaeRes] = await client.FECAESolicitarAsync({
      Auth: auth,
      FeCAEReq: feCAEReq,
    })
    const top = fecaeRes as Record<string, unknown>
    const resultRoot =
      (top.FECAESolicitarResult as Record<string, unknown> | undefined) ??
      (top as Record<string, unknown>)
    const responsePayload = JSON.parse(
      JSON.stringify(resultRoot ?? {}, (_k, v) =>
        typeof v === "bigint" ? v.toString() : v,
      ),
    ) as Record<string, unknown>

    const feDetRaw = resultRoot?.FeDetResp as unknown
    let detResp: Record<string, unknown> | undefined
    if (Array.isArray(feDetRaw) && feDetRaw.length > 0) {
      detResp = feDetRaw[0] as Record<string, unknown>
    } else if (feDetRaw && typeof feDetRaw === "object") {
      const fr = feDetRaw as Record<string, unknown>
      const inner = fr.FECAEDetResponse
      if (Array.isArray(inner) && inner.length > 0) {
        detResp = inner[0] as Record<string, unknown>
      } else if (inner && typeof inner === "object") {
        detResp = inner as Record<string, unknown>
      } else {
        detResp = fr
      }
    }
    if (!detResp) {
      return {
        ok: false,
        error: "Respuesta AFIP sin detalle de comprobante.",
        requestPayload: requestPayload as Record<string, unknown>,
        responsePayload,
      }
    }

    const resultado = str(detResp.Resultado).toUpperCase() || ""
    const cae = str(detResp.CAE)
    const caeVtoRaw = str(detResp?.CAEFchVto)
    const obs = detResp?.Observaciones

    if (resultado !== "A") {
      let extra = ""
      if (obs) {
        extra = ` ${JSON.stringify(obs)}`
      }
      return {
        ok: false,
        error: `AFIP rechazó o observó el comprobante (resultado ${resultado || "?"}).${extra}`,
        requestPayload: requestPayload as Record<string, unknown>,
        responsePayload,
      }
    }
    if (!cae) {
      return {
        ok: false,
        error: "Respuesta AFIP sin CAE.",
        requestPayload: requestPayload as Record<string, unknown>,
        responsePayload,
      }
    }

    let caeFchVto = caeVtoRaw
    if (/^\d{8}$/.test(caeVtoRaw)) {
      const y = caeVtoRaw.slice(0, 4)
      const m = caeVtoRaw.slice(4, 6)
      const d = caeVtoRaw.slice(6, 8)
      caeFchVto = `${y}-${m}-${d}`
    }

    return {
      ok: true,
      cae,
      caeFchVto,
      cbteNro: siguiente,
      resultado,
      impTotal,
      impNeto,
      impIva,
      cbteFch: String(cbteFch),
      requestPayload: requestPayload as Record<string, unknown>,
      responsePayload,
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error FECAESolicitar"
    return {
      ok: false,
      error: msg,
      requestPayload: requestPayload as Record<string, unknown>,
    }
  }
}
