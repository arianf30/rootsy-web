"use client"

import { useCallback, useState } from "react"
import type { MouseEvent } from "react"
import Image from "next/image"
import {
  ChevronDown,
  Store,
  UtensilsCrossed,
  Factory,
  Package,
  Clock,
  LineChart,
  Lightbulb,
  Wallet,
  FileText,
  Landmark,
  LayoutGrid,
} from "lucide-react"
import { cn } from "@/lib/utils"

const RUBROS = [
  {
    id: "tiendas",
    title: "Tiendas",
    imageSrc:
      "https://londonmanager.com/static/media/tiendas.8d61a24c.jpg",
    icon: Store,
    description:
      "Retail omnicanal: stock en tiempo real y ventas claras desde un solo lugar.",
    bullets: [
      "Punto de venta y tickets rápidos",
      "Stock por sucursal y variantes (talle, color, etc.)",
      "Clientes, listas de precios y promociones",
      "Varias empresas o locales bajo la misma cuenta",
    ],
  },
  {
    id: "gastronomicos",
    title: "Gastronómicos",
    imageSrc:
      "https://londonmanager.com/static/media/gastronomicos.b95a1646.jpg",
    icon: UtensilsCrossed,
    description:
      "Salón, barra y delivery coordinados con cocina y cuentas al día.",
    bullets: [
      "Mesas, comandas y tiempos de salida",
      "Recetas, costos y control de mermas",
      "Compras a proveedores e insumos",
      "Cuentas corrientes y cierres de caja",
    ],
  },
  {
    id: "fabricantes",
    title: "Fabricantes",
    imageSrc:
      "https://londonmanager.com/static/media/fabricantes.727cc79c.jpg",
    icon: Factory,
    description:
      "Producción, materiales y pedidos integrados para fabricar con orden.",
    bullets: [
      "Órdenes de producción y prioridades",
      "Materiales, BOM y trazabilidad básica",
      "Stock de insumos y producto terminado",
      "Compras y proveedores alineados a la planta",
    ],
  },
] as const

const CASA_EN_ORDEN_FEATURES = [
  {
    id: "stock",
    title: "Controlar tu Stock",
    description:
      "Controlá el stock de tus productos e insumos, en cuántos depósitos quieras. Además, podés tener listas de precios diferenciadas.",
    icon: Package,
  },
  {
    id: "tiempo",
    title: "Ahorrar tiempo y esfuerzo",
    description:
      "Administrá tu negocio al 100% desde un solo lugar. Con esto, vas a ahorrar mucho tiempo y esfuerzo. Adiós Excel y papeles.",
    icon: Clock,
  },
  {
    id: "ventas",
    title: "Proyectar tus Ventas",
    description:
      "Vas a poder saber fácilmente qué días y horarios se vende más, qué productos y de qué forma. Así podrás proyectarte en el tiempo.",
    icon: LineChart,
  },
  {
    id: "oportunidades",
    title: "Encontrar Oportunidades",
    description:
      "Con reportes estadísticos vas a poder saber qué es lo que más funciona, evitando riesgos y encontrando oportunidades.",
    icon: Lightbulb,
  },
  {
    id: "gastos",
    title: "Gestionar tus Gastos",
    description:
      "Llevá el control de tus gastos fijos y variables como nunca antes. Vos elegís cuándo y cómo pagarlos, sin que se te pase nada.",
    icon: Wallet,
  },
  {
    id: "facturar",
    title: "Facturar fácilmente",
    description:
      "Facturá tus ventas de una manera fácil y rápida. Vas a poder emitir todo tipo de comprobante avalados por la AFIP.",
    icon: FileText,
  },
  {
    id: "cuentas",
    title: "Administrar tus Cuentas",
    description:
      "Si tenés más de una cuenta bancaria y manejás efectivo, vas a poder tener el control de tu dinero como nunca antes.",
    icon: Landmark,
  },
  {
    id: "puntos-venta",
    title: "Controlar tus Puntos de Venta",
    description:
      "Como si estuvieras en Netflix, con tan solo un clic vas a poder entrar y operar desde el punto de venta que quieras.",
    icon: LayoutGrid,
  },
] as const

const CARD_SUMMARY_BODY_H = "min-h-[50px]"
const CARD_DETAIL_BODY_H = "min-h-[200px]"

