"use server"

import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { getPopById, validatePopAccess } from "@/lib/popHelpers"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import { createClient } from "@/utils/supabase/server"

const MOVEMENT_TYPES = new Set([
  "sale",
  "purchase_receipt",
  "adjustment",
  "return_customer",
  "return_supplier",
  "transfer_in",
  "transfer_out",
  "initial",
])

export type InventoryMovementType =
  | "sale"
  | "purchase_receipt"
  | "adjustment"
  | "return_customer"
  | "return_supplier"
  | "transfer_in"
  | "transfer_out"
  | "initial"

export type InventoryArticleOption = {
  id: string
  name: string
}

export type InventoryMovementRow = {
  id: string
  articleId: string
  articleName: string
  quantityDelta: number
  movementType: string
  note: string
  createdAt: string
  createdBy: string | null
}

export type InventoryBalanceRow = {
  articleId: string
  articleName: string
  onHand: number
}

function parseQty(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 1e6) / 1e6
}

export async function createInventoryMovement(
  popId: string,
  input: {
    articleId: string
    quantityDelta: number
    movementType: InventoryMovementType
    note: string
  },
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
        POP_PERMS.INVENTORY_CREATE.resource,
        POP_PERMS.INVENTORY_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para registrar stock." }
    }
    if (!MOVEMENT_TYPES.has(input.movementType)) {
      return { success: false, error: "Tipo de movimiento no válido." }
    }
    const delta = parseQty(input.quantityDelta)
    if (delta === 0) {
      return { success: false, error: "La cantidad no puede ser cero." }
    }
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Sesión requerida." }
    }
    const note = input.note.trim()
    const { error } = await supabase.from("inventory_movements").insert({
      pop_id: popId,
      article_id: input.articleId,
      quantity_delta: delta,
      movement_type: input.movementType,
      note: note.length > 0 ? note : null,
      created_by: user.id,
    })
    if (error) {
      return { success: false, error: error.message || "No se pudo guardar." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function deleteInventoryMovement(
  popId: string,
  movementId: string,
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
        POP_PERMS.INVENTORY_DELETE.resource,
        POP_PERMS.INVENTORY_DELETE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para eliminar movimientos." }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("inventory_movements")
      .delete()
      .eq("id", movementId)
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

export async function getPopInventoryPageData(popId: string): Promise<
  | {
      success: true
      popName: string
      movements: InventoryMovementRow[]
      balances: InventoryBalanceRow[]
      articles: InventoryArticleOption[]
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      popName?: string
      movements: InventoryMovementRow[]
      balances: InventoryBalanceRow[]
      articles: InventoryArticleOption[]
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
> {
  const empty = {
    movements: [] as InventoryMovementRow[],
    balances: [] as InventoryBalanceRow[],
    articles: [] as InventoryArticleOption[],
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
        POP_PERMS.INVENTORY_READ.resource,
        POP_PERMS.INVENTORY_READ.action,
      )
    ) {
      return {
        success: false,
        error: "No tenés permiso para ver inventario en este punto.",
        redirect: `/${popId}/menu`,
        ...empty,
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVENTORY_CREATE.resource,
      POP_PERMS.INVENTORY_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVENTORY_UPDATE.resource,
      POP_PERMS.INVENTORY_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVENTORY_DELETE.resource,
      POP_PERMS.INVENTORY_DELETE.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()

    const { data: artRows, error: artErr } = await supabase
      .from("articles")
      .select("id, name")
      .eq("pop_id", popId)
      .eq("is_active", true)
      .order("name", { ascending: true })
    if (artErr) {
      return {
        success: false,
        error: artErr.message || "No se pudieron cargar artículos.",
        ...empty,
        popName,
      }
    }
    const articles: InventoryArticleOption[] = (artRows || []).map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
    }))
    const nameByArticle = new Map(articles.map((a) => [a.id, a.name]))

    const { data: movRows, error: movErr } = await supabase
      .from("inventory_movements")
      .select(
        `
        id,
        article_id,
        quantity_delta,
        movement_type,
        note,
        created_at,
        created_by,
        articles ( name )
      `,
      )
      .eq("pop_id", popId)
      .order("created_at", { ascending: false })
      .limit(250)
    if (movErr) {
      return {
        success: false,
        error: movErr.message || "No se pudieron cargar movimientos.",
        ...empty,
        popName,
      }
    }
    const movements: InventoryMovementRow[] = (movRows || []).map((r) => {
      const art = r.articles as unknown as { name?: string } | null
      const joinedName = art?.name ? String(art.name) : ""
      const aid = String(r.article_id)
      return {
        id: String(r.id),
        articleId: aid,
        articleName:
          joinedName || nameByArticle.get(aid) || aid,
        quantityDelta: parseQty(r.quantity_delta),
        movementType: String(r.movement_type ?? ""),
        note: r.note != null ? String(r.note) : "",
        createdAt: String(r.created_at ?? ""),
        createdBy: r.created_by != null ? String(r.created_by) : null,
      }
    })

    const { data: sumRows, error: sumErr } = await supabase
      .from("inventory_movements")
      .select("article_id, quantity_delta")
      .eq("pop_id", popId)
    if (sumErr) {
      return {
        success: false,
        error: sumErr.message || "No se pudieron calcular saldos.",
        ...empty,
        popName,
      }
    }
    const deltaByArticle = new Map<string, number>()
    for (const r of sumRows || []) {
      const aid = String(r.article_id)
      const d = parseQty(r.quantity_delta)
      deltaByArticle.set(aid, (deltaByArticle.get(aid) ?? 0) + d)
    }
    const balances: InventoryBalanceRow[] = articles.map((a) => ({
      articleId: a.id,
      articleName: a.name,
      onHand: Math.round((deltaByArticle.get(a.id) ?? 0) * 1e6) / 1e6,
    }))
    balances.sort((a, b) => a.articleName.localeCompare(b.articleName, "es"))

    return {
      success: true,
      popName,
      movements,
      balances,
      articles,
      canCreate,
      canUpdate,
      canDelete,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message, ...empty }
  }
}
