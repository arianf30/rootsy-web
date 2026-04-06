"use server"

import {
  getPopSiteId,
  validatePopAccess,
} from "@/lib/popHelpers"
import {
  lookupPadronContribuyente,
  type PadronActividadItem,
} from "@/lib/argentinaPadronLookup"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { popMenuHref } from "@/lib/popRoutes"

export async function lookupPadronForPop(
  popId: string,
  rawDocumento: string,
): Promise<
  | {
      success: true
      razonSocial: string
      domicilioFiscal?: string
      condicionIvaNombre?: string
      docTipoAfip?: number
      fiscalActividadesPadron?: PadronActividadItem[]
    }
  | { success: false; error: string; redirect?: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return {
        success: false,
        error: access.error || "Sin acceso",
        redirect: "/home",
      }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    const keys = snap.keys
    const canPadron =
      permissionKeysInclude(
        keys,
        POP_PERMS.SETTINGS_READ.resource,
        POP_PERMS.SETTINGS_READ.action,
      ) ||
      permissionKeysInclude(
        keys,
        POP_PERMS.SALE_READ.resource,
        POP_PERMS.SALE_READ.action,
      ) ||
      permissionKeysInclude(
        keys,
        POP_PERMS.CLIENT_READ.resource,
        POP_PERMS.CLIENT_READ.action,
      ) ||
      permissionKeysInclude(
        keys,
        POP_PERMS.SUPPLIER_READ.resource,
        POP_PERMS.SUPPLIER_READ.action,
      )
    if (!canPadron) {
      return {
        success: false,
        error: "No tenés permiso para consultar el padrón.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
      }
    }
    const res = await lookupPadronContribuyente(rawDocumento)
    if ("error" in res) {
      return { success: false, error: res.error }
    }
    return {
      success: true,
      razonSocial: res.razonSocial,
      domicilioFiscal: res.domicilioFiscal,
      condicionIvaNombre: res.condicionIvaNombre,
      docTipoAfip: res.docTipoAfip,
      fiscalActividadesPadron: res.fiscalActividadesPadron,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}
