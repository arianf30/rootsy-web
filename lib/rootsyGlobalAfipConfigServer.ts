import "server-only"

import {
  downloadArcaPadronCrt,
  downloadArcaPadronKey,
} from "@/lib/rootsyAfipStorage"
import { createServiceRoleClient } from "@/utils/supabase/service-role"

const SINGLETON_KEY = "global"

export type GlobalAfipPadronContext = {
  representadaCuit: string
  certPem: string
  keyPem: string
}

export async function getGlobalAfipPadronContext(): Promise<GlobalAfipPadronContext | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from("_rootsy_configurations")
    .select(
      "afip_consultation_cuit, arca_padron_crt_storage_updated_at, arca_padron_key_storage_updated_at",
    )
    .eq("singleton_key", SINGLETON_KEY)
    .maybeSingle()

  if (error || !data) return null

  const row = data as {
    afip_consultation_cuit: string | null
    arca_padron_crt_storage_updated_at: string | null
    arca_padron_key_storage_updated_at: string | null
  }

  const cuit = String(row.afip_consultation_cuit ?? "").replace(/\D/g, "")
  if (cuit.length !== 11) return null
  if (!row.arca_padron_crt_storage_updated_at || !row.arca_padron_key_storage_updated_at) {
    return null
  }

  const crt = await downloadArcaPadronCrt()
  const key = await downloadArcaPadronKey()
  if (!crt?.byteLength || !key?.byteLength) return null

  const certPem = Buffer.from(crt).toString("utf8").trim()
  const keyPem = Buffer.from(key).toString("utf8").trim()
  if (!certPem.includes("BEGIN CERTIFICATE") || !keyPem.includes("BEGIN")) {
    return null
  }

  return {
    representadaCuit: cuit,
    certPem,
    keyPem,
  }
}
