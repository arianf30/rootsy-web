import {
  FlowConnector,
  FlowNode,
  FlowRow,
  InsightGrid,
  ProductHealthCompactTable,
  ProductHealthShell,
} from "@/components/product-health-docs/ProductHealthDocs"
import {
  CheckCircle2,
  Cloud,
  Gauge,
  Home,
  KeyRound,
  Laptop,
  Lock,
  Server,
  Shield,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react"

export const metadata = {
  title: "Login — Salud del producto | Rootsy",
  description:
    "Consumos, rendimiento y seguridad de la pantalla de inicio de sesión.",
}

export default function LoginDocsPage() {
  return (
    <ProductHealthShell backHref="/login" backLabel="Volver al login">
      <section className="mt-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-100 text-lg font-black text-emerald-900 shadow-sm">
            1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Primera carga de la pantalla de login
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          El visitante abre la pantalla. Aún no envía el formulario. Lo que importa
          para el producto: cuánto hablás con Supabase, dónde corre el trabajo pesado
          y qué se valida sobre el usuario.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Dispositivo del usuario"
            detail="Pide la página y luego ejecuta la app: comprueba si ya hay sesión guardada."
          />
          <FlowConnector />
          <FlowNode
            icon={<Server className="size-5" />}
            label="Infra de la app (Edge)"
            detail="Antes de responder, se revisa la sesión con Supabase y se actualizan cookies si hace falta."
          />
          <FlowConnector />
          <FlowNode
            icon={<Cloud className="size-5" />}
            label="Supabase — identidad"
            detail="Confirma o refresca el token de sesión. No lista datos de tu negocio (locales, ventas, etc.)."
          />
        </FlowRow>

        <FlowRow>
          <FlowNode
            variant="muted"
            icon={<UserRound className="size-5" />}
            label="¿Ya estaba logueado?"
            detail="Si la sesión es válida, lo mandamos al inicio. Si no, ve el formulario de login."
          />
          <FlowConnector />
          <FlowNode
            variant="muted"
            icon={<Home className="size-5" />}
            label="Permisos de negocio"
            detail="En este paso no se miran roles del punto de venta ni permisos de menú: solo si existe sesión de identidad."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo (Supabase)",
              body: "Hay revisión de sesión en el borde de la app y otra lectura coherente en el navegador. No se abren consultas a tablas de datos del producto solo por mostrar el login.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "El costo principal es la hidratación y esas comprobaciones de sesión. El formulario en sí no dispara nada hasta que el usuario actúa.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "Capa 1: cookies de sesión gestionadas por el stack recomendado de Supabase + Next. Capa 2: si venía de un error de Google, el mensaje sale del texto de la URL, sin llamada extra.",
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
            Ingresar con correo y contraseña
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Al tocar “Ingresar”, primero se valida en el propio navegador (formato de
          mail y campos obligatorios). Solo si eso pasa se envía la contraseña al
          servicio de identidad de Supabase.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Validación en el dispositivo"
            detail="Evita viajes de red innecesarios si el formulario está incompleto o el mail es inválido."
          />
          <FlowConnector />
          <FlowNode
            icon={<KeyRound className="size-5" />}
            label="Identidad en Supabase"
            detail="Una solicitud al servicio de login: comprueba credenciales y, si coinciden, entrega sesión."
          />
          <FlowConnector />
          <FlowNode
            icon={<CheckCircle2 className="size-5" />}
            label="Resultado"
            variant="ok"
            detail="Éxito: navegación al inicio y refresco para alinear la app con la sesión nueva. Error: mensaje amigable sin filtrar detalles internos."
          />
        </FlowRow>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/35 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldCheck className="size-5" />
              <span className="text-sm font-bold">Seguridad y permisos</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Aquí solo entra la política de cuentas de Supabase (por ejemplo cuenta
              activa o correo verificado, según cómo tengas configurado el proyecto).{" "}
              <strong className="text-slate-900">No se evalúan permisos de POP</strong>{" "}
              en esta pantalla.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Gauge className="size-5 text-emerald-700" />
              <span className="text-sm font-bold">Consumo y rendimiento</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Un intento de login exitoso implica{" "}
              <strong className="text-slate-900">una</strong> operación contra el
              servicio de autenticación, más la navegación a inicio. Los fallos de
              validación local no consumen ese canal.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 space-y-8 border-t border-slate-200/80 pt-16">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-sky-400 bg-sky-100 text-lg font-black text-sky-900 shadow-sm">
            3
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Ingresar con Google
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          El usuario sale momentáneamente a Google y vuelve a tu dominio. El
          intercambio final del código de acceso lo hace un endpoint del servidor de
          la app, no el formulario en sí.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Pantalla de login"
            detail="Inicia el flujo OAuth y redirige al sitio de Google."
          />
          <FlowConnector />
          <FlowNode
            icon={<Lock className="size-5" />}
            label="Google"
            detail="El usuario autoriza. Google devuelve a tu app con un código de un solo uso."
          />
          <FlowConnector />
          <FlowNode
            icon={<Server className="size-5" />}
            label="Servidor de la app"
            detail="Recibe el código, lo canjea con Supabase por sesión y redirige al inicio o al login con error."
          />
        </FlowRow>

        <FlowRow>
          <FlowNode
            variant="ok"
            icon={<CheckCircle2 className="size-5" />}
            label="Si el canje sale bien"
            detail="Misma situación que un login con contraseña: ya hay sesión de identidad; los datos del negocio se protegen en pantallas posteriores."
          />
          <FlowConnector />
          <FlowNode
            variant="err"
            icon={<XCircle className="size-5" />}
            label="Si falla"
            detail="Vuelta al login con aviso visible. Sirve para monitorear problemas de configuración o de proveedor."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo",
              body: "Varias redirecciones HTTP y dos hitos claros a Auth de Supabase: inicio OAuth y canje del código en el servidor.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "La latencia percibida depende de Google y del canje en servidor; la UI muestra estado de “redirigiendo” para dar feedback.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "El código de OAuth no se procesa solo en el navegador: el canje en servidor reduce riesgo de manipulación. La ruta de destino tras login se limita a rutas relativas seguras.",
            },
          ]}
        />
      </section>

      <ProductHealthCompactTable
        rows={[
          [
            "Carga",
            "Revisión de sesión en el borde",
            "Sincronizar / validar sesión",
            "No aplica en esta pantalla",
          ],
          [
            "Correo y clave",
            "Navegación tras éxito",
            "Validar credenciales",
            "No aplica en esta pantalla",
          ],
          [
            "Google",
            "Callback en servidor",
            "OAuth + canje de código",
            "No aplica en esta pantalla",
          ],
        ]}
      />
    </ProductHealthShell>
  )
}
