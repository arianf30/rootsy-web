"use server"

import {
  CHART_ARQUEO_SOBRANTE_INGRESO_CODES,
  CHART_CAJA_EFECTIVO_CODES,
  CHART_DIFERENCIA_ARQUEO_GASTO_CODES,
} from "@/lib/argV3DefaultChartAccounts"
import {
  entryDateIsoInTimezone,
  timezoneForPopLedger,
} from "@/lib/entryDateTimezone"
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
  removeCashRegisterArcaPemFiles,
  uploadCashRegisterArcaPemFiles,
} from "@/lib/rootsyAfipStorage"
import { createClient } from "@/utils/supabase/server"

/** Totales del turno abierto en la tarjeta de caja (y coherente con el arqueo). */
export type CashRegisterOpenSessionTotals = {
  openingCash: number
  ventasEfectivo: number
  ingresosCajon: number
  egresosCajon: number
  efectivoTeoricoEnCajon: number
  /** Suma de ventas completadas del turno (todas las formas de pago). Requiere `sale:read`. */
  totalCobradoTurno: number | null
  /** Cobros del turno por medio de pago. Requiere `sale:read`. */
  cobrosPorMedio: { name: string; kind: string; total: number }[] | null
}

export type CashRegisterRow = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  openSessionId: string | null
  /** Efectivo teórico en cajón si hay turno abierto (apertura + ventas efectivo + cajón). */
  cashBalance: number | null
  openedAt: string | null
  openSessionTotals: CashRegisterOpenSessionTotals | null
  arcaPtoVta: number | null
  arcaCertificateSecretName: string | null
  arcaCertificateLastFour: string | null
  /** YYYY-MM-DD */
  arcaCertificateExpiresAt: string | null
  arcaCrtUploadedAt: string | null
  arcaKeyUploadedAt: string | null
}

export type PaymentMethodOption = {
  id: string
  name: string
  sortOrder: number
  kind: string
}

export type ClosingSnapshot = {
  cash: number
  payment_methods: Record<string, number>
  note?: string | null
}

export type CashRegisterSummaryMovement = {
  id: string
  sessionId: string
  sessionOpenedAt: string
  createdAt: string
  kind: "deposit" | "withdrawal"
  amount: number
  note: string | null
  createdBy: string | null
}

export type CashRegisterSummarySession = {
  id: string
  status: "open" | "closed"
  openedAt: string
  closedAt: string | null
  openingCash: number
  openingNote: string | null
  closingSnapshot: ClosingSnapshot | null
  movementDeposits: number
  movementWithdrawals: number
}

export type CashRegisterSummaryClosingBlock = {
  sessionId: string
  openedAt: string
  closedAt: string | null
  lines: { label: string; amount: number }[]
}

export type CashRegisterSummarySale = {
  id: string
  cashRegisterSessionId: string
  soldAt: string
  total: number
  status: string
  createdBy: string | null
  customerName: string | null
  currency: string
}

export type CashRegisterArqueoVentaPorMedio = {
  paymentMethodId: string
  name: string
  kind: string
  /** Suma de cobros en ventas completadas (esta caja, histórico). */
  totalVentas: number
}

export type CashRegisterArqueoSesionAbierta = {
  sessionId: string
  openingCash: number
  ventasEfectivo: number
  ingresosCajon: number
  egresosCajon: number
  /** Efectivo que debería haber en cajón: apertura + ventas efectivo + ingresos − egresos. */
  efectivoTeoricoEnCajon: number
}

export type CashRegisterSummaryData = {
  registerName: string
  sessions: CashRegisterSummarySession[]
  movements: CashRegisterSummaryMovement[]
  /** false si el usuario no tiene permiso `sale:read` (no se listan ventas). */
  salesIncluded: boolean
  sales: CashRegisterSummarySale[]
  /** Totales por medio de pago desde ventas; efectivo teórico del turno abierto. */
  arqueo: {
    ventasPorMedioPago: CashRegisterArqueoVentaPorMedio[]
    sesionAbierta: CashRegisterArqueoSesionAbierta | null
  } | null
  totals: {
    depositTotal: number
    withdrawalTotal: number
    netCashMovements: number
  }
  closingBlocks: CashRegisterSummaryClosingBlock[]
  aggregatedClosingLines: { label: string; amount: number }[]
}

function parseAmount(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

async function resolveAccountIdByCodes(
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

async function cancelAccountingEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entryId: string,
) {
  await supabase
    .from("accounting_entries")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", entryId)
}

async function computeEfectivoTeoricoSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  popId: string,
  sessionId: string,
): Promise<
  | {
      success: true
      teorico: number
      openingCash: number
      ventasEfectivo: number
      ingresosCajon: number
      egresosCajon: number
    }
  | { success: false; error: string }
