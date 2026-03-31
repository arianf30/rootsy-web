"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

const TESTIMONIOS = [
  {
    id: "1",
    nombre: "Laura Méndez",
    negocio: "Almacén del Parque · Rosario",
    foto:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a7a8?w=280&h=280&fit=crop&crop=faces",
    texto:
      "Centralizamos ventas y stock en un solo lugar y dejamos de pelearnos con planillas. Hoy vemos el negocio claro en segundos, desde el celular.",
  },
  {
    id: "2",
    nombre: "Martín Ríos",
    negocio: "Bar Central & Delivery · Córdoba",
    foto:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=280&h=280&fit=crop&crop=faces",
    texto:
      "Mesas, cocina y delivery conviven en Rootsy sin caos. Los cierres de caja pasaron de ser una odisea a algo que revisamos en minutos.",
  },
  {
    id: "3",
    nombre: "Carla Benítez",
    negocio: "Textiles Sur · Bahía Blanca",
    foto:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=280&h=280&fit=crop&crop=faces",
    texto:
      "Llevamos variantes, depósitos y pedidos a proveedores con orden. Mi equipo ya no pregunta ‘¿en qué Excel estaba?’ cada cinco minutos.",
  },
  {
    id: "4",
    nombre: "Diego Peralta",
    negocio: "Fábrica de muebles Linke · Mendoza",
    foto:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=280&h=280&fit=crop&crop=faces",
    texto:
      "Producción y materiales en la misma herramienta nos dio trazabilidad real. Sabemos qué entra, qué sale y qué falta sin recorrer la planta con papel.",
  },
] as const

type TestimoniosCarruselProps = {
  dark?: boolean
}

function TestimonioPanel({
  t,
  dark,
}: {
  t: (typeof TESTIMONIOS)[number]
  dark?: boolean
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border px-6 py-9 sm:px-10 sm:py-11",
        dark
          ? "border-white/[0.09] bg-[linear-gradient(165deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_45%,transparent_100%)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
          : "border-[#0a120e]/[0.08] bg-[linear-gradient(165deg,rgba(255,255,255,0.95)_0%,rgba(248,250,249,0.88)_100%)] shadow-[0_20px_50px_-28px_rgba(10,18,14,0.12)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-4 -top-6 font-serif text-[5.5rem] leading-none select-none sm:text-[6.5rem]",
          dark ? "text-emerald-400/[0.12]" : "text-emerald-600/[0.14]",
        )}
        aria-hidden
      >
        “
      </div>

      <div className="relative mx-auto max-w-xl text-center">
        <blockquote
          className={cn(
            "text-pretty text-[1.0625rem] font-medium leading-[1.65] tracking-[-0.01em] sm:text-lg sm:leading-[1.7]",
            dark ? "text-white/[0.88]" : "text-[#1e2822]",
          )}
        >
          {t.texto}
        </blockquote>

        <div
          className={cn(
            "mx-auto mt-8 h-px w-14 rounded-full sm:mt-9",
            dark ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" : "bg-gradient-to-r from-transparent via-emerald-600/35 to-transparent",
          )}
          aria-hidden
        />

        <div className="mt-8 flex flex-col items-center gap-4 sm:mt-9 sm:flex-row sm:justify-center sm:gap-5">
          <div
            className={cn(
              "relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl shadow-lg sm:size-20",
              dark
                ? "shadow-black/40 ring-2 ring-white/15"
                : "shadow-emerald-900/10 ring-2 ring-[#0a120e]/[0.06]",
            )}
          >
            <Image
              src={t.foto}
              alt=""
              width={160}
              height={160}
              className="size-full object-cover"
              unoptimized
              aria-hidden
            />
          </div>
          <div className="min-w-0 text-center sm:text-left">
            <p
              className={cn(
                "text-base font-bold tracking-tight sm:text-[1.0625rem]",
                dark ? "text-white" : "text-[#0a120e]",
              )}
            >
              {t.nombre}
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                dark ? "text-white/50" : "text-[#5a6f66]",
              )}
            >
              {t.negocio}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TestimoniosCarrusel({ dark }: TestimoniosCarruselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!api) return
    const sync = () => setIndex(api.selectedScrollSnap())
    sync()
    api.on("select", sync)
    return () => {
      api.off("select", sync)
    }
  }, [api])

  useEffect(() => {
    if (!api) return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (mq.matches) return
    const id = window.setInterval(() => {
      api.scrollNext()
    }, 6000)
    return () => window.clearInterval(id)
  }, [api])

  return (
    <div className="mt-10 sm:mt-12 lg:mt-14">
      <p className="sr-only">
        Testimonios de ejemplo; nombres y negocios ficticios. Podés cambiar de
        testimonio con los puntos o el carrusel avanza solo.
      </p>

      <div className="motion-reduce:hidden w-full">
        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "center" }}
          className="w-full"
          aria-label="Testimonios de clientes"
        >
          <CarouselContent className="-ml-0">
            {TESTIMONIOS.map((t) => (
              <CarouselItem key={t.id} className="basis-full pl-0">
                <article className="w-full px-1 sm:px-2">
                  <TestimonioPanel t={t} dark={dark} />
                </article>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div
          className="mt-8 flex justify-center gap-2 sm:mt-9"
          role="tablist"
          aria-label="Elegir testimonio"
        >
          {TESTIMONIOS.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ver testimonio de ${t.nombre}`}
              className={cn(
                "h-2 rounded-full transition-[width,background-color] duration-300",
                i === index
                  ? cn(
                      "w-9",
                      dark ? "bg-emerald-400/85" : "bg-emerald-600",
                    )
                  : cn(
                      "w-2",
                      dark
                        ? "bg-white/20 hover:bg-white/35"
                        : "bg-[#0a120e]/15 hover:bg-[#0a120e]/28",
                    ),
              )}
              onClick={() => api?.scrollTo(i)}
            />
          ))}
        </div>
      </div>

      <div className="motion-reduce:block hidden w-full px-1 sm:px-2">
        <article id={`testimonio-panel-${TESTIMONIOS[0].id}`}>
          <TestimonioPanel t={TESTIMONIOS[0]} dark={dark} />
        </article>
      </div>
    </div>
  )
}
