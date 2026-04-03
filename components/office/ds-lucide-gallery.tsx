"use client"

import { useCallback, useMemo, useState } from "react"
import { Check, Copy, ExternalLink, Search } from "lucide-react"
import { DynamicIcon, iconNames } from "lucide-react/dynamic"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 72
const SEARCH_CAP = 240

/** Palabras en español → términos en inglés que suelen aparecer en nombres de íconos Lucide */
const TERM_HINTS: Record<string, string> = {
  usuario: "user person",
  perfil: "user circle",
  cerrar: "x close",
  basura: "trash delete",
  carrito: "shopping-cart cart",
  compras: "shopping bag",
  casa: "home house",
  configuracion: "settings cog sliders",
  lupa: "search scan",
  agregar: "plus circle-plus",
  editar: "pencil pen square-pen",
  imagen: "image images",
  menu: "menu panel",
  flecha: "arrow chevron",
  descarga: "download import",
  subir: "upload export",
  notificacion: "bell",
  correo: "mail inbox",
  calendario: "calendar",
  reloj: "clock time",
  estrella: "star",
  corazon: "heart",
  candado: "lock",
  enlace: "link",
  copiar: "copy clipboard",
  vista: "eye scan",
  mover: "move drag",
  audio: "volume music",
  video: "video film",
  documento: "file file-text",
  carpeta: "folder",
  imprimir: "printer",
  filtros: "filter list-filter",
  ordenar: "arrow-up-down sort",
  mapa: "map pin map-pin",
  telefono: "phone",
  mensaje: "message square",
}

function wordMatchesIcon(name: string, word: string): boolean {
  if (!word) return false
  const hay = name.toLowerCase()
  if (hay.includes(word)) return true
  const hint = TERM_HINTS[word]
  if (!hint) return false
  return hint.split(/\s+/).some((h) => h.length > 0 && hay.includes(h))
}

function iconMatchesQuery(name: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const words = q.split(/\s+/).filter((w) => w.length > 0)
  if (words.length === 0) return true
  const hyphenated = q.replace(/\s+/g, "-")
  if (name.toLowerCase().includes(hyphenated)) return true
  return words.every((w) => wordMatchesIcon(name, w))
}

function copySnippet(name: string): string {
  return `<DynamicIcon name="${name}" className="size-4" />`
}

export function DsLucideGallery() {
  const [query, setQuery] = useState("")
  const [browsePage, setBrowsePage] = useState(1)
  const [copied, setCopied] = useState<string | null>(null)

  const sortedNames = useMemo(
    () => [...iconNames].sort((a, b) => a.localeCompare(b)),
    [],
  )

  const searchActive = query.trim().length > 0

  const filtered = useMemo(() => {
    if (!searchActive) return sortedNames
    return sortedNames.filter((n) => iconMatchesQuery(n, query))
  }, [sortedNames, query, searchActive])

  const visibleNames = useMemo(() => {
    if (searchActive) {
      return filtered.slice(0, SEARCH_CAP)
    }
    return filtered.slice(0, browsePage * PAGE_SIZE)
  }, [filtered, searchActive, browsePage])

  const canLoadMore = !searchActive && visibleNames.length < filtered.length
  const truncatedSearch = searchActive && filtered.length > SEARCH_CAP

  const onCopy = useCallback(async (name: string) => {
    const text = `import { DynamicIcon } from "lucide-react/dynamic"\n\n${copySnippet(
      name,
    )}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(name)
      window.setTimeout(() => setCopied((c) => (c === name ? null : c)), 1600)
    } catch {
      setCopied(null)
    }
  }, [])

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card/40 p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          Paquete{" "}
          <span className="font-mono text-[13px] text-foreground">lucide-react</span>{" "}
          (misma familia que shadcn/ui). En pantallas usamos imports nombrados; para
          explorar todos los nombres sin inflar el bundle de cada ruta,{" "}
          <span className="font-mono text-[13px]">DynamicIcon</span> carga el trazo
          bajo demanda. Documentación oficial:{" "}
          <a
            href="https://lucide.dev"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            lucide.dev
          </a>
          .
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative min-w-0 flex-1 space-y-1.5">
          <Label
            htmlFor="ds-lucide-search"
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Buscar íconos
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="ds-lucide-search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setBrowsePage(1)
              }}
              placeholder="Ej: user, cart, arrow close… (varias palabras = todas deben coincidir)"
              className="h-11 pl-9"
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Incluye ayudas en español (p. ej. <strong className="font-medium text-foreground/80">carrito</strong>,{" "}
            <strong className="font-medium text-foreground/80">usuario</strong>,{" "}
            <strong className="font-medium text-foreground/80">lupa</strong>) mapeadas a términos típicos
            en inglés del nombre del ícono. Para listar todo el set sin filtro, dejá vacío y usá &quot;Cargar
            más&quot;.
          </p>
        </div>
        {searchActive ? (
          <p className="shrink-0 text-sm tabular-nums text-muted-foreground sm:pb-2">
            {filtered.length === 0
              ? "Sin coincidencias"
              : truncatedSearch
                ? `Primeros ${visibleNames.length} de ${filtered.length}`
                : `${filtered.length} coincidencias`}
          </p>
        ) : (
          <p className="shrink-0 text-sm tabular-nums text-muted-foreground sm:pb-2">
            {visibleNames.length} de {sortedNames.length} íconos
          </p>
        )}
      </div>

      {truncatedSearch ? (
        <p className="text-xs text-amber-700 dark:text-amber-300/90">
          Hay muchos resultados: mostramos hasta {SEARCH_CAP}. Afiná la búsqueda para ver otros.
        </p>
      ) : null}

      <ul
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        aria-label="Galería de íconos Lucide"
      >
        {visibleNames.map((name) => (
          <li key={name}>
            <div
              className={cn(
                "flex h-full flex-col gap-2 rounded-lg border border-border/80 bg-card/50 p-2 shadow-sm transition-colors hover:border-primary/35 hover:bg-card",
              )}
            >
              <div className="flex items-center justify-center rounded-md bg-muted/40 py-3 text-foreground">
                <DynamicIcon
                  name={name}
                  className="size-7"
                  strokeWidth={1.75}
                  aria-hidden
                />
              </div>
              <code className="line-clamp-2 break-all text-[10px] font-medium leading-tight text-foreground">
                {name}
              </code>
              <div className="mt-auto flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 gap-1 px-1.5 text-[10px]"
                  onClick={() => onCopy(name)}
                >
                  {copied === name ? (
                    <Check className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="size-3 shrink-0 opacity-70" />
                  )}
                  Copiar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2"
                  asChild
                >
                  <a
                    href={`https://lucide.dev/icons/${encodeURIComponent(name)}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Abrir en lucide.dev"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!searchActive && canLoadMore ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={() => setBrowsePage((p) => p + 1)}
        >
          Cargar más ({PAGE_SIZE} siguientes · {sortedNames.length - visibleNames.length}{" "}
          restantes)
        </Button>
      ) : null}

      {searchActive && filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay íconos que coincidan. Probá una sola palabra clave, sinónimos en inglés, o revisá el{" "}
          <a
            className="font-medium text-primary underline-offset-4 hover:underline"
            href="https://lucide.dev/icons/"
            target="_blank"
            rel="noreferrer"
          >
            índice en Lucide
          </a>
          .
        </p>
      ) : null}
    </div>
  )
}
