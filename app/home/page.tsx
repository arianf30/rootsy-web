"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  Download,
  HelpCircle,
  Leaf,
  LogOut,
  MoreVertical,
  Plus,
  UserCog,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import {
  getHomePageData,
  type UserPopListItem,
  type UserProfileDTO,
} from "@/app/profile/actions"
import { cn } from "@/lib/utils"

const ACCENTS = [
  {
    accent: "from-amber-400 via-yellow-500 to-orange-600",
    glow: "shadow-amber-500/35",
  },
  {
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
    glow: "shadow-emerald-500/35",
  },
  {
    accent: "from-fuchsia-500 via-violet-600 to-indigo-700",
    glow: "shadow-fuchsia-500/35",
  },
  {
    accent: "from-rose-400 via-red-500 to-orange-600",
    glow: "shadow-rose-500/35",
  },
  {
    accent: "from-sky-400 via-blue-500 to-indigo-600",
    glow: "shadow-sky-500/35",
  },
] as const

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase()
}

function avatarFallbackLetters(profile: UserProfileDTO | null, email?: string | null): string {
  const fn = profile?.firstName?.trim()
  const ln = profile?.lastName?.trim()
  if (fn && ln) return (fn.charAt(0) + ln.charAt(0)).toUpperCase()
  if (fn) return fn.slice(0, 2).toUpperCase()
  const fromEmail = email?.split("@")[0]?.slice(0, 2)
  return (fromEmail ?? "U").toUpperCase()
}

