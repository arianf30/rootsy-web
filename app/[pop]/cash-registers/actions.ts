"use server"

import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { getPopById, validatePopAccess } from "@/lib/popHelpers"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import { createClient } from "@/utils/supabase/server"

export type CashRegisterRow = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  openSessionId: string | null
  cashBalance: number | null
  openedAt: string | null
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

export type CashRegisterSummaryData = {
  registerName: string
  sessions: CashRegisterSummarySession[]
  movements: CashRegisterSummaryMovement[]
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
        redirect: `/${popId}/menu`,
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
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data: regs, error: regErr } = await supabase
      .from("cash_registers")
      .select("id, name, sort_order, is_active")
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
      if (open) {
        openSessionId = open.id
        openedAt = open.opened_at
        cashBalance = await computeCashBalance(supabase, open.id, open.opening_cash)
      }
      registers.push({
        id,
        name: String(r.name ?? ""),
        sortOrder: Number(r.sort_order ?? 0) || 0,
        isActive: Boolean(r.is_active),
        openSessionId,
        cashBalance,
        openedAt,
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
  input: { name: string; sortOrder: number; isActive: boolean },
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
    const supabase = await createClient()
    const { error } = await supabase
      .from("cash_registers")
      .update({
        name,
        sort_order: sortOrder,
        is_active: input.isActive,
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
      return { success: false, error: error.message || "Could not close session." }
    }
    if (!closedRow) {
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
      .select("id, name")
      .eq("pop_id", popId)
    const pmNames = new Map<string, string>()
    for (const p of pmRows || []) {
      pmNames.set(String(p.id), String(p.name ?? ""))
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
    const data: CashRegisterSummaryData = {
      registerName,
      sessions,
      movements,
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
