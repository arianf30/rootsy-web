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
import {
  CHART_GASTO_MERMA_CODES,
  CHART_INGRESO_AJUSTE_CODES,
  CHART_MERCADERIAS_CODES,
} from "@/lib/argV3DefaultChartAccounts"
import {
  entryDateIsoInTimezone,
  timezoneForPopLedger,
} from "@/lib/entryDateTimezone"
import { createClient } from "@/utils/supabase/server"

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
  costPrice: number
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

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function siteIdsMatchClientRoute(
  routeSiteId: string,
  popSiteId: string,
): boolean {
  return routeSiteId.trim().toLowerCase() === popSiteId.trim().toLowerCase()
}

async function sumInventoryOnHandForArticle(
  supabase: Awaited<ReturnType<typeof createClient>>,
  popId: string,
  articleId: string,
): Promise<{ success: true; onHand: number } | { success: false; error: string }> {
  const { data: rows, error } = await supabase
    .from("inventory_movements")
    .select("quantity_delta")
    .eq("pop_id", popId)
    .eq("article_id", articleId)
  if (error) {
    return { success: false, error: error.message || "No se pudo leer el stock." }
  }
  let t = 0
  for (const r of rows || []) {
    t += parseQty(r.quantity_delta)
  }
  return { success: true, onHand: Math.round(t * 1e6) / 1e6 }
}

type FifoAllocationPlan = {
  layerId: string
  qty: number
  unitCost: number
  remainingBefore: number
}

export type CreateInventoryAdjustmentInput = {
  articleId: string
  quantityDelta: number
  note: string
  siteId: string
}

export type GetArticleInventoryBalanceInput = {
  articleId: string
  siteId: string
}

