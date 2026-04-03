import { cn } from "@/lib/utils"

/**
 * Estilo unificado para Input y Select en la misma fila (modales y formularios densos).
 * Usar en className junto con focus del componente base.
 */
export const FORM_CONTROL_MD = cn(
  "h-11 min-h-11 w-full rounded-lg border-border/60 bg-background/80 text-sm shadow-sm",
  "transition-[color,box-shadow] focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/25",
)

/** Etiqueta compacta tipo modal POS / perfil. */
export const FORM_LABEL_UPPER = cn(
  "text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
)
