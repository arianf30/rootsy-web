"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const ITEMS = [
  {
    id: "que-es",
    pregunta: "¿Qué es Rootsy, en pocas palabras?",
    respuesta:
      "Es un sistema para administrar tu negocio en un solo lugar: ventas, stock, compras, caja y reportes. Pensado para que el día a día sea más ordenado, sin depender de mil planillas sueltas.",
  },
  {
    id: "rubro",
    pregunta: "¿Sirve para mi rubro o solo para algunos?",
    respuesta:
      "Rootsy se adapta a distintos tipos de negocio: tiendas, gastronomía, fabricación y más. La idea es que configures lo que usás vos (productos, variantes, mesas, producción, etc.) sin arrancar de cero cada vez.",
  },
  {
    id: "instalacion",
    pregunta: "¿Tengo que instalar algo en la computadora?",
    respuesta:
      "No hace falta instalar un programa clásico: accedés desde el navegador y también podés usarlo en el celular cuando estés en movimiento.",
  },
  {
    id: "prueba",
    pregunta: "¿Puedo probar antes de comprometerme?",
    respuesta:
      "Podés explorar y validar si encaja con tu forma de trabajar antes de dar el salto definitivo. Los detalles de planes y períodos los verás en la sección de precios cuando estén publicados.",
  },
  {
    id: "datos",
    pregunta: "¿Dónde quedan mis datos?",
    respuesta:
      "Tus datos se alojan en infraestructura pensada para aplicaciones web actuales, con buenas prácticas de acceso y respaldo. Si necesitás documentación formal para tu empresa, se puede complementar con el canal de soporte.",
  },
  {
    id: "migrar",
    pregunta: "¿Puedo migrar desde Excel u otro sistema?",
    respuesta:
      "Sí, muchos equipos empiezan con información en planillas o en herramientas anteriores. La migración depende de qué tengas hoy; lo importante es ordenar productos, clientes y stock de forma que el cambio sea progresivo y controlado.",
  },
] as const

export function PreguntasAnticipadasSection() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 border-t border-emerald-900/10 bg-gradient-to-b from-[#e8ede9] via-[#f0f3f1] to-[#e6ebe7] py-16 text-[#0f1714] sm:py-20 lg:py-24"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16, 185, 129, 0.08), transparent 55%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="max-w-4xl text-balance text-3xl font-extrabold tracking-tight text-[#060a08] sm:text-4xl">
          <span className="block sm:inline">
            Nos anticipamos a algunas preguntas{" "}
          </span>
          <span className="block sm:inline">que te estarás haciendo:</span>
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-[#3d5248] sm:text-xl">
          Respuestas de ejemplo para orientarte; el producto final puede variar
          según tu plan y configuración.
        </p>

        <div className="mt-10 rounded-2xl border border-[#0a120e]/[0.08] bg-white/90 px-1 shadow-[0_20px_50px_-24px_rgba(10,18,14,0.12)] ring-1 ring-white/80 sm:px-2">
          <Accordion type="single" collapsible className="w-full px-3 sm:px-5">
            {ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-[#0a120e]/[0.08]">
                <AccordionTrigger className="py-5 text-left text-base font-semibold text-[#0a120e] hover:no-underline sm:text-[1.05rem]">
                  {item.pregunta}
                </AccordionTrigger>
                <AccordionContent className="text-pretty text-[0.9375rem] leading-relaxed text-[#3d5248]">
                  {item.respuesta}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
