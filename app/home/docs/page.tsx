import {
  FlowConnector,
  FlowNode,
  FlowRow,
  InsightGrid,
  ProductHealthCompactTable,
  ProductHealthShell,
} from "@/components/product-health-docs/ProductHealthDocs"
import {
  Cloud,
  Database,
  Gauge,
  Home,
  Laptop,
  Server,
  Shield,
  ShieldCheck,
  Store,
} from "lucide-react"

export const metadata = {
  title: "Inicio — Salud del producto | Rootsy",
  description:
    "Consumos, rendimiento y seguridad de la pantalla de inicio y elección de POP.",
}

export default function HomeDocsPage() {
  return (
    <ProductHealthShell backHref="/home" backLabel="Volver al inicio">
      <section className="mt-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-100 text-lg font-black text-emerald-900 shadow-sm">
            1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Primera carga del inicio
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          El usuario ya inició sesión (la ruta exige cuenta válida). La pantalla
          pide en una sola acción de servidor el listado de POPs a los que tiene
          acceso, el perfil visible y si puede crear un POP nuevo.
        </p>

        <FlowRow>
          <FlowNode
            icon={<ShieldCheck className="size-5" />}
            label="Sesión obligatoria"
            detail="Sin sesión no se muestra el contenido: el guard de la app redirige al login."
          />
          <FlowConnector />
          <FlowNode
            icon={<Server className="size-5" />}
            label="Una llamada al servidor"
            detail="getHomePageData agrupa en paralelo perfil, POPs y regla de alta de POP."
          />
          <FlowConnector />
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Listado y acciones"
            detail="Tarjetas por POP, estado de suscripción y atajo para crear POP si aplica."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo (Supabase)",
              body: "Incluye identidad ya establecida, RPC de POPs accesibles, lectura de datos del POP (sitio, suscripción por POP) y perfil en tabla de usuarios. El volumen crece con la cantidad de POPs por el resumen de suscripción.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "Un único POST del cliente dispara tres tareas en paralelo en el servidor; evita múltiples viajes de red sueltos al cargar.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "Solo ve datos ligados a su usuario. Las políticas RLS y los RPC deben limitar POPs y filas de perfil al dueño de la sesión.",
            },
          ]}
        />
      </section>

      <section className="mt-16 space-y-8 border-t border-slate-200/80 pt-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-violet-400 bg-violet-100 text-lg font-black text-violet-900 shadow-sm">
            2
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Elegir un POP o crear uno
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Al tocar un POP se navega a su menú usando el sitio y el id del POP en
          la URL. El botón de suscripción o crear POP dispara navegación según
          reglas de negocio ya cargadas.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Store className="size-5" />}
            label="Entrar a un POP"
            detail="Navegación cliente a /{siteId}/{popId}/menu sin nueva carga masiva de datos en este paso."
          />
          <FlowConnector />
          <FlowNode
            icon={<Home className="size-5" />}
            label="Cerrar sesión"
            detail="Cierra sesión en el cliente y vuelve al flujo de login."
          />
        </FlowRow>

        <div className="rounded-xl border border-slate-200/90 bg-white/85 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800">
            <Database className="size-5 text-emerald-700" />
            <span className="text-sm font-bold">Datos de negocio</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            A diferencia de las pantallas solo de auth, acá sí se consultan POPs y
            perfil de aplicación bajo el JWT del usuario. Si algo falla, la UI
            puede mostrar reintento sin exponer detalles internos.
          </p>
        </div>
      </section>

      <ProductHealthCompactTable
        rows={[
          [
            "Carga inicial",
            "Server action getHomePageData",
            "Sesión + RPC/listados según implementación",
            "users, pops, suscripción por POP (vía RPC)",
          ],
          [
            "Tras cargar",
            "Navegación / logout",
            "Sin llamada extra típica",
            "No aplica salvo nueva ruta",
          ],
        ]}
      />
    </ProductHealthShell>
  )
}
