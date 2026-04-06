import { createServiceRoleClient } from "@/utils/supabase/service-role"

export const ROOTSY_AFIP_STORAGE_BUCKET = "rootsy_afip_private" as const

export const ARCA_PADRON_CRT_OBJECT_PATH = "global/arca_padron.crt" as const
export const ARCA_PADRON_KEY_OBJECT_PATH = "global/arca_padron.key" as const

export function cashRegisterArcaCrtObjectPath(
  popId: string,
  registerId: string,
): string {
  return `pops/${popId}/cash_registers/${registerId}/arca.crt.pem`
}

export function cashRegisterArcaKeyObjectPath(
  popId: string,
  registerId: string,
): string {
  return `pops/${popId}/cash_registers/${registerId}/arca.key.pem`
}

export async function downloadArcaPadronCrt(): Promise<Uint8Array | null> {
  const client = createServiceRoleClient()
  const { data, error } = await client.storage
    .from(ROOTSY_AFIP_STORAGE_BUCKET)
    .download(ARCA_PADRON_CRT_OBJECT_PATH)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

export async function downloadArcaPadronKey(): Promise<Uint8Array | null> {
  const client = createServiceRoleClient()
  const { data, error } = await client.storage
    .from(ROOTSY_AFIP_STORAGE_BUCKET)
    .download(ARCA_PADRON_KEY_OBJECT_PATH)
  if (error || !data) return null
  return new Uint8Array(await data.arrayBuffer())
}

export async function uploadCashRegisterArcaPemFiles(params: {
  popId: string
  registerId: string
  certPemUtf8: string
  keyPemUtf8: string
}): Promise<{ success: true } | { success: false; error: string }> {
  const max = 512 * 1024
  if (params.certPemUtf8.length > max || params.keyPemUtf8.length > max) {
    return { success: false, error: "Archivo demasiado grande (máx. 512 KB)." }
  }
  const client = createServiceRoleClient()
  const crtPath = cashRegisterArcaCrtObjectPath(params.popId, params.registerId)
  const keyPath = cashRegisterArcaKeyObjectPath(params.popId, params.registerId)
  const crtBytes = Buffer.from(params.certPemUtf8, "utf8")
  const keyBytes = Buffer.from(params.keyPemUtf8, "utf8")
  const { error: errCrt } = await client.storage
    .from(ROOTSY_AFIP_STORAGE_BUCKET)
    .upload(crtPath, crtBytes, {
      upsert: true,
      contentType: "application/x-pem-file",
    })
  if (errCrt) {
    return {
      success: false,
      error: errCrt.message || "No se pudo subir el .crt al almacenamiento.",
    }
  }
  const { error: errKey } = await client.storage
    .from(ROOTSY_AFIP_STORAGE_BUCKET)
    .upload(keyPath, keyBytes, {
      upsert: true,
      contentType: "application/x-pem-file",
    })
  if (errKey) {
    return {
      success: false,
      error: errKey.message || "No se pudo subir el .key al almacenamiento.",
    }
  }
  return { success: true }
}

export async function removeCashRegisterArcaPemFiles(
  popId: string,
  registerId: string,
): Promise<void> {
  const client = createServiceRoleClient()
  await client.storage.from(ROOTSY_AFIP_STORAGE_BUCKET).remove([
    cashRegisterArcaCrtObjectPath(popId, registerId),
    cashRegisterArcaKeyObjectPath(popId, registerId),
  ])
}

export async function downloadCashRegisterArcaPemFiles(
  popId: string,
  registerId: string,
): Promise<
  | { success: true; certPemUtf8: string; keyPemUtf8: string }
  | { success: false; error: string }
> {
  const client = createServiceRoleClient()
  const crtPath = cashRegisterArcaCrtObjectPath(popId, registerId)
  const keyPath = cashRegisterArcaKeyObjectPath(popId, registerId)
  const { data: cData, error: cErr } = await client.storage
    .from(ROOTSY_AFIP_STORAGE_BUCKET)
    .download(crtPath)
  if (cErr || !cData) {
    return {
      success: false,
      error:
        cErr?.message ||
        "No se encontró el certificado (.crt) en el almacenamiento de esta caja.",
    }
  }
  const { data: kData, error: kErr } = await client.storage
    .from(ROOTSY_AFIP_STORAGE_BUCKET)
    .download(keyPath)
  if (kErr || !kData) {
    return {
      success: false,
      error:
        kErr?.message ||
        "No se encontró la clave (.key) en el almacenamiento de esta caja.",
    }
  }
  const certPemUtf8 = Buffer.from(await cData.arrayBuffer()).toString("utf8")
  const keyPemUtf8 = Buffer.from(await kData.arrayBuffer()).toString("utf8")
  if (!certPemUtf8.trim() || !keyPemUtf8.trim()) {
    return { success: false, error: "Certificado o clave vacíos en el bucket." }
  }
  return { success: true, certPemUtf8, keyPemUtf8 }
}
