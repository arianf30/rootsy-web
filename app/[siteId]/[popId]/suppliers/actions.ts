"use server"

import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import {
  getPopById,
  getPopSiteId,
  validatePopAccess,
} from "@/lib/popHelpers"
import { popMenuHref } from "@/lib/popRoutes"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import { createClient } from "@/utils/supabase/server"

export type SupplierTableRow = {
  id: string
  name: string
  email: string
  phone: string
  taxId: string
  notes: string
}

export type UpsertPopSupplierInput = {
  name: string
  email: string
  phone: string
  taxId: string
  notes: string
}

export async function createPopSupplier(
  popId: string,
  input: UpsertPopSupplierInput,
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
        POP_PERMS.SUPPLIER_CREATE.resource,
        POP_PERMS.SUPPLIER_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para crear proveedores." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "El nombre es obligatorio." }
    }
    const supabase = await createClient()
    const { error } = await supabase.from("suppliers").insert({
      pop_id: popId,
      name,
      email: input.email.trim() || null,
      phone: input.phone.trim() || null,
      tax_id: input.taxId.trim() || null,
      notes: input.notes.trim() || null,
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

export async function updatePopSupplier(
  popId: string,
  supplierId: string,
  input: UpsertPopSupplierInput,
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
        POP_PERMS.SUPPLIER_UPDATE.resource,
        POP_PERMS.SUPPLIER_UPDATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para editar proveedores." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "El nombre es obligatorio." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("suppliers")
      .update({
        name,
        email: input.email.trim() || null,
        phone: input.phone.trim() || null,
        tax_id: input.taxId.trim() || null,
        notes: input.notes.trim() || null,
      })
      .eq("id", supplierId)
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

export async function deletePopSupplier(
  popId: string,
  supplierId: string,
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
        POP_PERMS.SUPPLIER_DELETE.resource,
        POP_PERMS.SUPPLIER_DELETE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para eliminar proveedores." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", supplierId)
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

export async function getPopSuppliersTable(popId: string): Promise<
  | {
      success: true
      suppliers: SupplierTableRow[]
      popName: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      suppliers: SupplierTableRow[]
      popName?: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
> {
  const empty = {
    suppliers: [] as SupplierTableRow[],
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
        POP_PERMS.SUPPLIER_READ.resource,
        POP_PERMS.SUPPLIER_READ.action,
      )
    ) {
      return {
        success: false,
        error: "No tenés permiso para ver proveedores en este punto.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
        ...empty,
        popName: "",
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SUPPLIER_CREATE.resource,
      POP_PERMS.SUPPLIER_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SUPPLIER_UPDATE.resource,
      POP_PERMS.SUPPLIER_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SUPPLIER_DELETE.resource,
      POP_PERMS.SUPPLIER_DELETE.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("suppliers")
      .select("id, name, email, phone, tax_id, notes")
      .eq("pop_id", popId)
      .order("name", { ascending: true })
    if (error) {
      return {
        success: false,
        error: error.message || "No se pudieron cargar los proveedores.",
        ...empty,
        popName,
      }
    }
    const suppliers: SupplierTableRow[] = (data || []).map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      email: String(r.email ?? ""),
      phone: String(r.phone ?? ""),
      taxId: String(r.tax_id ?? ""),
      notes: String(r.notes ?? ""),
    }))
    return {
      success: true,
      suppliers,
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
