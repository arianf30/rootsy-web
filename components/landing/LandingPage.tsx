"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClientesSection } from "@/components/landing/ClientesSection"
import { ControlNegocioSection } from "@/components/landing/ControlNegocioSection"
import { PreguntasAnticipadasSection } from "@/components/landing/PreguntasAnticipadasSection"
import { PreciosSection } from "@/components/landing/PreciosSection"
import { RubrosSection } from "@/components/landing/RubrosSection"
import { LandingHeroParkBackdrop } from "@/components/rootsy"
import { Leaf, Menu, X } from "lucide-react"

const NAV = [
  { label: "Inicio", href: "#inicio" },
  { label: "Soluciones", href: "#soluciones" },
  { label: "Clientes", href: "#clientes" },
  { label: "Preguntas frecuentes", href: "#faq" },
  { label: "Precios", href: "#precios" },
] as const

/** URL del login (p. ej. app en rootsy-core). Si no está definida, /menu como demo. */
const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"

/** Altura mínima del panel hero (debajo del header), además de llenar el viewport restante. */
const HERO_PANE_MIN_REM = 22

/** Tope en pantallas muy altas (solo el panel bajo el header en desktop; cap general en mobile). */
const HERO_PANE_MAX_REM = 44

export function LandingPage() {
  const headerRef = useRef<HTMLElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const [headerH, setHeaderH] = useState(72)
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

  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setHeaderH(el.offsetHeight)
    })
    ro.observe(el)
    setHeaderH(el.offsetHeight)
    return () => ro.disconnect()
  }, [])

  const heroPaneHeight = `min(max(${HERO_PANE_MIN_REM}rem, calc(100dvh - ${headerH}px)), ${HERO_PANE_MAX_REM}rem)`

  const heroPaneHeightMobile = `min(max(${HERO_PANE_MIN_REM}rem, 100dvh), ${HERO_PANE_MAX_REM}rem)`

  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, () => ({
        width: Math.random() * 2 + 1,
        height: Math.random() * 2 + 1,
        left: Math.random() * 100,
        top: Math.random() * 100,
        opacity: Math.random() * 0.22 + 0.05,
        duration: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      })),
    )
  }, [])

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = heroRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePos({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    })
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    return () => window.removeEventListener("mousemove", onMouseMove)
  }, [onMouseMove])

  const goInicio = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: "smooth" })
    window.history.replaceState(null, "", "#inicio")
    setNavOpen(false)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      {/* Barra superior: sticky (overflow-x-clip evita que overflow-x-hidden rompa sticky) */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 shrink-0 border-b border-rootsy-hairline bg-card/95 backdrop-blur-2xl supports-[backdrop-filter]:bg-card/88"
      >
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
                onClick={item.href === "#inicio" ? goInicio : undefined}
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
                  onClick={
                    item.href === "#inicio"
                      ? goInicio
                      : () => setNavOpen(false)
                  }
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

      <section
        ref={heroRef}
        id="inicio"
        aria-label="Inicio"
        className="relative z-10 isolate min-h-0 overflow-hidden scroll-mt-0 max-lg:h-[var(--rootsy-hero-h-mobile)] lg:fixed lg:inset-x-0 lg:top-[var(--rootsy-hero-top)] lg:z-[8] lg:min-h-0 lg:scroll-mt-0 lg:h-[var(--rootsy-hero-h)]"
        style={
          {
            "--rootsy-hero-top": `${headerH}px`,
            "--rootsy-hero-h": heroPaneHeight,
            "--rootsy-hero-h-mobile": heroPaneHeightMobile,
          } as React.CSSProperties
        }
      >
        <LandingHeroParkBackdrop
          mouseX={mousePos.x}
          mouseY={mousePos.y}
          particles={particles}
        />

        <div className="relative z-10 flex h-full min-h-0 flex-col justify-center px-4 pt-6 pb-[62px] sm:px-6 lg:px-8">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-10">
                <div className="flex flex-col gap-6">
                  <p className="rootsy-hero-rise rootsy-hero-rise-d1 inline-flex w-fit items-center gap-2 rounded-md border border-primary/40 bg-primary/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-meadow shadow-[0_0_24px_rgba(16,185,129,0.2)] backdrop-blur-sm">
                    Gestión que crece con vos
                  </p>
                  <h1 className="rootsy-hero-rise rootsy-hero-rise-d2 text-balance text-4xl font-extrabold tracking-tight text-foreground drop-shadow-[0_4px_32px_rgba(0,0,0,0.55)] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.08]">
                    Un solo sistema.{" "}
                    <span className="bg-gradient-to-r from-meadow to-teal-200 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(52,211,153,0.25)]">
                      Cualquier negocio.
                    </span>
                  </h1>
                  <p className="rootsy-hero-rise rootsy-hero-rise-d3 max-w-xl text-pretty text-lg text-foreground/80 sm:text-xl">
                    Rootsy se adapta a cómo vendés, comprás y administrás: un mundo
                    ordenado bajo el mismo árbol — simple en la superficie, profundo
                    cuando lo necesitás.
                  </p>
                  <div className="rootsy-hero-rise rootsy-hero-rise-d4 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Button
                      size="lg"
                      className="relative h-12 overflow-hidden rounded-xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500 to-teal-600 px-8 text-base font-bold tracking-wide text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5),0_0_36px_-4px_rgba(16,185,129,0.4)] transition hover:from-emerald-400 hover:to-teal-500"
                      asChild
                    >
                      <a href="#precios">¡Quiero dar el salto!</a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 rounded-xl border-border/80 bg-background/40 text-foreground backdrop-blur-sm hover:bg-muted"
                      asChild
                    >
                      <Link href={LOGIN_URL}>Ingresar</Link>
                    </Button>
                  </div>
                  <p className="rootsy-hero-rise rootsy-hero-rise-d5 text-sm text-foreground/50">
                    Sin tarjeta para explorar · Migrá cuando quieras
                  </p>
                </div>

                <div className="rootsy-hero-rise rootsy-hero-rise-d3 relative mx-auto flex min-h-[200px] w-full max-w-[460px] justify-center lg:mx-0 lg:max-w-none lg:min-h-0 lg:justify-end">
                  <div className="relative aspect-[4/5] w-full max-w-[400px] lg:aspect-square lg:max-w-[min(100%,420px)]">
                    <div
                      className="rootsy-mascot-orb pointer-events-none absolute left-1/2 top-1/2 h-[88%] w-[88%] rounded-full bg-gradient-to-br from-emerald-400/25 via-teal-500/15 to-transparent blur-3xl motion-reduce:blur-none"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-emerald-400/20 ring-offset-0 ring-offset-transparent motion-reduce:opacity-40"
                      aria-hidden
                    />
                    <Image
                      src="/rootsy-mascot.png"
                      alt="Rootsy, la guía de tu negocio"
                      fill
                      className="-scale-x-100 object-contain object-bottom motion-safe:animate-[mascot-float_6.5s_ease-in-out_infinite]"
                      sizes="(max-width: 1024px) 90vw, 480px"
                      priority
                      style={{
                        filter:
                          "drop-shadow(0 32px 48px rgba(0,0,0,0.55)) drop-shadow(0 0 42px rgba(52,211,153,0.14))",
                      }}
                    />
                  </div>
                </div>
            </div>
          </div>
      </section>

      <main className="relative z-20 bg-background lg:bg-transparent">
        <div
          className="hidden shrink-0 lg:block"
          aria-hidden
          style={{ height: heroPaneHeight }}
        />

        <RubrosSection />

        <div className="relative w-full border-t border-white/10 bg-[#070a09] text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-90"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 120% 80% at 15% 20%, rgba(16, 185, 129, 0.14), transparent 55%), radial-gradient(ellipse 90% 70% at 85% 75%, rgba(45, 212, 191, 0.08), transparent 50%), linear-gradient(180deg, rgb(8 12 11) 0%, #070a09 45%, #050807 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/35 to-transparent"
            aria-hidden
          />
          <div className="relative">
            <ControlNegocioSection />
            <ClientesSection variant="dark" />
          </div>
        </div>

        <PreguntasAnticipadasSection />

        <PreciosSection />
      </main>

      <footer className="relative z-20 border-t border-rootsy-hairline bg-rootsy-footer py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-foreground/45 sm:flex-row sm:text-left sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Rootsy</span>
          <span className="text-foreground/35">El mundo dentro de tu negocio</span>
        </div>
      </footer>
    </div>
  )
}
