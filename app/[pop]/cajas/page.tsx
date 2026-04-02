"use client"

import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Info,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { PopSaleHeader } from "@/components/pop/pop-sale-header"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CajaEstado = "abierta" | "cerrada"

type Caja = {
  id: string
  nombre: string
  estado: CajaEstado
  saldoEfectivo: number
  totalTarjetas: number
  totalOtros: number
  pie: string
}

const CAJAS_MOCK: Caja[] = [
  {
    id: "1",
    nombre: "Caja 1",
    estado: "abierta",
    saldoEfectivo: 186_240,
    totalTarjetas: 0,
    totalOtros: 0,
    pie: "Apertura: Blas Paredes el 22/05/2025 a las 19:48hs",
  },
  {
    id: "2",
    nombre: "Caja 2",
    estado: "cerrada",
    saldoEfectivo: 0,
    totalTarjetas: 0,
    totalOtros: 0,
    pie: "Último cierre: Blas Paredes el 28/03/2025 a las 18:32hs",
  },
]

function formatoMonedaARS(valor: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(valor)
}

export default function CajasPage() {
  const params = useParams()
  const popSlug =
    typeof params?.pop === "string"
      ? params.pop
      : Array.isArray(params?.pop)
        ? params.pop[0]
        : "1"

  const [isOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFsChange = () =>
      setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFsChange)
    return () => document.removeEventListener("fullscreenchange", onFsChange)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen()
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070a09] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(52,211,153,0.12),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.08),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.028)_1px,transparent_1px)] bg-size-[40px_40px] opacity-[0.18]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <PopSaleHeader
          popSlug={popSlug}
          title="Cajas"
          isOnline={isOnline}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          user={{
            name: "Francisco Ruiz",
            role: "Admin",
            avatarSrc:
              "https://api.dicebear.com/7.x/avataaars/svg?seed=francisco",
            initials: "FR",
          }}
          trailingActions={
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-9 shrink-0 rounded-xl border-emerald-400/35 bg-emerald-500/10 text-emerald-100 shadow-[inset_0_1px_0_rgba(167,243,208,0.12)] hover:bg-emerald-500/16 hover:text-white"
              aria-label="Nueva caja"
            >
              <Plus className="size-4.5" />
            </Button>
          }
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                Punto de venta
              </p>
              <h2 className="text-lg font-bold tracking-tight text-white/90 sm:text-xl">
                Estado de cajas
              </h2>
              <p className="mt-1 max-w-xl text-sm text-white/50">
                Gestioná aperturas, arqueos y movimientos de efectivo con el
                mismo criterio visual que el resto del POS.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/55 backdrop-blur-sm">
              <span
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  isOnline ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" : "bg-rose-400",
                )}
              />
              Sincronización simulada — demo local
            </div>
          </div>

          <ul className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:gap-8">
            {CAJAS_MOCK.map((caja) => (
              <li key={caja.id}>
                <article
                  className={cn(
                    "flex h-full flex-col rounded-2xl border bg-card/90 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 backdrop-blur-xl",
                    caja.estado === "abierta"
                      ? "border-emerald-500/25 ring-emerald-500/10"
                      : "border-white/[0.08] ring-white/[0.04]",
                  )}
                >
                  <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight text-foreground">
                        {caja.nombre}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          caja.estado === "abierta"
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                            : "border-white/10 bg-white/[0.04] text-white/45",
                        )}
                      >
                        {caja.estado === "abierta" ? (
                          <LockOpen className="size-3.5" aria-hidden />
                        ) : (
                          <Lock className="size-3.5" aria-hidden />
                        )}
                        {caja.estado === "abierta" ? "Abierta" : "Cerrada"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 px-2 text-xs text-rose-300/80 hover:bg-rose-500/10 hover:text-rose-200"
                      >
                        <Trash2 className="size-3.5" />
                        Eliminar
                      </Button>
                    </div>
                  </header>

                  <div className="pt-5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Efectivo en caja
                    </p>
                    <div
                      className={cn(
                        "rounded-xl border-2 px-4 py-4 sm:px-5 sm:py-5",
                        caja.estado === "abierta"
                          ? "border-emerald-400/45 bg-emerald-500/[0.07]"
                          : "border-white/[0.08] bg-white/[0.03]",
                      )}
                    >
                      <p
                        className={cn(
                          "text-2xl font-black tabular-nums tracking-tight sm:text-3xl",
                          caja.estado === "abierta"
                            ? "text-emerald-200"
                            : "text-white/35",
                        )}
                      >
                        {formatoMonedaARS(caja.saldoEfectivo)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Movimientos rápidos
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={caja.estado !== "abierta"}
                        className="h-10 flex-1 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.06] font-semibold text-foreground/85 hover:bg-white/10 disabled:opacity-40"
                      >
                        <ArrowUpCircle className="size-4 text-emerald-300" />
                        Ingresar efectivo
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={caja.estado !== "abierta"}
                        className="h-10 flex-1 gap-2 rounded-xl border border-white/[0.06] bg-white/[0.06] font-semibold text-foreground/85 hover:bg-white/10 disabled:opacity-40"
                      >
                        <ArrowDownCircle className="size-4 text-amber-200/90" />
                        Retirar efectivo
                      </Button>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-0 divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">
                        Total de tarjetas
                      </dt>
                      <dd className="font-semibold tabular-nums text-foreground/90">
                        {formatoMonedaARS(caja.totalTarjetas)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <dt className="text-muted-foreground">
                        Total de otros métodos
                      </dt>
                      <dd className="font-semibold tabular-nums text-foreground/90">
                        {formatoMonedaARS(caja.totalOtros)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {caja.estado === "abierta" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-xl border-border/60 bg-transparent font-semibold"
                        >
                          Resumen
                        </Button>
                        <Button
                          type="button"
                          className="h-11 rounded-xl bg-foreground font-semibold text-background hover:bg-foreground/90"
                        >
                          Cerrar caja
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-xl border-border/60 bg-transparent font-semibold"
                        >
                          Arqueo
                        </Button>
                        <Button
                          type="button"
                          className="h-11 rounded-xl bg-foreground font-semibold text-background hover:bg-foreground/90"
                        >
                          Abrir caja
                        </Button>
                      </>
                    )}
                  </div>

                  <footer className="mt-auto flex items-start gap-2 border-t border-white/[0.05] pt-4 text-xs text-muted-foreground">
                    <Info
                      className="mt-0.5 size-3.5 shrink-0 text-white/35"
                      aria-hidden
                    />
                    <p>{caja.pie}</p>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  )
}
