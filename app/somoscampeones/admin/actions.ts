"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import {
  ARCA_PADRON_CRT_OBJECT_PATH,
  ARCA_PADRON_KEY_OBJECT_PATH,
  ROOTSY_AFIP_STORAGE_BUCKET,
} from "@/lib/rootsyAfipStorage"
import { isRootsyPlatformAdmin } from "@/lib/rootsyPlatformAdmin"
import { createServiceRoleClient } from "@/utils/supabase/service-role"

const SINGLETON_KEY = "global"

export type RootsyAdminConfigView = {
  afipCuit: string | null
  hasArcaCrt: boolean
  hasArcaKey: boolean
  updatedAt: string | null
}

export type SaveRootsyAdminState = {
  ok: boolean
  message: string
}

function normalizeCuit(raw: string): string | null {
  const d = raw.replace(/\D/g, "")
  if (d.length !== 11) return null
  return d
}

async function requirePlatformAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user?.id || !isRootsyPlatformAdmin(user.id)) {
    return { supabase: null as Awaited<ReturnType<typeof createClient>> | null, user: null }
  }
  return { supabase, user }
}

export async function loadRootsyAdminConfig(): Promise<RootsyAdminConfigView | null> {
  const { supabase, user } = await requirePlatformAdmin()
  if (!supabase || !user) return null

  const { data: row, error } = await supabase
    .from("_rootsy_configurations")
    .select(
      "afip_consultation_cuit, arca_padron_crt_storage_updated_at, arca_padron_key_storage_updated_at, updated_at",
    )
    .eq("singleton_key", SINGLETON_KEY)
    .maybeSingle()

  if (error || !row) {
    return {
      afipCuit: null,
      hasArcaCrt: false,
      hasArcaKey: false,
      updatedAt: null,
    }
  }

  const r = row as {
    afip_consultation_cuit: string | null
    arca_padron_crt_storage_updated_at: string | null
    arca_padron_key_storage_updated_at: string | null
    updated_at: string | null
  }

  return {
    afipCuit: r.afip_consultation_cuit,
    hasArcaCrt: Boolean(r.arca_padron_crt_storage_updated_at),
    hasArcaKey: Boolean(r.arca_padron_key_storage_updated_at),
    updatedAt: r.updated_at,
  }
}

async function uploadToPrivateBucket(
  objectPath: string,
  bytes: Buffer,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const srv = createServiceRoleClient()
    const { error } = await srv.storage.from(ROOTSY_AFIP_STORAGE_BUCKET).upload(
      objectPath,
      bytes,
      {
        upsert: true,
        contentType: "application/x-pem-file",
        cacheControl: "no-store",
      },
    )
    if (error) {
      return {
        ok: false,
        message:
          "No se pudo guardar el archivo en el bucket privado. Revisá permisos y SUPABASE_SERVICE_ROLE_KEY.",
      }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : ""
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY") || msg.includes("URL de Supabase")) {
      return {
        ok: false,
        message:
          "Configurá SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor (solo backend, nunca NEXT_PUBLIC).",
      }
    }
    return {
      ok: false,
      message: "No se pudo acceder al almacenamiento privado.",
    }
  }
}

export async function saveRootsyConfiguration(
  _prev: SaveRootsyAdminState,
  formData: FormData,
): Promise<SaveRootsyAdminState> {
  const { supabase, user } = await requirePlatformAdmin()
  if (!supabase || !user) {
    return { ok: false, message: "No autorizado." }
  }

  const cuitRaw = String(formData.get("afipCuit") ?? "").trim()
  const cuitNorm = normalizeCuit(cuitRaw)
  if (!cuitNorm) {
    return { ok: false, message: "Ingresá un CUIT válido (11 dígitos)." }
  }

  const crtFile = formData.get("arcaCrt") as File | null
  const keyFile = formData.get("arcaKey") as File | null

  let crtBuffer: Buffer | null = null
  let keyBuffer: Buffer | null = null

  if (crtFile && typeof crtFile.size === "number" && crtFile.size > 0) {
    const ab = await crtFile.arrayBuffer()
    crtBuffer = Buffer.from(ab)
    if (crtBuffer.length === 0) {
      return { ok: false, message: "El archivo .crt está vacío." }
    }
  }

  if (keyFile && typeof keyFile.size === "number" && keyFile.size > 0) {
    const ab = await keyFile.arrayBuffer()
    keyBuffer = Buffer.from(ab)
    if (keyBuffer.length === 0) {
      return { ok: false, message: "El archivo .key está vacío." }
    }
  }

  const { data: existing } = await supabase
    .from("_rootsy_configurations")
    .select(
      "arca_padron_crt_storage_updated_at, arca_padron_key_storage_updated_at",
    )
    .eq("singleton_key", SINGLETON_KEY)
    .maybeSingle()

  const ex = existing as {
    arca_padron_crt_storage_updated_at: string | null
    arca_padron_key_storage_updated_at: string | null
  } | null

  const updatedAt = new Date().toISOString()

  if (crtBuffer?.length) {
    const up = await uploadToPrivateBucket(ARCA_PADRON_CRT_OBJECT_PATH, crtBuffer)
    if (!up.ok) return { ok: false, message: up.message }
  }

  if (keyBuffer?.length) {
    const up = await uploadToPrivateBucket(ARCA_PADRON_KEY_OBJECT_PATH, keyBuffer)
    if (!up.ok) return { ok: false, message: up.message }
  }

  const rowPayload: Record<string, unknown> = {
    afip_consultation_cuit: cuitNorm,
    updated_at: updatedAt,
    updated_by: user.id,
    arca_padron_crt_storage_updated_at:
      crtBuffer?.length ? updatedAt : ex?.arca_padron_crt_storage_updated_at ?? null,
    arca_padron_key_storage_updated_at:
      keyBuffer?.length ? updatedAt : ex?.arca_padron_key_storage_updated_at ?? null,
  }

  const existsRow = Boolean(existing)

  if (existsRow) {
    const { error } = await supabase
      .from("_rootsy_configurations")
      .update(rowPayload)
      .eq("singleton_key", SINGLETON_KEY)

    if (error) {
      return {
        ok: false,
        message: "No se pudo guardar la configuración en la base de datos.",
      }
    }
  } else {
    const { error } = await supabase
      .from("_rootsy_configurations")
      .insert({ singleton_key: SINGLETON_KEY, ...rowPayload })

    if (error) {
      return {
        ok: false,
        message: "No se pudo guardar la configuración en la base de datos.",
      }
    }
  }

  revalidatePath("/somoscampeones/admin")
  return { ok: true, message: "Configuración guardada." }
}
