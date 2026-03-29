"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf, Menu, X } from "lucide-react"

const NAV = [
  { label: "Inicio", href: "#inicio" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Clientes", href: "#clientes" },
  { label: "Preguntas frecuentes", href: "#faq" },
  { label: "Precios", href: "#precios" },
] as const

/** URL del login (p. ej. app en rootsy-core). Si no está definida, /menu como demo. */
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/menu"

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const [particles, setParticles] = useState<
    Array<{
      width: number
      height: number
      left: number
      top: number
      opacity: number
      duration: number
      delay: number
    }>
  >([])
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setParticles(
      Array.from({ length: 14 }, () => ({
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.18 + 0.04,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      })),
    )
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    return () => window.removeEventListener("mousemove", onMouseMove)
  }, [onMouseMove])

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-hidden bg-background text-foreground"
    >
      {/* Fondo atmosférico — tokens del shell (app/[pop]/menu) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute h-[820px] w-[820px] rounded-full opacity-[0.12] blur-[150px] transition-all duration-[2000ms] ease-out"
          style={{
            background:
              "radial-gradient(circle, rgba(52, 211, 153, 0.55) 0%, transparent 70%)",
            left: `${mousePos.x}%`,
            top: `${mousePos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
        <div className="absolute left-1/2 top-0 h-[420px] w-[1100px] -translate-x-1/2 rounded-full bg-emerald-600/[0.07] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16, 185, 129, 0.15), transparent 55%)",
          }}
        />
        {particles.map((particle, i) => (
          <div
            key={i}
            className="animate-float absolute rounded-full"
            style={{
              width: particle.width + "px",
              height: particle.height + "px",
              left: particle.left + "%",
              top: particle.top + "%",
              background: "var(--rootsy-particle)",
              opacity: particle.opacity,
              animationDuration: particle.duration + "s",
              animationDelay: particle.delay + "s",
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,10,9,0.75)_100%)]" />
        {/* “Dosel” superior sutil */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background via-transparent to-transparent"
          aria-hidden
        />
      </div>

      {/* Barra superior */}
      <header className="sticky top-0 z-50 border-b border-rootsy-hairline bg-card/95 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted ring-1 ring-border">
              <Leaf className="h-5 w-5 text-meadow" aria-hidden />
            </span>
            <span className="text-lg">Rootsy</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/65 transition-colors hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-foreground/80 hover:bg-muted hover:text-foreground sm:inline-flex"
              asChild
            >
              <Link href={LOGIN_URL}>Ingresar</Link>
            </Button>
            <Button
              size="sm"
              className="hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/30 hover:from-emerald-400 hover:to-teal-500 sm:inline-flex"
              asChild
            >
              <a href="#precios">Quiero dar el salto</a>
            </Button>
            <button
              type="button"
              className="rounded-xl border border-border bg-secondary p-2 text-foreground md:hidden"
              aria-expanded={navOpen}
              aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setNavOpen((o) => !o)}
            >
              {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {navOpen ? (
          <div className="border-t border-rootsy-hairline bg-card/98 px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1" aria-label="Móvil">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-muted"
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <Link
                href={LOGIN_URL}
                className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-meadow hover:bg-muted"
                onClick={() => setNavOpen(false)}
              >
                Ingresar
              </Link>
              <a
                href="#precios"
                className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
                onClick={() => setNavOpen(false)}
              >
                Quiero dar el salto
              </a>
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        {/* Hero = Inicio */}
        <section
          id="inicio"
          className="relative z-10 scroll-mt-24 px-4 pb-24 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20"
        >
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-10">
            <div className="flex flex-col gap-6">
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-meadow">
                Gestión que crece con vos
              </p>
              <h1 className="text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                Un solo sistema.{" "}
                <span className="bg-gradient-to-r from-meadow to-teal-200 bg-clip-text text-transparent">
                  Cualquier negocio.
                </span>
              </h1>
              <p className="max-w-xl text-pretty text-lg text-foreground/65 sm:text-xl">
                Rootsy se adapta a cómo vendés, comprás y administrás: un mundo
                ordenado bajo el mismo árbol — simple en la superficie, profundo
                cuando lo necesitás.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 px-8 text-base font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-400 hover:to-teal-500"
                  asChild
                >
                  <a href="#precios">¡Quiero dar el salto!</a>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-border bg-secondary text-foreground hover:bg-muted"
                  asChild
                >
                  <Link href={LOGIN_URL}>Ingresar</Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Sin tarjeta para explorar · Migrá cuando quieras
              </p>
            </div>

            <div className="relative mx-auto flex max-w-md justify-center lg:mx-0 lg:max-w-none lg:justify-end">
              <div className="relative aspect-square w-full max-w-[420px]">
                <div className="absolute inset-6 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent blur-2xl" />
                <div className="absolute inset-0 rounded-[2rem] ring-1 ring-border" />
                <Image
                  src="/rootsy-mascot.png"
                  alt="Rootsy, la guía de tu negocio"
                  fill
                  className="object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.45)] motion-safe:animate-[mascot-float_7s_ease-in-out_infinite]"
                  sizes="(max-width: 1024px) 90vw, 420px"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Anclas vacías: las completamos en siguientes iteraciones */}
        <section
          id="soluciones"
          className="relative z-10 scroll-mt-24 border-t border-rootsy-hairline bg-rootsy-section-alt py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Soluciones</h2>
            <p className="mt-2 max-w-2xl text-foreground/55">
              Próximamente: cómo Rootsy encaja en tu operación.
            </p>
          </div>
        </section>

        <section
          id="clientes"
          className="relative z-10 scroll-mt-24 py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Clientes</h2>
            <p className="mt-2 max-w-2xl text-foreground/55">
              Próximamente: historias y sectores.
            </p>
          </div>
        </section>

        <section
          id="faq"
          className="relative z-10 scroll-mt-24 border-t border-rootsy-hairline bg-rootsy-section-alt py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Preguntas frecuentes</h2>
            <p className="mt-2 max-w-2xl text-foreground/55">
              Próximamente: respuestas claras, sin humo.
            </p>
          </div>
        </section>

        <section
          id="precios"
          className="relative z-10 scroll-mt-24 py-24 pb-32"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Precios</h2>
            <p className="mt-2 max-w-2xl text-foreground/55">
              Próximamente: planes y el salto que mencionamos arriba.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-rootsy-hairline bg-rootsy-footer py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-foreground/45 sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Rootsy</span>
          <span className="text-foreground/35">El mundo dentro de tu negocio</span>
        </div>
      </footer>
    </div>
  )
}
