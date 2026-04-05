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
      POP_PERMS.ACCOUNTS_READ.resource,
      POP_PERMS.ACCOUNTS_READ.action,
    )
    if (!canReadAccounts) {
      return {
        success: false,
        error: "You do not have permission to view accounting for this store.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.ACCOUNTS_CREATE.resource,
      POP_PERMS.ACCOUNTS_CREATE.action,
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
      return { success: false, error: accErr.message || "Could not load accounts." }
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
      return { success: false, error: jErr.message || "Could not load journal." }
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
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
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
        POP_PERMS.ACCOUNTS_CREATE.resource,
        POP_PERMS.ACCOUNTS_CREATE.action,
      )
    ) {
      return { success: false, error: "No permission to create accounts." }
    }
    const code = input.code.trim()
    const name = input.name.trim()
    if (!code || !name) {
      return { success: false, error: "Code and name are required." }
    }
    const level = Math.trunc(Number(input.level))
    if (!Number.isFinite(level) || level < 1) {
      return { success: false, error: "Invalid level." }
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
      return { success: false, error: error.message || "Could not create account." }
    }
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: message }
  }
}