function RubroCard({
  rubro,
}: {
  rubro: (typeof RUBROS)[number]
}) {
  const [detalle, setDetalle] = useState(false)
  const Icon = rubro.icon

  const onCardMove = useCallback((e: MouseEvent<HTMLElement>) => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const max = 8
    el.style.setProperty("--rx", `${-py * max}deg`)
    el.style.setProperty("--ry", `${px * max}deg`)
  }, [])

  const onCardLeave = useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    el.style.setProperty("--rx", "0deg")
    el.style.setProperty("--ry", "0deg")
  }, [])

  return (
    <article
      onMouseMove={onCardMove}
      onMouseLeave={onCardLeave}
      className={cn(
        "group rootsy-card-tilt relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 p-0 shadow-[0_20px_56px_-18px_rgba(10,18,14,0.18),inset_0_1px_0_0_rgba(255,255,255,0.95)]",
        "ring-1 ring-[#0a120e]/[0.05] backdrop-blur-sm transition-[box-shadow] duration-300",
        "hover:shadow-[0_32px_72px_-16px_rgba(10,18,14,0.26),0_0_0_1px_rgba(16,185,129,0.12),0_0_48px_-12px_rgba(16,185,129,0.14),inset_0_1px_0_0_rgba(255,255,255,1)]",
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl motion-reduce:hidden"
        aria-hidden
      >
        <div
          className={cn(
            "absolute top-0 h-full w-[55%] skew-x-[-16deg] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-[left,opacity] duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            "left-[-60%] group-hover:left-[125%] group-hover:opacity-90",
          )}
        />
      </div>

      {!detalle ? (
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-[#e8ece9]">
          <Image
            src={rubro.imageSrc}
            alt={rubro.title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4">
        {!detalle ? (
          <>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 via-teal-600/15 to-emerald-800/10 text-emerald-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)] ring-1 ring-emerald-900/10">
              <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <h3 className="mt-3 text-lg font-bold tracking-tight text-[#0a120e]">
              {rubro.title}
            </h3>
            <div className={cn("relative mt-2 min-h-0 flex-1", CARD_SUMMARY_BODY_H)}>
              <p className="text-sm leading-relaxed text-[#3d5248]">
                {rubro.description}
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-bold tracking-tight text-[#0a120e]">
              {rubro.title}
            </h3>
            <div className={cn("relative mt-3 min-h-0 flex-1", CARD_DETAIL_BODY_H)}>
            <ul className="space-y-2 text-sm leading-snug text-[#2a3830]">
              {rubro.bullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_0_8px_rgba(16,185,129,0.45)]"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            </div>
          </>
        )}

      <button
        type="button"
        onClick={() => setDetalle((v) => !v)}
        className={cn(
          "relative z-[1] mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,0.35)]",
          "bg-gradient-to-br from-[#0f1a16] via-[#152820] to-[#0d1814] ring-1 ring-white/10 transition-[filter,transform] duration-200",
          "hover:brightness-110 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/50",
        )}
      >
        {detalle ? "Volver" : "Ver más"}
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200 motion-reduce:transition-none",
            detalle && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      </div>
    </article>
  )
}

export function RubrosSection() {
  return (
    <section
      id="soluciones"
      className="relative z-10 scroll-mt-16 border-t border-white/15 bg-gradient-to-b from-[#e4eae6] via-[#eef2ef] to-[#e6ece8] py-14 text-[#0f1714] sm:py-16 lg:py-32 shadow-[0_-32px_80px_-48px_rgba(0,0,0,0.45)]"
      style={{
        clipPath:
          "polygon(0 16px, 5% 0, 95% 0, 100% 16px, 100% 100%, 0 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -10%, rgba(16, 185, 129, 0.12), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-600/25 to-transparent"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#5a6f66]">
          Modo campaña
        </p>
        <h2 className="mt-2 text-balance text-3xl font-extrabold tracking-tight text-[#060a08] sm:text-4xl">
          Adaptado a todos los{" "}
          <span className="rootsy-chrome-accent">rubros.</span>
        </h2>
        <p className="mt-3 max-w-3xl text-pretty text-lg leading-relaxed text-[#3d5248] sm:text-xl">
          Un sistema preparado para todo tipo de negocio. Además, podés tener
          varias empresas o puntos de venta en el mismo lugar.
        </p>

        <div className="mt-10 grid auto-rows-fr gap-5 [perspective:1400px] sm:grid-cols-2 sm:gap-6 sm:mt-12 lg:grid-cols-3 lg:gap-7">
          {RUBROS.map((rubro) => (
            <RubroCard key={rubro.id} rubro={rubro} />
          ))}
        </div>

        <div className="mt-16 border-t border-[#0a120e]/10 pt-16 sm:mt-20 sm:pt-20 lg:mt-24 lg:pt-24">
          <h2 className="text-balance text-3xl font-extrabold leading-tight tracking-tight text-[#060a08] sm:text-4xl lg:text-[2.35rem] lg:leading-[1.12]">
            Vas a tener la casa en orden,
            <br />
            <span className="rootsy-chrome-accent">como siempre quisiste.</span>
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-[#3d5248] sm:text-xl">
            Estas son sólo algunas soluciones.
          </p>

          <ul className="mt-12 grid list-none gap-10 sm:grid-cols-2 sm:gap-x-10 sm:gap-y-12 lg:mt-14 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-14">
            {CASA_EN_ORDEN_FEATURES.map((item) => {
              const FeatIcon = item.icon
              return (
                <li key={item.id}>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/25 via-teal-600/18 to-emerald-800/12 text-emerald-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)] ring-1 ring-emerald-900/12">
                    <FeatIcon
                      className="h-6 w-6"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-bold tracking-tight text-[#0a120e]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-pretty text-sm leading-relaxed text-[#3d5248] sm:text-[0.9375rem]">
                    {item.description}
                  </p>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
