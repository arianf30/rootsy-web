import Image from "next/image"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const CONTROL_NEGOCIO_ITEMS = [
  "No vas a perderte de nada, sólo necesitás conexión a internet.",
  "Vas a poder ver lo que se está vendiendo en todo momento.",
  "Con el chat interno, dejale mensajes a tus socios y empleados.",
  "Entérate al instante cuáles fueron las ventas del día.",
  "Revisá tus cuentas, gastos, facturas, proveedores, lo que quieras.",
] as const

const CONTROL_NEGOCIO_IMAGE =
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=960&q=80"

export function ControlNegocioSection() {
  return (
    <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:grid lg:grid-cols-[minmax(0,0.44fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:px-8 lg:py-20">
      <figure className="relative mx-auto flex max-w-[320px] justify-center sm:max-w-[380px] lg:mx-0 lg:max-w-none">
        <div
          className="relative aspect-square w-full max-w-[min(100%,380px)] lg:max-w-[400px]"
          style={{
            borderRadius: "45% 55% 52% 48% / 48% 45% 55% 52%",
          }}
        >
          <div
            className="absolute -inset-3 rounded-[inherit] border-[3px] border-emerald-500/25 bg-emerald-950/15 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_-24px_rgba(16,185,129,0.25)] sm:-inset-4 sm:border-[4px]"
            aria-hidden
          />
          <div className="relative h-full overflow-hidden rounded-[inherit] ring-1 ring-white/10">
            <Image
              src={CONTROL_NEGOCIO_IMAGE}
              alt="Panel de métricas y negocio en un dispositivo móvil"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 90vw, 400px"
              unoptimized
            />
          </div>
        </div>
      </figure>

      <div className="mt-10 flex flex-col justify-center lg:mt-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-meadow/90">
          Desde cualquier lugar
        </p>
        <h2 className="mt-3 text-balance text-2xl font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)] sm:text-3xl lg:text-[2rem] lg:leading-[1.15]">
          Controlá tu negocio donde quiera que estés.
        </h2>
        <ul className="mt-8 space-y-4 text-[0.9375rem] leading-snug text-white/75 sm:text-base">
          {CONTROL_NEGOCIO_ITEMS.map((line) => (
            <li key={line} className="flex gap-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-meadow"
                strokeWidth={2}
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <Button
          size="lg"
          className="mt-10 h-12 w-full rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500 to-teal-600 px-8 text-base font-semibold text-white shadow-[0_12px_40px_-12px_rgba(16,185,129,0.45)] transition hover:from-emerald-400 hover:to-teal-500 sm:w-auto sm:self-start"
          asChild
        >
          <a href="#precios">Solicitar prueba gratuita</a>
        </Button>
      </div>
    </div>
  )
}