function HomePage() {
  const router = useRouter()
  const { logOut, user, loading: authLoading } = useAuth()

  const [pops, setPops] = useState<UserPopListItem[] | null>(null)
  const [profile, setProfile] = useState<UserProfileDTO | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [canCreatePop, setCanCreatePop] = useState(false)

  const loadData = useCallback(async () => {
    setLoadError(false)
    try {
      const data = await getHomePageData()
      setPops(data.pops)
      setProfile(data.profile)
      setCanCreatePop(data.canCreatePop)
    } catch {
      setPops([])
      setLoadError(true)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    void loadData()
  }, [authLoading, loadData])

  const handleLogOut = async () => {
    await logOut()
    router.push("/login")
    router.refresh()
  }

  const displayName =
    profile?.fullName?.trim() ||
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Usuario"

  const avatarUrl =
    profile?.imageUrl?.trim() ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null

  const isLoading = authLoading || pops === null

  return (
    <div className="relative h-screen overflow-hidden bg-[#070a09] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.14),transparent_35%),radial-gradient(circle_at_82%_46%,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_45%_88%,rgba(34,211,238,0.1),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[42px_42px] opacity-25" />
        <div className="absolute -top-28 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl motion-safe:animate-pulse" />
        <div className="absolute right-2 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl motion-safe:animate-pulse [animation-delay:900ms]" />
        <div className="absolute bottom-0 left-16 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl motion-safe:animate-pulse [animation-delay:1700ms]" />
        <div className="absolute -top-40 -right-24 h-136 w-136 rounded-full bg-[conic-gradient(from_0deg,rgba(16,185,129,0.14),rgba(99,102,241,0.1),rgba(16,185,129,0.14))] blur-3xl motion-safe:animate-[spin_42s_linear_infinite]" />
        <div className="absolute -bottom-44 -left-28 h-136 w-136 rounded-full bg-[conic-gradient(from_0deg,rgba(34,211,238,0.12),rgba(52,211,153,0.08),rgba(34,211,238,0.12))] blur-3xl motion-safe:animate-[spin_50s_linear_infinite_reverse]" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-1 py-1 text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 ring-1 ring-white/15">
              <Leaf className="h-5 w-5 text-meadow" aria-hidden />
            </span>
            <span className="text-lg font-bold tracking-tight">Rootsy</span>
          </Link>

          <div className="flex items-center gap-3">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className="inline-flex size-9 items-center justify-center rounded-full text-white/65 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Mas opciones"
              >
                <MoreVertical className="size-4.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-48 border-white/14 bg-[#111716]/96 text-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl"
              >
                <DropdownMenuItem className="cursor-pointer gap-2.5 text-white/90 focus:bg-white/10 focus:text-white">
                  <UserCog className="size-4 text-white/70" />
                  Editar perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer gap-2.5 text-white/90 focus:bg-white/10 focus:text-white">
                  <HelpCircle className="size-4 text-white/70" />
                  Ayuda
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer gap-2.5"
                  onSelect={() => void handleLogOut()}
                >
                  <LogOut className="size-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Avatar className="size-10 ring-2 ring-white/15">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="" />
              ) : null}
              <AvatarFallback className="bg-emerald-900/40 text-sm font-semibold text-white">
                {avatarFallbackLetters(profile, user?.email ?? null)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex h-[calc(100svh-4.5rem)] w-full max-w-7xl flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-5 pb-24 pt-14 sm:px-8 lg:px-10">
        <section className="w-full max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Bienvenid@ {displayName}!{" "}
            <span className="inline-block origin-bottom-right animate-[wave_2.4s_ease-in-out_infinite]">
              👋
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/70 sm:text-xl">
            A que punto de venta queres ingresar?
          </p>

          {loadError ? (
            <p className="mt-8 text-sm text-amber-200/90">
              No pudimos cargar tus puntos de venta.{" "}
              <button
                type="button"
                className="font-semibold underline underline-offset-2 hover:text-white"
                onClick={() => void loadData()}
              >
                Reintentar
              </button>
            </p>
          ) : null}

          {isLoading ? (
            <div
              className="mt-16 flex flex-col items-center justify-center gap-3 text-white/60"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <Spinner className="size-10 text-emerald-400/80" />
              <span className="text-sm">Cargando tus puntos de venta…</span>
            </div>
          ) : (
            <ul className="mt-12 mx-auto flex max-w-3xl list-none flex-wrap justify-center gap-x-2 gap-y-7 sm:gap-x-3">
              {pops!.length === 0 ? (
                <li className="w-full max-w-md rounded-2xl border border-white/12 bg-white/5 px-6 py-10 text-center text-white/75">
                  <p className="text-base leading-relaxed">
                    No tenés puntos de venta asociados con acceso activo. Si
                    esperabas ver uno, pedí que te inviten o que activen tu rol en
                    el POP.
                  </p>
                </li>
              ) : (
                pops!.map((pop, index) => {
                  const palette = ACCENTS[index % ACCENTS.length]!
                  const sigla = initialsFromName(pop.name)
                  const sub = pop.subscription

                  return (
                    <li
                      key={pop.id}
                      className="group basis-[9.1rem] sm:basis-[9.4rem]"
                    >
                      <div className="mx-auto flex w-full max-w-40 flex-col items-center">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/${pop.siteId}/${pop.id}/menu`)
                          }
                          className="flex w-full flex-col items-center"
                        >
                          <div className="relative">
                            <div
                              className={cn(
                                "absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-90",
                                palette.glow,
                              )}
                            />
                            <div
                              className={cn(
                                "relative flex size-28 items-center justify-center rounded-full bg-linear-to-br shadow-xl ring-2 ring-white/14 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04]",
                                palette.accent,
                              )}
                            >
                              <span className="text-[1.72rem] font-black tracking-tight text-white drop-shadow">
                                {sigla}
                              </span>
                            </div>
                            <PopStatusBadge pop={pop} />
                          </div>
                          <span className="mt-4 text-center text-[0.92rem] font-semibold text-white/78 transition-colors group-hover:text-white">
                            {pop.name}
                          </span>
                          <span
                            className="mt-1 text-center font-mono text-[10px] font-semibold uppercase tracking-wider text-white/42"
                            title="Site ID"
                          >
                            {pop.siteId}
                          </span>
                          {!pop.isOwner ? (
                            <span className="mt-1 line-clamp-2 text-center text-[10px] font-medium uppercase tracking-wider text-white/40">
                              {pop.roleName}
                            </span>
                          ) : null}
                        </button>

                        {pop.isOwner &&
                        sub &&
                        sub.isActive === false ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="mt-3 h-8 border-white/20 bg-white/10 text-xs text-white hover:bg-white/15"
                            onClick={() =>
                              router.push(
                                `/${pop.siteId}/${pop.id}/subscribe`,
                              )
                            }
                          >
                            Activar suscripción
                          </Button>
                        ) : null}

                        {sub?.status === "trial" &&
                        sub.daysRemaining != null ? (
                          <p className="mt-2 max-w-40 text-center text-[10px] leading-snug text-white/55">
                            Prueba: {sub.daysRemaining} días restantes
                          </p>
                        ) : null}

                        {sub?.isActive &&
                        sub.status === "active" &&
                        sub.planDisplayName ? (
                          <p className="mt-2 max-w-40 text-center text-[10px] leading-snug text-white/55">
                            {sub.planDisplayName}
                            {sub.businessTypeDisplayName
                              ? ` · ${sub.businessTypeDisplayName}`
                              : ""}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  )
                })
              )}

              {canCreatePop ? (
                <li className="group basis-[9.1rem] sm:basis-[9.4rem]">
                  <button
                    type="button"
                    onClick={() => router.push("/pops/create")}
                    className="mx-auto flex w-full max-w-40 flex-col items-center"
                  >
                    <div className="relative flex size-28 items-center justify-center rounded-full border-2 border-dashed border-white/22 bg-white/3 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-emerald-300/45 group-hover:bg-emerald-400/7">
                      <Plus className="size-8 text-white/45 transition-colors group-hover:text-emerald-200" />
                    </div>
                    <span className="mt-4 text-[0.92rem] font-semibold text-white/45 transition-colors group-hover:text-white/70">
                      Agregar nuevo
                    </span>
                  </button>
                </li>
              ) : null}
            </ul>
          )}
        </section>

        <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-4">
          <p className="hidden text-sm text-white/52 sm:block">
            Instala el sistema en tu compu y accede mas facil y rapido.
          </p>
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-2 rounded-lg border-white/20 bg-black/25 text-white/85 hover:bg-white/10 hover:text-white"
          >
            <Download className="size-4" />
            Descargar
          </Button>
        </div>
      </main>
    </div>
  )
}

function PopStatusBadge({ pop }: { pop: UserPopListItem }) {
  const sub = pop.subscription

  if (!sub) {
    return (
      <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-0 bg-black/70 text-[10px] uppercase tracking-wider text-emerald-200">
        {pop.isOwner ? "Propietario" : "Activo"}
      </Badge>
    )
  }

  if (sub.status === "trial") {
    return (
      <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-0 bg-amber-950/80 text-[10px] uppercase tracking-wider text-amber-100">
        Prueba
      </Badge>
    )
  }

  if (sub.isActive) {
    return (
      <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-0 bg-black/70 text-[10px] uppercase tracking-wider text-emerald-200">
        Activo
      </Badge>
    )
  }

  return (
    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-0 bg-red-950/70 text-[10px] uppercase tracking-wider text-red-100">
      Inactivo
    </Badge>
  )
}

export default withAuth(HomePage)
