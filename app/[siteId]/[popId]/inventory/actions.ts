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

export type InventoryCostLayerRow = {
  id: string
  articleId: string
  articleName: string
  sourceMovementId: string | null
  quantityReceived: number
  quantityRemaining: number
  unitCost: number
  receivedAt: string
}

export type InventoryLayerAllocationRow = {
  id: string
  layerId: string
  articleId: string
  articleName: string
  inventoryMovementId: string
  movementType: string
  quantity: number
  unitCost: number
  lineCost: number
  createdAt: string
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
      costLayers: InventoryCostLayerRow[]
      layerAllocations: InventoryLayerAllocationRow[]
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
      costLayers: InventoryCostLayerRow[]
      layerAllocations: InventoryLayerAllocationRow[]
      articles: InventoryArticleOption[]
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
> {
  const empty = {
    movements: [] as InventoryMovementRow[],
    balances: [] as InventoryBalanceRow[],
    costLayers: [] as InventoryCostLayerRow[],
    layerAllocations: [] as InventoryLayerAllocationRow[],
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
        redirect: popMenuHref(await getPopSiteId(popId), popId),
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

    const { data: layerRows, error: layerErr } = await supabase
      .from("inventory_cost_layers")
      .select(
        `
        id,
        article_id,
        source_movement_id,
        quantity_received,
        quantity_remaining,
        unit_cost,
        received_at,
        articles ( name )
      `,
      )
      .eq("pop_id", popId)
      .order("received_at", { ascending: true })
    if (layerErr) {
      return {
        success: false,
        error: layerErr.message || "No se pudieron cargar capas de costo.",
        ...empty,
        popName,
      }
    }
    const costLayers: InventoryCostLayerRow[] = (layerRows || []).map((r) => {
      const art = r.articles as unknown as { name?: string } | null
      const aid = String(r.article_id)
      return {
        id: String(r.id),
        articleId: aid,
        articleName: art?.name
          ? String(art.name)
          : nameByArticle.get(aid) || aid,
        sourceMovementId:
          r.source_movement_id != null ? String(r.source_movement_id) : null,
        quantityReceived: parseQty(r.quantity_received),
        quantityRemaining: parseQty(r.quantity_remaining),
        unitCost: parseQty(r.unit_cost),
        receivedAt: String(r.received_at ?? ""),
      }
    })

    const { data: allocRows, error: allocErr } = await supabase
      .from("inventory_layer_allocations")
      .select(
        `
        id,
        layer_id,
        article_id,
        inventory_movement_id,
        quantity,
        unit_cost,
        created_at,
        articles ( name ),
        inventory_movements ( movement_type )
      `,
      )
      .eq("pop_id", popId)
      .order("created_at", { ascending: false })
      .limit(150)
    if (allocErr) {
      return {
        success: false,
        error: allocErr.message || "No se pudieron cargar imputaciones FIFO.",
        ...empty,
        popName,
      }
    }
    const layerAllocations: InventoryLayerAllocationRow[] = (
      allocRows || []
    ).map((r) => {
      const art = r.articles as unknown as { name?: string } | null
      const mov = r.inventory_movements as unknown as {
        movement_type?: string
      } | null
      const aid = String(r.article_id)
      const q = parseQty(r.quantity)
      const uc = parseQty(r.unit_cost)
      return {
        id: String(r.id),
        layerId: String(r.layer_id),
        articleId: aid,
        articleName: art?.name
          ? String(art.name)
          : nameByArticle.get(aid) || aid,
        inventoryMovementId: String(r.inventory_movement_id),
        movementType: String(mov?.movement_type ?? ""),
        quantity: q,
        unitCost: uc,
        lineCost: Math.round(q * uc * 1e6) / 1e6,
        createdAt: String(r.created_at ?? ""),
      }
    })

    return {
      success: true,
      popName,
      movements,
      balances,
      costLayers,
      layerAllocations,
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
