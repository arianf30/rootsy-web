"use server"

import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { getPopById, validatePopAccess } from "@/lib/popHelpers"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import { createClient } from "@/utils/supabase/server"

export type ClientTableRow = {
  id: string
  name: string
  email: string
  phone: string
  taxId: string
  notes: string
}

export type UpsertPopClientInput = {
  name: string
  email: string
  phone: string
  taxId: string
  notes: string
}

export async function createPopClient(
  popId: string,
  input: UpsertPopClientInput,
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
        POP_PERMS.CLIENT_CREATE.resource,
        POP_PERMS.CLIENT_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para crear clientes." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "Name is required." }
    }
    const supabase = await createClient()
    const { error } = await supabase.from("clients").insert({
      pop_id: popId,
      name,
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      tax_id: input.taxId.trim() || null,
      notes: input.notes.trim() || null,
    })
    if (error) {
      return { success: false, error: error.message || "Could not create." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function updatePopClient(
  popId: string,
  clientId: string,
  input: UpsertPopClientInput,
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
        POP_PERMS.CLIENT_UPDATE.resource,
        POP_PERMS.CLIENT_UPDATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para editar clientes." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "Name is required." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("clients")
      .update({
        name,
        email: input.email.trim() || null,
        phone: input.phone.trim() || null,
        tax_id: input.taxId.trim() || null,
        notes: input.notes.trim() || null,
      })
      .eq("id", clientId)
      .eq("pop_id", popId)
    if (error) {
      return { success: false, error: error.message || "Could not save." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function deletePopClient(
  popId: string,
  clientId: string,
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
        POP_PERMS.CLIENT_DELETE.resource,
        POP_PERMS.CLIENT_DELETE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para eliminar clientes." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId)
      .eq("pop_id", popId)
    if (error) {
      return { success: false, error: error.message || "Could not delete." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function getPopClientsTable(popId: string): Promise<
  | {
      success: true
      clients: ClientTableRow[]
      popName: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      clients: ClientTableRow[]
      popName?: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
> {
  const empty = {
    clients: [] as ClientTableRow[],
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
        popName: "",
      }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.CLIENT_READ.resource,
        POP_PERMS.CLIENT_READ.action,
      )
    ) {
      return {
        success: false,
        error: "You do not have permission to view clients for this store.",
        redirect: `/${popId}/menu`,
        ...empty,
        popName: "",
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CLIENT_CREATE.resource,
      POP_PERMS.CLIENT_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CLIENT_UPDATE.resource,
      POP_PERMS.CLIENT_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CLIENT_DELETE.resource,
      POP_PERMS.CLIENT_DELETE.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("id, name, email, phone, tax_id, notes")
      .eq("pop_id", popId)
      .order("name", { ascending: true })
    if (error) {
      return {
        success: false,
        error: error.message || "Could not load clients.",
        ...empty,
        popName,
      }
    }
    const clients: ClientTableRow[] = (data || []).map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      email: String(r.email ?? ""),
      phone: String(r.phone ?? ""),
      taxId: String(r.tax_id ?? ""),
      notes: String(r.notes ?? ""),
    }))
    return {
      success: true,
      clients,
      popName,
      canCreate,
      canUpdate,
      canDelete,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return {
      success: false,
      error: message,
      ...empty,
      popName: "",
    }
  }
}
