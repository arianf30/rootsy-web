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

export type AccountType =
  | "activo_corriente"
  | "activo_no_corriente"
  | "pasivo_corriente"
  | "pasivo_no_corriente"
  | "patrimonio_neto"
  | "ingresos"
  | "costos"
  | "gastos"

export type AccountNature = "deudora" | "acreedora"

export type ChartAccountRow = {
  id: string
  parentId: string | null
  code: string
  name: string
  accountType: AccountType
  nature: AccountNature
  level: number
  isMovementAccount: boolean
}

export type CreateChartAccountInput = {
  code: string
  name: string
  accountType: AccountType
  nature: AccountNature
  level: number
  isMovementAccount: boolean
}

export async function getAccountingPageData(popId: string): Promise<
  | {
      success: true
      popName: string
      accounts: ChartAccountRow[]
      canReadAccounts: boolean
      canCreate: boolean
      canReadJournal: boolean
      journalEntryCount: number
    }
  | { success: false; error: string; redirect?: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso", redirect: "/home" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    const canReadAccounts = permissionKeysInclude(
      snap.keys,
      POP_PERMS.ACCOUNTING_READ.resource,
      POP_PERMS.ACCOUNTING_READ.action,
    )
    if (!canReadAccounts) {
      return {
        success: false,
        error: "No tenés permiso para ver contabilidad en este punto de venta.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.ACCOUNTING_CREATE.resource,
      POP_PERMS.ACCOUNTING_CREATE.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data: accRows, error: accErr } = await supabase
      .from("accounting_chart_of_accounts")
      .select(
        "id, parent_id, code, name, account_type, nature, level, is_movement_account",
      )
      .eq("pop_id", popId)
      .order("code", { ascending: true })
    if (accErr) {
      return { success: false, error: accErr.message || "No se pudo cargar el plan de cuentas." }
    }
    const accountTypes: AccountType[] = [
      "activo_corriente",
      "activo_no_corriente",
      "pasivo_corriente",
      "pasivo_no_corriente",
      "patrimonio_neto",
      "ingresos",
      "costos",
      "gastos",
    ]
    const natures: AccountNature[] = ["deudora", "acreedora"]
    const accounts: ChartAccountRow[] = (accRows || []).map((r) => {
      const at = String(r.account_type ?? "")
      const nt = String(r.nature ?? "")
      const pid = r.parent_id
      return {
        id: String(r.id),
        parentId:
          pid != null && String(pid).length > 0 ? String(pid) : null,
        code: String(r.code ?? ""),
        name: String(r.name ?? ""),
        accountType: accountTypes.includes(at as AccountType)
          ? (at as AccountType)
          : "gastos",
        nature: natures.includes(nt as AccountNature)
          ? (nt as AccountNature)
          : "deudora",
        level: Number(r.level ?? 1) || 1,
        isMovementAccount: Boolean(r.is_movement_account),
      }
    })
    const { count: journalCount, error: jErr } = await supabase
      .from("accounting_entries")
      .select("id", { count: "exact", head: true })
      .eq("pop_id", popId)
    if (jErr) {
      return { success: false, error: jErr.message || "No se pudo consultar el libro diario." }
    }
    return {
      success: true,
      popName,
      accounts,
      canReadAccounts,
      canCreate,
      canReadJournal: canReadAccounts,
      journalEntryCount: journalCount ?? 0,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export type JournalEntrySummaryRow = {
  id: string
  entryNumber: number
  entryDate: string
  description: string
  sourceType: string
  totalDebit: number
  totalCredit: number
}

export type JournalEntryLineRow = {
  id: string
  accountCode: string
  accountName: string
  debitAmount: number
  creditAmount: number
  lineDescription: string | null
}

export type LedgerMovementRow = {
  id: string
  entryDate: string
  entryNumber: number
  entryDescription: string
  debitAmount: number
  creditAmount: number
  runningBalance: number
}

export type TrialBalanceRow = {
  accountCode: string
  accountName: string
  accountType: AccountType
  sumDebit: number
  sumCredit: number
  balance: number
}

export type FinancialSummaryRow = {
  label: string
  total: number
  accountTypes: AccountType[]
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export async function getAccountingJournalEntries(
  popId: string,
  fromDate: string | null,
  toDate: string | null,
): Promise<
  | { success: true; entries: JournalEntrySummaryRow[] }
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
        POP_PERMS.ACCOUNTING_READ.resource,
        POP_PERMS.ACCOUNTING_READ.action,
      )
    ) {
      return { success: false, error: "Sin permiso para ver el libro diario." }
    }
    const supabase = await createClient()
    let q = supabase
      .from("accounting_entries")
      .select("id, entry_number, entry_date, description, source_type, status")
      .eq("pop_id", popId)
      .eq("status", "posted")
      .order("entry_date", { ascending: false })
      .order("entry_number", { ascending: false })
      .limit(200)
    if (fromDate && fromDate.trim()) {
      q = q.gte("entry_date", fromDate.trim())
    }
    if (toDate && toDate.trim()) {
      q = q.lte("entry_date", toDate.trim())
    }
    const { data: entries, error: eErr } = await q
    if (eErr) {
      return { success: false, error: eErr.message || "No se pudieron cargar los asientos." }
    }
    const list = entries || []
    if (list.length === 0) {
      return { success: true, entries: [] }
    }
    const ids = list.map((e) => String(e.id))
    const { data: lines, error: lErr } = await supabase
      .from("accounting_entry_lines")
      .select("entry_id, debit_amount, credit_amount")
      .in("entry_id", ids)
    if (lErr) {
      return { success: false, error: lErr.message || "No se pudieron cargar las líneas." }
    }
    const debitByEntry = new Map<string, number>()
    const creditByEntry = new Map<string, number>()
    for (const ln of lines || []) {
      const eid = String(ln.entry_id)
      const d = Number(ln.debit_amount ?? 0)
      const c = Number(ln.credit_amount ?? 0)
      debitByEntry.set(eid, (debitByEntry.get(eid) ?? 0) + d)
      creditByEntry.set(eid, (creditByEntry.get(eid) ?? 0) + c)
    }
    const rows: JournalEntrySummaryRow[] = list.map((e) => {
      const id = String(e.id)
      return {
        id,
        entryNumber: Number(e.entry_number ?? 0),
        entryDate: String(e.entry_date ?? ""),
        description: String(e.description ?? ""),
        sourceType: String(e.source_type ?? ""),
        totalDebit: roundMoney(debitByEntry.get(id) ?? 0),
        totalCredit: roundMoney(creditByEntry.get(id) ?? 0),
      }
    })
    return { success: true, entries: rows }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getAccountingEntryLines(
  popId: string,
  entryId: string,
): Promise<
  | { success: true; lines: JournalEntryLineRow[] }
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
        POP_PERMS.ACCOUNTING_READ.resource,
        POP_PERMS.ACCOUNTING_READ.action,
      )
    ) {
      return { success: false, error: "Sin permiso." }
    }
    const supabase = await createClient()
    const { data: entry, error: entErr } = await supabase
      .from("accounting_entries")
      .select("id")
      .eq("id", entryId)
      .eq("pop_id", popId)
      .maybeSingle()
    if (entErr || !entry) {
      return { success: false, error: "Asiento no encontrado." }
    }
    const { data: lines, error: lErr } = await supabase
      .from("accounting_entry_lines")
      .select(
        `
        id,
        debit_amount,
        credit_amount,
        description,
        line_order,
        accounting_chart_of_accounts ( code, name )
      `,
      )
      .eq("entry_id", entryId)
      .order("line_order", { ascending: true })
    if (lErr) {
      return { success: false, error: lErr.message || "No se pudieron cargar las líneas." }
    }
    const rows: JournalEntryLineRow[] = (lines || []).map((r) => {
      const acc = r.accounting_chart_of_accounts as unknown as {
        code?: string
        name?: string
      } | null
      return {
        id: String(r.id),
        accountCode: acc?.code ? String(acc.code) : "—",
        accountName: acc?.name ? String(acc.name) : "—",
        debitAmount: roundMoney(Number(r.debit_amount ?? 0)),
        creditAmount: roundMoney(Number(r.credit_amount ?? 0)),
        lineDescription: r.description != null ? String(r.description) : null,
      }
    })
    return { success: true, lines: rows }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getAccountingLedgerForAccount(
  popId: string,
  accountCode: string,
  fromDate: string | null,
  toDate: string | null,
): Promise<
  | {
      success: true
      accountName: string
      nature: AccountNature
      rows: LedgerMovementRow[]
    }
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
        POP_PERMS.ACCOUNTING_READ.resource,
        POP_PERMS.ACCOUNTING_READ.action,
      )
    ) {
      return { success: false, error: "Sin permiso." }
    }
    const code = accountCode.trim()
    if (!code) {
      return { success: false, error: "Indicá un código de cuenta." }
    }
    const supabase = await createClient()
    const { data: acc, error: aErr } = await supabase
      .from("accounting_chart_of_accounts")
      .select("id, name, nature")
      .eq("pop_id", popId)
      .eq("code", code)
      .maybeSingle()
    if (aErr || !acc) {
      return { success: false, error: "No hay cuenta con ese código en este punto." }
    }
    const accountId = String(acc.id)
    const natureStr = String(acc.nature ?? "deudora")
    const nature: AccountNature =
      natureStr === "acreedora" ? "acreedora" : "deudora"
    const { data: lines, error: lErr } = await supabase
      .from("accounting_entry_lines")
      .select("id, entry_id, debit_amount, credit_amount, description")
      .eq("account_id", accountId)
    if (lErr) {
      return { success: false, error: lErr.message || "No se pudieron cargar movimientos." }
    }
    const entryIds = [...new Set((lines || []).map((l) => String(l.entry_id)))]
    if (entryIds.length === 0) {
      return {
        success: true,
        accountName: String(acc.name ?? ""),
        nature,
        rows: [],
      }
    }
    let entQ = supabase
      .from("accounting_entries")
      .select("id, entry_date, entry_number, description, status")
      .eq("pop_id", popId)
      .eq("status", "posted")
      .in("id", entryIds)
    if (fromDate && fromDate.trim()) {
      entQ = entQ.gte("entry_date", fromDate.trim())
    }
    if (toDate && toDate.trim()) {
      entQ = entQ.lte("entry_date", toDate.trim())
    }
    const { data: entries, error: eErr } = await entQ
    if (eErr) {
      return { success: false, error: eErr.message || "No se pudieron cargar asientos." }
    }
    const entryById = new Map(
      (entries || []).map((e) => [
        String(e.id),
        {
          entryDate: String(e.entry_date ?? ""),
          entryNumber: Number(e.entry_number ?? 0),
          description: String(e.description ?? ""),
        },
      ]),
    )
    const allowed = new Set(entryById.keys())
    const filtered = (lines || []).filter((l) => allowed.has(String(l.entry_id)))
    filtered.sort((a, b) => {
      const ea = entryById.get(String(a.entry_id))
      const eb = entryById.get(String(b.entry_id))
      if (!ea || !eb) return 0
      const da = ea.entryDate.localeCompare(eb.entryDate)
      if (da !== 0) return da
      return ea.entryNumber - eb.entryNumber
    })
    let running = 0
    const rows: LedgerMovementRow[] = filtered.map((l) => {
      const d = Number(l.debit_amount ?? 0)
      const c = Number(l.credit_amount ?? 0)
      const meta = entryById.get(String(l.entry_id))
      if (nature === "deudora") {
        running += d - c
      } else {
        running += c - d
      }
      return {
        id: String(l.id),
        entryDate: meta?.entryDate ?? "",
        entryNumber: meta?.entryNumber ?? 0,
        entryDescription: meta?.description ?? "",
        debitAmount: roundMoney(d),
        creditAmount: roundMoney(c),
        runningBalance: roundMoney(running),
      }
    })
    return {
      success: true,
      accountName: String(acc.name ?? ""),
      nature,
      rows,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getAccountingTrialBalance(
  popId: string,
  fromDate: string | null,
  toDate: string | null,
): Promise<
  | { success: true; rows: TrialBalanceRow[] }
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
        POP_PERMS.ACCOUNTING_READ.resource,
        POP_PERMS.ACCOUNTING_READ.action,
      )
    ) {
      return { success: false, error: "Sin permiso." }
    }
    const supabase = await createClient()
    let entQ = supabase
      .from("accounting_entries")
      .select("id")
      .eq("pop_id", popId)
      .eq("status", "posted")
    if (fromDate && fromDate.trim()) {
      entQ = entQ.gte("entry_date", fromDate.trim())
    }
    if (toDate && toDate.trim()) {
      entQ = entQ.lte("entry_date", toDate.trim())
    }
    const { data: postedEntries, error: eErr } = await entQ
    if (eErr) {
      return { success: false, error: eErr.message || "No se pudieron listar asientos." }
    }
    const entryIds = (postedEntries || []).map((e) => String(e.id))
    if (entryIds.length === 0) {
      return { success: true, rows: [] }
    }
    const { data: lines, error: lErr } = await supabase
      .from("accounting_entry_lines")
      .select(
        `
        account_id,
        debit_amount,
        credit_amount,
        accounting_chart_of_accounts ( code, name, account_type, nature )
      `,
      )
      .in("entry_id", entryIds)
    if (lErr) {
      return { success: false, error: lErr.message || "No se pudieron cargar líneas." }
    }
    const accountTypes: AccountType[] = [
      "activo_corriente",
      "activo_no_corriente",
      "pasivo_corriente",
      "pasivo_no_corriente",
      "patrimonio_neto",
      "ingresos",
      "costos",
      "gastos",
    ]
    const agg = new Map<
      string,
      {
        code: string
        name: string
        accountType: AccountType
        nature: AccountNature
        debit: number
        credit: number
      }
    >()
    for (const ln of lines || []) {
      const acc = ln.accounting_chart_of_accounts as unknown as {
        code?: string
        name?: string
        account_type?: string
        nature?: string
      } | null
      const aid = String(ln.account_id)
      const d = Number(ln.debit_amount ?? 0)
      const c = Number(ln.credit_amount ?? 0)
      const at = String(acc?.account_type ?? "gastos")
      const nt = String(acc?.nature ?? "deudora")
      const prev = agg.get(aid) ?? {
        code: acc?.code ? String(acc.code) : "",
        name: acc?.name ? String(acc.name) : "",
        accountType: accountTypes.includes(at as AccountType)
          ? (at as AccountType)
          : "gastos",
        nature: nt === "acreedora" ? "acreedora" : "deudora",
        debit: 0,
        credit: 0,
      }
      prev.debit += d
      prev.credit += c
      agg.set(aid, prev)
    }
    const rows: TrialBalanceRow[] = [...agg.values()]
      .map((v) => {
        const balance =
          v.nature === "deudora"
            ? roundMoney(v.debit - v.credit)
            : roundMoney(v.credit - v.debit)
        return {
          accountCode: v.code,
          accountName: v.name,
          accountType: v.accountType,
          sumDebit: roundMoney(v.debit),
          sumCredit: roundMoney(v.credit),
          balance,
        }
      })
      .sort((a, b) =>
        a.accountCode.localeCompare(b.accountCode, undefined, { numeric: true }),
      )
    return { success: true, rows }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getAccountingFinancialSummaries(
  popId: string,
  fromDate: string | null,
  toDate: string | null,
): Promise<
  | { success: true; summaries: FinancialSummaryRow[] }
  | { success: false; error: string }
