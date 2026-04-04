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
  Database,
  Gauge,
  Home,
  Laptop,
  Lock,
  Server,
  Shield,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react"

export const metadata = {
  title: "Registro — Salud del producto | Rootsy",
  description:
    "Consumos, rendimiento y seguridad de la pantalla de alta de cuenta.",
}

export default function RegisterDocsPage() {
  return (
    <ProductHealthShell backHref="/register" backLabel="Volver al registro">
      <section className="mt-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-100 text-lg font-black text-emerald-900 shadow-sm">
            1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Primera carga del registro
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Igual que el login: el visitante aún no envió datos. La app comprueba si ya
          hay sesión; si alguien entró con cuenta activa, lo derivamos al inicio en
          lugar de mostrar el formulario de alta.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Dispositivo"
            detail="Carga la pantalla e hidrata la app."
          />
          <FlowConnector />
          <FlowNode
            icon={<Server className="size-5" />}
            label="Infra (Edge)"
            detail="Revisión de sesión y cookies alineadas con Supabase."
          />
          <FlowConnector />
          <FlowNode
            icon={<UserRound className="size-5" />}
            label="¿Ya tiene sesión?"
            detail="Si sí → inicio. Si no → formulario de registro."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo",
              body: "Misma pauta que login: sincronía de sesión en borde y en navegador. Sin alta de negocio hasta que el usuario envía el formulario.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "Costo inicial en hidratación y chequeo de invitado; el formulario no dispara backend hasta el submit.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "Pantalla para invitados: evita que un usuario ya logueado vea el flujo de alta duplicado.",
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
            Enviar el formulario (correo y contraseña)
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Primero se valida nombre, apellido, mail y reglas de contraseña en el
          dispositivo. Recién después se crea la cuenta en el servicio de identidad.
          Según la configuración del proyecto, puede haber sesión inmediata o
          pedido de confirmación por correo — y en algunos caminos la app consulta
          o crea fila en el perfil de usuario en base de datos.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Validación local"
            detail="Evita llamadas si los datos no cumplen reglas de negocio básicas."
          />
          <FlowConnector />
          <FlowNode
            icon={<UserPlus className="size-5" />}
            label="Alta en Auth"
            detail="Registro de identidad en Supabase con metadata de nombre."
          />
          <FlowConnector />
          <FlowNode
            icon={<Database className="size-5" />}
            label="Perfil en app"
            variant="muted"
            detail="Si la sesión queda activa de inmediato, se crea registro de perfil. Si hace falta confirmar mail, puede haber lectura puntual del perfil para evitar duplicados."
          />
          <FlowConnector />
          <FlowNode
            icon={<Home className="size-5" />}
            label="Desenlace"
            variant="ok"
            detail="Sesión lista → inicio. Sin sesión → mensaje para revisar correo o aviso si el mail ya existía."
          />
        </FlowRow>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/35 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldCheck className="size-5" />
              <span className="text-sm font-bold">Seguridad y permisos</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Reglas de Supabase Auth (fortaleza de clave, confirmación de email,
              duplicados).{" "}
              <strong className="text-slate-900">No hay permisos de POP</strong> en
              este paso. El acceso a filas de perfil depende de las políticas RLS que
              definan para la tabla de usuarios de la app.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Gauge className="size-5 text-emerald-700" />
              <span className="text-sm font-bold">Consumo y rendimiento</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Cada intento completo implica al menos una operación de registro en
              Auth; en el camino con sesión inmediata puede sumarse una escritura (y
              en otros caminos una lectura) sobre datos de perfil. Fallos de
              validación local no consumen esos canales.
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
            Registro con Google
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Mismo patrón que el login con Google: salida al proveedor, retorno con
          código y canje en servidor. El destino tras éxito es el inicio de la app.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Pantalla de registro"
            detail="Inicia OAuth hacia Google."
          />
          <FlowConnector />
          <FlowNode
            icon={<Lock className="size-5" />}
            label="Google"
            detail="Consentimiento y redirección con código."
          />
          <FlowConnector />
          <FlowNode
            icon={<Server className="size-5" />}
            label="Servidor de la app"
            detail="Canje del código por sesión (callback) y redirección segura."
          />
          <FlowConnector />
          <FlowNode
            icon={<CheckCircle2 className="size-5" />}
            label="Resultado"
            variant="ok"
            detail="Usuario con sesión; el perfil de app puede completarse en flujos posteriores según diseño del producto."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo",
              body: "Redirecciones + Auth (inicio OAuth + canje). Sin consultas de negocio obligatorias en esta pantalla salvo lo que agregues después del primer login.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "Latencia dominada por Google y el callback; feedback de “redirigiendo” en UI.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "Canje en servidor; destinos de redirección acotados a rutas relativas seguras.",
            },
          ]}
        />
      </section>

      <ProductHealthCompactTable
        rows={[
          [
            "Carga",
            "Sesión en borde + invitado",
            "Validar / refrescar sesión",
            "No aplica hasta enviar formulario",
          ],
          [
            "Formulario email/clave",
            "Navegación o mensaje UX",
            "signUp / reglas Auth",
            "Lectura o alta de perfil según ramo (RLS)",
          ],
          [
            "Google",
            "Callback servidor",
            "OAuth + canje",
            "Típicamente después del primer acceso",
          ],
        ]}
      />
    </ProductHealthShell>
  )
}
