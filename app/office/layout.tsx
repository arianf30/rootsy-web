import type { Metadata } from "next"
import Link from "next/link"
import { LayoutDashboard, Leaf, Lock, Palette } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { OfficeThemeToggle } from "@/components/office/office-theme-toggle"

export const metadata: Metadata = {
  title: "Office — Rootsy",
  description: "Administración y herramientas internas del producto.",
  robots: "noindex, nofollow",
}

const nav = [
  {
    href: "/office",
    label: "Inicio",
    icon: LayoutDashboard,
    description: "Resumen office",
  },
  {
    href: "/office/design-system",
    label: "UI Kit",
    icon: Palette,
    description: "Referencia para diseño",
  },
] as const

export default function OfficeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card/80 backdrop-blur-xl lg:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/office"
            className="inline-flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
              <Leaf className="size-4" aria-hidden />
            </span>
            Office
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <OfficeThemeToggle className="order-last sm:order-none" />
            <Badge
              variant="outline"
              className="shrink-0 gap-1 border-amber-500/40 text-[10px] text-amber-800 dark:border-amber-400/40 dark:text-amber-300"
            >
              <Lock className="size-3" aria-hidden />
              Solo owners
            </Badge>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2" aria-label="Office">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="lg:flex lg:min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:block">
          <div className="sticky top-0 flex h-full max-h-screen flex-col gap-6 p-5">
            <Link
              href="/office"
              className="inline-flex items-center gap-2 rounded-xl px-1 py-1 font-semibold tracking-tight transition-opacity hover:opacity-90"
            >
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
                <Leaf className="size-4" aria-hidden />
              </span>
              Rootsy Office
            </Link>

            <OfficeThemeToggle className="w-full" />

            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100/90">
              <p className="flex items-center gap-1.5 font-semibold">
                <Lock className="size-3.5 shrink-0" aria-hidden />
                Área restringida
              </p>
              <p className="mt-1 text-[11px] opacity-90">
                Pensada para owners del proyecto. Reemplazar por auth + roles
                antes de producción.
              </p>
            </div>

            <Separator />

            <nav className="flex flex-1 flex-col gap-0.5" aria-label="Secciones office">
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Navegación
              </p>
              {nav.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground/80">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </nav>

            <div className="mt-auto border-t border-border/60 pt-4 text-[10px] leading-relaxed text-muted-foreground">
              Nuevas páginas privadas: agregar rutas bajo{" "}
              <code className="rounded bg-muted px-1 font-mono">app/office/</code>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
