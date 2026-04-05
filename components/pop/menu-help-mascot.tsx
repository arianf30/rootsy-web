"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

const MASCOT = "/images/rootsy-help-mascot.png"

type MenuHelpMascotProps = {
  className?: string
  onClick?: () => void
}

/**
 * Asistente visual del menú POP: mascota + nube de copy.
 * Burbuja opaca (sin transparencia) para contraste legible. Animación en `globals.css`.
 */
export function MenuHelpMascot({ className, onClick }: MenuHelpMascotProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-6 right-6 z-30 hidden sm:block",
        className,
      )}
    >
      <div className="rootsy-help-mascot-widget pointer-events-none flex justify-end">
        <div className="rootsy-help-mascot-widget-inner flex max-w-[min(100vw-3rem,280px)] flex-col items-end gap-1">
          <div
            className={cn(
              "mr-1 rounded-[1.25rem] border border-zinc-200 bg-white",
              "px-3.5 py-2 shadow-sm",
            )}
          >
            <p className="text-right text-[0.8125rem] font-medium leading-snug tracking-tight text-zinc-900 antialiased">
              ¿Necesitas ayuda?
            </p>
          </div>

          <button
            type="button"
            onClick={onClick}
            className={cn(
              "group pointer-events-auto relative flex w-[min(132px,32vw)] max-w-[140px] shrink-0",
              "cursor-pointer rounded-2xl bg-transparent outline-none",
              "transition-transform duration-200 ease-out",
              "hover:scale-[1.04] active:scale-[0.97]",
              "focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label="Abrir ayuda"
          >
            <Image
              src={MASCOT}
              alt=""
              width={280}
              height={320}
              className="h-auto w-full max-h-[min(132px,26vh)] object-contain object-bottom select-none drop-shadow-[0_10px_28px_rgba(0,0,0,0.2)] transition-[filter,transform] duration-300 ease-out group-hover:drop-shadow-[0_12px_32px_rgba(16,185,129,0.18)]"
              sizes="140px"
            />
          </button>
        </div>
      </div>
    </div>
  )
}
