import { DsColorRow, DsTypeRow } from "@/components/office/ds-section"

const SEMANTIC_COLORS = [
  {
    name: "Fondo",
    token: "background",
    sampleClass: "bg-background",
    border: true,
  },
  {
    name: "Texto principal",
    token: "foreground",
    sampleClass: "bg-foreground",
  },
  {
    name: "Superficie tarjeta",
    token: "card",
    sampleClass: "bg-card",
    border: true,
  },
  {
    name: "Texto sobre tarjeta",
    token: "card-foreground",
    sampleClass: "bg-card-foreground",
  },
  {
    name: "Acento principal",
    token: "primary",
    sampleClass: "bg-primary",
  },
  {
    name: "Texto sobre acento",
    token: "primary-foreground",
    sampleClass: "bg-primary-foreground",
    border: true,
  },
  {
    name: "Secundario",
    token: "secondary",
    sampleClass: "bg-secondary",
    border: true,
  },
  {
    name: "Apagado / muted",
    token: "muted",
    sampleClass: "bg-muted",
    border: true,
  },
  {
    name: "Texto apagado",
    token: "muted-foreground",
    sampleClass: "bg-muted-foreground",
  },
  {
    name: "Destructivo",
    token: "destructive",
    sampleClass: "bg-destructive",
  },
  {
    name: "Bosque (marca)",
    token: "forest",
    sampleClass: "bg-forest",
  },
  {
    name: "Pradera",
    token: "meadow",
    sampleClass: "bg-meadow",
  },
  {
    name: "Ámbar",
    token: "amber",
    sampleClass: "bg-amber",
  },
  {
    name: "Corteza",
    token: "bark",
    sampleClass: "bg-bark",
  },
  {
    name: "Borde",
    token: "border",
    sampleClass: "bg-border",
    border: true,
  },
] as const

const TYPE_SCALE = [
  {
    utility: "text-xs",
    size: "0.75rem",
    lineHeight: "1rem",
    sample: "Texto extra chico — etiquetas densas y leyendas.",
  },
  {
    utility: "text-sm",
    size: "0.875rem",
    lineHeight: "1.25rem",
    sample: "Texto chico — cuerpo secundario y descripciones.",
  },
  {
    utility: "text-base",
    size: "1rem",
    lineHeight: "1.5rem",
    sample: "Texto base — párrafos y formularios.",
  },
  {
    utility: "text-lg",
    size: "1.125rem",
    lineHeight: "1.75rem",
    sample: "Texto grande — subtítulos de sección.",
  },
  {
    utility: "text-xl",
    size: "1.25rem",
    lineHeight: "1.75rem",
    sample: "Texto XL — títulos de bloque.",
  },
  {
    utility: "text-2xl",
    size: "1.5rem",
    lineHeight: "2rem",
    sample: "Encabezado 2 — jerarquía intermedia.",
    className: "text-2xl font-bold",
  },
  {
    utility: "text-3xl",
    size: "1.875rem",
    lineHeight: "2.25rem",
    sample: "Encabezado 1 — pantallas internas.",
    className: "text-3xl font-bold",
  },
  {
    utility: "text-4xl",
    size: "2.25rem",
    lineHeight: "2.5rem",
    sample: "Display — bienvenidas y héroes.",
    className: "text-4xl font-extrabold",
  },
] as const

export function DsFoundationColors() {
  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/40 px-4 sm:px-6">
      {SEMANTIC_COLORS.map((c) => (
        <DsColorRow
          key={c.token}
          name={c.name}
          token={c.token}
          sampleClass={c.sampleClass}
          border={"border" in c ? c.border : false}
        />
      ))}
    </div>
  )
}

export function DsFoundationTypeScale() {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-2 sm:px-6">
      <div className="hidden border-b border-border/50 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-[minmax(0,7rem)_minmax(0,5rem)_minmax(0,6rem)_1fr] sm:gap-4">
        <span>Clase</span>
        <span>Tamaño</span>
        <span>Interlineado</span>
        <span>Muestra</span>
      </div>
      {TYPE_SCALE.map((row) => (
        <DsTypeRow
          key={row.utility}
          utility={row.utility}
          size={row.size}
          lineHeight={row.lineHeight}
          sample={row.sample}
          previewClassName={"className" in row ? row.className : row.utility}
        />
      ))}
    </div>
  )
}