> {
  const { data: sess, error: se } = await supabase
    .from("cash_register_sessions")
    .select("id, opening_cash, status")
    .eq("id", sessionId)
    .eq("pop_id", popId)
    .maybeSingle()
  if (se || !sess?.id) {
    return { success: false, error: "No se pudo leer la sesión de caja." }
  }
  if (String(sess.status) !== "open") {
    return { success: false, error: "La sesión no está abierta." }
  }
  const openingCash = parseAmount(sess.opening_cash)
  const { data: pmRows } = await supabase
    .from("payment_methods")
    .select("id, kind")
    .eq("pop_id", popId)
  const pmKinds = new Map<string, string>()
  for (const p of pmRows || []) {
    pmKinds.set(String(p.id), String(p.kind ?? "other"))
  }
  const { data: saleRows } = await supabase
    .from("sales")
    .select("id")
    .eq("pop_id", popId)
    .eq("cash_register_session_id", sessionId)
    .eq("status", "completed")
  const saleIds = (saleRows || []).map((r) => String(r.id))
  let ventasEfectivo = 0
  if (saleIds.length > 0) {
    const { data: osp } = await supabase
      .from("sale_payments")
      .select("payment_method_id, amount")
      .eq("pop_id", popId)
      .in("sale_id", saleIds)
    for (const row of osp || []) {
      const kind = pmKinds.get(String(row.payment_method_id))
      if (kind === "cash") {
        ventasEfectivo += parseAmount(row.amount)
      }
    }
  }
  ventasEfectivo = Math.round(ventasEfectivo * 100) / 100
  const { data: movs } = await supabase
    .from("cash_register_movements")
    .select("kind, amount")
    .eq("session_id", sessionId)
    .eq("pop_id", popId)
  let ing = 0
  let eg = 0
  for (const m of movs || []) {
    const amt = parseAmount(m.amount)
    if (String(m.kind) === "deposit") ing += amt
    else if (String(m.kind) === "withdrawal") eg += amt
  }
  ing = Math.round(ing * 100) / 100
  eg = Math.round(eg * 100) / 100
  const teorico =
    Math.round((openingCash + ventasEfectivo + ing - eg) * 100) / 100
  return {
    success: true,
    teorico,
    openingCash,
    ventasEfectivo,
    ingresosCajon: ing,
    egresosCajon: eg,
  }
}

function parseClosingSnapshot(raw: unknown): ClosingSnapshot | null {
  if (!raw || typeof raw !== "object") return null
  const o = raw as Record<string, unknown>
  const cash = parseAmount(o.cash)
  const pm: Record<string, number> = {}
  const pms = o.payment_methods
  if (pms && typeof pms === "object" && !Array.isArray(pms)) {
    for (const [k, v] of Object.entries(pms as Record<string, unknown>)) {
      pm[k] = parseAmount(v)
    }
  }
  const note = typeof o.note === "string" ? o.note : null
  return { cash, payment_methods: pm, note: note ?? undefined }
}

function looksLikePemCert(s: string): boolean {
  const t = s.trim()
  return t.includes("BEGIN CERTIFICATE") && t.includes("END CERTIFICATE")
}

function looksLikePemKey(s: string): boolean {
  const t = s.trim()
  return (
    (t.includes("BEGIN RSA PRIVATE KEY") ||
      t.includes("BEGIN PRIVATE KEY") ||
      t.includes("BEGIN EC PRIVATE KEY")) &&
    t.includes("END")
  )
}

async function computeCashBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sessionId: string,
  openingCash: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("cash_register_movements")
    .select("kind, amount")
    .eq("session_id", sessionId)
  if (error || !data) return openingCash
  let bal = openingCash
  for (const row of data) {
    const amt = parseAmount(row.amount)
    if (String(row.kind) === "deposit") bal += amt
    else if (String(row.kind) === "withdrawal") bal -= amt
  }
  return Math.round(bal * 100) / 100
}

