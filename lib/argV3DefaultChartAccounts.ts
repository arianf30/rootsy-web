/**
 * Plan de cuentas modelo Argentina (`demo_seed` arg_v3) insertado por
 * `public.seed_pop_site_defaults` al crear un POP con sitio `arg`.
 * Fuente de verdad: `rootsy-core/docs/supabase/seed_pop_site_defaults.sql`.
 * Si cambiás el seed SQL, actualizá este arreglo para que el código y la doc
 * coincidan.
 */
export type ArgV3ChartAccountType =
  | "activo_corriente"
  | "activo_no_corriente"
  | "pasivo_corriente"
  | "pasivo_no_corriente"
  | "patrimonio_neto"
  | "ingresos"
  | "costos"
  | "gastos"

export type ArgV3ChartNature = "deudora" | "acreedora"

export type ArgV3DefaultChartRow = {
  code: string
  name: string
  accountType: ArgV3ChartAccountType
  nature: ArgV3ChartNature
  level: number
}

export const ARG_V3_DEFAULT_CHART_ACCOUNTS: readonly ArgV3DefaultChartRow[] = [
  { code: "1.1.1.01", name: "Caja", accountType: "activo_corriente", nature: "deudora", level: 4 },
  { code: "1.1.1.02", name: "Bancos", accountType: "activo_corriente", nature: "deudora", level: 4 },
  {
    code: "1.1.1.03",
    name: "Tarjetas y plataformas a liquidar",
    accountType: "activo_corriente",
    nature: "deudora",
    level: 4,
  },
  { code: "1.1.1.04", name: "Otros cobros", accountType: "activo_corriente", nature: "deudora", level: 4 },
  { code: "1.1.2.01", name: "Cuentas por Cobrar", accountType: "activo_corriente", nature: "deudora", level: 4 },
  {
    code: "1.1.2.02",
    name: "Documentos por Cobrar",
    accountType: "activo_corriente",
    nature: "deudora",
    level: 4,
  },
  {
    code: "1.1.2.03",
    name: "Créditos fiscales IVA",
    accountType: "activo_corriente",
    nature: "deudora",
    level: 4,
  },
  { code: "1.1.3.01", name: "Mercaderías", accountType: "activo_corriente", nature: "deudora", level: 4 },
  {
    code: "1.1.3.02",
    name: "Productos Terminados",
    accountType: "activo_corriente",
    nature: "deudora",
    level: 4,
  },
  { code: "1.1.3.03", name: "Materias Primas", accountType: "activo_corriente", nature: "deudora", level: 4 },
  { code: "1.2.1.01", name: "Bienes de uso", accountType: "activo_no_corriente", nature: "deudora", level: 4 },
  {
    code: "1.2.1.02",
    name: "Amortización acumulada",
    accountType: "activo_no_corriente",
    nature: "acreedora",
    level: 4,
  },
  { code: "2.1.1.01", name: "Proveedores", accountType: "pasivo_corriente", nature: "acreedora", level: 4 },
  {
    code: "2.1.1.02",
    name: "Documentos a Pagar",
    accountType: "pasivo_corriente",
    nature: "acreedora",
    level: 4,
  },
  { code: "2.1.2.01", name: "IVA a Pagar", accountType: "pasivo_corriente", nature: "acreedora", level: 4 },
  {
    code: "2.1.2.02",
    name: "Impuestos y retenciones a pagar",
    accountType: "pasivo_corriente",
    nature: "acreedora",
    level: 4,
  },
  {
    code: "2.1.2.03",
    name: "Cargas sociales a pagar",
    accountType: "pasivo_corriente",
    nature: "acreedora",
    level: 4,
  },
  {
    code: "2.2.1.01",
    name: "Préstamos bancarios",
    accountType: "pasivo_no_corriente",
    nature: "acreedora",
    level: 4,
  },
  { code: "3.1.1.01", name: "Capital social", accountType: "patrimonio_neto", nature: "acreedora", level: 4 },
  {
    code: "3.2.1.01",
    name: "Resultados no asignados",
    accountType: "patrimonio_neto",
    nature: "acreedora",
    level: 4,
  },
  { code: "4.1.1.01", name: "Ventas", accountType: "ingresos", nature: "acreedora", level: 4 },
  {
    code: "4.1.1.02",
    name: "Ventas de servicios",
    accountType: "ingresos",
    nature: "acreedora",
    level: 4,
  },
  { code: "4.2.1.01", name: "Otros ingresos", accountType: "ingresos", nature: "acreedora", level: 4 },
  { code: "5.1.1.01", name: "Costo de ventas", accountType: "costos", nature: "deudora", level: 4 },
  { code: "5.2.1.01", name: "Costo de producción", accountType: "costos", nature: "deudora", level: 4 },
  { code: "6.1.1.01", name: "Alquileres", accountType: "gastos", nature: "deudora", level: 4 },
  { code: "6.1.1.02", name: "Servicios públicos", accountType: "gastos", nature: "deudora", level: 4 },
  {
    code: "6.1.1.03",
    name: "Sueldos y cargas sociales",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
  },
  {
    code: "6.1.1.04",
    name: "Honorarios profesionales",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
  },
  {
    code: "6.2.1.01",
    name: "Publicidad y marketing",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
  },
  {
    code: "6.2.1.02",
    name: "Comisiones y gastos comerciales",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
  },
  {
    code: "6.2.1.03",
    name: "Mermas y pérdidas de inventario",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
  },
  {
    code: "6.3.1.01",
    name: "Intereses y gastos financieros",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
  },
] as const

export const ARG_V3_CHART_CODE = {
  mercaderiasPrimary: "1.1.3.01",
  mercaderiasAlt: ["1.1.3.02", "1.1.3.03"] as const,
  otrosIngresos: "4.2.1.01",
  ventas: "4.1.1.01",
  mermasInventario: "6.2.1.03",
} as const

export const CHART_MERCADERIAS_CODES: readonly string[] = [
  ARG_V3_CHART_CODE.mercaderiasPrimary,
  ...ARG_V3_CHART_CODE.mercaderiasAlt,
]

export const CHART_INGRESO_AJUSTE_CODES: readonly string[] = [
  ARG_V3_CHART_CODE.otrosIngresos,
  ARG_V3_CHART_CODE.ventas,
]

export const CHART_GASTO_MERMA_CODES: readonly string[] = [
  ARG_V3_CHART_CODE.mermasInventario,
  "6.2.1.02",
  "6.1.1.01",
]

export const CHART_IVA_PAGAR_CODES: readonly string[] = ["2.1.2.01"]

export const CHART_COSTO_VENTAS_CODES: readonly string[] = ["5.1.1.01"]

export const CHART_VENTAS_GRAVADAS_CODES: readonly string[] = [
  ARG_V3_CHART_CODE.ventas,
  "4.1.1.02",
]
