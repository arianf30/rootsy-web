import Image from "next/image"
import Link from "next/link"
import { Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RecoverPasswordPage() {
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

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[2.1rem]">
                Recuperar contraseña
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-zinc-200 sm:text-base">
                Ingresá tu correo electrónico y te enviaremos un enlace para que
                puedas restablecer tu contraseña.
              </p>
            </div>

            <form className="mt-8 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="correo" className="text-zinc-100">
                  Correo electrónico
                </Label>
                <Input
                  id="correo"
                  type="email"
                  placeholder="Correo electrónico"
                  className="h-12 border-white/14 bg-white/8 text-zinc-50 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] placeholder:text-zinc-400 focus-visible:ring-emerald-400/40"
                />
              </div>

              <Button
                type="button"
                className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.65)] hover:from-emerald-400 hover:to-teal-400"
              >
                Enviar
              </Button>

              <Link
                href="/login"
                className="mx-auto block w-fit text-center text-sm font-medium text-zinc-200 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Volver a iniciar sesión
              </Link>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
