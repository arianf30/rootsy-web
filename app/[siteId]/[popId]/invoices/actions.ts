"use server"

import {
  POP_PERMS,
  permissionKeysInclude,
} from "@/lib/popPermissionConstants"
import { emitArcaFacturaBConsumidorFinal } from "@/lib/arcaWsfeEmit"
import { getPopById, getPopSiteId, validatePopAccess } from "@/lib/popHelpers"
import { loadPopPermissionsSnapshot } from "@/lib/popPermissionsServer"
import {
  DEFAULT_SALE_SITE_ID,
  findSaleInvoiceTypeByArcaCbteTipo,
} from "@/lib/saleInvoiceTypes"
import { isArcaAfipHomologationFromEnv } from "@/lib/arcaAfipGlobalMode"
import type { PopPermissionsSnapshotJSON } from "@/lib/popPermissionsServer"
import { popMenuHref, siteIdFromPopRow } from "@/lib/popRoutes"
import { downloadCashRegisterArcaPemFiles } from "@/lib/rootsyAfipStorage"
import { createClient } from "@/utils/supabase/server"
import { createServiceRoleClient } from "@/utils/supabase/service-role"

export type InvoiceArcaTableRow = {
  id: string
  saleId: string | null
  arcaCbteTipo: number
  tipoLabel: string
  arcaRegimen: string
  ptoVta: number
  cbteNro: string
  cbteFch: string
  docTipo: number | null
  docNro: string
  receptorRazonSocial: string
  impTotal: number
  impNeto: number
  impIva: number
  impTrib: number
  monId: string
  monCotiz: number
  cae: string | null
  caeFchVto: string | null
  status: string
  arcaResultado: string | null
  arcaObservaciones: string | null
  payloadRequest: unknown
  payloadResponse: unknown
}

function parseMoney(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return Math.round(n * 100) / 100
}

function normalizeCuitDigits(s: string): string {
  return s.replace(/\D/g, "")
}

