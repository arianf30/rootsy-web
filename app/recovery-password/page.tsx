"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Eye, EyeOff, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/context/AuthContextSupabase"
import {
  SIGNUP_PASSWORD_HINT,
  validateEmailField,
  validateSignupPassword,
} from "@/lib/authValidation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

type Phase =
  | "verifying"
  | "request"
  | "new-password"
  | "email-sent"
  | "fatal"

const RECOVERY_NEXT = "/recovery-password?paso=nueva"

function RecoverPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const supabase = useMemo(() => createClient(), [])

  const paso = searchParams.get("paso")
  const tokenHash = searchParams.get("token_hash")
  const typeParam = searchParams.get("type")

  const [phase, setPhase] = useState<Phase>("verifying")
  const [fatalMessage, setFatalMessage] = useState("")

  const [email, setEmail] = useState("")
  const [fieldErrors, setFieldErrors] = useState({ email: "" })
  const [requestError, setRequestError] = useState("")
  const [requestLoading, setRequestLoading] = useState(false)

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [pwFieldErrors, setPwFieldErrors] = useState({
    password: "",
    confirmPassword: "",
  })
  const [updateError, setUpdateError] = useState("")
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      if (tokenHash && typeParam) {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          type: typeParam as
            | "signup"
            | "invite"
            | "magiclink"
            | "recovery"
            | "email_change"
            | "email",
          token_hash: tokenHash,
        })
        if (cancelled) return
        if (verifyError) {
          setFatalMessage(
            "El link de recuperación es inválido o ha expirado. Por favor, solicita uno nuevo.",
          )
          setPhase("fatal")
          return
        }
        setPhase("new-password")
        return
      }

      if (paso === "nueva") {
        await new Promise((r) => setTimeout(r, 500))
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session) {
          setFatalMessage(
            "No hay una sesión activa. Solicitá un nuevo link desde recuperación de contraseña.",
          )
          setPhase("fatal")
          return
        }
        setPhase("new-password")
        return
      }

      if (cancelled) return
      setPhase("request")
    }

    void verify()
    return () => {
      cancelled = true
    }
  }, [paso, tokenHash, typeParam, supabase])

  useEffect(() => {
    if (phase !== "request" || authLoading) return
    if (user) {
      router.replace("/home")
    }
  }, [phase, authLoading, user, router])

  const validateRequestEmail = () => {
    const err = validateEmailField(email)
    setFieldErrors({ email: err })
    return !err
  }

  const handleSendEmail = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setRequestError("")
    if (!validateRequestEmail()) return

    setRequestLoading(true)
    setFieldErrors({ email: "" })
    try {
      const cleanEmail = email.trim().toLowerCase()
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const next = encodeURIComponent(RECOVERY_NEXT)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${origin}/auth/callback?next=${next}`,
        },
      )
      if (resetError) throw resetError
      setPhase("email-sent")
    } catch (err: unknown) {
      setRequestError(
        err instanceof Error
          ? err.message
          : "Error al enviar el correo de recuperación",
      )
    } finally {
      setRequestLoading(false)
    }
  }

  const validatePasswordForm = () => {
    const pErr = validateSignupPassword(password)
    let cErr = ""
    if (!confirmPassword) {
      cErr = "Por favor confirma tu contraseña"
    } else if (confirmPassword !== password) {
      cErr = "Las contraseñas no coinciden"
    }
    setPwFieldErrors({
      password: pErr,
      confirmPassword: cErr,
    })
    return !pErr && !cErr
  }

  const handleUpdatePassword = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setUpdateError("")
    if (!validatePasswordForm()) return

    setUpdateLoading(true)
    setPwFieldErrors({ password: "", confirmPassword: "" })
    try {
      const { error: updateErrorInner } = await supabase.auth.updateUser({
        password,
      })
      if (updateErrorInner) throw updateErrorInner
      setUpdateSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 2000)
    } catch (err: unknown) {
      setUpdateError(
        err instanceof Error ? err.message : "Error al actualizar la contraseña",
      )
    } finally {
      setUpdateLoading(false)
    }
  }

  const shell = (children: React.ReactNode) => (
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
            {children}
          </div>
        </section>
      </main>
    </div>
  )

  if (phase === "verifying") {
    return shell(
      <div className="space-y-2 pt-6 text-center">
        <h1 className="text-xl font-semibold">Verificando…</h1>
        <p className="text-sm text-muted-foreground">
          Validando el enlace de recuperación.
        </p>
      </div>,
    )
  }

  if (phase === "fatal") {
    return shell(
      <div className="space-y-4 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
          No pudimos continuar
        </h1>
        <p className="text-sm text-destructive">{fatalMessage}</p>
        <Button asChild className="h-12 w-full">
          <Link href="/recovery-password">Volver a solicitar enlace</Link>
        </Button>
        <Link
          href="/login"
          className="mx-auto block w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Ir al inicio de sesión
        </Link>
      </div>,
    )
  }

  if (phase === "email-sent") {
    return shell(
      <div className="space-y-4 pt-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
          Revisá tu correo
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Si el correo está registrado, recibirás un enlace para restablecer tu
          contraseña. El enlace te llevará a esta misma app para elegir una nueva
          clave.
        </p>
        <Button asChild variant="outline" className="h-12 w-full border-white/20">
          <Link href="/login">Volver al inicio de sesión</Link>
        </Button>
      </div>,
    )
  }

  if (phase === "new-password") {
    return shell(
      <>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
            Nueva contraseña
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Ingresá tu nueva contraseña. {SIGNUP_PASSWORD_HINT}
          </p>
        </div>

        {updateSuccess ? (
          <p className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
            ¡Contraseña actualizada! Redirigiendo al inicio de sesión…
          </p>
        ) : null}

        {updateError && !updateSuccess ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {updateError}
          </p>
        ) : null}

        <form className="mt-8 space-y-5" noValidate onSubmit={handleUpdatePassword}>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(pwFieldErrors.password)}
                className={cn(
                  "h-12 border-white/14 bg-white/8 pr-10 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-emerald-400/40",
                  pwFieldErrors.password && "border-destructive/60",
                )}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground"
                aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPw((s) => !s)}
              >
                {showPw ? (
                  <EyeOff className="size-4.5" aria-hidden />
                ) : (
                  <Eye className="size-4.5" aria-hidden />
                )}
              </button>
            </div>
            {pwFieldErrors.password ? (
              <p className="text-xs text-destructive">{pwFieldErrors.password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPw2 ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={Boolean(pwFieldErrors.confirmPassword)}
                className={cn(
                  "h-12 border-white/14 bg-white/8 pr-10 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.9)] focus-visible:ring-emerald-400/40",
                  pwFieldErrors.confirmPassword && "border-destructive/60",
                )}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-muted-foreground"
                aria-label={showPw2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                onClick={() => setShowPw2((s) => !s)}
              >
                {showPw2 ? (
                  <EyeOff className="size-4.5" aria-hidden />
                ) : (
                  <Eye className="size-4.5" aria-hidden />
                )}
              </button>
            </div>
            {pwFieldErrors.confirmPassword ? (
              <p className="text-xs text-destructive">
                {pwFieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            disabled={updateLoading || updateSuccess}
            className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.65)] hover:from-emerald-400 hover:to-teal-400"
          >
            {updateLoading ? "Guardando…" : "Actualizar contraseña"}
          </Button>

          <Link
            href="/login"
            className="mx-auto block w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Volver al inicio de sesión
          </Link>
        </form>
      </>,
    )
  }

  return shell(
    <>
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-[2.1rem]">
          Recuperar contraseña
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Ingresa tu correo electronico y te enviaremos un email para que puedas
          restablecer tu contraseña.
        </p>
      </div>

      {requestError ? (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {requestError}
        </p>
      ) : null}

      <form className="mt-8 space-y-5" noValidate onSubmit={handleSendEmail}>
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

        <Button
          type="submit"
          disabled={requestLoading}
          className="h-12 w-full bg-linear-to-r from-emerald-500 to-teal-500 text-base font-semibold text-white shadow-[0_16px_30px_-14px_rgba(16,185,129,0.65)] hover:from-emerald-400 hover:to-teal-400"
        >
          {requestLoading ? "Enviando…" : "Enviar"}
        </Button>

        <Link
          href="/login"
          className="mx-auto block w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Volver al inicio de sesión
        </Link>
      </form>
    </>,
  )
}

export default RecoverPasswordPage
