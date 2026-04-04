"use server"

import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { getPopById, getPopSiteId, validatePopAccess } from "@/lib/popHelpers"
import { popMenuHref } from "@/lib/popRoutes"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import { createClient } from "@/utils/supabase/server"

export type PopPrinterTableRow = {
  id: string
  name: string
  isActive: boolean
  sortOrder: number
  integrationKind: string | null
  connectionHint: string | null
}

export type UpsertPopPrinterInput = {
  name: string
  isActive: boolean
  sortOrder: number
  integrationKind: string
  connectionHint: string
}

function trimOrNull(s: string): string | null {
  const t = s.trim()
  return t ? t : null
}

export async function createPopPrinter(
  popId: string,
  input: UpsertPopPrinterInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.PRINTER_CREATE.resource,
        POP_PERMS.PRINTER_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para crear impresoras." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "El nombre es obligatorio." }
    }
    const sortOrder = Number(input.sortOrder)
    if (!Number.isFinite(sortOrder)) {
      return { success: false, error: "Orden inválido." }
    }
    const supabase = await createClient()
    const { error } = await supabase.from("pop_printers").insert({
      pop_id: popId,
      name,
      is_active: input.isActive,
      sort_order: Math.trunc(sortOrder),
      integration_kind: trimOrNull(input.integrationKind),
      connection_hint: trimOrNull(input.connectionHint),
    })
    if (error) {
      return { success: false, error: error.message || "No se pudo crear." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function updatePopPrinter(
  popId: string,
  rowId: string,
  input: UpsertPopPrinterInput,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.PRINTER_UPDATE.resource,
        POP_PERMS.PRINTER_UPDATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para editar impresoras." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "El nombre es obligatorio." }
    }
    const sortOrder = Number(input.sortOrder)
    if (!Number.isFinite(sortOrder)) {
      return { success: false, error: "Orden inválido." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("pop_printers")
      .update({
        name,
        is_active: input.isActive,
        sort_order: Math.trunc(sortOrder),
        integration_kind: trimOrNull(input.integrationKind),
        connection_hint: trimOrNull(input.connectionHint),
      })
      .eq("id", rowId)
      .eq("pop_id", popId)
    if (error) {
      return { success: false, error: error.message || "No se pudo guardar." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function deletePopPrinter(
  popId: string,
  rowId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.PRINTER_DELETE.resource,
        POP_PERMS.PRINTER_DELETE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para eliminar impresoras." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("pop_printers")
      .delete()
      .eq("id", rowId)
      .eq("pop_id", popId)
    if (error) {
      return { success: false, error: error.message || "No se pudo eliminar." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getPopPrintersTable(popId: string): Promise<
  | {
      success: true
      rows: PopPrinterTableRow[]
      popName: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      rows: PopPrinterTableRow[]
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
      popName?: string
    }
> {
  const empty = {
    rows: [] as PopPrinterTableRow[],
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  }
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return {
        success: false,
        error: access.error || "Sin acceso",
        redirect: "/home",
        ...empty,
      }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.PRINTER_READ.resource,
        POP_PERMS.PRINTER_READ.action,
      )
    ) {
      return {
        success: false,
        error:
          "No tenés permiso para ver las impresoras de este punto de venta.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
        ...empty,
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.PRINTER_CREATE.resource,
      POP_PERMS.PRINTER_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.PRINTER_UPDATE.resource,
      POP_PERMS.PRINTER_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.PRINTER_DELETE.resource,
      POP_PERMS.PRINTER_DELETE.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("pop_printers")
      .select(
        "id, name, is_active, sort_order, integration_kind, connection_hint",
      )
      .eq("pop_id", popId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
    if (error) {
      return {
        success: false,
        error: error.message || "No se pudieron cargar las impresoras.",
        ...empty,
        popName,
      }
    }
    const rows: PopPrinterTableRow[] = (data || []).map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      isActive: Boolean(r.is_active),
      sortOrder: Number(r.sort_order ?? 0) || 0,
      integrationKind:
        r.integration_kind != null && String(r.integration_kind).trim()
          ? String(r.integration_kind)
          : null,
      connectionHint:
        r.connection_hint != null && String(r.connection_hint).trim()
          ? String(r.connection_hint)
          : null,
    }))
    return {
      success: true,
      rows,
      popName,
      canCreate,
      canUpdate,
      canDelete,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return {
      success: false,
      error: message,
      ...empty,
      popName: "",
    }
  }
}
