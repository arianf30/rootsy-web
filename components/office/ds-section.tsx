import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type DsSectionProps = {
  id: string
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DsSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: DsSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 border-b border-border/60 pb-16 last:border-b-0",
        className,
      )}
    >
      <header className="mb-8 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="space-y-8">{children}</div>
    </section>
  )
}

/** Pieza nombrada para el UI Kit: nombre + dónde aparece en el producto. */
export function DesignTile({
  name,
  where,
  children,
}: {
  name: string
  where: string
  children: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/50 p-5 sm:p-6">
      <header className="mb-5 border-b border-border/50 pb-4">
        <h3 className="text-base font-semibold tracking-tight">{name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{where}</p>
      </header>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/** Contenedor estilo documentación (rejilla de variantes con título). */
export function DsVariantPanel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border/80 bg-muted/40 px-4 py-3 sm:px-5">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-8 p-5 sm:p-6">{children}</div>
    </div>
  )
}

/** Celda: muestra arriba el componente y abajo nombre de variante (estilo Tailwind UI). */
export function DsVariantCell({
  label,
  sublabel,
  children,
}: {
  label: string
  sublabel?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-[5.5rem] flex-col items-center gap-3 text-center">
      <div className="flex min-h-11 w-full items-center justify-center">
        {children}
      </div>
      <div className="space-y-0.5">
        <p className="font-mono text-[11px] font-medium text-foreground">{label}</p>
        {sublabel ? (
          <p className="max-w-[10rem] text-[10px] leading-snug text-muted-foreground">
            {sublabel}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Fila de paleta: muestra color + etiquetas (estilo referencia Tailwind). */
export function DsColorRow({
  name,
  token,
  sampleClass,
  border,
}: {
  name: string
  token: string
  sampleClass: string
  border?: boolean
}) {
  return (
    <div className="flex items-center gap-4 py-3 sm:gap-6">
      <div
        className={`size-14 shrink-0 rounded-lg shadow-inner sm:size-16 ${sampleClass} ${border ? "ring-1 ring-border" : ""}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{token}</p>
      </div>
    </div>
  )
}

/** Fila de escala tipográfica. */
export function DsTypeRow({
  utility,
  size,
  lineHeight,
  sample,
  previewClassName,
}: {
  utility: string
  size: string
  lineHeight: string
  sample: string
  /** Clases aplicadas a la muestra (p. ej. text-2xl font-bold). */
  previewClassName?: string
}) {
  const preview = previewClassName ?? utility
  return (
    <div className="grid gap-3 border-b border-border/50 py-4 last:border-b-0 sm:grid-cols-[minmax(0,7rem)_minmax(0,5rem)_minmax(0,6rem)_1fr] sm:items-baseline sm:gap-4">
      <code className="font-mono text-xs font-medium text-primary">{utility}</code>
      <span className="text-xs text-muted-foreground">{size}</span>
      <span className="text-xs text-muted-foreground">{lineHeight}</span>
      <p className={preview}>{sample}</p>
    </div>
  )
}
