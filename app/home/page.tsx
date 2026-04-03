"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Download,
  HelpCircle,
  Leaf,
  LogOut,
  MoreVertical,
  Plus,
  UserCog,
} from "lucide-react"

import { EditProfileDialog } from "@/components/home/edit-profile-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const SUCURSALES = [
  {
    id: "1",
    nombre: "Nuevo Origen",
    sigla: "NO",
    accent: "from-amber-400 via-yellow-500 to-orange-600",
    glow: "shadow-amber-500/35",
    badge: "Activo",
  },
  {
    id: "2",
    nombre: "Sano de Raiz",
    sigla: "SR",
    accent: "from-emerald-400 via-teal-500 to-cyan-600",
    glow: "shadow-emerald-500/35",
    badge: "Activo",
  },
  {
    id: "3",
    nombre: "Pepe Guapo",
    sigla: "PG",
    accent: "from-fuchsia-500 via-violet-600 to-indigo-700",
    glow: "shadow-fuchsia-500/35",
    badge: "Activo",
  },
] as const

export default function HomePage() {
  const [perfilAbierto, setPerfilAbierto] = useState(false)

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
                <DropdownMenuItem
                  className="cursor-pointer gap-2.5 text-white/90 focus:bg-white/10 focus:text-white"
                  onSelect={() => setPerfilAbierto(true)}
                >
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
                >
                  <LogOut className="size-4" />
                  Cerrar sesion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Avatar className="size-10 ring-2 ring-white/15">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=francisco" />
              <AvatarFallback className="bg-emerald-900/40 text-white">
                FR
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex h-[calc(100svh-4.5rem)] w-full max-w-7xl flex-col items-center justify-center overflow-hidden px-5 pb-24 pt-14 sm:px-8 lg:px-10">
        <section className="w-full max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Bienvenid@ Francisco!{" "}
            <span className="inline-block origin-bottom-right animate-[wave_2.4s_ease-in-out_infinite]">
              👋
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/70 sm:text-xl">
            A que punto de venta queres ingresar?
          </p>

          <ul className="mt-12 mx-auto flex max-w-3xl list-none flex-wrap justify-center gap-x-2 gap-y-7 sm:gap-x-3">
            {SUCURSALES.map((sucursal) => (
              <li key={sucursal.id} className="group basis-[9.1rem] sm:basis-[9.4rem]">
                <Link
                  href={`/${sucursal.id}/menu`}
                  className="mx-auto flex w-full max-w-40 flex-col items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070a09]"
                  aria-label={`Entrar a punto de venta ${sucursal.nombre}`}
                >
                  <div className="relative">
                    <div
                      className={`absolute inset-0 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-90 ${sucursal.glow}`}
                    />
                    <div
                      className={`relative flex size-28 items-center justify-center rounded-full bg-linear-to-br ${sucursal.accent} shadow-xl ring-2 ring-white/14 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.04]`}
                    >
                      <span className="text-[1.72rem] font-black tracking-tight text-white drop-shadow">
                        {sucursal.sigla}
                      </span>
                    </div>
                    <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 border-0 bg-black/70 text-[10px] uppercase tracking-wider text-emerald-200">
                      {sucursal.badge}
                    </Badge>
                  </div>
                  <span className="mt-4 text-[0.92rem] font-semibold text-white/78 transition-colors group-hover:text-white">
                    {sucursal.nombre}
                  </span>
                </Link>
              </li>
            ))}

            <li className="group basis-[9.1rem] sm:basis-[9.4rem]">
              <button
                type="button"
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
          </ul>
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

      <EditProfileDialog open={perfilAbierto} onOpenChange={setPerfilAbierto} />
    </div>
  )
}
