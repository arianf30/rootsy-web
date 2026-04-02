"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { Eye, EyeOff, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { withGuestAuth } from "@/hoc/withGuestAuth"
import {
  SIGNUP_PASSWORD_HINT,
  validateEmailField,
  validateNameField,
  validateSignupPassword,
} from "@/lib/authValidation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

function RegisterPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  const [error, setError] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const validateForm = () => {
    const errors = {
      firstName: validateNameField("El nombre", firstName),
      lastName: validateNameField("El apellido", lastName),
      email: validateEmailField(email),
      password: validateSignupPassword(password),
    }
    setFieldErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setError("")
    setIsSuccess(false)
    if (!validateForm()) return

    setIsLoading(true)
    setFieldErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    })

    try {
      const cleanEmail = email.trim().toLowerCase()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      })

      if (authError && !authData?.user) {
        const errorMsg = authError.message?.toLowerCase() || ""
        if (
          errorMsg.includes("already registered") ||
          errorMsg.includes("user already registered") ||
          errorMsg.includes("already exists") ||
          errorMsg.includes("email address is already registered")
        ) {
          setError(
            "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
          )
        } else if (errorMsg.includes("invalid") && errorMsg.includes("email")) {
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            setError(
              "Hubo un problema al registrar el correo electrónico. Por favor, intenta nuevamente.",
            )
          } else {
            setError("Por favor ingresa un correo electrónico válido")
          }
        } else {
          setError(authError.message || "Error al registrar usuario")
        }
        setIsLoading(false)
        return
      }

      if (!authData?.user) {
        setError(
          "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
        )
        setIsLoading(false)
        return
      }

      if (!authData.session) {
        if (authData.user.email_confirmed_at) {
          setError(
            "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
          )
          setIsLoading(false)
          return
        }

        const { data: existingUser, error: checkError } = await supabase
          .from("users")
          .select("id")
          .eq("id", authData.user.id)
          .maybeSingle()

        if (existingUser && !checkError) {
          setError(
            "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
          )
          setIsLoading(false)
          return
        }

        const userCreatedAt = new Date(authData.user.created_at)
        const now = new Date()
        const timeDiff = (now.getTime() - userCreatedAt.getTime()) / 1000

        if (timeDiff > 2) {
          setError(
            "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
          )
          setIsLoading(false)
          return
        }

        setError(
          "Por favor, revisa tu correo electrónico para confirmar tu cuenta.",
        )
        setIsSuccess(true)
        setIsLoading(false)
        return
      }

      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })

      if (profileError && profileError.code !== "23505") {
        setError(
          "Usuario creado pero hubo un error al crear el perfil. Por favor, inicia sesión.",
        )
        setIsLoading(false)
        return
      }

      await new Promise((r) => setTimeout(r, 100))
      router.push("/home")
      router.refresh()
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al registrar usuario"
      if (
        errorMessage.includes("already registered") ||
        errorMessage.includes("already exists")
      ) {
        setError(
          "Este correo electrónico ya está registrado. Por favor, inicia sesión.",
        )
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError("")
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/home`,
        },
      })
      if (oauthError) throw oauthError
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error al registrar con Google",
      )
      setGoogleLoading(false)
    }
  }

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

          <div className="relative w-full max-w-lg rounded-4xl border border-white/12 bg-white/[0.035] p-7 shadow-[0_30px_90px_-42px_rgba(10,18,14,0.7),inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-9">
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
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
                Registrarse
              </h1>
              <p className="text-sm text-muted-foreground">
                Ya tengo mi usuario, quiero{" "}
                <Link
                  href="/login"
                  className="font-semibold text-meadow transition-colors hover:text-emerald-500"
                >
                  iniciar sesion
                </Link>
                .
              </p>
            </div>

            {error ? (
              <p
                className={cn(
                  "mt-4 rounded-lg border px-3 py-2 text-sm",
                  isSuccess
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
                )}
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <form className="mt-8 space-y-5" noValidate onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Nombre"
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    className={cn(
                      "h-12 border-white/14 bg-white/8 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-emerald-400/40",
                      fieldErrors.firstName && "border-destructive/60",
                    )}
                  />
                  {fieldErrors.firstName ? (
                    <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Apellido"
                    aria-invalid={Boolean(fieldErrors.lastName)}
                    className={cn(
                      "h-12 border-white/14 bg-white/8 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-emerald-400/40",
                      fieldErrors.lastName && "border-destructive/60",
                    )}
                  />
                  {fieldErrors.lastName ? (
                    <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="correo">Correo electronico</Label>
                <Input
                  id="correo"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electronico"
                  aria-invalid={Boolean(fieldErrors.email)}
                  className={cn(
                    "h-12 border-white/14 bg-white/8 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-emerald-400/40",
                    fieldErrors.email && "border-destructive/60",
                  )}
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    aria-invalid={Boolean(fieldErrors.password)}
                    className={cn(
                      "h-12 border-white/14 bg-white/8 pr-10 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-emerald-400/40",
                      fieldErrors.password && "border-destructive/60",
                    )}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((s) => !s)}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4.5" aria-hidden />
                    ) : (
                      <Eye className="size-4.5" aria-hidden />
                    )}
                  </button>
                </div>
                {fieldErrors.password ? (
                  <p className="text-xs text-destructive">{fieldErrors.password}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{SIGNUP_PASSWORD_HINT}</p>
                )}
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Al hacer clic en &quot;Registrarme&quot;, aceptas los{" "}
                <button
                  type="button"
                  className="font-medium text-meadow transition-colors hover:text-emerald-500"
                >
                  Terminos y condiciones
                </button>
                , la{" "}
                <button
                  type="button"
                  className="font-medium text-meadow transition-colors hover:text-emerald-500"
                >
                  Politica de privacidad
                </button>{" "}
                y la{" "}
                <button
                  type="button"
                  className="font-medium text-meadow transition-colors hover:text-emerald-500"
                >
                  Politica de cookies
                </button>
                .
              </p>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.65)] hover:from-emerald-400 hover:to-teal-400"
              >
                {isLoading ? "Registrando…" : "Registrarme"}
              </Button>

              <Link
                href="/recuperar-contrasena"
                className="mx-auto block w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                No recuerdo mi contraseña
              </Link>
            </form>

            <div className="space-y-4 pt-6">
              <Separator className="bg-white/12" />
              <Button
                type="button"
                variant="outline"
                disabled={googleLoading}
                onClick={() => void handleGoogle()}
                className="h-12 w-full justify-center gap-3 border-white/20 bg-black/15 text-foreground/85 hover:bg-white/10"
              >
                <span className="inline-flex size-5 items-center justify-center rounded-full border border-border bg-white text-[11px] font-bold text-[#4285F4]">
                  G
                </span>
                {googleLoading ? "Redirigiendo…" : "Registrate con tu cuenta de Google."}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default withGuestAuth(RegisterPage)
