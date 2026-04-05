"use server"

import {
  CHART_COSTO_VENTAS_CODES,
  CHART_IVA_PAGAR_CODES,
  CHART_MERCADERIAS_CODES,
  CHART_VENTAS_GRAVADAS_CODES,
} from "@/lib/argV3DefaultChartAccounts"
import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { getPopById, validatePopAccess } from "@/lib/popHelpers"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import {
  entryDateIsoInTimezone,
  timezoneForPopLedger,
} from "@/lib/entryDateTimezone"
import { createClient } from "@/utils/supabase/server"

const PAYMENT_KIND_ACCOUNT_FALLBACK: Record<string, readonly string[]> = {
  cash: ["1.1.1.01"],
  transfer: ["1.1.1.02"],
  card_debit: ["1.1.1.03"],
  card_credit: ["1.1.1.03"],
  other: ["1.1.1.04", "1.1.1.01"],
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

type FifoAllocationPlan = {
  layerId: string
  qty: number
  unitCost: number
  remainingBefore: number
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

async function resolveAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  popId: string,
  codes: readonly string[],
): Promise<string | null> {
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

type OpenCashContext = {
  sessionId: string
  cashRegisterId: string
}

async function resolveOpenCashSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  popId: string,
): Promise<
  | { success: true; ctx: OpenCashContext }
  | { success: false; error: string }
> {
  const { data: regs, error: regErr } = await supabase
    .from("cash_registers")
    .select("id")
    .eq("pop_id", popId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (regErr) {
    return { success: false, error: regErr.message || "No se pudieron leer las cajas." }
  }
  const { data: sessions, error: sessErr } = await supabase
    .from("cash_register_sessions")
    .select("id, cash_register_id")
    .eq("pop_id", popId)
    .eq("status", "open")
  if (sessErr) {
    return { success: false, error: sessErr.message || "No se pudieron leer sesiones de caja." }
  }
  const openByReg = new Map<string, string>()
  for (const s of sessions || []) {
    openByReg.set(String(s.cash_register_id), String(s.id))
  }
  for (const r of regs || []) {
    const rid = String(r.id)
    const sid = openByReg.get(rid)
    if (sid) {
      return {
        success: true,
        ctx: { sessionId: sid, cashRegisterId: rid },
      }
    }
  }
  return {
    success: false,
    error:
      "No hay sesión de caja abierta. Abrí una caja desde el menú Cajas antes de vender.",
  }
}

async function undoFifoSaleMovement(
  supabase: Awaited<ReturnType<typeof createClient>>,
  movementId: string,
  fifoAllocations: FifoAllocationPlan[],
) {
  await supabase
    .from("inventory_layer_allocations")
    .delete()
    .eq("inventory_movement_id", movementId)
  if (fifoAllocations.length > 0) {
    for (const a of fifoAllocations) {
      await supabase
        .from("inventory_cost_layers")
        .update({ quantity_remaining: a.remainingBefore })
        .eq("id", a.layerId)
    }
  }
  await supabase.from("inventory_movements").delete().eq("id", movementId)
}

async function cancelSaleRollback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  saleId: string,
  tracked: { id: string; fifo: FifoAllocationPlan[] }[],
) {
  for (const tm of tracked) {
    await undoFifoSaleMovement(supabase, tm.id, tm.fifo)
  }
  await supabase
    .from("sales")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", saleId)
}

async function cancelAccountingEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryId: string,
) {
  await supabase
    .from("accounting_entries")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", entryId)
}

export type CompleteSaleLineInput = {
  articleId: string
  quantity: number
  itemDiscountMode: "porcentaje" | "fijo"
  itemDiscountDraft: string
  comment?: string
}

export type CompleteSaleInput = {
  siteId: string
  lines: CompleteSaleLineInput[]
  clientId: string | null
  paymentMethodId: string
  generalDiscountMode: "porcentaje" | "fijo"
  valorDescuentoPorcentaje: number
  valorDescuentoFijo: number
  invoiceTypeLabel?: string | null
}

