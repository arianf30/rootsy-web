import {
  ROOTSY_PALETTE_FAMILIES,
  ROOTSY_SEMANTIC_TO_PRIMITIVE,
  SHADES,
  type RootsPaletteFamily,
  type Shade,
} from "@/lib/rootsy-palette"
import { DsColorRow, DsTypeRow } from "@/components/office/ds-section"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

function DsPaletteFamilyStrip({ family }: { family: RootsPaletteFamily }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/35 p-4 sm:p-5">
      <div className="mb-3 max-w-3xl space-y-1">
        <h3 className="text-sm font-semibold tracking-tight">{family.label}</h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {family.intent}
        </p>
        <p className="font-mono text-[10px] text-muted-foreground/90">
          {`bg-${family.id}-[50–950] · text-${family.id}-[paso]`}
        </p>
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] sm:gap-2">
        {SHADES.map((step) => {
          const hex = family.steps[step as Shade]
          const isAnchor = family.anchor === step
          return (
            <div
              key={step}
              className="flex w-[4.25rem] shrink-0 flex-col gap-1 sm:w-[4.75rem]"
            >
              <div
                className={cn(
                  "relative h-12 w-full rounded-lg border shadow-inner sm:h-14",
                  hex.toLowerCase() === "#ffffff" || hex === "#fafcfb"
                    ? "border-border"
                    : "border-black/10 dark:border-white/12",
                )}
                style={{ backgroundColor: hex }}
                title={hex}
              >
                {isAnchor ? (
                  <span className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-white/95 text-amber-600 shadow dark:bg-ink-800 dark:text-amber-300">
                    <Star className="size-3 fill-current" aria-hidden />
                    <span className="sr-only">Ancla de uso principal</span>
                  </span>
                ) : null}
              </div>
              <p className="text-center font-mono text-[10px] font-semibold tabular-nums">
                {step}
              </p>
              <p className="text-center font-mono text-[9px] leading-tight text-muted-foreground">
                {hex}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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

export function DsFoundationTypefaces() {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-card/40 p-4 sm:p-6">
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sans · interfaz (font-sans)
        </p>
        <p className="font-sans text-2xl font-semibold tracking-tight">
          Nunito — Ábaco verde 123
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          <span className="font-mono text-[11px] text-foreground">Nunito</span> se carga con{" "}
          <span className="font-mono text-[11px]">next/font/google</span> en{" "}
          <span className="font-mono text-[11px]">app/layout.tsx</span>
          (subset latin, pesos 400, 500, 600, 700, 800). El{" "}
          <span className="font-mono text-[11px]">&lt;body&gt;</span> aplica{" "}
          <span className="font-mono text-[11px]">font-sans</span> y las variables{" "}
          <span className="font-mono text-[11px]">--font-nunito</span> y{" "}
          <span className="font-mono text-[11px]">--font-geist-mono</span>. En el tema (
          <span className="font-mono text-[11px]">app/globals.css</span>,{" "}
          <span className="font-mono text-[11px]">@theme inline</span>){" "}
          <span className="font-mono text-[11px]">--font-sans</span> resuelve a esa familia con
          respaldo <span className="font-mono text-[11px]">sans-serif</span>.
        </p>
      </div>
      <div className="space-y-2 border-t border-border/60 pt-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Mono · código (font-mono)
        </p>
        <p className="font-mono text-sm text-foreground">
          Geist Mono — const sku = &quot;POS-2048&quot;
        </p>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          <span className="font-mono text-[11px] text-foreground">Geist Mono</span> también viene de{" "}
          <span className="font-mono text-[11px]">next/font/google</span>;{" "}
          <span className="font-mono text-[11px]">--font-mono</span> en el tema usa{" "}
          <span className="font-mono text-[11px]">var(--font-geist-mono)</span> con fallback{" "}
          <span className="font-mono text-[11px]">ui-monospace</span>.
        </p>
      </div>
    </div>
  )
}

/**
 * Paleta primitiva (50–950) + puente a tokens semánticos.
 * design-role: mismos nombres en feedback y código; Ley de escalas: primitivos para matiz, semántica para significado.
 */
export function DsFoundationColors() {
  return (
    <div className="space-y-10">
      <div className="rounded-xl border border-border/70 bg-card/40 p-4 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Cómo usarla
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Cada fila es una <strong className="font-medium text-foreground">familia</strong> con el mismo matiz
          de más claro (50) a más oscuro (950), como en Tailwind o Material. El ícono ★ marca el paso
          alineado al producto actual (CTA, partícula POP, shell oscuro, etc.). Para UI preferí tokens
          semánticos (<span className="font-mono text-xs">bg-primary</span>) cuando el significado importa;
          usá <span className="font-mono text-xs">forest</span>, <span className="font-mono text-xs">ink</span>,
          etc. cuando necesites un tono intermedio. Valores en{" "}
          <span className="font-mono text-xs">lib/rootsy-palette.ts</span> y{" "}
          <span className="font-mono text-xs">app/globals.css</span> deben mantenerse iguales.
        </p>
      </div>

      <div className="space-y-5">
        {ROOTSY_PALETTE_FAMILIES.map((family) => (
          <DsPaletteFamilyStrip key={family.id} family={family} />
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Del token semántico al primitivo
        </h3>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Atajos para feedback (“subí el fondo un paso en ink”) sin ambigüedades.
        </p>
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="grid grid-cols-[1fr_auto] gap-x-4 border-b border-border/60 bg-muted/30 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,12rem)]">
            <span className="hidden sm:block">Token</span>
            <span>Rol</span>
            <span className="text-right sm:text-left">Primitivo sugerido</span>
          </div>
          <ul className="divide-y divide-border/50">
            {ROOTSY_SEMANTIC_TO_PRIMITIVE.map((row) => (
              <li
                key={row.token}
                className="grid grid-cols-1 gap-1 px-3 py-2.5 text-sm sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)_minmax(0,12rem)] sm:items-center sm:gap-4"
              >
                <code className="font-mono text-xs text-primary">{row.token}</code>
                <span>{row.label}</span>
                <code className="font-mono text-[11px] text-muted-foreground sm:text-left">
                  {row.hint}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold tracking-tight">
          Muestra rápida · tokens shadcn
        </h3>
        <p className="text-sm text-muted-foreground">
          Resuelven según el tema claro/oscuro del Office (no son pasos 50–950).
        </p>
        <div className="divide-y divide-border/60 rounded-xl border border-border bg-card/40 px-4 sm:px-6">
          <DsColorRow
            name="Fondo"
            token="background"
            sampleClass="bg-background"
            border
          />
          <DsColorRow
            name="Texto principal"
            token="foreground"
            sampleClass="bg-foreground"
          />
          <DsColorRow
            name="Tarjeta"
            token="card"
            sampleClass="bg-card"
            border
          />
          <DsColorRow
            name="Primary"
            token="primary"
            sampleClass="bg-primary"
          />
          <DsColorRow
            name="Muted"
            token="muted"
            sampleClass="bg-muted"
            border
          />
          <DsColorRow
            name="Borde"
            token="border"
            sampleClass="bg-border"
            border
          />
        </div>
      </div>
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