export async function createInventoryAdjustment(
  popId: string,
  input: CreateInventoryAdjustmentInput,
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
      return { success: false, error: "Sin permiso para registrar ajustes de stock." }
    }
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.ACCOUNTS_CREATE.resource,
        POP_PERMS.ACCOUNTS_CREATE.action,
      ) ||
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.ACCOUNTS_UPDATE.resource,
        POP_PERMS.ACCOUNTS_UPDATE.action,
      )
    ) {
      return {
        success: false,
        error:
          "Se requiere permiso de cuentas (crear y actualizar asientos) para registrar el ajuste con asiento contable.",
      }
    }
    const popRes = await getPopById(popId)
    if (!popRes.success || !popRes.pop) {
      return { success: false, error: popRes.error || "No se pudo validar el punto de venta." }
    }
    if (!siteIdsMatchClientRoute(input.siteId, popRes.pop.siteId)) {
      return {
        success: false,
        error: "El sitio de la URL no coincide con el punto de venta.",
      }
    }
    const deltaRaw = Number(input.quantityDelta)
    if (!Number.isFinite(deltaRaw) || deltaRaw === 0) {
      return { success: false, error: "La cantidad no es válida." }
    }
    const qtyAbs = Math.abs(deltaRaw)
    if (!Number.isInteger(qtyAbs) || qtyAbs < 1 || qtyAbs > 10000) {
      return {
        success: false,
        error: "La cantidad debe ser un entero entre 1 y 10000.",
      }
    }
    const delta = deltaRaw > 0 ? qtyAbs : -qtyAbs
    const tz = timezoneForPopLedger(popRes.pop.country, popRes.pop.siteId)
    const entryDate = entryDateIsoInTimezone(tz)
    const note = input.note.trim()
    if (note.length < 1) {
      return { success: false, error: "Indicá un motivo o detalle del ajuste." }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Sesión requerida." }
    }

    const { data: artRow, error: artErr } = await supabase
      .from("articles")
      .select("id, name, cost_price")
      .eq("id", input.articleId)
      .eq("pop_id", popId)
      .maybeSingle()
    if (artErr || !artRow) {
      return { success: false, error: "Artículo no encontrado en este punto." }
    }
    const articleName = String(artRow.name ?? "")
    const articleCostRef = roundMoney(Number(artRow.cost_price ?? 0))

    const isIncrease = delta > 0

    if (!isIncrease) {
      const oh = await sumInventoryOnHandForArticle(supabase, popId, input.articleId)
      if (!oh.success) {
        return { success: false, error: oh.error }
      }
      if (qtyAbs > oh.onHand + 1e-6) {
        return {
          success: false,
          error: "El stock no alcanza para restar esa cantidad.",
        }
      }
    }

    let amount = 0
    let valuationUnitForLayer: number | null = null
    let fifoAllocations: FifoAllocationPlan[] = []

    if (isIncrease) {
      const u = articleCostRef > 0 ? articleCostRef : null
      if (u == null || u <= 0) {
        return {
          success: false,
          error:
            "Configurá un precio de costo mayor que cero en el artículo para valorar el ajuste.",
        }
      }
      valuationUnitForLayer = u
      amount = roundMoney(delta * u)
    } else {
      const { data: layerRows, error: lrErr } = await supabase
        .from("inventory_cost_layers")
        .select("id, quantity_remaining, unit_cost, received_at")
        .eq("pop_id", popId)
        .eq("article_id", input.articleId)
        .gt("quantity_remaining", 0)
        .order("received_at", { ascending: true })
      if (lrErr) {
        return { success: false, error: lrErr.message || "No se pudieron leer capas de costo." }
      }
      const layers = layerRows || []
      if (layers.length === 0) {
        const u = articleCostRef > 0 ? articleCostRef : null
        if (u == null || u <= 0) {
          return {
            success: false,
            error:
              "Sin capas de costo: configurá precio de costo en el artículo para valorar la salida.",
          }
        }
        amount = roundMoney(qtyAbs * u)
      } else {
        let need = qtyAbs
        let total = 0
        const plans: FifoAllocationPlan[] = []
        for (const row of layers) {
          if (need <= 0) break
          const rem = parseQty(row.quantity_remaining)
          if (rem <= 0) continue
          const take = Math.min(need, rem)
          const uc = parseQty(row.unit_cost)
          total += roundMoney(take * uc)
          plans.push({
            layerId: String(row.id),
            qty: take,
            unitCost: uc,
            remainingBefore: rem,
          })
          need = parseQty(need - take)
        }
        if (need > 0) {
          const u = articleCostRef > 0 ? articleCostRef : null
          if (u == null || u <= 0) {
            return {
              success: false,
              error:
                "Configurá precio de costo en el artículo para valorar el remanente que no cubren las capas FIFO.",
            }
          }
          total += roundMoney(need * u)
        }
        amount = roundMoney(total)
        fifoAllocations = plans
      }
    }

    if (amount <= 0) {
      return { success: false, error: "El importe del asiento debe ser mayor que cero." }
    }

    async function resolveAccountId(codes: readonly string[]) {
      for (const code of codes) {
        const { data: row } = await supabase
          .from("accounting_chart_of_accounts")
          .select("id")
          .eq("pop_id", popId)
          .eq("code", code)
          .maybeSingle()
        if (row?.id) return String(row.id)
      }
      return null
    }

    const mercaderiasId = await resolveAccountId(CHART_MERCADERIAS_CODES)
    if (!mercaderiasId) {
      return {
        success: false,
        error:
          "No hay cuenta de inventario (p. ej. 1.1.3.01 Mercaderías) en el plan de cuentas de este punto.",
      }
    }
    const offsetId = isIncrease
      ? await resolveAccountId(CHART_INGRESO_AJUSTE_CODES)
      : await resolveAccountId(CHART_GASTO_MERMA_CODES)
    if (!offsetId) {
      return {
        success: false,
        error: isIncrease
          ? "No hay cuenta de ingresos para ajustes (p. ej. 4.2.1.01 Otros ingresos)."
          : "No hay cuenta de gastos para mermas (p. ej. 6.2.1.03 Mermas y pérdidas de inventario).",
      }
    }

    const entryDescription = `Ajuste inventario — ${articleName || "Artículo"}`

    async function undoFifoAfterMovementFailure(mid: string) {
      if (isIncrease && valuationUnitForLayer != null) {
        await supabase.from("inventory_cost_layers").delete().eq("source_movement_id", mid)
      }
      if (!isIncrease && fifoAllocations.length > 0) {
        for (const r of fifoAllocations) {
          await supabase
            .from("inventory_cost_layers")
            .update({ quantity_remaining: r.remainingBefore })
            .eq("id", r.layerId)
        }
      }
      await supabase.from("inventory_movements").delete().eq("id", mid)
    }

    const { data: movIns, error: movErr } = await supabase
      .from("inventory_movements")
      .insert({
        pop_id: popId,
        article_id: input.articleId,
        quantity_delta: delta,
        movement_type: "adjustment",
        note,
        created_by: user.id,
      })
      .select("id")
      .single()
    if (movErr || !movIns?.id) {
      return { success: false, error: movErr?.message || "No se pudo guardar el movimiento." }
    }
    const movementId = String(movIns.id)

    if (isIncrease && valuationUnitForLayer != null) {
      const { error: posLayerErr } = await supabase.from("inventory_cost_layers").insert({
        pop_id: popId,
        article_id: input.articleId,
        source_movement_id: movementId,
        quantity_received: delta,
        quantity_remaining: delta,
        unit_cost: valuationUnitForLayer,
      })
      if (posLayerErr) {
        await supabase.from("inventory_movements").delete().eq("id", movementId)
        return {
          success: false,
          error: posLayerErr.message || "No se pudo registrar la capa de costo del ajuste.",
        }
      }
    } else if (!isIncrease && fifoAllocations.length > 0) {
      for (const a of fifoAllocations) {
        const { error: allocInsErr } = await supabase
          .from("inventory_layer_allocations")
          .insert({
            pop_id: popId,
            layer_id: a.layerId,
            article_id: input.articleId,
            inventory_movement_id: movementId,
            quantity: a.qty,
            unit_cost: a.unitCost,
          })
        if (allocInsErr) {
          await supabase.from("inventory_movements").delete().eq("id", movementId)
          return {
            success: false,
            error: allocInsErr.message || "No se pudo registrar la imputación FIFO.",
          }
        }
      }
      for (const a of fifoAllocations) {
        const newRem = parseQty(a.remainingBefore - a.qty)
        const { error: layUpdErr } = await supabase
          .from("inventory_cost_layers")
          .update({ quantity_remaining: newRem })
          .eq("id", a.layerId)
        if (layUpdErr) {
          for (const r of fifoAllocations) {
            await supabase
              .from("inventory_cost_layers")
              .update({ quantity_remaining: r.remainingBefore })
              .eq("id", r.layerId)
          }
          await supabase.from("inventory_movements").delete().eq("id", movementId)
          return {
            success: false,
            error: layUpdErr.message || "No se pudo actualizar la capa de costo.",
          }
        }
      }
    }

    const { data: maxRow } = await supabase
      .from("accounting_entries")
      .select("entry_number")
      .eq("pop_id", popId)
      .order("entry_number", { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextNum =
      maxRow?.entry_number != null && Number.isFinite(Number(maxRow.entry_number))
        ? Number(maxRow.entry_number) + 1
        : 1

    const { data: entIns, error: entErr } = await supabase
      .from("accounting_entries")
      .insert({
        pop_id: popId,
        entry_number: nextNum,
        entry_date: entryDate,
        source_type: "inventory_adjustment",
        source_id: movementId,
        description: entryDescription,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single()
    if (entErr || !entIns?.id) {
      await undoFifoAfterMovementFailure(movementId)
      return { success: false, error: entErr?.message || "No se pudo crear el asiento." }
    }
    const entryId = String(entIns.id)

    const lineMercaderias = isIncrease
      ? {
          account_id: mercaderiasId,
          debit_amount: amount,
          credit_amount: 0,
          description: note,
          line_order: 1,
        }
      : {
          account_id: mercaderiasId,
          debit_amount: 0,
          credit_amount: amount,
          description: note,
          line_order: 2,
        }
    const lineOffset = isIncrease
      ? {
          account_id: offsetId,
          debit_amount: 0,
          credit_amount: amount,
          description: note,
          line_order: 2,
        }
      : {
          account_id: offsetId,
          debit_amount: amount,
          credit_amount: 0,
          description: note,
          line_order: 1,
        }

    const { error: linesErr } = await supabase.from("accounting_entry_lines").insert([
      lineMercaderias,
      lineOffset,
    ].map((l) => ({ ...l, entry_id: entryId })))
    if (linesErr) {
      await supabase.from("accounting_entries").delete().eq("id", entryId)
      await undoFifoAfterMovementFailure(movementId)
      return { success: false, error: linesErr.message || "No se pudieron crear las líneas del asiento." }
    }

    const { error: postErr } = await supabase
      .from("accounting_entries")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        posted_by: user.id,
      })
      .eq("id", entryId)
    if (postErr) {
      await supabase.from("accounting_entries").delete().eq("id", entryId)
      await undoFifoAfterMovementFailure(movementId)
      return { success: false, error: postErr.message || "No se pudo registrar el asiento." }
    }

    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

const INITIAL_STOCK_NOTE = "Saldo inicial"

export type CreateInitialStockLedgerInput = {
  articleId: string
  quantity: number
  siteId: string
}

export async function createInitialStockLedgerForArticle(
  popId: string,
  input: CreateInitialStockLedgerInput,
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
      return { success: false, error: "Sin permiso para registrar movimientos de inventario." }
    }
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.ACCOUNTS_CREATE.resource,
        POP_PERMS.ACCOUNTS_CREATE.action,
      ) ||
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.ACCOUNTS_UPDATE.resource,
        POP_PERMS.ACCOUNTS_UPDATE.action,
      )
    ) {
      return {
        success: false,
        error:
          "Se requiere permiso de cuentas (crear y actualizar asientos) para registrar el stock inicial.",
      }
    }
    const popRes = await getPopById(popId)
    if (!popRes.success || !popRes.pop) {
      return { success: false, error: popRes.error || "No se pudo validar el punto de venta." }
    }
    if (!siteIdsMatchClientRoute(input.siteId, popRes.pop.siteId)) {
      return {
        success: false,
        error: "El sitio de la URL no coincide con el punto de venta.",
      }
    }
    const qtyAbs = Number(input.quantity)
    if (!Number.isFinite(qtyAbs) || !Number.isInteger(qtyAbs) || qtyAbs < 1 || qtyAbs > 10000) {
      return {
        success: false,
        error: "La cantidad de stock inicial debe ser un entero entre 1 y 10000.",
      }
    }
    const delta = qtyAbs
    const tz = timezoneForPopLedger(popRes.pop.country, popRes.pop.siteId)
    const entryDate = entryDateIsoInTimezone(tz)
    const note = INITIAL_STOCK_NOTE

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Sesión requerida." }
    }

    const { data: artRow, error: artErr } = await supabase
      .from("articles")
      .select("id, name, cost_price")
      .eq("id", input.articleId)
      .eq("pop_id", popId)
      .maybeSingle()
    if (artErr || !artRow) {
      return { success: false, error: "Artículo no encontrado en este punto." }
    }
    const articleName = String(artRow.name ?? "")
    const articleCostRef = roundMoney(Number(artRow.cost_price ?? 0))
    if (articleCostRef <= 0) {
      return {
        success: false,
        error:
          "Configurá un precio de costo mayor que cero en el artículo para valorar el stock inicial.",
      }
    }
    const amount = roundMoney(delta * articleCostRef)
    if (amount <= 0) {
      return { success: false, error: "El importe del asiento debe ser mayor que cero." }
    }

    async function resolveAccountId(codes: readonly string[]) {
      for (const code of codes) {
        const { data: row } = await supabase
          .from("accounting_chart_of_accounts")
          .select("id")
          .eq("pop_id", popId)
          .eq("code", code)
          .maybeSingle()
        if (row?.id) return String(row.id)
      }
      return null
    }

    const mercaderiasId = await resolveAccountId(CHART_MERCADERIAS_CODES)
    if (!mercaderiasId) {
      return {
        success: false,
        error:
          "No hay cuenta de inventario (p. ej. 1.1.3.01 Mercaderías) en el plan de cuentas de este punto.",
      }
    }
    const offsetId = await resolveAccountId(CHART_INGRESO_AJUSTE_CODES)
    if (!offsetId) {
      return {
        success: false,
        error:
          "No hay cuenta de ingresos para ajustes (p. ej. 4.2.1.01 Otros ingresos).",
      }
    }

    const entryDescription = `Stock inicial — ${articleName || "Artículo"}`

    async function undoAfterMovementFailure(movementId: string) {
      await supabase.from("inventory_cost_layers").delete().eq("source_movement_id", movementId)
      await supabase.from("inventory_movements").delete().eq("id", movementId)
    }

    const { data: movIns, error: movErr } = await supabase
      .from("inventory_movements")
      .insert({
        pop_id: popId,
        article_id: input.articleId,
        quantity_delta: delta,
        movement_type: "initial",
        note,
        created_by: user.id,
      })
      .select("id")
      .single()
    if (movErr || !movIns?.id) {
      return { success: false, error: movErr?.message || "No se pudo guardar el movimiento." }
    }
    const movementId = String(movIns.id)

    const { error: posLayerErr } = await supabase.from("inventory_cost_layers").insert({
      pop_id: popId,
      article_id: input.articleId,
      source_movement_id: movementId,
      quantity_received: delta,
      quantity_remaining: delta,
      unit_cost: articleCostRef,
    })
    if (posLayerErr) {
      await undoAfterMovementFailure(movementId)
      return {
        success: false,
        error: posLayerErr.message || "No se pudo registrar la capa de costo del stock inicial.",
      }
    }

    const { data: maxRow } = await supabase
      .from("accounting_entries")
      .select("entry_number")
      .eq("pop_id", popId)
      .order("entry_number", { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextNum =
      maxRow?.entry_number != null && Number.isFinite(Number(maxRow.entry_number))
        ? Number(maxRow.entry_number) + 1
        : 1

    const { data: entIns, error: entErr } = await supabase
      .from("accounting_entries")
      .insert({
        pop_id: popId,
        entry_number: nextNum,
        entry_date: entryDate,
        source_type: "inventory_initial",
        source_id: movementId,
        description: entryDescription,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single()
    if (entErr || !entIns?.id) {
      await undoAfterMovementFailure(movementId)
      return { success: false, error: entErr?.message || "No se pudo crear el asiento." }
    }
    const entryId = String(entIns.id)

    const lineMercaderias = {
      account_id: mercaderiasId,
      debit_amount: amount,
      credit_amount: 0,
      description: note,
      line_order: 1,
    }
    const lineOffset = {
      account_id: offsetId,
      debit_amount: 0,
      credit_amount: amount,
      description: note,
      line_order: 2,
    }

    const { error: linesErr } = await supabase.from("accounting_entry_lines").insert([
      lineMercaderias,
      lineOffset,
    ].map((l) => ({ ...l, entry_id: entryId })))
    if (linesErr) {
      await supabase.from("accounting_entries").delete().eq("id", entryId)
      await undoAfterMovementFailure(movementId)
      return { success: false, error: linesErr.message || "No se pudieron crear las líneas del asiento." }
    }

    const { error: postErr } = await supabase
      .from("accounting_entries")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        posted_by: user.id,
      })
      .eq("id", entryId)
    if (postErr) {
      await supabase.from("accounting_entries").delete().eq("id", entryId)
      await undoAfterMovementFailure(movementId)
      return { success: false, error: postErr.message || "No se pudo registrar el asiento." }
    }

    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getArticleInventoryBalance(
  popId: string,
  input: GetArticleInventoryBalanceInput,
): Promise<{ success: true; onHand: number } | { success: false; error: string }> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    const canReadBalance =
      permissionKeysInclude(
        snap.keys,
        POP_PERMS.INVENTORY_READ.resource,
        POP_PERMS.INVENTORY_READ.action,
      ) ||
      permissionKeysInclude(
        snap.keys,
        POP_PERMS.INVENTORY_CREATE.resource,
        POP_PERMS.INVENTORY_CREATE.action,
      )
    if (!canReadBalance) {
      return { success: false, error: "Sin permiso para consultar inventario." }
    }
    const popRes = await getPopById(popId)
    if (!popRes.success || !popRes.pop) {
      return { success: false, error: popRes.error || "No se pudo validar el punto de venta." }
    }
    if (!siteIdsMatchClientRoute(input.siteId, popRes.pop.siteId)) {
      return {
        success: false,
        error: "El sitio de la URL no coincide con el punto de venta.",
      }
    }
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Sesión requerida." }
    }
    return await sumInventoryOnHandForArticle(supabase, popId, input.articleId)
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
      ledgerTimeZone: string
      movements: InventoryMovementRow[]
      balances: InventoryBalanceRow[]
      costLayers: InventoryCostLayerRow[]
      layerAllocations: InventoryLayerAllocationRow[]
      articles: InventoryArticleOption[]
      canCreate: boolean
      canPostAdjustmentAccounting: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      popName?: string
      ledgerTimeZone?: string
      movements: InventoryMovementRow[]
      balances: InventoryBalanceRow[]
      costLayers: InventoryCostLayerRow[]
      layerAllocations: InventoryLayerAllocationRow[]
      articles: InventoryArticleOption[]
      canCreate: boolean
      canPostAdjustmentAccounting: boolean
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
    canPostAdjustmentAccounting: false,
    canUpdate: false,
    canDelete: false,
    ledgerTimeZone: "",
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
    const canPostAdjustmentAccounting =
      canCreate &&
      permissionKeysInclude(
        snap.keys,
        POP_PERMS.ACCOUNTS_CREATE.resource,
        POP_PERMS.ACCOUNTS_CREATE.action,
      ) &&
      permissionKeysInclude(
        snap.keys,
        POP_PERMS.ACCOUNTS_UPDATE.resource,
        POP_PERMS.ACCOUNTS_UPDATE.action,
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
    const ledgerTimeZone =
      popRes.success && popRes.pop
        ? timezoneForPopLedger(popRes.pop.country, popRes.pop.siteId)
        : "UTC"
    const supabase = await createClient()

    const { data: artRows, error: artErr } = await supabase
      .from("articles")
      .select("id, name, cost_price")
      .eq("pop_id", popId)
      .eq("is_active", true)
      .order("name", { ascending: true })
    if (artErr) {
      return {
        success: false,
        error: artErr.message || "No se pudieron cargar artículos.",
        ...empty,
        popName,
        ledgerTimeZone,
      }
    }
    const articles: InventoryArticleOption[] = (artRows || []).map((r) => ({
      id: String(r.id),
      name: String(r.name ?? ""),
      costPrice: roundMoney(Number(r.cost_price ?? 0)),
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
        ledgerTimeZone,
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
        ledgerTimeZone,
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
        ledgerTimeZone,
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
        ledgerTimeZone,
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
      ledgerTimeZone,
      movements,
      balances,
      costLayers,
      layerAllocations,
      articles,
      canCreate,
      canPostAdjustmentAccounting,
      canUpdate,
      canDelete,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message, ...empty }
  }
}