function cbteFchNumToIsoDate(cbteFch: string): string {
  const t = cbteFch.replace(/\D/g, "")
  if (t.length === 8) {
    return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`
  }
  return new Date().toISOString().slice(0, 10)
}

export type InvoiceFormCashSession = {
  cashRegisterId: string
  cashRegisterName: string
  sessionId: string
  ptoVta: number | null
  hasCertificates: boolean
}

function canResolveCashRegisterForInvoiceUi(
  snap: PopPermissionsSnapshotJSON,
): boolean {
  return (
    permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVOICES_READ.resource,
      POP_PERMS.INVOICES_READ.action,
    ) &&
    permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVOICES_CREATE.resource,
      POP_PERMS.INVOICES_CREATE.action,
    ) &&
    permissionKeysInclude(
      snap.keys,
      POP_PERMS.CASH_REGISTER_READ.resource,
      POP_PERMS.CASH_REGISTER_READ.action,
    )
  )
}

async function resolveOpenCashRegisterForInvoice(
  popId: string,
  snap: PopPermissionsSnapshotJSON,
): Promise<
  | { success: true; ctx: InvoiceFormCashSession }
  | { success: false }
> {
  if (!canResolveCashRegisterForInvoiceUi(snap)) {
    return { success: false }
  }
  const srv = createServiceRoleClient()
  const { data: regs, error: regErr } = await srv
    .from("cash_registers")
    .select(
      "id, name, sort_order, arca_pto_vta, arca_certificate_crt_uploaded_at, arca_certificate_key_uploaded_at",
    )
    .eq("pop_id", popId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true })
  if (regErr || !regs) return { success: false }
  const { data: sessions, error: sessErr } = await srv
    .from("cash_register_sessions")
    .select("id, cash_register_id")
    .eq("pop_id", popId)
    .eq("status", "open")
  if (sessErr) return { success: false }
  const openByReg = new Map<string, string>()
  for (const s of sessions || []) {
    openByReg.set(String(s.cash_register_id), String(s.id))
  }
  for (const r of regs) {
    const rid = String(r.id)
    const sid = openByReg.get(rid)
    if (sid) {
      const crt = r.arca_certificate_crt_uploaded_at != null
      const key = r.arca_certificate_key_uploaded_at != null
      const pto =
        r.arca_pto_vta != null && Number.isFinite(Number(r.arca_pto_vta))
          ? Number(r.arca_pto_vta)
          : null
      return {
        success: true,
        ctx: {
          cashRegisterId: rid,
          cashRegisterName: String(r.name ?? ""),
          sessionId: sid,
          ptoVta: pto,
          hasCertificates: Boolean(crt && key),
        },
      }
    }
  }
  return { success: false }
}

export async function getInvoiceFormContext(popId: string): Promise<
  | {
      success: true
      fiscalCuit: string | null
      fiscalRazonSocial: string | null
      cashSession: InvoiceFormCashSession | null
      canCreateInvoice: boolean
    }
  | { success: false; error: string; redirect?: string }
> {
  try {
    const access = await validatePopAccess(popId)
    if (!access.hasAccess || !access.isActive) {
      return { success: false, error: access.error || "Sin acceso", redirect: "/home" }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVOICES_CREATE.resource,
      POP_PERMS.INVOICES_CREATE.action,
    )
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.INVOICES_READ.resource,
        POP_PERMS.INVOICES_READ.action,
      )
    ) {
      return {
        success: false,
        error: "No tenés permiso para facturación.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
      }
    }
    const popRes = await getPopById(popId)
    const fiscalCuit =
      popRes.success && popRes.pop?.fiscalCuit
        ? normalizeCuitDigits(String(popRes.pop.fiscalCuit))
        : null
    const fiscalRazonSocial =
      popRes.success && popRes.pop?.fiscalRazonSocial
        ? String(popRes.pop.fiscalRazonSocial)
        : null
    const open = await resolveOpenCashRegisterForInvoice(popId, snap)
    const cashSession = open.success ? open.ctx : null
    return {
      success: true,
      fiscalCuit: fiscalCuit && fiscalCuit.length === 11 ? fiscalCuit : null,
      fiscalRazonSocial,
      cashSession,
      canCreateInvoice: canCreate,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function testArcaInvoiceHomologacion(
  popId: string,
  formData: FormData,
): Promise<
  | {
      success: true
      cae: string
      caeFchVto: string
      cbteNro: number
      ptoVta: number
      impTotal: number
      impNeto: number
      impIva: number
      cbteFch: string
      payloadRequest: Record<string, unknown>
      payloadResponse: Record<string, unknown>
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
        POP_PERMS.INVOICES_CREATE.resource,
        POP_PERMS.INVOICES_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para emitir comprobantes de prueba." }
    }
    const popRes = await getPopById(popId)
    if (!popRes.success || !popRes.pop?.fiscalCuit) {
      return {
        success: false,
        error: "Configurá el CUIT fiscal del punto de venta antes de probar.",
      }
    }
    const cuitEmisor = normalizeCuitDigits(String(popRes.pop.fiscalCuit))
    if (cuitEmisor.length !== 11) {
      return { success: false, error: "CUIT fiscal del punto de venta inválido." }
    }

    const crt = formData.get("crt")
    const key = formData.get("key")
    if (!(crt instanceof File) || !(key instanceof File)) {
      return { success: false, error: "Subí el certificado (.crt) y la clave (.key)." }
    }
    if (crt.size === 0 || key.size === 0) {
      return { success: false, error: "Los archivos no pueden estar vacíos." }
    }
    const certPem = Buffer.from(await crt.arrayBuffer()).toString("utf8")
    const keyPem = Buffer.from(await key.arrayBuffer()).toString("utf8")

    const ptoRaw = String(formData.get("ptoVta") ?? "").trim()
    const ptoVta = ptoRaw === "" ? NaN : Number(ptoRaw)
    if (!Number.isFinite(ptoVta) || ptoVta < 0 || ptoVta > 99999) {
      return { success: false, error: "Punto de venta inválido (0–99999)." }
    }
    const impRaw = String(formData.get("importeTotal") ?? "").trim()
    const impTotal = Number(impRaw.replace(",", "."))
    if (!Number.isFinite(impTotal) || impTotal <= 0) {
      return { success: false, error: "Importe total inválido." }
    }

    const docTipo = Number(formData.get("docTipo") ?? 99)
    const docNro = String(formData.get("docNro") ?? "0").trim()
    const razon = String(formData.get("receptorRazonSocial") ?? "Consumidor Final").trim() || "Consumidor Final"

    const emit = await emitArcaFacturaBConsumidorFinal({
      certPem,
      keyPem,
      cuitEmisor,
      ptoVta,
      cbteTipo: 6,
      impTotal,
      homologation: true,
      docTipo: Number.isFinite(docTipo) ? docTipo : 99,
      docNro,
      receptorRazonSocial: razon,
    })

    if (!emit.ok) {
      return { success: false, error: emit.error }
    }

    return {
      success: true,
      cae: emit.cae,
      caeFchVto: emit.caeFchVto,
      cbteNro: emit.cbteNro,
      ptoVta,
      impTotal: emit.impTotal,
      impNeto: emit.impNeto,
      impIva: emit.impIva,
      cbteFch: emit.cbteFch,
      payloadRequest: emit.requestPayload,
      payloadResponse: emit.responsePayload,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function createArcaInvoiceWithOpenCashRegister(
  popId: string,
  formData: FormData,
): Promise<
  | {
      success: true
      invoiceId: string
      cae: string
      caeFchVto: string
      cbteNro: number
      ptoVta: number
      impTotal: number
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
        POP_PERMS.INVOICES_CREATE.resource,
        POP_PERMS.INVOICES_CREATE.action,
      )
    ) {
      return { success: false, error: "Sin permiso para emitir facturas." }
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
        error: "Se requiere permiso de cajas para validar la sesión abierta.",
      }
    }
    const popRes = await getPopById(popId)
    if (!popRes.success || !popRes.pop?.fiscalCuit) {
      return {
        success: false,
        error: "Configurá el CUIT fiscal del punto de venta.",
      }
    }
    const cuitEmisor = normalizeCuitDigits(String(popRes.pop.fiscalCuit))
    if (cuitEmisor.length !== 11) {
      return { success: false, error: "CUIT fiscal del punto de venta inválido." }
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.id) {
      return { success: false, error: "Sesión requerida." }
    }

    const open = await resolveOpenCashRegisterForInvoice(popId, snap)
    if (!open.success) {
      return {
        success: false,
        error:
          "Tenés que tener una caja abierta con certificados ARCA cargados. Abrí una sesión en Cajas.",
      }
    }
    const ctx = open.ctx
    if (!ctx.hasCertificates) {
      return {
        success: false,
        error:
          "La caja abierta no tiene certificado y clave en el almacenamiento. Configuralos al editar la caja.",
      }
    }
    if (ctx.ptoVta == null) {
      return {
        success: false,
        error: "Configurá el punto de venta AFIP en la caja registradora.",
      }
    }

    const pem = await downloadCashRegisterArcaPemFiles(popId, ctx.cashRegisterId)
    if (!pem.success) {
      return { success: false, error: pem.error }
    }

    const impRaw = String(formData.get("importeTotal") ?? "").trim()
    const impTotal = Number(impRaw.replace(",", "."))
    if (!Number.isFinite(impTotal) || impTotal <= 0) {
      return { success: false, error: "Importe total inválido." }
    }
    const docTipo = Number(formData.get("docTipo") ?? 99)
    const docNro = String(formData.get("docNro") ?? "0").trim()
    const razon =
      String(formData.get("receptorRazonSocial") ?? "Consumidor Final").trim() ||
      "Consumidor Final"

    const emit = await emitArcaFacturaBConsumidorFinal({
      certPem: pem.certPemUtf8,
      keyPem: pem.keyPemUtf8,
      cuitEmisor,
      ptoVta: ctx.ptoVta,
      cbteTipo: 6,
      impTotal,
      homologation: isArcaAfipHomologationFromEnv(),
      docTipo: Number.isFinite(docTipo) ? docTipo : 99,
      docNro,
      receptorRazonSocial: razon,
    })

    if (!emit.ok) {
      return { success: false, error: emit.error }
    }

    const cbteFchIso = cbteFchNumToIsoDate(emit.cbteFch)
    const siteIdForInv =
      siteIdFromPopRow({
        site_id: popRes.pop.siteId as string | null | undefined,
        settings: popRes.pop.settings,
      }) ?? DEFAULT_SALE_SITE_ID
    const opt = findSaleInvoiceTypeByArcaCbteTipo(siteIdForInv, 6)

    const { data: ins, error: insErr } = await supabase
      .from("invoices_arca")
      .insert({
        pop_id: popId,
        sale_id: null,
        cash_register_id: ctx.cashRegisterId,
        arca_cbte_tipo: 6,
        arca_regimen: opt?.arcaRegimen ?? "fe_general",
        pto_vta: ctx.ptoVta,
        cbte_nro: emit.cbteNro,
        cbte_fch: cbteFchIso,
        doc_tipo: Number.isFinite(docTipo) ? docTipo : 99,
        doc_nro: docTipo === 99 ? "0" : docNro,
        receptor_razon_social: razon,
        imp_total: emit.impTotal,
        imp_neto: emit.impNeto,
        imp_iva: emit.impIva,
        imp_trib: 0,
        mon_id: "PES",
        mon_cotiz: 1,
        cae: emit.cae,
        cae_fch_vto: emit.caeFchVto.slice(0, 10),
        status: "authorized",
        arca_resultado: emit.resultado,
        arca_observaciones: null,
        payload_request: emit.requestPayload,
        payload_response: emit.responsePayload,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (insErr || !ins?.id) {
      return {
        success: false,
        error: insErr?.message || "No se pudo guardar la factura en la base.",
      }
    }

    return {
      success: true,
      invoiceId: String(ins.id),
      cae: emit.cae,
      caeFchVto: emit.caeFchVto,
      cbteNro: emit.cbteNro,
      ptoVta: ctx.ptoVta,
      impTotal: emit.impTotal,
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Error desconocido"
    return { success: false, error: message }
  }
}

export async function getPopInvoicesArcaTable(popId: string): Promise<
  | {
      success: true
      popName: string
      invoices: InvoiceArcaTableRow[]
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
  | {
      success: false
      error: string
      redirect?: string
      invoices: InvoiceArcaTableRow[]
      popName?: string
      canCreate: boolean
      canUpdate: boolean
      canDelete: boolean
    }
> {
  const empty = {
    invoices: [] as InvoiceArcaTableRow[],
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
        popName: "",
      }
    }
    const snap = await loadPopPermissionsSnapshot(popId)
    if (
      !permissionKeysInclude(
        snap.keys,
        POP_PERMS.INVOICES_READ.resource,
        POP_PERMS.INVOICES_READ.action,
      )
    ) {
      return {
        success: false,
        error: "No tenés permiso para ver facturas en este punto.",
        redirect: popMenuHref(await getPopSiteId(popId), popId),
        ...empty,
        popName: "",
      }
    }
    const canCreate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVOICES_CREATE.resource,
      POP_PERMS.INVOICES_CREATE.action,
    )
    const canUpdate = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVOICES_UPDATE.resource,
      POP_PERMS.INVOICES_UPDATE.action,
    )
    const canDelete = permissionKeysInclude(
      snap.keys,
      POP_PERMS.INVOICES_DELETE.resource,
      POP_PERMS.INVOICES_DELETE.action,
    )

    const popRes = await getPopById(popId)
    const popName =
      popRes.success && popRes.pop ? String(popRes.pop.name ?? "") : ""
    const siteId =
      popRes.success && popRes.pop
        ? siteIdFromPopRow(popRes.pop)
        : DEFAULT_SALE_SITE_ID

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("invoices_arca")
      .select(
        `
        id,
        sale_id,
        arca_cbte_tipo,
        arca_regimen,
        pto_vta,
        cbte_nro,
        cbte_fch,
        doc_tipo,
        doc_nro,
        receptor_razon_social,
        imp_total,
        imp_neto,
        imp_iva,
        imp_trib,
        mon_id,
        mon_cotiz,
        cae,
        cae_fch_vto,
        status,
        arca_resultado,
        arca_observaciones,
        payload_request,
        payload_response
      `,
      )
      .eq("pop_id", popId)
      .order("cbte_fch", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500)

    if (error) {
      return {
        success: false,
        error: error.message || "No se pudieron cargar las facturas.",
        ...empty,
        popName,
      }
    }

    const invoices: InvoiceArcaTableRow[] = (data || []).map((row) => {
      const cbteTipo = Number(row.arca_cbte_tipo ?? 0)
      const opt = findSaleInvoiceTypeByArcaCbteTipo(siteId, cbteTipo)
      const tipoLabel = opt?.label ?? `CbteTipo ${cbteTipo}`
      const nro = row.cbte_nro
      const cbteNroStr =
        typeof nro === "bigint" || typeof nro === "number"
          ? String(nro)
          : String(nro ?? "")

      return {
        id: String(row.id),
        saleId: row.sale_id != null ? String(row.sale_id) : null,
        arcaCbteTipo: cbteTipo,
        tipoLabel,
        arcaRegimen: String(row.arca_regimen ?? "fe_general"),
        ptoVta: Number(row.pto_vta ?? 0),
        cbteNro: cbteNroStr,
        cbteFch: String(row.cbte_fch ?? ""),
        docTipo: row.doc_tipo != null ? Number(row.doc_tipo) : null,
        docNro: String(row.doc_nro ?? ""),
        receptorRazonSocial: String(row.receptor_razon_social ?? ""),
        impTotal: parseMoney(row.imp_total),
        impNeto: parseMoney(row.imp_neto),
        impIva: parseMoney(row.imp_iva),
        impTrib: parseMoney(row.imp_trib),
        monId: String(row.mon_id ?? "PES"),
        monCotiz: Number(row.mon_cotiz ?? 1),
        cae: row.cae != null ? String(row.cae) : null,
        caeFchVto: row.cae_fch_vto != null ? String(row.cae_fch_vto) : null,
        status: String(row.status ?? ""),
        arcaResultado: row.arca_resultado != null ? String(row.arca_resultado) : null,
        arcaObservaciones:
          row.arca_observaciones != null ? String(row.arca_observaciones) : null,
        payloadRequest: row.payload_request ?? {},
        payloadResponse: row.payload_response ?? {},
      }
    })

    return {
      success: true,
      popName,
      invoices,
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
