import Image from "next/image"
import Link from "next/link"
import { Eye, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <main className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <section className="relative hidden overflow-hidden lg:block">
          <Image
            src="/login-mascota.png"
            alt="Mascota de Rootsy en un entorno natural con paneles de datos"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/35 via-black/15 to-transparent" />
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_90%_70%_at_20%_50%,rgba(16,185,129,0.16),transparent_62%)] px-5 py-10 sm:px-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 -left-8 h-72 w-72 rounded-full bg-emerald-500/16 blur-3xl" />
            <div className="absolute top-1/2 right-4 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -bottom-16 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.05),transparent_45%)]" />
          </div>

          <div className="relative w-full max-w-lg rounded-4xl border border-white/12 bg-white/[0.035] p-7 text-zinc-50 shadow-[0_30px_90px_-42px_rgba(10,18,14,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-9">
            <Link
              href="/"
              className="absolute -top-6 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/16 bg-[#0b1110]/90 px-4 py-2 text-sm font-semibold tracking-wide text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.8)] ring-1 ring-emerald-400/25 transition-all hover:scale-[1.02] hover:border-emerald-300/45 hover:ring-emerald-300/35"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-400/16 text-emerald-200">
                <Leaf className="size-4" aria-hidden />
              </span>
              Rootsy
            </Link>
            <div className="pointer-events-none absolute -top-10 left-1/2 h-20 w-2/3 -translate-x-1/2 rounded-full bg-emerald-400/18 blur-2xl" />

            <div className="space-y-1.5">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[2.1rem]">
                Registrarse
              </h1>
              <p className="text-sm text-zinc-200">
                Ya tengo mi usuario, quiero{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-300 underline-offset-4 transition-colors hover:text-emerald-200 hover:underline"
                >
                  iniciar sesión
                </Link>
                .
              </p>
            </div>

            <form className="mt-8 space-y-5" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-zinc-100">
                    Nombre
                  </Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Nombre"
                    className="h-12 border-white/14 bg-white/8 text-zinc-50 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] placeholder:text-zinc-400 focus-visible:ring-emerald-400/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido" className="text-zinc-100">
                    Apellido
                  </Label>
                  <Input
                    id="apellido"
                    type="text"
                    placeholder="Apellido"
                    className="h-12 border-white/14 bg-white/8 text-zinc-50 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] placeholder:text-zinc-400 focus-visible:ring-emerald-400/40"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo" className="text-zinc-100">
                  Correo electronico
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="Correo electronico"
                  className="h-12 border-white/14 bg-white/8 text-zinc-50 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] placeholder:text-zinc-400 focus-visible:ring-emerald-400/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-100">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    className="h-12 border-white/14 bg-white/8 pr-10 text-zinc-50 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] placeholder:text-zinc-400 focus-visible:ring-emerald-400/40"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-100"
                    aria-label="Mostrar u ocultar contraseña"
                  >
                    <Eye className="size-4.5" aria-hidden />
                  </button>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-zinc-200">
                Al hacer clic en "Registrarme", aceptas los{" "}
                <button
                  type="button"
                  className="font-medium text-emerald-300 underline-offset-2 transition-colors hover:text-emerald-200 hover:underline"
                >
                  Terminos y condiciones
                </button>
                , la{" "}
                <button
                  type="button"
                  className="font-medium text-emerald-300 underline-offset-2 transition-colors hover:text-emerald-200 hover:underline"
                >
                  Politica de privacidad
                </button>{" "}
                y la{" "}
                <button
                  type="button"
                  className="font-medium text-emerald-300 underline-offset-2 transition-colors hover:text-emerald-200 hover:underline"
                >
                  Politica de cookies
                </button>
                .
              </p>

              <Button
                type="button"
                className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.65)] hover:from-emerald-400 hover:to-teal-400"
              >
                Registrarme
              </Button>
            </form>

            <div className="space-y-4 pt-6">
              <Separator className="bg-white/12" />
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full justify-center gap-3 border-white/20 bg-black/15 text-zinc-100 hover:bg-white/10 hover:text-white"
              >
                <span className="inline-flex size-5 items-center justify-center rounded-full border border-white/25 bg-white text-[11px] font-bold text-[#4285F4]">
                  G
                </span>
                Registrarme con Google
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
