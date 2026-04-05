const PREFIX_LABELS: Record<string, string> = {
  "1": "Activo",
  "2": "Pasivo",
  "3": "Patrimonio neto",
  "4": "Ingresos",
  "5": "Costos",
  "6": "Gastos",
  "1.1": "Activo corriente",
  "1.2": "Activo no corriente",
  "2.1": "Pasivo corriente",
  "2.2": "Pasivo no corriente",
  "3.1": "Capital y aportes",
  "3.2": "Resultados",
  "4.1": "Actividad principal",
  "4.1.1": "Ventas y servicios",
  "4.2": "Otros ingresos",
  "5.1": "Costo de ventas",
  "5.2": "Costo de producción",
  "6.1": "Administración",
  "6.2": "Comercialización",
  "6.3": "Financieros y tenencia",
  "1.1.1": "Disponibilidades",
  "1.1.2": "Créditos por ventas y otros créditos",
  "1.1.3": "Existencias",
  "1.2.1": "Bienes de uso",
  "2.1.1": "Deudas comerciales",
  "2.1.2": "Obligaciones fiscales y sociales",
  "2.2.1": "Pasivos no corrientes",
  "3.1.1": "Capital y reservas",
  "3.2.1": "Resultados acumulados",
  "4.2.1": "Otros ingresos",
  "5.1.1": "Costo de ventas",
  "5.2.1": "Costo de producción",
  "6.1.1": "Gastos administrativos",
  "6.2.1": "Gastos de comercialización",
  "6.3.1": "Gastos financieros y por tenencia",
}

const BREADCRUMB_SEP = " > "

export function labelForAccountingCodePrefix(prefix: string): string | null {
  const k = prefix.trim()
  return PREFIX_LABELS[k] ?? null
}

export function codePrefixForLeafGroup(code: string): string | null {
  const parts = code.trim().split(".")
  if (parts.length < 4) return null
  return parts.slice(0, -1).join(".")
}

function cumulativeCodePrefixes(code: string): string[] {
  const parts = code.trim().split(".").filter(Boolean)
  if (parts.length === 0) return []
  const out: string[] = []
  for (let i = 0; i < parts.length; i++) {
    out.push(parts.slice(0, i + 1).join("."))
  }
  return out
}

export function breadcrumbForCodePrefix(prefix: string): string {
  const labels = cumulativeCodePrefixes(prefix).map(
    (p) => labelForAccountingCodePrefix(p) ?? p,
  )
  return labels.join(BREADCRUMB_SEP)
}

export function breadcrumbForAccountRow(row: { code: string; name: string }): string {
  const parts = row.code.trim().split(".").filter(Boolean)
  if (parts.length === 0) return row.name.trim() || "—"
  const labels: string[] = []
  for (let i = 0; i < parts.length; i++) {
    const pfx = parts.slice(0, i + 1).join(".")
    if (i === parts.length - 1) {
      labels.push(row.name.trim() || pfx)
    } else {
      labels.push(labelForAccountingCodePrefix(pfx) ?? pfx)
    }
  }
  return labels.join(BREADCRUMB_SEP)
}
