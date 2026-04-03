export const DEFAULT_SALE_SITE_ID = "arg" as const
export type SaleSiteId = typeof DEFAULT_SALE_SITE_ID

export type SaleInvoiceTypeOption = {
  readonly label: string
  readonly note?: string
}

export const SALE_INVOICE_TYPES_BY_SITE: Record<
  string,
  readonly SaleInvoiceTypeOption[]
> = {
  arg: [
    { label: "Factura A" },
    { label: "Factura B" },
    { label: "Factura C" },
    { label: "Nota de crédito A" },
    { label: "Nota de crédito B" },
    { label: "Nota de crédito C" },
    { label: "Nota de débito A" },
    { label: "Nota de débito B" },
    { label: "Nota de débito C" },
    { label: "Recibo" },
    {
      label: "Factura de crédito electrónica MiPyME (FCE) A",
      note: "Régimen MiPyME / ARCA",
    },
    {
      label: "Factura de crédito electrónica MiPyME (FCE) B",
      note: "Régimen MiPyME / ARCA",
    },
    {
      label: "Factura de crédito electrónica MiPyME (FCE) C",
      note: "Régimen MiPyME / ARCA",
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