export async function completeSale(
  popId: string,
  input: CompleteSaleInput,
): Promise<{ success: true; saleId: string } | { success: false; error: string }> {
  const trackedMovements: {
    id: string
    fifo: FifoAllocationPlan[]
  }[] = []
  let saleIdForRollback: string | null = null
  let revenueEntryId: string | null = null

  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }

    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.SALE_CREATE.resource,
        POP_PERMS.SALE_CREATE.action,
      ) ||
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.SALE_UPDATE.resource,
        POP_PERMS.SALE_UPDATE.action,
      )
    ) {
      return {
        success: false,
        error:
          "Sin permiso para registrar o actualizar ventas (crear y actualizar).",
      }
    }
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.INVENTORY_CREATE.resource,
        POP_PERMS.INVENTORY_CREATE.action,
      )
    ) {
      return {
        success: false,
        error: "Sin permiso de inventario para descontar stock de la venta.",
      }
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
          "Se requiere permiso de cuentas (crear y actualizar asientos) para registrar la venta.",
      }
    }
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.CASH_REGISTER_READ.resource,
        POP_PERMS.CASH_REGISTER_READ.action,
      )
    ) {
      return {
        success: false,
        error:
          "Se requiere permiso para ver cajas y asociar la venta a una sesión abierta.",
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

    const linesIn = input.lines || []
    if (linesIn.length < 1) {
      return { success: false, error: "Agregá al menos un producto al pedido." }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Sesión requerida." }
    }

    const cashRes = await resolveOpenCashSession(supabase, popId)
    if (!cashRes.success) {
      return { success: false, error: cashRes.error }
    }
    const { sessionId: cashRegisterSessionId, cashRegisterId } = cashRes.ctx

    const pmId = input.paymentMethodId.trim()
    if (!pmId) {
      return { success: false, error: "Elegí un medio de pago." }
    }
    const { data: pmRow, error: pmErr } = await supabase
      .from("payment_methods")
      .select("id, kind, accounting_account_id")
      .eq("id", pmId)
      .eq("pop_id", popId)
      .eq("is_active", true)
      .maybeSingle()
    if (pmErr || !pmRow?.id) {
      return { success: false, error: "Medio de pago no válido en este punto." }
    }
    const pmKind = String(pmRow.kind ?? "other")
    let paymentAccountId: string | null = pmRow.accounting_account_id
      ? String(pmRow.accounting_account_id)
      : null
    if (!paymentAccountId) {
      const codes = PAYMENT_KIND_ACCOUNT_FALLBACK[pmKind] ?? PAYMENT_KIND_ACCOUNT_FALLBACK.other
      paymentAccountId = await resolveAccountId(supabase, popId, codes)
    }
    if (!paymentAccountId) {
      return {
        success: false,
        error:
          "Configurá una cuenta contable en el medio de pago o el plan de cuentas (caja/bancos) para registrar el cobro.",
      }
    }

    let clientName: string | null = null
    let clientTaxId: string | null = null
    if (input.clientId?.trim()) {
      const cid = input.clientId.trim()
      const { data: cl, error: clErr } = await supabase
        .from("clients")
        .select("id, name, tax_id")
        .eq("id", cid)
        .eq("pop_id", popId)
        .maybeSingle()
      if (clErr || !cl?.id) {
        return { success: false, error: "Cliente no encontrado en este punto." }
      }
      clientName = String(cl.name ?? "")
      clientTaxId = cl.tax_id ? String(cl.tax_id) : null
    }

    type BuiltLine = {
      articleId: string
      name: string
      qty: number
      unitPrice: number
      ivaPct: number
      itemDiscount: number
      lineBase: number
      comment: string | null
    }

    const built: BuiltLine[] = []
    for (const raw of linesIn) {
      const qty = parseQty(raw.quantity)
      if (qty <= 0 || qty > 100000) {
        return { success: false, error: "Hay cantidades inválidas en el pedido." }
      }
      const { data: art, error: aErr } = await supabase
        .from("articles")
        .select("id, name, sale_price, iva")
        .eq("id", raw.articleId)
        .eq("pop_id", popId)
        .eq("is_active", true)
        .maybeSingle()
      if (aErr || !art?.id) {
        return { success: false, error: "Uno de los artículos ya no está disponible." }
      }
      const unitPrice = roundMoney(Number(art.sale_price ?? 0))
      const ivaPct = Math.max(0, Number(art.iva ?? 0) || 0)
      const precioBase = roundMoney(unitPrice * qty)
      const draft = (raw.itemDiscountDraft ?? "").trim().replace(",", ".")
      const n = Number.parseFloat(draft)
      let itemDiscount = 0
      if (Number.isFinite(n) && n > 0) {
        const modo = raw.itemDiscountMode ?? "porcentaje"
        itemDiscount =
          modo === "porcentaje"
            ? roundMoney(precioBase * (Math.min(100, Math.max(0, n)) / 100))
            : roundMoney(Math.min(Math.max(0, n), precioBase))
      }
      const lineBase = roundMoney(precioBase - itemDiscount)
      if (lineBase < 0) {
        return { success: false, error: "Los importes de línea no son válidos." }
      }
      const com = raw.comment?.trim()
      built.push({
        articleId: String(art.id),
        name: String(art.name ?? ""),
        qty,
        unitPrice,
        ivaPct,
        itemDiscount,
        lineBase,
        comment: com ? com : null,
      })
    }

    const subtotalAfterItems = roundMoney(
      built.reduce((a, l) => a + l.lineBase, 0),
    )
    const genPct = Math.max(0, Math.min(100, Number(input.valorDescuentoPorcentaje) || 0))
    const genFijo = Math.max(0, Number(input.valorDescuentoFijo) || 0)
    let generalDiscount = 0
    if (input.generalDiscountMode === "porcentaje") {
      generalDiscount = roundMoney(subtotalAfterItems * (genPct / 100))
    } else {
      generalDiscount = roundMoney(Math.min(genFijo, subtotalAfterItems))
    }
    const discountTotal = roundMoney(
      built.reduce((a, l) => a + l.itemDiscount, 0) + generalDiscount,
    )

    const total = roundMoney(subtotalAfterItems - generalDiscount)
    if (total <= 0) {
      return { success: false, error: "El total de la venta debe ser mayor que cero." }
    }

    const scale =
      subtotalAfterItems > 0 ? roundMoney(total / subtotalAfterItems) : 1
    type FiscalLine = BuiltLine & { lineFinal: number; taxPart: number; netPart: number }
    const fiscalLines: FiscalLine[] = []
    let sumTax = 0
    let sumNet = 0
    for (const l of built) {
      const lineFinal = roundMoney(l.lineBase * scale)
      let taxPart = 0
      let netPart = lineFinal
      if (l.ivaPct > 0) {
        taxPart = roundMoney((lineFinal * l.ivaPct) / (100 + l.ivaPct))
        netPart = roundMoney(lineFinal - taxPart)
      }
      sumTax = roundMoney(sumTax + taxPart)
      sumNet = roundMoney(sumNet + netPart)
      fiscalLines.push({ ...l, lineFinal, taxPart, netPart })
    }

    let taxTotal = sumTax
    let subtotalNet = sumNet
    const drift = roundMoney(total - roundMoney(sumNet + sumTax))
    if (Math.abs(drift) >= 0.01 && fiscalLines.length > 0) {
      const last = fiscalLines[fiscalLines.length - 1]
      const adjNet = roundMoney(last.netPart + drift)
      fiscalLines[fiscalLines.length - 1] = {
        ...last,
        netPart: adjNet,
      }
      subtotalNet = roundMoney(
        fiscalLines.reduce((a, x) => a + x.netPart, 0),
      )
      taxTotal = roundMoney(total - subtotalNet)
    } else {
      taxTotal = roundMoney(sumTax)
      subtotalNet = roundMoney(total - taxTotal)
    }

    const lineItemsJson = fiscalLines.map((l) => ({
      article_id: l.articleId,
      quantity: l.qty,
      unit_price: l.unitPrice,
      iva: l.ivaPct,
      line_discount: roundMoney(
        l.itemDiscount +
          (subtotalAfterItems > 0
            ? generalDiscount * (l.lineBase / subtotalAfterItems)
            : 0),
      ),
      line_total: l.lineFinal,
      name_snapshot: l.name,
      comment: l.comment,
    }))

    const metadata: Record<string, unknown> = {}
    const invLabel = input.invoiceTypeLabel?.trim()
    if (invLabel) {
      metadata.invoice_type_label = invLabel
    }

    for (const l of built) {
      const oh = await sumInventoryOnHandForArticle(supabase, popId, l.articleId)
      if (!oh.success) {
        return { success: false, error: oh.error }
      }
      if (l.qty > oh.onHand + 1e-6) {
        return {
          success: false,
          error: `Stock insuficiente para «${l.name || "Artículo"}».`,
        }
      }
    }

    const { data: saleIns, error: saleErr } = await supabase
      .from("sales")
      .insert({
        pop_id: popId,
        client_id: input.clientId?.trim() || null,
        customer_name: clientName,
        customer_tax_id: clientTaxId,
        line_items: lineItemsJson,
        subtotal: subtotalNet,
        tax_total: taxTotal,
        discount_total: discountTotal,
        total,
        currency: "ARS",
        status: "draft",
        sold_at: new Date().toISOString(),
        cash_register_id: cashRegisterId,
        cash_register_session_id: cashRegisterSessionId,
        created_by: user.id,
        metadata,
      })
      .select("id")
      .single()

    if (saleErr || !saleIns?.id) {
      return {
        success: false,
        error: saleErr?.message || "No se pudo crear la venta.",
      }
    }
    const saleId = String(saleIns.id)
    saleIdForRollback = saleId

    const { error: payErr } = await supabase.from("sale_payments").insert({
      pop_id: popId,
      sale_id: saleId,
      payment_method_id: pmId,
      amount: total,
      sort_order: 0,
    })
    if (payErr) {
      await cancelSaleRollback(supabase, saleId, [])
      return { success: false, error: payErr.message || "No se pudo registrar el cobro." }
    }

    let cogsTotal = 0
    for (const l of built) {
      const qtyAbs = l.qty
      const delta = -qtyAbs
      const { data: artRow } = await supabase
        .from("articles")
        .select("id, name, cost_price")
        .eq("id", l.articleId)
        .eq("pop_id", popId)
        .maybeSingle()
      const articleName = String(artRow?.name ?? l.name ?? "")
      const articleCostRef = roundMoney(Number(artRow?.cost_price ?? 0))

      const { data: layerRows, error: lrErr } = await supabase
        .from("inventory_cost_layers")
        .select("id, quantity_remaining, unit_cost, received_at")
        .eq("pop_id", popId)
        .eq("article_id", l.articleId)
        .gt("quantity_remaining", 0)
        .order("received_at", { ascending: true })
      if (lrErr) {
        await cancelSaleRollback(supabase, saleId, trackedMovements)
        return { success: false, error: lrErr.message || "No se pudieron leer capas de costo." }
      }
      const layers = layerRows || []
      let amount = 0
      let fifoAllocations: FifoAllocationPlan[] = []

      if (layers.length === 0) {
        const u = articleCostRef > 0 ? articleCostRef : null
        if (u == null || u <= 0) {
          await cancelSaleRollback(supabase, saleId, trackedMovements)
          return {
            success: false,
            error: `Configurá precio de costo en «${articleName}» para valorar la salida de stock.`,
          }
        }
        amount = roundMoney(qtyAbs * u)
      } else {
        let need = qtyAbs
        let totalCost = 0
        const plans: FifoAllocationPlan[] = []
        for (const row of layers) {
          if (need <= 0) break
          const rem = parseQty(row.quantity_remaining)
          if (rem <= 0) continue
          const take = Math.min(need, rem)
          const uc = parseQty(row.unit_cost)
          totalCost += roundMoney(take * uc)
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
            await cancelSaleRollback(supabase, saleId, trackedMovements)
            return {
              success: false,
              error: `Configurá precio de costo en «${articleName}» para el remanente FIFO.`,
            }
          }
          totalCost += roundMoney(need * u)
        }
        amount = roundMoney(totalCost)
        fifoAllocations = plans
      }

      if (amount <= 0) {
        await cancelSaleRollback(supabase, saleId, trackedMovements)
        return {
          success: false,
          error: `No se pudo valorar el costo de «${articleName}».`,
        }
      }

      const note = `Venta — ${articleName}`
      const { data: movIns, error: movErr } = await supabase
        .from("inventory_movements")
        .insert({
          pop_id: popId,
          article_id: l.articleId,
          quantity_delta: delta,
          movement_type: "sale",
          sale_id: saleId,
          note,
          created_by: user.id,
        })
        .select("id")
        .single()
      if (movErr || !movIns?.id) {
        await cancelSaleRollback(supabase, saleId, trackedMovements)
        return { success: false, error: movErr?.message || "No se pudo registrar el movimiento de stock." }
      }
      const movementId = String(movIns.id)
      trackedMovements.push({ id: movementId, fifo: fifoAllocations })

      if (fifoAllocations.length > 0) {
        for (const a of fifoAllocations) {
          const { error: allocInsErr } = await supabase
            .from("inventory_layer_allocations")
            .insert({
              pop_id: popId,
              layer_id: a.layerId,
              article_id: l.articleId,
              inventory_movement_id: movementId,
              quantity: a.qty,
              unit_cost: a.unitCost,
            })
          if (allocInsErr) {
            await cancelSaleRollback(supabase, saleId, trackedMovements)
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
            await cancelSaleRollback(supabase, saleId, trackedMovements)
            return {
              success: false,
              error: layUpdErr.message || "No se pudo actualizar la capa de costo.",
            }
          }
        }
      }

      cogsTotal = roundMoney(cogsTotal + amount)
    }

    const tz = timezoneForPopLedger(popRes.pop.country, popRes.pop.siteId)
    const entryDate = entryDateIsoInTimezone(tz)

    const ventasId = await resolveAccountId(supabase, popId, CHART_VENTAS_GRAVADAS_CODES)
    if (!ventasId) {
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return {
        success: false,
        error: "No hay cuenta de ventas (p. ej. 4.1.1.01) en el plan de cuentas.",
      }
    }

    const ivaId =
      taxTotal > 0
        ? await resolveAccountId(supabase, popId, CHART_IVA_PAGAR_CODES)
        : null
    if (taxTotal > 0 && !ivaId) {
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return {
        success: false,
        error: "No hay cuenta de IVA a pagar (p. ej. 2.1.2.01) en el plan de cuentas.",
      }
    }

    const mercaderiasId = await resolveAccountId(supabase, popId, CHART_MERCADERIAS_CODES)
    const costoVentasId = await resolveAccountId(supabase, popId, CHART_COSTO_VENTAS_CODES)
    if (cogsTotal > 0 && (!mercaderiasId || !costoVentasId)) {
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return {
        success: false,
        error:
          "No hay cuenta de mercaderías o costo de ventas (p. ej. 1.1.3.01 / 5.1.1.01) en el plan de cuentas.",
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

    const entryDescription = `Venta registrada`
    const { data: entIns, error: entErr } = await supabase
      .from("accounting_entries")
      .insert({
        pop_id: popId,
        entry_number: nextNum,
        entry_date: entryDate,
        source_type: "sale",
        source_id: saleId,
        description: entryDescription,
        status: "draft",
        created_by: user.id,
      })
      .select("id")
      .single()
    if (entErr || !entIns?.id) {
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return { success: false, error: entErr?.message || "No se pudo crear el asiento contable." }
    }
    revenueEntryId = String(entIns.id)

    const linesPayload: {
      account_id: string
      debit_amount: number
      credit_amount: number
      description: string | null
      line_order: number
    }[] = [
      {
        account_id: paymentAccountId,
        debit_amount: total,
        credit_amount: 0,
        description: entryDescription,
        line_order: 1,
      },
      {
        account_id: ventasId,
        debit_amount: 0,
        credit_amount: subtotalNet,
        description: entryDescription,
        line_order: 2,
      },
    ]
    let order = 3
    if (taxTotal > 0 && ivaId) {
      linesPayload.push({
        account_id: ivaId,
        debit_amount: 0,
        credit_amount: taxTotal,
        description: entryDescription,
        line_order: order,
      })
      order += 1
    }
    if (cogsTotal > 0 && mercaderiasId && costoVentasId) {
      linesPayload.push(
        {
          account_id: costoVentasId,
          debit_amount: cogsTotal,
          credit_amount: 0,
          description: "Costo de mercaderías vendidas",
          line_order: order,
        },
        {
          account_id: mercaderiasId,
          debit_amount: 0,
          credit_amount: cogsTotal,
          description: "Costo de mercaderías vendidas",
          line_order: order + 1,
        },
      )
    }

    const { error: linesErr } = await supabase.from("accounting_entry_lines").insert(
      linesPayload.map((row) => ({ ...row, entry_id: revenueEntryId })),
    )
    if (linesErr) {
      await cancelAccountingEntry(supabase, revenueEntryId)
      revenueEntryId = null
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return { success: false, error: linesErr.message || "No se pudieron crear las líneas del asiento." }
    }

    const { error: postErr } = await supabase
      .from("accounting_entries")
      .update({
        status: "posted",
        posted_at: new Date().toISOString(),
        posted_by: user.id,
      })
      .eq("id", revenueEntryId)
    if (postErr) {
      await cancelAccountingEntry(supabase, revenueEntryId)
      revenueEntryId = null
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return { success: false, error: postErr.message || "No se pudo registrar el asiento." }
    }

    const { error: compErr } = await supabase
      .from("sales")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", saleId)
    if (compErr) {
      await cancelAccountingEntry(supabase, revenueEntryId)
      revenueEntryId = null
      await cancelSaleRollback(supabase, saleId, trackedMovements)
      return { success: false, error: compErr.message || "No se pudo completar la venta." }
    }

    return { success: true, saleId }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}
