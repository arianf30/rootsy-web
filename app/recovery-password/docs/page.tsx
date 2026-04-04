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
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Mail,
  Server,
  Shield,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react"

export const metadata = {
  title: "Recuperar contraseña — Salud del producto | Rootsy",
  description:
    "Consumos, rendimiento y seguridad del flujo de restablecimiento de clave.",
}

export default function RecuperarContrasenaDocsPage() {
  return (
    <ProductHealthShell
      backHref="/recovery-password"
      backLabel="Volver a recuperar contraseña"
    >
      <section className="mt-10 space-y-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border-2 border-emerald-400 bg-emerald-100 text-lg font-black text-emerald-900 shadow-sm">
            1
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Primera carga: qué ve el usuario
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          La misma URL puede mostrar cosas distintas según los parámetros del
          enlace (magic link) o el paso del flujo. Al entrar, la app evalúa la URL y
          la sesión antes de mostrar el formulario de correo, la pantalla de nueva
          clave o un error amigable.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Loader2 className="size-5" />}
            label="Verificación inicial"
            detail="Breve estado “validando enlace” mientras se interpreta la URL."
          />
          <FlowConnector />
          <FlowNode
            icon={<Lock className="size-5" />}
            label="¿Llegó link mágico?"
            variant="muted"
            detail="Si trae token del mail, se valida con el servicio de identidad y se abre el paso de nueva contraseña."
          />
          <FlowConnector />
          <FlowNode
            icon={<KeyRound className="size-5" />}
            label="¿Paso “nueva” sin token?"
            variant="muted"
            detail="Se comprueba si ya hay sesión de recuperación activa; si no, se muestra error y se invita a pedir otro enlace."
          />
          <FlowConnector />
          <FlowNode
            icon={<Mail className="size-5" />}
            label="Flujo por defecto"
            detail="Formulario para pedir el correo y disparar el envío del enlace."
          />
        </FlowRow>

        <FlowRow>
          <FlowNode
            icon={<UserRound className="size-5" />}
            label="Si ya está logueado"
            variant="muted"
            detail="En la pantalla de “pedir correo”, si hay sesión normal se redirige al inicio: no mezclamos recuperación con cuenta ya activa."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Cloud className="size-4" />,
              title: "Consumo",
              body: "En la apertura pueden ejecutarse llamadas a Auth (validar token o leer sesión). No es un listado de datos de negocio.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "Una transición corta de verificación evita parpadeos de formulario incorrecto; el costo es acotado a esas comprobaciones.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "Enlaces inválidos o vencidos se traducen en mensaje claro y camino a solicitar un enlace nuevo.",
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
            Pedir el correo de recuperación
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          El usuario ingresa su mail. Tras validarlo en el dispositivo, la app pide
          a Supabase Auth que envíe el correo. El enlace de vuelta pasa por el
          callback de la app y termina en la pantalla de elegir nueva contraseña.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Validación local"
            detail="Formato de correo antes de tocar la red."
          />
          <FlowConnector />
          <FlowNode
            icon={<Cloud className="size-5" />}
            label="Auth — reset por email"
            detail="Dispara el envío del mail con enlace firmado hacia tu dominio."
          />
          <FlowConnector />
          <FlowNode
            icon={<Mail className="size-5" />}
            label="Mensaje en pantalla"
            variant="ok"
            detail="Confirmación genérica: no se revela si el mail existe o no (buena práctica anti-enumeración)."
          />
        </FlowRow>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/35 p-4">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldCheck className="size-5" />
              <span className="text-sm font-bold">Seguridad</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              El flujo depende de la configuración de correo y plantillas de
              Supabase. La redirección tras hacer clic apunta a tu app y luego al
              paso de nueva clave.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200/90 bg-white/80 p-4">
            <div className="flex items-center gap-2 text-slate-800">
              <Gauge className="size-5 text-emerald-700" />
              <span className="text-sm font-bold">Rendimiento</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">
              Una solicitud por intento válido; los errores de validación local no
              generan envío.
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
            Definir nueva contraseña y cerrar
          </h2>
        </div>

        <p className="max-w-4xl text-sm leading-relaxed text-slate-700 sm:text-base">
          Con sesión de recuperación válida, el usuario elige clave y confirmación.
          Al guardar, se actualiza la credencial en Auth y se redirige al login tras
          un breve mensaje de éxito.
        </p>

        <FlowRow>
          <FlowNode
            icon={<Laptop className="size-5" />}
            label="Validación local"
            detail="Reglas de fortaleza e igualdad entre campos."
          />
          <FlowConnector />
          <FlowNode
            icon={<Cloud className="size-5" />}
            label="Auth — actualizar usuario"
            detail="Persiste la nueva contraseña en el servicio de identidad."
          />
          <FlowConnector />
          <FlowNode
            icon={<CheckCircle2 className="size-5" />}
            label="Cierre"
            variant="ok"
            detail="Feedback positivo y redirección automática al inicio de sesión."
          />
        </FlowRow>

        <FlowRow>
          <FlowNode
            variant="err"
            icon={<XCircle className="size-5" />}
            label="Si algo falla"
            detail="Error visible en pantalla; el usuario puede reintentar o volver a pedir enlace."
          />
        </FlowRow>

        <InsightGrid
          items={[
            {
              icon: <Server className="size-4" />,
              title: "Callback intermedio",
              body: "El clic en el mail suele pasar por la ruta de callback del servidor (canje de código) antes de aterrizar en /recovery-password con sesión lista.",
            },
            {
              icon: <Gauge className="size-4" />,
              title: "Rendimiento",
              body: "El tramo más sensible es la cadena mail → proveedor de correo → navegador → callback; la actualización de clave es una operación puntual.",
            },
            {
              icon: <Shield className="size-4" />,
              title: "Seguridad",
              body: "La recuperación apoya en tokens de un solo uso y ventanas de validez definidas en Auth; sin permisos de POP en esta pantalla.",
            },
          ]}
        />
      </section>

      <ProductHealthCompactTable
        rows={[
          [
            "Carga / URL",
            "Layout con suspense; ramas por query",
            "verifyOtp o getSession según caso",
            "No aplica",
          ],
          [
            "Pedir mail",
            "Mensaje UX + posible callback después",
            "resetPasswordForEmail",
            "No aplica",
          ],
          [
            "Nueva clave",
            "Redirección a login",
            "updateUser (contraseña)",
            "No aplica",
          ],
        ]}
      />
    </ProductHealthShell>
  )
}
