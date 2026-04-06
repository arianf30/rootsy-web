import "server-only"

import { loginWsaaAndGetPersonaV2 } from "@/lib/arcaPadronWs"
import type { PadronLookupOk } from "@/lib/argentinaPadronLookup"
import { getGlobalAfipPadronContext } from "@/lib/rootsyGlobalAfipConfigServer"

function extractSoapFaultText(e: unknown): string {
  if (!(e instanceof Error)) return ""
  const any = e as Error & {
    root?: { Body?: { Fault?: { faultstring?: string } } }
    response?: { data?: unknown }
  }
  const fs = any.root?.Body?.Fault?.faultstring
  if (typeof fs === "string" && fs.trim()) return fs.trim()
  return e.message
}

function friendlyAfipWsaaMessage(raw: string): string | null {
  const t = raw.toLowerCase()
  if (
    t.includes("coe.notauthorized") ||
    t.includes("computador no autorizado") ||
    t.includes("loginfault") ||
    t.includes("notauthorized")
  ) {
    return (
      "AFIP rechazó el acceso (computador no autorizado). Suele faltar habilitar el servicio " +
      "«Constancia de inscripción» / ws_sr_constancia_inscripcion en el Administrador de relaciones " +
      "de clave fiscal para el mismo certificado que subiste. El CUIT en admin Rootsy debe ser el " +
      "del representado de ese certificado. Si el certificado es de homologación, en el servidor " +
      "definí ARCA_PADRON_AFIP_ENV=homologation."
    )
  }
  return null
}

function soapErrMessage(e: unknown): string {
  const raw = extractSoapFaultText(e)
  if (!raw) return "Error al comunicarse con ARCA/AFIP."
  const friendly = friendlyAfipWsaaMessage(raw)
  return friendly ?? raw
}

export async function lookupPadronArcaContribuyenteByCuit(
  cuit11: string,
): Promise<PadronLookupOk | { error: string } | null> {
  const ctx = await getGlobalAfipPadronContext()
  if (!ctx) return null
  try {
    return await loginWsaaAndGetPersonaV2({
      certPem: ctx.certPem,
      keyPem: ctx.keyPem,
      cuitRepresentada: ctx.representadaCuit,
      idPersonaCuit: cuit11,
    })
  } catch (e) {
    return { error: soapErrMessage(e) }
  }
}