> {
  const tb = await getAccountingTrialBalance(popId, fromDate, toDate)
  if (!tb.success) {
    return { success: false, error: tb.error }
  }
  const sum = (types: AccountType[]) =>
    roundMoney(
      tb.rows
        .filter((r) => types.includes(r.accountType))
        .reduce((a, r) => a + r.balance, 0),
    )
  const summaries: FinancialSummaryRow[] = [
    {
      label: "Activo (total)",
      total: sum(["activo_corriente", "activo_no_corriente"]),
      accountTypes: ["activo_corriente", "activo_no_corriente"],
    },
    {
      label: "Pasivo (total)",
      total: sum(["pasivo_corriente", "pasivo_no_corriente"]),
      accountTypes: ["pasivo_corriente", "pasivo_no_corriente"],
    },
    {
      label: "Patrimonio neto (total)",
      total: sum(["patrimonio_neto"]),
      accountTypes: ["patrimonio_neto"],
    },
    {
      label: "Ingresos (total)",
      total: sum(["ingresos"]),
      accountTypes: ["ingresos"],
    },
    {
      label: "Costos (total)",
      total: sum(["costos"]),
      accountTypes: ["costos"],
    },
    {
      label: "Gastos (total)",
      total: sum(["gastos"]),
      accountTypes: ["gastos"],
    },
  ]
  return { success: true, summaries }
}

export async function createChartAccount(
  popId: string,
  input: CreateChartAccountInput,
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
        POP_PERMS.ACCOUNTING_CREATE.resource,
        POP_PERMS.ACCOUNTING_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para crear cuentas." }
    }
    const code = input.code.trim()
    const name = input.name.trim()
    if (!code || !name) {
      return { success: false, error: "Código y nombre son obligatorios." }
    }
    const level = Math.trunc(Number(input.level))
    if (!Number.isFinite(level) || level < 1) {
      return { success: false, error: "Nivel inválido." }
    }
    const supabase = await createClient()
    const { error } = await supabase.from("accounting_chart_of_accounts").insert({
      pop_id: popId,
      code,
      name,
      account_type: input.accountType,
      nature: input.nature,
      level,
      is_movement_account: input.isMovementAccount,
      parent_id: null,
      metadata: { user_created: true },
    })
    if (error) {
      return { success: false, error: error.message || "No se pudo crear la cuenta." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}