async function loadCobrosTurnoPorMedio(
  supabase: Awaited<ReturnType<typeof createClient>>,
  popId: string,
  sessionId: string,
): Promise<{
  totalCobrado: number
  porMedio: { name: string; kind: string; total: number }[]
}> {
  const { data: saleRows } = await supabase
    .from("sales")
    .select("id, total")
    .eq("pop_id", popId)
    .eq("cash_register_session_id", sessionId)
    .eq("status", "completed")
  let totalCobrado = 0
  for (const s of saleRows || []) {
    totalCobrado += parseAmount(s.total)
  }
  totalCobrado = Math.round(totalCobrado * 100) / 100
  const saleIds = (saleRows || []).map((r) => String(r.id))
  if (saleIds.length === 0) {
    return { totalCobrado: 0, porMedio: [] }
  }
  const { data: pmMeta } = await supabase
    .from("payment_methods")
    .select("id, name, kind")
    .eq("pop_id", popId)
  const pmNames = new Map<string, string>()
  const pmKinds = new Map<string, string>()
  for (const p of pmMeta || []) {
    const id = String(p.id)
    pmNames.set(id, String(p.name ?? ""))
    pmKinds.set(id, String(p.kind ?? "other"))
  }
  const { data: spRows } = await supabase
    .from("sale_payments")
    .select("payment_method_id, amount")
    .eq("pop_id", popId)
    .in("sale_id", saleIds)
  const sums = new Map<string, number>()
  for (const row of spRows || []) {
    const pid = String(row.payment_method_id)
    sums.set(pid, (sums.get(pid) ?? 0) + parseAmount(row.amount))
  }
  const porMedio = [...sums.entries()]
    .map(([paymentMethodId, total]) => ({
      name: pmNames.get(paymentMethodId) ?? paymentMethodId,
      kind: pmKinds.get(paymentMethodId) ?? "other",
      total: Math.round(total * 100) / 100,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
  return { totalCobrado, porMedio }
}

export async function getCashRegistersPageData(popId: string): Promise<
  | {
      success: true
      popName: string
      registers: CashRegisterRow[]
      paymentMethods: PaymentMethodOption[]
      canRead: boolean
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | { success: false; error: string; redirect?: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso", redirect: "/home" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    const canRead = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CASH_REGISTER_READ.resource,
      POP_PERMS.CASH_REGISTER_READ.action,
    )
    if (!canRead) {
      return {
        success: false,
        error: "You do not have permission to view cash registers.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CASH_REGISTER_CREATE.resource,
      POP_PERMS.CASH_REGISTER_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CASH_REGISTER_UPDATE.resource,
      POP_PERMS.CASH_REGISTER_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.CASH_REGISTER_DELETE.resource,
      POP_PERMS.CASH_REGISTER_DELETE.action,
    )
    const canReadSales = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SALE_READ.resource,
      POP_PERMS.SALE_READ.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data: regs, error: regErr } = await supabase
      .from("cash_registers")
      .select(
        "id, name, sort_order, is_active, arca_pto_vta, arca_certificate_secret_name, arca_certificate_last_four, arca_certificate_expires_at, arca_certificate_crt_uploaded_at, arca_certificate_key_uploaded_at",
      )
      .eq("pop_id", popId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
    if (regErr) {
      return { success: false, error: regErr.message || "Could not load registers." }
    }
    const { data: openSessions, error: sessErr } = await supabase
      .from("cash_register_sessions")
      .select("id, cash_register_id, opening_cash, opened_at")
      .eq("pop_id", popId)
      .eq("status", "open")
    if (sessErr) {
      return { success: false, error: sessErr.message || "Could not load sessions." }
    }
    const openByRegister = new Map<
      string,
      { id: string; opening_cash: number; opened_at: string }
    >()
    for (const s of openSessions || []) {
      const rid = String(s.cash_register_id)
      openByRegister.set(rid, {
        id: String(s.id),
        opening_cash: parseAmount(s.opening_cash),
        opened_at: String(s.opened_at ?? ""),
      })
    }
    const registers: CashRegisterRow[] = []
    for (const r of regs || []) {
      const id = String(r.id)
      const open = openByRegister.get(id)
      let cashBalance: number | null = null
      let openSessionId: string | null = null
      let openedAt: string | null = null
      let openSessionTotals: CashRegisterOpenSessionTotals | null = null
      if (open) {
        openSessionId = open.id
        openedAt = open.opened_at
        const ef = await computeEfectivoTeoricoSession(supabase, popId, open.id)
        if (ef.success) {
          cashBalance = ef.teorico
          let totalCobradoTurno: number | null = null
          let cobrosPorMedio: CashRegisterOpenSessionTotals["cobrosPorMedio"] =
            null
          if (canReadSales) {
            const cob = await loadCobrosTurnoPorMedio(
              supabase,
              popId,
              open.id,
            )
            totalCobradoTurno = cob.totalCobrado
            cobrosPorMedio = cob.porMedio
          }
          openSessionTotals = {
            openingCash: ef.openingCash,
            ventasEfectivo: ef.ventasEfectivo,
            ingresosCajon: ef.ingresosCajon,
            egresosCajon: ef.egresosCajon,
            efectivoTeoricoEnCajon: ef.teorico,
            totalCobradoTurno,
            cobrosPorMedio,
          }
        } else {
          cashBalance = await computeCashBalance(
            supabase,
            open.id,
            open.opening_cash,
          )
        }
      }
      registers.push({
        id,
        name: String(r.name ?? ""),
        sortOrder: Number(r.sort_order ?? 0) || 0,
        isActive: Boolean(r.is_active),
        openSessionId,
        cashBalance,
        openedAt,
        openSessionTotals,
        arcaPtoVta:
          r.arca_pto_vta != null && Number.isFinite(Number(r.arca_pto_vta))
            ? Number(r.arca_pto_vta)
            : null,
        arcaCertificateSecretName:
          r.arca_certificate_secret_name != null
            ? String(r.arca_certificate_secret_name)
            : null,
        arcaCertificateLastFour:
          r.arca_certificate_last_four != null
            ? String(r.arca_certificate_last_four)
            : null,
        arcaCertificateExpiresAt:
          r.arca_certificate_expires_at != null
            ? String(r.arca_certificate_expires_at).slice(0, 10)
            : null,
        arcaCrtUploadedAt:
          r.arca_certificate_crt_uploaded_at != null
            ? String(r.arca_certificate_crt_uploaded_at)
            : null,
        arcaKeyUploadedAt:
          r.arca_certificate_key_uploaded_at != null
            ? String(r.arca_certificate_key_uploaded_at)
            : null,
      })
    }
    let paymentMethods: PaymentMethodOption[] = []
    const { data: pmRows } = await supabase
      .from("payment_methods")
      .select("id, name, sort_order, kind")
      .eq("pop_id", popId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    if (pmRows) {
      paymentMethods = pmRows.map((p) => ({
        id: String(p.id),
        name: String(p.name ?? ""),
        sortOrder: Number(p.sort_order ?? 0) || 0,
        kind: String(p.kind ?? "other"),
      }))
    }
    return {
      success: true,
      popName,
      registers,
      paymentMethods,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function createCashRegister(
  popId: string,
  input: { name: string; sortOrder: number },
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
        POP_PERMS.CASH_REGISTER_CREATE.resource,
        POP_PERMS.CASH_REGISTER_CREATE.action,
      )
    ) {
      return { success: false, error: "No permission to create registers." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "Name is required." }
    }
    const sortOrder = Math.trunc(Number(input.sortOrder))
    if (!Number.isFinite(sortOrder)) {
      return { success: false, error: "Invalid sort order." }
    }
    const supabase = await createClient()
    const { error } = await supabase.from("cash_registers").insert({
      pop_id: popId,
      name,
      sort_order: sortOrder,
      is_active: true,
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

export async function updateCashRegister(
  popId: string,
  registerId: string,
  input: {
    name: string
    sortOrder: number
    isActive: boolean
    arcaPtoVta: number | null
    arcaCertificateSecretName: string | null
    arcaCertificateLastFour: string | null
    /** YYYY-MM-DD o vacío → null */
    arcaCertificateExpiresAt: string | null
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
        POP_PERMS.CASH_REGISTER_UPDATE.resource,
        POP_PERMS.CASH_REGISTER_UPDATE.action,
      )
    ) {
      return { success: false, error: "No permission to update." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "Name is required." }
    }
    const sortOrder = Math.trunc(Number(input.sortOrder))
    if (!Number.isFinite(sortOrder)) {
      return { success: false, error: "Invalid sort order." }
    }
    const pto = input.arcaPtoVta
    if (
      pto != null &&
      (!Number.isFinite(pto) || pto < 0 || pto > 99999)
    ) {
      return { success: false, error: "Punto de venta inválido (0–99999)." }
    }
    const supabase = await createClient()
    const secretTrim = input.arcaCertificateSecretName?.trim() ?? ""
    const lastFourTrim = input.arcaCertificateLastFour?.trim() ?? ""
    const expRaw = input.arcaCertificateExpiresAt?.trim() ?? ""
    const arca_certificate_expires_at =
      expRaw.length > 0 ? expRaw.slice(0, 10) : null
    const { error } = await supabase
      .from("cash_registers")
      .update({
        name,
        sort_order: sortOrder,
        is_active: input.isActive,
        arca_pto_vta: pto,
        arca_certificate_secret_name: secretTrim.length > 0 ? secretTrim : null,
        arca_certificate_last_four: lastFourTrim.length > 0 ? lastFourTrim : null,
        arca_certificate_expires_at,
      })
      .eq("id", registerId)
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

export async function uploadCashRegisterArcaCertificates(
  popId: string,
  registerId: string,
  formData: FormData,
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
        POP_PERMS.CASH_REGISTER_UPDATE.resource,
        POP_PERMS.CASH_REGISTER_UPDATE.action,
      )
    ) {
      return { success: false, error: "No permission to update." }
    }
    const crt = formData.get("crt")
    const key = formData.get("key")
    if (!(crt instanceof File) || !(key instanceof File)) {
      return {
        success: false,
        error: "Subí el archivo .crt y el .key (ambos).",
      }
    }
    if (crt.size === 0 || key.size === 0) {
      return { success: false, error: "Los archivos no pueden estar vacíos." }
    }
    const certText = Buffer.from(await crt.arrayBuffer()).toString("utf8")
    const keyText = Buffer.from(await key.arrayBuffer()).toString("utf8")
    if (!looksLikePemCert(certText)) {
      return {
        success: false,
        error: "El .crt no parece un PEM de certificado válido.",
      }
    }
    if (!looksLikePemKey(keyText)) {
      return {
        success: false,
        error: "El .key no parece una clave privada PEM válida.",
      }
    }
    const up = await uploadCashRegisterArcaPemFiles({
      popId,
      registerId,
      certPemUtf8: certText,
      keyPemUtf8: keyText,
    })
    if (!up.success) return up
    const expField = formData.get("expiresAt")
    const expStr =
      typeof expField === "string" && expField.trim().length > 0
        ? expField.trim().slice(0, 10)
        : null
    const now = new Date().toISOString()
    const supabase = await createClient()
    const { error } = await supabase
      .from("cash_registers")
      .update({
        arca_certificate_crt_uploaded_at: now,
        arca_certificate_key_uploaded_at: now,
        arca_certificate_expires_at: expStr,
      })
      .eq("id", registerId)
      .eq("pop_id", popId)
    if (error) {
      return { success: false, error: error.message || "Could not save metadata." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    if (
      message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      message.includes("URL de Supabase")
    ) {
      return {
        success: false,
        error:
          "Falta configurar el almacenamiento en el servidor (SUPABASE_SERVICE_ROLE_KEY).",
      }
    }
    return { success: false, error: message }
  }
}

export async function deleteCashRegister(
  popId: string,
  registerId: string,
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
        POP_PERMS.CASH_REGISTER_DELETE.resource,
        POP_PERMS.CASH_REGISTER_DELETE.action,
      )
    ) {
      return { success: false, error: "No permission to delete." }
    }
    const supabase = await createClient()
    const { data: open } = await supabase
      .from("cash_register_sessions")
      .select("id")
      .eq("pop_id", popId)
      .eq("cash_register_id", registerId)
      .eq("status", "open")
      .maybeSingle()
    if (open) {
      return {
        success: false,
        error: "Close the register before deleting it.",
      }
    }
    const { error } = await supabase
      .from("cash_registers")
      .delete()
      .eq("id", registerId)
      .eq("pop_id", popId)
    if (error) {
      return { success: false, error: error.message || "Could not delete." }
    }
    try {
      await removeCashRegisterArcaPemFiles(popId, registerId)
    } catch {
      /* best-effort: borrar objetos del bucket */
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function openCashSession(
  popId: string,
  registerId: string,
  openingCash: number,
  openingNote?: string | null,
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
        POP_PERMS.CASH_REGISTER_CREATE.resource,
        POP_PERMS.CASH_REGISTER_CREATE.action,
      )
    ) {
      return { success: false, error: "No permission to open a session." }
    }
    const cash = parseAmount(openingCash)
    if (cash < 0) {
      return { success: false, error: "Opening cash cannot be negative." }
    }
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Not authenticated." }
    }
    const noteTrim = openingNote?.trim() ?? ""
    const { error } = await supabase.from("cash_register_sessions").insert({
      pop_id: popId,
      cash_register_id: registerId,
      status: "open",
      opened_by: user.id,
      opening_cash: cash,
      note: noteTrim.length > 0 ? noteTrim : null,
    })
    if (error) {
      return { success: false, error: error.message || "Could not open session." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function closeCashSession(
  popId: string,
  sessionId: string,
  snapshot: ClosingSnapshot,
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
        POP_PERMS.CASH_REGISTER_UPDATE.resource,
        POP_PERMS.CASH_REGISTER_UPDATE.action,
      )
    ) {
      return { success: false, error: "No permission to close a session." }
    }
    const cash = parseAmount(snapshot.cash)
    if (cash < 0) {
      return { success: false, error: "Cash total cannot be negative." }
    }
    const pm: Record<string, number> = {}
    for (const [k, v] of Object.entries(snapshot.payment_methods ?? {})) {
      const n = parseAmount(v)
      if (n < 0) {
        return { success: false, error: "Amounts cannot be negative." }
      }
      pm[k] = n
    }
    const closeNote = snapshot.note?.trim() ?? ""
    const closing_snapshot: Record<string, unknown> = {
      cash,
      payment_methods: pm,
    }
    if (closeNote.length > 0) {
      closing_snapshot.note = closeNote
    }
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Not authenticated." }
    }

    const teorRes = await computeEfectivoTeoricoSession(
      supabase,
      popId,
      sessionId,
    )
    if (!teorRes.success) {
      return { success: false, error: teorRes.error }
    }
    const counted = cash
    const teorico = teorRes.teorico
    const diff = Math.round((counted - teorico) * 100) / 100
    const absDiff = Math.abs(diff)
    let arqueoEntryId: string | null = null

    if (absDiff >= 0.01) {
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
            "Hay diferencia de arqueo en efectivo y se requiere permiso de cuentas (crear y actualizar asientos) para registrarla.",
        }
      }
      const popRes = await getPopById(popId)
      if (!popRes.success || !popRes.pop) {
        return {
          success: false,
          error: popRes.error || "No se pudo validar el punto de venta.",
        }
      }
      const cajaId = await resolveAccountIdByCodes(
        supabase,
        popId,
        CHART_CAJA_EFECTIVO_CODES,
      )
      if (!cajaId) {
        return {
          success: false,
          error:
            "No hay cuenta Caja (p. ej. 1.1.1.01) en el plan de cuentas para el arqueo.",
        }
      }
      const tz = timezoneForPopLedger(popRes.pop.country, popRes.pop.siteId)
      const entryDate = entryDateIsoInTimezone(tz)
      const descBase =
        diff < 0
          ? `Faltante de arqueo de caja (${absDiff.toFixed(2)})`
          : `Sobrante de arqueo de caja (${absDiff.toFixed(2)})`

      let line1: {
        account_id: string
        debit_amount: number
        credit_amount: number
        description: string | null
        line_order: number
      }
      let line2: typeof line1

      if (diff < 0) {
        const gastoId = await resolveAccountIdByCodes(
          supabase,
          popId,
          CHART_DIFERENCIA_ARQUEO_GASTO_CODES,
        )
        if (!gastoId) {
          return {
            success: false,
            error:
              "No hay cuenta de gasto para diferencias de arqueo (p. ej. 6.1.1.05) en el plan de cuentas.",
          }
        }
        line1 = {
          account_id: gastoId,
          debit_amount: absDiff,
          credit_amount: 0,
          description: descBase,
          line_order: 1,
        }
        line2 = {
          account_id: cajaId,
          debit_amount: 0,
          credit_amount: absDiff,
          description: descBase,
          line_order: 2,
        }
      } else {
        const ingresoId = await resolveAccountIdByCodes(
          supabase,
          popId,
          CHART_ARQUEO_SOBRANTE_INGRESO_CODES,
        )
        if (!ingresoId) {
          return {
            success: false,
            error:
              "No hay cuenta de otros ingresos (p. ej. 4.2.1.01) en el plan de cuentas.",
          }
        }
        line1 = {
          account_id: cajaId,
          debit_amount: absDiff,
          credit_amount: 0,
          description: descBase,
          line_order: 1,
        }
        line2 = {
          account_id: ingresoId,
          debit_amount: 0,
          credit_amount: absDiff,
          description: descBase,
          line_order: 2,
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
          source_type: "cash_register_close",
          source_id: sessionId,
          description: descBase,
          status: "draft",
          created_by: user.id,
        })
        .select("id")
        .single()
      if (entErr || !entIns?.id) {
        return {
          success: false,
          error: entErr?.message || "No se pudo crear el asiento de arqueo.",
        }
      }
      arqueoEntryId = String(entIns.id)

      const { error: linesErr } = await supabase.from("accounting_entry_lines").insert([
        { ...line1, entry_id: arqueoEntryId },
        { ...line2, entry_id: arqueoEntryId },
      ])
      if (linesErr) {
        await cancelAccountingEntry(supabase, arqueoEntryId)
        return {
          success: false,
          error: linesErr.message || "No se pudo registrar el asiento de arqueo.",
        }
      }

      const { error: postErr } = await supabase
        .from("accounting_entries")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
          posted_by: user.id,
        })
        .eq("id", arqueoEntryId)
      if (postErr) {
        await cancelAccountingEntry(supabase, arqueoEntryId)
        return {
          success: false,
          error: postErr.message || "No se pudo registrar el asiento de arqueo.",
        }
      }
    }

    const { data: closedRow, error } = await supabase
      .from("cash_register_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: user.id,
        closing_snapshot,
      })
      .eq("id", sessionId)
      .eq("pop_id", popId)
      .eq("status", "open")
      .select("id")
      .maybeSingle()
    if (error) {
      if (arqueoEntryId) {
        await cancelAccountingEntry(supabase, arqueoEntryId)
      }
      return { success: false, error: error.message || "Could not close session." }
    }
    if (!closedRow) {
      if (arqueoEntryId) {
        await cancelAccountingEntry(supabase, arqueoEntryId)
      }
      return {
        success: false,
        error: "Session not found or already closed.",
      }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

export async function addCashMovement(
  popId: string,
  sessionId: string,
  input: { kind: "deposit" | "withdrawal"; amount: number; note: string },
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
        POP_PERMS.CASH_REGISTER_CREATE.resource,
        POP_PERMS.CASH_REGISTER_CREATE.action,
      )
    ) {
      return { success: false, error: "No permission to add movements." }
    }
    const amount = parseAmount(input.amount)
    if (amount <= 0) {
      return { success: false, error: "Amount must be greater than zero." }
    }
    const supabase = await createClient()
    const { data: sess } = await supabase
      .from("cash_register_sessions")
      .select("opening_cash")
      .eq("id", sessionId)
      .eq("pop_id", popId)
      .eq("status", "open")
      .maybeSingle()
    if (!sess) {
      return { success: false, error: "Session is not open." }
    }
    const opening = parseAmount(sess.opening_cash)
    const bal = await computeCashBalance(supabase, sessionId, opening)
    if (input.kind === "withdrawal" && amount > bal) {
      return { success: false, error: "Withdrawal exceeds cash on hand." }
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Not authenticated." }
    }
    const note = input.note.trim()
    const { error } = await supabase.from("cash_register_movements").insert({
      pop_id: popId,
      session_id: sessionId,
      kind: input.kind,
      amount,
      note: note.length > 0 ? note : null,
      created_by: user.id,
    })
    if (error) {
      return { success: false, error: error.message || "Could not save movement." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}

function paymentMethodLabel(
  id: string,
  methods: Map<string, string>,
): string {
  if (id === "__cash_counted") return "Efectivo (contado al cierre)"
  return methods.get(id) ?? id
}

export async function getCashRegisterSummary(
  popId: string,
  registerId: string,
): Promise<
  | { success: true; data: CashRegisterSummaryData }
  | { success: false; error: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.CASH_REGISTER_READ.resource,
        POP_PERMS.CASH_REGISTER_READ.action,
      )
    ) {
      return { success: false, error: "No permission to view cash registers." }
    }
    const supabase = await createClient()
    const { data: reg, error: regErr } = await supabase
      .from("cash_registers")
      .select("id, name")
      .eq("pop_id", popId)
      .eq("id", registerId)
      .maybeSingle()
    if (regErr) {
      return { success: false, error: regErr.message || "Could not load register." }
    }
    if (!reg) {
      return { success: false, error: "Register not found." }
    }
    const registerName = String(reg.name ?? "")
    const { data: pmRows } = await supabase
      .from("payment_methods")
      .select("id, name, kind")
      .eq("pop_id", popId)
    const pmNames = new Map<string, string>()
    const pmKinds = new Map<string, string>()
    for (const p of pmRows || []) {
      const id = String(p.id)
      pmNames.set(id, String(p.name ?? ""))
      pmKinds.set(id, String(p.kind ?? "other"))
    }
    const { data: sessRows, error: sessErr } = await supabase
      .from("cash_register_sessions")
      .select(
        "id, status, opened_at, closed_at, opening_cash, note, closing_snapshot",
      )
      .eq("pop_id", popId)
      .eq("cash_register_id", registerId)
      .order("opened_at", { ascending: false })
    if (sessErr) {
      return { success: false, error: sessErr.message || "Could not load sessions." }
    }
    const sessionIds = (sessRows || []).map((s) => String(s.id))
    let moveRows: {
      id: unknown
      session_id: unknown
      kind: unknown
      amount: unknown
      note: unknown
      created_at: unknown
      created_by: unknown
    }[] = []
    if (sessionIds.length > 0) {
      const { data: m, error: mErr } = await supabase
        .from("cash_register_movements")
        .select("id, session_id, kind, amount, note, created_at, created_by")
        .eq("pop_id", popId)
        .in("session_id", sessionIds)
        .order("created_at", { ascending: false })
      if (mErr) {
        return { success: false, error: mErr.message || "Could not load movements." }
      }
      moveRows = m || []
    }
    const sessionOpenedAt = new Map<string, string>()
    for (const s of sessRows || []) {
      sessionOpenedAt.set(String(s.id), String(s.opened_at ?? ""))
    }
    const depWit = new Map<string, { dep: number; wit: number }>()
    for (const sid of sessionIds) {
      depWit.set(sid, { dep: 0, wit: 0 })
    }
    let depositTotal = 0
    let withdrawalTotal = 0
    for (const m of moveRows) {
      const amt = parseAmount(m.amount)
      const kind = String(m.kind)
      const bucket = depWit.get(String(m.session_id))
      if (kind === "deposit") {
        depositTotal += amt
        if (bucket) bucket.dep += amt
      } else if (kind === "withdrawal") {
        withdrawalTotal += amt
        if (bucket) bucket.wit += amt
      }
    }
    const sessions: CashRegisterSummarySession[] = []
    for (const s of sessRows || []) {
      const id = String(s.id)
      const st = String(s.status) === "closed" ? "closed" : "open"
      const dw = depWit.get(id) ?? { dep: 0, wit: 0 }
      const closingSnapshot =
        st === "closed" ? parseClosingSnapshot(s.closing_snapshot) : null
      sessions.push({
        id,
        status: st,
        openedAt: String(s.opened_at ?? ""),
        closedAt: s.closed_at != null ? String(s.closed_at) : null,
        openingCash: parseAmount(s.opening_cash),
        openingNote: s.note != null ? String(s.note) : null,
        closingSnapshot,
        movementDeposits: Math.round(dw.dep * 100) / 100,
        movementWithdrawals: Math.round(dw.wit * 100) / 100,
      })
    }
    const movements: CashRegisterSummaryMovement[] = moveRows.map((m) => ({
      id: String(m.id),
      sessionId: String(m.session_id),
      sessionOpenedAt: sessionOpenedAt.get(String(m.session_id)) ?? "",
      createdAt: String(m.created_at ?? ""),
      kind: String(m.kind) === "withdrawal" ? "withdrawal" : "deposit",
      amount: parseAmount(m.amount),
      note: m.note != null ? String(m.note) : null,
      createdBy: m.created_by != null ? String(m.created_by) : null,
    }))
    const closingBlocks: CashRegisterSummaryClosingBlock[] = []
    const agg = new Map<string, number>()
    for (const sess of sessions) {
      if (sess.status !== "closed" || !sess.closingSnapshot) continue
      const cs = sess.closingSnapshot
      const lines: { label: string; amount: number }[] = [
        {
          label: paymentMethodLabel("__cash_counted", pmNames),
          amount: cs.cash,
        },
      ]
      const keyCash = "__agg_cash"
      agg.set(keyCash, (agg.get(keyCash) ?? 0) + cs.cash)
      for (const [pid, amt] of Object.entries(cs.payment_methods)) {
        lines.push({
          label: paymentMethodLabel(pid, pmNames),
          amount: amt,
        })
        agg.set(pid, (agg.get(pid) ?? 0) + amt)
      }
      closingBlocks.push({
        sessionId: sess.id,
        openedAt: sess.openedAt,
        closedAt: sess.closedAt,
        lines,
      })
    }
    const aggregatedClosingLines: { label: string; amount: number }[] = []
    if (agg.has("__agg_cash")) {
      aggregatedClosingLines.push({
        label: paymentMethodLabel("__cash_counted", pmNames),
        amount: Math.round((agg.get("__agg_cash") ?? 0) * 100) / 100,
      })
    }
    for (const [pid, total] of agg) {
      if (pid === "__agg_cash") continue
      aggregatedClosingLines.push({
        label: paymentMethodLabel(pid, pmNames),
        amount: Math.round(total * 100) / 100,
      })
    }
    aggregatedClosingLines.sort((a, b) =>
      a.label.localeCompare(b.label, "es"),
    )
    let arqueo: CashRegisterSummaryData["arqueo"] = null
    let sales: CashRegisterSummarySale[] = []
    let salesIncluded = false
    const canReadSales = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SALE_READ.resource,
      POP_PERMS.SALE_READ.action,
    )
    if (canReadSales) {
      salesIncluded = true
      const { data: completedSaleIds } = await supabase
        .from("sales")
        .select("id")
        .eq("pop_id", popId)
        .eq("cash_register_id", registerId)
        .eq("status", "completed")
      const saleIdList = (completedSaleIds || []).map((r) => String(r.id))
      let ventasPorMedioPago: CashRegisterArqueoVentaPorMedio[] = []
      if (saleIdList.length > 0) {
        const { data: spRows } = await supabase
          .from("sale_payments")
          .select("payment_method_id, amount")
          .eq("pop_id", popId)
          .in("sale_id", saleIdList)
        const sums = new Map<string, number>()
        for (const row of spRows || []) {
          const pid = String(row.payment_method_id)
          sums.set(pid, (sums.get(pid) ?? 0) + parseAmount(row.amount))
        }
        ventasPorMedioPago = [...sums.entries()]
          .map(([paymentMethodId, total]) => ({
            paymentMethodId,
            name: pmNames.get(paymentMethodId) ?? paymentMethodId,
            kind: pmKinds.get(paymentMethodId) ?? "other",
            totalVentas: Math.round(total * 100) / 100,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "es"))
      }
      let sesionAbierta: CashRegisterArqueoSesionAbierta | null = null
      const openSess = (sessRows || []).find(
        (s) => String(s.status) === "open",
      )
      if (openSess) {
        const osid = String(openSess.id)
        const openingCash = parseAmount(openSess.opening_cash)
        const { data: osSaleIds } = await supabase
          .from("sales")
          .select("id")
          .eq("pop_id", popId)
          .eq("cash_register_session_id", osid)
          .eq("status", "completed")
        const osIdList = (osSaleIds || []).map((r) => String(r.id))
        let ventasEfectivo = 0
        if (osIdList.length > 0) {
          const { data: osp } = await supabase
            .from("sale_payments")
            .select("payment_method_id, amount")
            .eq("pop_id", popId)
            .in("sale_id", osIdList)
          for (const row of osp || []) {
            const kind = pmKinds.get(String(row.payment_method_id))
            if (kind === "cash") {
              ventasEfectivo += parseAmount(row.amount)
            }
          }
        }
        ventasEfectivo = Math.round(ventasEfectivo * 100) / 100
        const dw = depWit.get(osid) ?? { dep: 0, wit: 0 }
        const ingresosCajon = Math.round(dw.dep * 100) / 100
        const egresosCajon = Math.round(dw.wit * 100) / 100
        const efectivoTeoricoEnCajon =
          Math.round(
            (openingCash + ventasEfectivo + ingresosCajon - egresosCajon) *
              100,
          ) / 100
        sesionAbierta = {
          sessionId: osid,
          openingCash,
          ventasEfectivo,
          ingresosCajon,
          egresosCajon,
          efectivoTeoricoEnCajon,
        }
      }
      arqueo = { ventasPorMedioPago, sesionAbierta }
      const { data: saleRows, error: saleErr } = await supabase
        .from("sales")
        .select(
          "id, cash_register_session_id, sold_at, total, status, created_by, customer_name, currency",
        )
        .eq("pop_id", popId)
        .eq("cash_register_id", registerId)
        .order("sold_at", { ascending: false })
        .limit(500)
      if (saleErr) {
        return {
          success: false,
          error: saleErr.message || "No se pudieron cargar las ventas.",
        }
      }
      sales = (saleRows || []).map((r) => ({
        id: String(r.id),
        cashRegisterSessionId: String(r.cash_register_session_id ?? ""),
        soldAt: String(r.sold_at ?? ""),
        total: parseAmount(r.total),
        status: String(r.status ?? ""),
        createdBy: r.created_by != null ? String(r.created_by) : null,
        customerName: r.customer_name != null ? String(r.customer_name) : null,
        currency: String(r.currency ?? "ARS"),
      }))
    } else {
      arqueo = null
    }
    const data: CashRegisterSummaryData = {
      registerName,
      sessions,
      movements,
      salesIncluded,
      sales,
      arqueo,
      totals: {
        depositTotal: Math.round(depositTotal * 100) / 100,
        withdrawalTotal: Math.round(withdrawalTotal * 100) / 100,
        netCashMovements:
          Math.round((depositTotal - withdrawalTotal) * 100) / 100,
      },
      closingBlocks,
      aggregatedClosingLines,
    }
    return { success: true, data }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}
