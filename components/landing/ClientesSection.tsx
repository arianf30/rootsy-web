import { TestimoniosCarrusel } from "@/components/landing/TestimoniosCarrusel"

const MARCAS_EJEMPLO = [
  "Distribuidora Lapacho",
  "Casa Norte Retail",
  "Gastronomía Central",
  "Textiles del Parque",
  "Ferretería 12",
  "Farmacia Modelo",
  "Panadería El Roble",
  "Indumentaria Sur",
  "Logística Verde",
  "Market del Jardín",
] as const

function MarcaChip({ nombre, dark }: { nombre: string; dark?: boolean }) {
  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase()

  return (
    <div
      className={
        dark
          ? "flex h-[4.25rem] shrink-0 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.07] px-5 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] ring-1 ring-white/[0.06] backdrop-blur-md"
          : "flex h-[4.25rem] shrink-0 items-center gap-3 rounded-2xl border border-[#0a120e]/[0.08] bg-white/90 px-5 py-3 shadow-[0_12px_40px_-20px_rgba(10,18,14,0.2),inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-white/80 backdrop-blur-sm"
      }
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/90 to-teal-600/90 text-xs font-bold tracking-tight text-white shadow-md shadow-emerald-950/40 ring-1 ring-white/25">
        {iniciales}
      </span>
      <span
        className={
          dark
            ? "max-w-[200px] text-left text-sm font-semibold leading-snug tracking-tight text-white/88"
            : "max-w-[200px] text-left text-sm font-semibold leading-snug tracking-tight text-[#0a120e]/85"
        }
      >
        {nombre}
      </span>
    </div>
  )
}

type ClientesSectionProps = {
  /** Misma banda oscura que Control negocio (shell PS5). */
  variant?: "light" | "dark"
}

export function ClientesSection({ variant = "light" }: ClientesSectionProps) {
  const pista = [...MARCAS_EJEMPLO, ...MARCAS_EJEMPLO]
  const dark = variant === "dark"

  return (
    <section
      id="clientes"
      className={
        dark
          ? "relative scroll-mt-24 py-14 text-white sm:py-16 lg:py-20"
          : "relative scroll-mt-24 border-t border-emerald-900/10 bg-gradient-to-b from-[#e8ede9] via-[#f0f3f1] to-[#e6ebe7] py-16 text-[#0f1714] sm:py-20 lg:py-24"
      }
    >
      {!dark ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16, 185, 129, 0.08), transparent 55%)",
          }}
        />
      ) : null}
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          className={
            dark
              ? "text-balance text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
              : "text-balance text-3xl font-extrabold tracking-tight text-[#060a08] sm:text-4xl"
          }
        >
          Ya confían en nosotros
        </h2>
        <p
          className={
            dark
              ? "mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-white/70 sm:text-xl"
              : "mt-4 max-w-3xl text-pretty text-lg leading-relaxed text-[#3d5248] sm:text-xl"
          }
        >
          Estos son sólo algunos de los clientes que ya dieron el salto.
        </p>
        <p
          className={
            dark
              ? "mt-3 max-w-3xl text-pretty text-lg font-medium leading-relaxed text-white/80 sm:text-xl"
              : "mt-3 max-w-3xl text-pretty text-lg font-medium leading-relaxed text-[#2a3830] sm:text-xl"
          }
        >
          Vos también podés vivir más tranquilo, como ellos.
        </p>

        <div className="relative mt-12 sm:mt-14">
          <p className="sr-only">
            Marcas de ejemplo en carrusel: {MARCAS_EJEMPLO.join(", ")}.
          </p>
          <div className="motion-reduce:hidden rootsy-marquee-fade overflow-hidden py-2">
            <div className="rootsy-marquee-logos flex gap-5">
              {pista.map((nombre, i) => (
                <MarcaChip key={`${nombre}-${i}`} nombre={nombre} dark={dark} />
              ))}
            </div>
          </div>
          <ul className="motion-reduce:flex hidden list-none flex-wrap justify-center gap-4 py-2">
            {MARCAS_EJEMPLO.map((nombre) => (
              <li key={nombre}>
                <MarcaChip nombre={nombre} dark={dark} />
              </li>
            ))}
          </ul>
        </div>

        <TestimoniosCarrusel dark={dark} />
      </div>
    </section>
  )
}
