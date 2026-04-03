import { ARCA_ARG_SITE_ID } from "@/lib/arcaArgentinaConstants"

export const DEFAULT_SALE_SITE_ID = ARCA_ARG_SITE_ID
export type SaleSiteId = typeof DEFAULT_SALE_SITE_ID

export type SaleInvoiceArcaRegimen = "fe_general" | "fce_mipyme"

export type SaleInvoiceTypeOption = {
  readonly label: string
  readonly note?: string
  /**
   * Código **tipo de comprobante** (`CbteTipo`) en WSFE / ARCA para autorización electrónica.
   * Factura general vs FCE MiPyME usa códigos distintos (p. ej. 6 = Factura B, 206 = FCE B).
   */
  readonly arcaCbteTipo: number
  readonly arcaRegimen: SaleInvoiceArcaRegimen
}

export const SALE_INVOICE_TYPES_BY_SITE: Record<
  string,
  readonly SaleInvoiceTypeOption[]
> = {
  arg: [
    {
      label: "Factura A",
      arcaCbteTipo: 1,
      arcaRegimen: "fe_general",
    },
    {
      label: "Factura B",
      arcaCbteTipo: 6,
      arcaRegimen: "fe_general",
    },
    {
      label: "Factura C",
      arcaCbteTipo: 11,
      arcaRegimen: "fe_general",
    },
    {
      label: "Nota de crédito A",
      arcaCbteTipo: 3,
      arcaRegimen: "fe_general",
    },
    {
      label: "Nota de crédito B",
      arcaCbteTipo: 8,
      arcaRegimen: "fe_general",
    },
    {
      label: "Nota de crédito C",
      arcaCbteTipo: 13,
      arcaRegimen: "fe_general",
    },
    {
      label: "Nota de débito A",
      arcaCbteTipo: 2,
      arcaRegimen: "fe_general",
    },
    {
      label: "Nota de débito B",
      arcaCbteTipo: 7,
      arcaRegimen: "fe_general",
    },
    {
      label: "Nota de débito C",
      arcaCbteTipo: 12,
      arcaRegimen: "fe_general",
    },
    {
      label: "Recibo A",
      arcaCbteTipo: 4,
      arcaRegimen: "fe_general",
    },
    {
      label: "Recibo B",
      arcaCbteTipo: 9,
      arcaRegimen: "fe_general",
    },
    {
      label: "Recibo C",
      arcaCbteTipo: 15,
      arcaRegimen: "fe_general",
    },
    {
      label: "Factura de crédito electrónica MiPyME (FCE) A",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 201,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Factura de crédito electrónica MiPyME (FCE) B",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 206,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Factura de crédito electrónica MiPyME (FCE) C",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 211,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Nota de débito electrónica MiPyME (FCE) A",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 202,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Nota de débito electrónica MiPyME (FCE) B",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 207,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Nota de débito electrónica MiPyME (FCE) C",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 212,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Nota de crédito electrónica MiPyME (FCE) A",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 203,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Nota de crédito electrónica MiPyME (FCE) B",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 208,
      arcaRegimen: "fce_mipyme",
    },
    {
      label: "Nota de crédito electrónica MiPyME (FCE) C",
      note: "Régimen MiPyME / ARCA",
      arcaCbteTipo: 213,
      arcaRegimen: "fce_mipyme",
    },
  ],
}

export function getSaleInvoiceTypeLabelsForSite(
  siteId: string,
): readonly string[] {
  const list =
    SALE_INVOICE_TYPES_BY_SITE[siteId] ??
    SALE_INVOICE_TYPES_BY_SITE[DEFAULT_SALE_SITE_ID]
  return list.map((o) => o.label)
}

export function getSaleInvoiceTypeOptionsForSite(
  siteId: string,
): readonly SaleInvoiceTypeOption[] {
  return (
    SALE_INVOICE_TYPES_BY_SITE[siteId] ??
    SALE_INVOICE_TYPES_BY_SITE[DEFAULT_SALE_SITE_ID]
  )
}

export function findSaleInvoiceTypeByLabel(
  siteId: string,
  label: string,
): SaleInvoiceTypeOption | undefined {
  return getSaleInvoiceTypeOptionsForSite(siteId).find((o) => o.label === label)
}

export function findSaleInvoiceTypeByArcaCbteTipo(
  siteId: string,
  arcaCbteTipo: number,
): SaleInvoiceTypeOption | undefined {
  return getSaleInvoiceTypeOptionsForSite(siteId).find(
    (o) => o.arcaCbteTipo === arcaCbteTipo,
  )
}
