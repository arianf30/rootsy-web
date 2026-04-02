"use client"

import Link from "next/link"
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  MoreVertical,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { ReactNode } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export type PopSaleHeaderUser = {
  name: string
  role: string
  avatarSrc: string
  initials: string
}

export type PopSaleHeaderProps = {
  popSlug: string
  title: string
  storeName?: string
  storeLogoSrc?: string
  isOnline: boolean
  isFullscreen: boolean
  onToggleFullscreen: () => void | Promise<void>
  user: PopSaleHeaderUser
  /** Controles extra antes del bloque de avatar (p. ej. “Nueva caja”) */
  trailingActions?: ReactNode
}

const DEFAULT_STORE = "Nuevo Origen"
const DEFAULT_LOGO =
  "https://api.dicebear.com/7.x/shapes/svg?seed=store1&backgroundColor=1a1f1d"

export function PopSaleHeader({
  popSlug,
  title,
  storeName = DEFAULT_STORE,
  storeLogoSrc = DEFAULT_LOGO,
  isOnline,
  isFullscreen,
  onToggleFullscreen,
  user,
  trailingActions,
}: PopSaleHeaderProps) {
  const backHref = `/${popSlug}/menu`

  return (
    <header className="border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
      <div className="grid h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={backHref}
            className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/6 bg-secondary text-foreground/70 transition-all hover:border-foreground/12 hover:bg-muted hover:text-foreground"
            aria-label="Volver al menú"
          >
            <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="size-8 overflow-hidden rounded-lg ring-1 ring-border">
              <img
                src={storeLogoSrc}
                alt=""
                className="size-full object-cover"
              />
            </div>
            <span className="truncate text-sm font-semibold text-foreground/85">
              {storeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <h1 className="text-[1.85rem] font-black tracking-tight text-foreground">
            {title}
          </h1>
          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
              isOnline
                ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
                : "border-rose-400/35 bg-rose-500/12 text-rose-200",
            )}
            role="status"
            aria-label={isOnline ? "Conectado" : "Sin conexión"}
          >
            {isOnline ? (
              <Wifi className="size-3" aria-hidden />
            ) : (
              <WifiOff className="size-3" aria-hidden />
            )}
            {isOnline ? "Online" : "Offline"}
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <button
            type="button"
            className="group inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Más opciones"
          >
            <MoreVertical className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={() => void onToggleFullscreen()}
            className="group inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={
              isFullscreen
                ? "Salir de pantalla completa"
                : "Pantalla completa"
            }
          >
            {isFullscreen ? (
              <Minimize2 className="size-4.5" />
            ) : (
              <Maximize2 className="size-4.5" />
            )}
          </button>
          {trailingActions}
          <div className="h-6 w-px shrink-0 bg-border" />
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="size-10 ring-1 ring-border">
                <AvatarImage src={user.avatarSrc} alt={user.name} />
                <AvatarFallback>{user.initials}</AvatarFallback>
              </Avatar>
              <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-card bg-primary" />
            </div>
            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold text-foreground/85">
                {user.name}
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
