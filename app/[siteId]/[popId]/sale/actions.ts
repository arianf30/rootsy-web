"use server"

import { DEFAULT_SALE_SITE_ID } from "@/lib/saleInvoiceTypes"
import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { getPopById, validatePopAccess } from "@/lib/popHelpers"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import { createClient } from "@/utils/supabase/server"

export type SaleCatalogCategory = {
  id: string
  name: string
}

export type SaleCatalogArticle = {
  id: string
  name: string
  description: string
  salePrice: number
  iva: number
  categoryId: string
  categoryName: string
}

export type SaleCatalogClient = {
  id: string
  name: string
  taxId: string | null
}

export type SaleCatalogPaymentMethod = {
  id: string
  name: string
  kind: string
  sortOrder: number
  accountingAccountId: string | null
}

export type SaleOpenCashSession = {
  sessionId: string
  cashRegisterId: string
  registerName: string
}

export async function getSaleCatalog(popId: string): Promise<
  | {
      success: true
      popName: string
      categories: SaleCatalogCategory[]
      articles: SaleCatalogArticle[]
      clients: SaleCatalogClient[]
      paymentMethods: SaleCatalogPaymentMethod[]
      canReadClients: boolean
      canReadPaymentMethods: boolean
      canCreateSale: boolean
      canReadCashRegisters: boolean
      openCashSession: SaleOpenCashSession | null
      invoiceTypeSiteId: string
    }
  | { success: false; error: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso" }
    }

    const snap = await loadPopPermissionsSnapshot(popId)
    const hasSaleRead = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SALE_READ.resource,
      POP_PERMS.SALE_READ.action,
    )
    if (!hasSaleRead) {
      return {
        success: false,
        error:
          "Necesitás permiso de lectura de ventas (sale:read) para usar esta pantalla.",
      }
    }

    const canReadClients = hasSaleRead
    const canReadPaymentMethods = hasSaleRead
    const canReadCashRegisters = hasSaleRead
    const canCreateSale = permissionKeysInclude(
      snap.keys,
      POP_PERMS.SALE_CREATE.resource,
      POP_PERMS.SALE_CREATE.action,
    )

    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""

    const supabase = await createClient()

    const { data: catRows, error: catErr } = await supabase
      .from("categories")
      .select("id, name")
      .eq("pop_id", popId)
      .order("name", { ascending: true })

    if (catErr) {
      return { success: false, error: catErr.message }
    }

    const categories: SaleCatalogCategory[] = (catRows || []).map((c) => ({
      id: String(c.id),
      name: String(c.name ?? ""),
    }))

    const { data: artRows, error: artErr } = await supabase
      .from("articles")
      .select(
        `
        id,
        name,
        description,
        sale_price,
        iva,
        category_id,
        categories ( id, name )
      `,
      )
      .eq("pop_id", popId)
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (artErr) {
      return { success: false, error: artErr.message }
    }

    const rows = (artRows || []) as Record<string, unknown>[]
    const articles: SaleCatalogArticle[] = rows.map((row) => {
      const cat = row.categories as unknown as { name?: string } | null
      return {
        id: String(row.id),
        name: String(row.name ?? ""),
        description: String(row.description ?? ""),
        salePrice: Number(row.sale_price ?? 0) || 0,
        iva: Number(row.iva ?? 0) || 0,
        categoryId: String(row.category_id ?? ""),
        categoryName: cat?.name ? String(cat.name) : "—",
      }
    })

    let clients: SaleCatalogClient[] = []
    if (canReadClients) {
      const { data: clRows, error: clErr } = await supabase
        .from("clients")
        .select("id, name, tax_id")
        .eq("pop_id", popId)
        .order("name", { ascending: true })
      if (clErr) {
        return { success: false, error: clErr.message }
      }
      clients = (clRows || []).map((c) => ({
        id: String(c.id),
        name: String(c.name ?? ""),
        taxId: c.tax_id != null ? String(c.tax_id) : null,
      }))
    }

    let openCashSession: SaleOpenCashSession | null = null
    if (canReadCashRegisters) {
      const { data: regs, error: regErr } = await supabase
        .from("cash_registers")
        .select("id, name, sort_order")
        .eq("pop_id", popId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
      const { data: openSessions, error: sessErr } = await supabase
        .from("cash_register_sessions")
        .select("id, cash_register_id")
        .eq("pop_id", popId)
        .eq("status", "open")
      if (!regErr && !sessErr && regs && openSessions) {
        const openByReg = new Map<string, string>()
        for (const s of openSessions) {
          openByReg.set(String(s.cash_register_id), String(s.id))
        }
        for (const r of regs) {
          const rid = String(r.id)
          const sid = openByReg.get(rid)
          if (sid) {
            openCashSession = {
              sessionId: sid,
              cashRegisterId: rid,
              registerName: String(r.name ?? ""),
            }
            break
          }
        }
      }
    }

    let paymentMethods: SaleCatalogPaymentMethod[] = []
    if (canReadPaymentMethods) {
      const { data: pmRows, error: pmErr } = await supabase
        .from("payment_methods")
        .select("id, name, kind, sort_order, accounting_account_id")
        .eq("pop_id", popId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
      if (pmErr) {
        return { success: false, error: pmErr.message }
      }
      paymentMethods = (pmRows || []).map((p) => ({
        id: String(p.id),
        name: String(p.name ?? ""),
        kind: String(p.kind ?? "other"),
        sortOrder: Number(p.sort_order ?? 0) || 0,
        accountingAccountId: p.accounting_account_id
          ? String(p.accounting_account_id)
          : null,
      }))
    }

    return {
      success: true,
      popName,
      categories,
      articles,
      clients,
      paymentMethods,
      canReadClients,
      canReadPaymentMethods,
      canCreateSale,
      canReadCashRegisters,
      openCashSession,
      invoiceTypeSiteId: DEFAULT_SALE_SITE_ID,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}
