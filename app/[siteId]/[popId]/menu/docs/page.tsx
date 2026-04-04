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
  Gauge,
  KeyRound,
  Laptop,
  Lock,
  MapPin,
  Server,
  Shield,
  ShieldCheck,
  UserRound,
} from "lucide-react"

export const metadata = {
  title: "Menú POP — Salud del producto | Rootsy",
  description:
    "Consumos, rendimiento y seguridad del menú principal de un punto de venta.",
}

export default async function MenuDocsPage({
  params,
}: {
  params: Promise<{ siteId: string; popId: string }>
}) {
  const { siteId, popId } = await params
  const backHref = `/${siteId}/${popId}/menu`

  return (
    <ProductHealthShell backHref={backHref} backLabel="Volver al menú">
      <section className="mt-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-100 text-lg font-black text-emerald-900 shadow-sm">
            1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Primera carga del menú del POP
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          La URL incluye <strong className="text-slate-900">sitio</strong> y{" "}
          <strong className="text-slate-900">POP</strong> para enrutar. El servidor
          valida que el usuario tenga acceso a ese POP, que el POP esté activo y
          trae nombre del local, permisos del rol en ese POP y datos básicos del
          perfil para el encabezado.
        </p>

        <FlowRow>
          <FlowNode
            icon={<ShieldCheck className="size-5" />}
            label="Sesión obligatoria"
            detail="Sin sesión no se muestra el menú del POP."
          />
          <FlowConnector />
          <FlowNode
            icon={<Lock className="size-5" />}
            label="Acceso al POP"
            detail="Se comprueba membresía y estado del POP antes de mostrar ítems."
          />
          <FlowConnector />
          <FlowNode
            icon={<KeyRound className="size-5" />}
            label="Permisos"
            detail="Se cargan claves de permiso para ocultar o mostrar enlaces del menú."
          />
          <FlowConnector />
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Interfaz"
            detail="Búsqueda y carruseles son mayormente cliente; no duplican la carga de permisos en cada tecla."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo (Supabase)",
              body: "Una acción de servidor con lectura del POP, RPC de permisos del usuario en ese POP, listado de POPs accesibles (para el rol) y perfil. Es el punto donde el producto empieza a cruzar identidad con tenant (pop_id).",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "Una sola ronda de datos al entrar; los enlaces del menú navegan a otras pantallas que volverán a validar en sus propias acciones.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "Si no hay acceso o el POP está inactivo, mensaje y redirección típica al inicio. Los permisos finos se aplican también en cada pantalla destino.",
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
            Navegar dentro del menú
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Cada ítem enlazable apunta a rutas bajo el mismo{" "}
          <code className="rounded bg-slate-100 px-1 font-mono text-xs">
            /{siteId}/{popId}/…
          </code>
          . La visibilidad depende de los permisos ya cargados; el resto son
          secciones placeholder hasta que exista la feature.
        </p>

        <FlowRow>
          <FlowNode
            icon={<UserRound className="size-5" />}
            label="Filtrado por permisos"
            detail="El cliente decide qué entradas mostrar según las claves recibidas."
          />
          <FlowConnector />
          <FlowNode
            icon={<MapPin className="size-5" />}
            label="Misma URL base"
            detail="siteId en la ruta alinea enlaces con el catálogo fiscal y navegación coherente."
          />
        </FlowRow>
      </section>

      <section className="mt-16 space-y-8 border-t border-slate-200/80 pt-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-sky-400 bg-sky-100 text-lg font-black text-sky-900 shadow-sm">
            3
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Ir al inicio global
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Desde el dock, “Inicio” lleva a <code className="font-mono text-xs">/home</code>{" "}
          para cambiar de POP o de contexto sin cerrar sesión.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Server className="size-5" />}
            label="Nueva pantalla"
            detail="/home volverá a cargar POPs y perfil con su propia lógica."
          />
        </FlowRow>
      </section>

      <ProductHealthCompactTable
        rows={[
          [
            "Carga del menú",
            "getPopMenuData(popId)",
            "validatePopAccess, RPC permisos, pops, users",
            "pops, users, vía RPC permisos / membresía",
          ],
          [
            "Usar un ítem",
            "Router cliente",
            "Sin llamada extra en el clic",
            "Pantalla destino (RLS por feature)",
          ],
          [
            "Volver a /home",
            "Navegación",
            "Según home",
            "Según home",
          ],
        ]}
      />
    </ProductHealthShell>
  )
}
