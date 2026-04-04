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

export type PaymentMethodKind =
  | "cash"
  | "card_debit"
  | "card_credit"
  | "transfer"
  | "other"

export type AccountingChartOption = {
  id: string
  code: string
  name: string
}

export type PaymentMethodTableRow = {
  id: string
  name: string
  kind: PaymentMethodKind
  isActive: boolean
  sortOrder: number
  accountingAccountId: string | null
  accountingAccountLabel: string | null
}

export type UpsertPopPaymentMethodInput = {
  name: string
  kind: PaymentMethodKind
  sortOrder: number
}

async function resolveDefaultLedgerAccountId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  popId: string,
  kind: PaymentMethodKind,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await supabase.rpc("payment_method_default_account_id", {
    p_pop_id: popId,
    p_kind: kind,
  })
  if (error) {
    return { error: error.message || "No se pudo vincular la cuenta contable." }
  }
  if (data == null || String(data).length === 0) {
    return {
      error:
        "No hay cuenta predeterminada para este tipo en el plan (códigos 1.1.1.01 a 1.1.1.04).",
    }
  }
  return { id: String(data) }
}

export async function createPopPaymentMethod(
  popId: string,
  input: UpsertPopPaymentMethodInput,
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
        POP_PERMS.PAYMENT_METHOD_CREATE.resource,
        POP_PERMS.PAYMENT_METHOD_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para crear medios de pago." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "El nombre es obligatorio." }
    }
    const sortOrder = Number(input.sortOrder)
    if (!Number.isFinite(sortOrder)) {
      return { success: false, error: "Orden inválido." }
    }
    const supabase = await createClient()
    const ledger = await resolveDefaultLedgerAccountId(supabase, popId, input.kind)
    if ("error" in ledger) {
      return { success: false, error: ledger.error }
    }
    const { error } = await supabase.from("payment_methods").insert({
      pop_id: popId,
      name,
      kind: input.kind,
      is_active: true,
      sort_order: Math.trunc(sortOrder),
      accounting_account_id: ledger.id,
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

export async function updatePopPaymentMethod(
  popId: string,
  rowId: string,
  input: UpsertPopPaymentMethodInput,
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
        POP_PERMS.PAYMENT_METHOD_UPDATE.resource,
        POP_PERMS.PAYMENT_METHOD_UPDATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para editar medios de pago." }
    }
    const name = input.name.trim()
    if (!name) {
      return { success: false, error: "El nombre es obligatorio." }
    }
    const sortOrder = Number(input.sortOrder)
    if (!Number.isFinite(sortOrder)) {
      return { success: false, error: "Orden inválido." }
    }
    const supabase = await createClient()
    const ledger = await resolveDefaultLedgerAccountId(supabase, popId, input.kind)
    if ("error" in ledger) {
      return { success: false, error: ledger.error }
    }
    const { error } = await supabase
      .from("payment_methods")
      .update({
        name,
        kind: input.kind,
        sort_order: Math.trunc(sortOrder),
        accounting_account_id: ledger.id,
      })
      .eq("id", rowId)
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

export async function deletePopPaymentMethod(
  popId: string,
  rowId: string,
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
        POP_PERMS.PAYMENT_METHOD_DELETE.resource,
        POP_PERMS.PAYMENT_METHOD_DELETE.action,
      )
    ) {
      return {
        success: false,
        error: "Sin permiso para eliminar medios de pago.",
      }
    }
    const supabase = await createClient()
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", rowId)
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

export async function getPopPaymentMethodsTable(popId: string): Promise<
  | {
      success: true
      rows: PaymentMethodTableRow[]
      popName: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      rows: PaymentMethodTableRow[]
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
      popName?: string
    }
> {
  const empty = {
    rows: [] as PaymentMethodTableRow[],
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
        POP_PERMS.PAYMENT_METHOD_READ.resource,
        POP_PERMS.PAYMENT_METHOD_READ.action,
      )
    ) {
      return {
        success: false,
        error:
          "No tenés permiso para ver medios de pago de este punto de venta.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
        ...empty,
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.PAYMENT_METHOD_CREATE.resource,
      POP_PERMS.PAYMENT_METHOD_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.PAYMENT_METHOD_UPDATE.resource,
      POP_PERMS.PAYMENT_METHOD_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.PAYMENT_METHOD_DELETE.resource,
      POP_PERMS.PAYMENT_METHOD_DELETE.action,
    )
    const canAccountingRead = permissionKeysInclude(
      snap.keys,
      POP_PERMS.ACCOUNTS_READ.resource,
      POP_PERMS.ACCOUNTS_READ.action,
    )
    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("payment_methods")
      .select("id, name, kind, is_active, sort_order, accounting_account_id")
      .eq("pop_id", popId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
    if (error) {
      return {
        success: false,
        error: error.message || "No se pudieron cargar los medios de pago.",
        ...empty,
        popName,
      }
    }
    let labelById = new Map<string, string>()
    if (canAccountingRead) {
      const { data: accRows, error: accErr } = await supabase
        .from("accounting_chart_of_accounts")
        .select("id, code, name")
        .eq("pop_id", popId)
        .eq("is_movement_account", true)
        .order("code", { ascending: true })
      if (accErr) {
        return {
          success: false,
          error: accErr.message || "No se pudo cargar el plan de cuentas.",
          ...empty,
          popName,
        }
      }
      for (const a of accRows || []) {
        const id = String(a.id)
        labelById.set(id, `${String(a.code ?? "")} — ${String(a.name ?? "")}`)
      }
    }
    const kinds: PaymentMethodKind[] = [
      "cash",
      "card_debit",
      "card_credit",
      "transfer",
      "other",
    ]
    const rows: PaymentMethodTableRow[] = (data || []).map((r) => {
      const k = String(r.kind ?? "other")
      const kind = kinds.includes(k as PaymentMethodKind)
        ? (k as PaymentMethodKind)
        : "other"
      const aid = r.accounting_account_id
        ? String(r.accounting_account_id)
        : null
      let accountingAccountLabel: string | null = null
      if (aid) {
        accountingAccountLabel = canAccountingRead
          ? labelById.get(aid) ?? "—"
          : "Vinculada"
      }
      return {
        id: String(r.id),
        name: String(r.name ?? ""),
        kind,
        isActive: Boolean(r.is_active),
        sortOrder: Number(r.sort_order ?? 0) || 0,
        accountingAccountId: aid,
        accountingAccountLabel,
      }
    })
    return {
      success: true,
      rows,
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
