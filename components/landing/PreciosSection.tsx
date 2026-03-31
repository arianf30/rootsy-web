import Link from "next/link"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"

const PLANES = [
  {
    id: "esencial",
    nombre: "Esencial",
    descripcion: "Para arrancar con orden: un solo lugar para ventas y stock.",
    precio: "$ 9.900",
    periodo: "/ mes",
    notaPrecio: "+ impuestos · ejemplo",
    destacado: false,
    features: [
      "Hasta 2 usuarios",
      "1 sucursal o depósito",
      "Catálogo y stock en vivo",
      "Reportes básicos",
      "Soporte por correo",
    ],
    cta: "Empezar con Esencial",
    ctaVariant: "outline" as const,
  },
  {
    id: "profesional",
    nombre: "Profesional",
    descripcion: "El equilibrio entre potencia y simplicidad para el día a día.",
    precio: "$ 24.900",
    periodo: "/ mes",
    notaPrecio: "+ impuestos · ejemplo",
    destacado: true,
    features: [
      "Hasta 8 usuarios",
      "Varias sucursales",
      "Listas de precios y roles",
      "Reportes avanzados",
      "Soporte prioritario",
    ],
    cta: "Elegir Profesional",
    ctaVariant: "default" as const,
  },
  {
    id: "empresa",
    nombre: "Empresa",
    descripcion: "Multisede, integraciones y acompañamiento cuando escala todo.",
    precio: "A medida",
    periodo: "",
    notaPrecio: "Cotización según volumen",
    destacado: false,
    features: [
      "Usuarios y permisos a escala",
      "Varias razones sociales",
      "API e integraciones (según plan)",
      "Onboarding asistido",
      "Soporte dedicado",
    ],
    cta: "Hablar con ventas",
    ctaVariant: "outline" as const,
  },
] as const

export function PreciosSection() {
  return (
    <section
      id="precios"
      className="relative scroll-mt-24 border-t border-[#cfc6b8]/90 bg-gradient-to-b from-[#ebe6dc] via-[#f5f1ea] to-[#e8e2d6] py-20 text-[#1c1914] sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.65]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 80% 0%, rgba(180, 140, 90, 0.09), transparent 50%), radial-gradient(ellipse 90% 60% at 10% 100%, rgba(120, 140, 160, 0.08), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 35%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a89880]/40 to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#6b6358]">
          Suscripciones
        </p>
        <h2 className="mt-2 max-w-3xl text-balance text-3xl font-extrabold tracking-tight text-[#14110d] sm:text-4xl">
          Planes claros para dar el salto cuando vos quieras
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-[#4a453c] sm:text-xl">
          Valores de ejemplo para orientarte; el precio final puede variar según
          promociones, moneda y acuerdo comercial.
        </p>

        <ul className="mt-12 grid list-none gap-6 lg:grid-cols-3 lg:gap-8">
          {PLANES.map((plan) => (
            <li
              key={plan.id}
              className={cn(
                "flex",
                plan.destacado && "lg:-mt-2 lg:mb-2",
              )}
            >
              <Card
                className={cn(
                  "flex w-full flex-col border-[#d9d0c4] bg-white/92 py-0 shadow-[0_24px_60px_-28px_rgba(40,32,24,0.18)] backdrop-blur-sm",
                  plan.destacado &&
                    "border-emerald-600/35 bg-white ring-2 ring-emerald-600/25 shadow-[0_28px_70px_-24px_rgba(16,120,72,0.22)]",
                )}
              >
                {plan.destacado ? (
                  <div className="rounded-t-xl bg-gradient-to-r from-emerald-600/90 to-teal-600/90 px-6 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
                    Más elegido
                  </div>
                ) : null}
                <CardHeader className="gap-3 pb-2 pt-8">
                  <CardTitle className="text-xl font-bold text-[#14110d]">
                    {plan.nombre}
                  </CardTitle>
                  <CardDescription className="text-pretty text-[0.9375rem] leading-relaxed text-[#5c564c]">
                    {plan.descripcion}
                  </CardDescription>
                  <div className="pt-2">
                    <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                      <span className="text-3xl font-extrabold tracking-tight text-[#14110d] sm:text-[2rem]">
                        {plan.precio}
                      </span>
                      {plan.periodo ? (
                        <span className="text-base font-semibold text-[#6b6358]">
                          {plan.periodo}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-[#7a7268]">{plan.notaPrecio}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pb-6 pt-2">
                  <ul className="flex flex-col gap-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex gap-3 text-sm leading-snug text-[#3d3830]">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700">
                          <Check className="size-3.5 stroke-[2.5]" aria-hidden />
                        </span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto flex-col gap-3 border-t border-[#ebe4d9] pt-6 pb-8">
                  <Button
                    size="lg"
                    variant={plan.ctaVariant}
                    className={cn(
                      "h-11 w-full rounded-xl font-semibold",
                      plan.destacado &&
                        "border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/20 hover:from-emerald-400 hover:to-teal-500",
                    )}
                    asChild
                  >
                    <Link href={LOGIN_URL}>{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
