"use client"

import {
  getPopSettingsPageData,
  syncPadronForPopFiscal,
  updatePopSettings,
  type PopSettingsFormInput,
} from "@/app/[siteId]/[popId]/settings/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { usePadronAutofillRazonSocial } from "@/hooks/usePadronAutofillRazonSocial"
import { periodoAfipToYmdFirstDay } from "@/lib/afipDateParse"
import { parsePadronActividadesJson } from "@/lib/padronActividadesHelpers"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Building2,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react"

const ACTIVIDAD_SELECT_NONE = "__none__"

function formatCuitHyphenated(raw: string): string {
  const d = raw.replace(/\D/g, "")
  if (d.length !== 11) return raw.trim()
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}

function SettingsPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [isOwner, setIsOwner] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [padronBusy, setPadronBusy] = useState(false)

  const [form, setForm] = useState<
    PopSettingsFormInput & { fiscalPadronSyncedAt: string | null }
  >({
    name: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    streetAddress: "",
    postalCode: "",
    fiscalCuit: "",
    fiscalRazonSocial: "",
    fiscalInicioActividadesDate: "",
    fiscalIngresosBrutosText: "",
    fiscalPadronActividadesJson: "",
    fiscalActividadSeleccionadaId: "",
    fiscalPadronSyncedAt: null,
  })

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const padron = usePadronAutofillRazonSocial(popId, form.fiscalCuit ?? "", {
    enabled: Boolean(popId) && isOwner && canUpdate && !loading,
    suppressClear: loading,
  })

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getPopSettingsPageData(popId)
    if (!res.success) {
      setError(res.error || "Error")
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setPopName(res.popName)
    setIsOwner(res.isOwner)
    setCanUpdate(res.canUpdate)
    setForm({
      ...res.form,
      fiscalCuit: res.form.fiscalCuit ?? "",
      fiscalRazonSocial: res.form.fiscalRazonSocial ?? "",
      fiscalInicioActividadesDate: res.form.fiscalInicioActividadesDate ?? "",
      fiscalIngresosBrutosText: res.form.fiscalIngresosBrutosText ?? "",
      fiscalPadronActividadesJson: res.form.fiscalPadronActividadesJson ?? "",
      fiscalActividadSeleccionadaId: res.form.fiscalActividadSeleccionadaId ?? "",
    })
    setError(null)
  }, [popId, siteId])

  useEffect(() => {
    if (!popId || !siteId) {
      setLoading(false)
      setError("Punto de venta no encontrado")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      await load()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [load, popId, siteId])

  const actividadesPadronList = useMemo(
    () => parsePadronActividadesJson(form.fiscalPadronActividadesJson),
    [form.fiscalPadronActividadesJson],
  )

  useEffect(() => {
    if (!isOwner || loading) return
    if (padron.busy) return
    const hasCuit = Boolean((form.fiscalCuit ?? "").trim())
    if (!hasCuit) {
      setForm((f) => ({
        ...f,
        fiscalRazonSocial: "",
        fiscalPadronActividadesJson: "",
        fiscalActividadSeleccionadaId: "",
        fiscalInicioActividadesDate: "",
        fiscalIngresosBrutosText: "",
      }))
      return
    }
    if (!padron.razonSocial.trim()) return
    const acts = padron.fiscalActividadesPadron ?? []
    const json = acts.length ? JSON.stringify(acts) : ""
    setForm((f) => {
      const sel = f.fiscalActividadSeleccionadaId?.trim() ?? ""
      const selStillValid =
        sel.length > 0 && acts.some((a) => a.idActividad === sel)
      return {
        ...f,
        fiscalRazonSocial: padron.razonSocial,
        fiscalPadronActividadesJson: json,
        ...(selStillValid ? {} : { fiscalActividadSeleccionadaId: "" }),
      }
    })
  }, [
    padron.razonSocial,
    padron.fiscalActividadesPadron,
    padron.busy,
    isOwner,
    loading,
    form.fiscalCuit,
  ])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const up = () => setIsOnline(true)
    const down = () => setIsOnline(false)
    window.addEventListener("online", up)
    window.addEventListener("offline", down)
    return () => {
      window.removeEventListener("online", up)
      window.removeEventListener("offline", down)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
  }, [])

  useEffect(() => {
    const onFs = () =>
      setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onFs)
    return () => document.removeEventListener("fullscreenchange", onFs)
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !canUpdate) return
    setSaving(true)
    setBanner(null)
    const res = await updatePopSettings(popId, {
      name: form.name,
      phone: form.phone,
      country: form.country,
      state: form.state,
      city: form.city,
      streetAddress: form.streetAddress,
      postalCode: form.postalCode,
      fiscalCuit: isOwner ? form.fiscalCuit : undefined,
      fiscalRazonSocial: isOwner ? form.fiscalRazonSocial : undefined,
      fiscalInicioActividadesDate: isOwner
        ? form.fiscalInicioActividadesDate
        : undefined,
      fiscalIngresosBrutosText: isOwner
        ? form.fiscalIngresosBrutosText
        : undefined,
      fiscalPadronActividadesJson: isOwner
        ? form.fiscalPadronActividadesJson
        : undefined,
      fiscalActividadSeleccionadaId: isOwner
        ? form.fiscalActividadSeleccionadaId
        : undefined,
    })
    setSaving(false)
    if (!res.success) {
      setBanner(res.error)
      return
    }
    setBanner("Cambios guardados.")
    await load()
  }

  const onSyncPadron = async () => {
    if (!popId || !isOwner) return
    setPadronBusy(true)
    setBanner(null)
    const res = await syncPadronForPopFiscal(popId)
    setPadronBusy(false)
    if (!res.success) {
      setBanner(res.error)
      return
    }
    setForm((f) => {
      const acts = res.fiscalActividadesPadron ?? []
      const json = acts.length ? JSON.stringify(acts) : ""
      const sel = f.fiscalActividadSeleccionadaId?.trim() ?? ""
      const selStillValid =
        sel.length > 0 && acts.some((a) => a.idActividad === sel)
      return {
        ...f,
        fiscalRazonSocial: res.razonSocial,
        fiscalPadronActividadesJson: json,
        ...(selStillValid ? {} : { fiscalActividadSeleccionadaId: "" }),
        fiscalPadronSyncedAt: new Date().toISOString(),
      }
    })
    setBanner("Datos fiscales actualizados desde el padrón.")
  }

  const headerUserName =
    (typeof user?.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    user?.email?.split("@")[0] ||
    "Usuario"
  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  if (!popId || !siteId) {
    return (
      <div className="min-h-screen bg-[#070a09] p-10 text-sm text-slate-300">
        Punto de venta no encontrado
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070a09] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.12),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(99,102,241,0.08),transparent_38%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[38px_38px] opacity-20" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 pb-12 pt-6 sm:px-6">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={popMenuHref(siteId, popId)}
              className="group inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label="Volver al menú"
            >
              <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">
                Configurar
              </p>
              <h1 className="truncate text-2xl font-bold tracking-tight text-white">
                Ajustes
              </h1>
              <p className="truncate text-sm text-white/50">
                {popName || (loading ? "…" : "—")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                isOnline
                  ? "border-emerald-400/35 bg-emerald-500/12 text-emerald-200"
                  : "border-rose-400/35 bg-rose-500/12 text-rose-200",
              )}
            >
              {isOnline ? (
                <Wifi className="size-3" aria-hidden />
              ) : (
                <WifiOff className="size-3" aria-hidden />
              )}
              {isOnline ? "Online" : "Offline"}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void toggleFullscreen()}
              className="text-white/70 hover:bg-white/10 hover:text-white"
              aria-label={
                isFullscreen
                  ? "Salir de pantalla completa"
                  : "Pantalla completa"
              }
            >
              {isFullscreen ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </Button>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1">
              <Avatar className="size-8">
                <AvatarImage src={userAvatarSrc} alt="" />
                <AvatarFallback className="bg-emerald-500/20 text-[10px] text-emerald-200">
                  {headerUserName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-40 truncate text-xs font-medium text-white/85 sm:inline">
                {headerUserName}
              </span>
            </div>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
          >
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/50">Cargando…</p>
        ) : (
          <form
            onSubmit={(e) => void submit(e)}
            className="space-y-8 rounded-2xl border border-white/10 bg-[#0c1210]/90 p-6 shadow-xl backdrop-blur-xl"
          >
            {banner ? (
              <p
                role="status"
                className="rounded-lg border border-emerald-500/35 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100"
              >
                {banner}
              </p>
            ) : null}

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
                <Building2 className="size-4 text-emerald-400/90" aria-hidden />
                Datos del punto
              </h2>
              <div className="space-y-2">
                <Label htmlFor="pop-name" className="text-white/60">
                  Nombre comercial
                </Label>
                <Input
                  id="pop-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  disabled={!canUpdate}
                  className="border-white/15 bg-black/30 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pop-phone" className="text-white/60">
                  Teléfono
                </Label>
                <Input
                  id="pop-phone"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  disabled={!canUpdate}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pop-country" className="text-white/60">
                    País
                  </Label>
                  <Input
                    id="pop-country"
                    value={form.country}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, country: e.target.value }))
                    }
                    disabled={!canUpdate}
                    className="border-white/15 bg-black/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pop-state" className="text-white/60">
                    Provincia / estado
                  </Label>
                  <Input
                    id="pop-state"
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    disabled={!canUpdate}
                    className="border-white/15 bg-black/30 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pop-city" className="text-white/60">
                  Ciudad
                </Label>
                <Input
                  id="pop-city"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                  disabled={!canUpdate}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pop-street" className="text-white/60">
                  Domicilio
                </Label>
                <Input
                  id="pop-street"
                  value={form.streetAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, streetAddress: e.target.value }))
                  }
                  disabled={!canUpdate}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pop-cp" className="text-white/60">
                  Código postal
                </Label>
                <Input
                  id="pop-cp"
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, postalCode: e.target.value }))
                  }
                  disabled={!canUpdate}
                  className="border-white/15 bg-black/30 text-white"
                />
              </div>
            </section>

            {isOwner ? (
              <section className="space-y-4 border-t border-white/10 pt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">
                  Fiscal (titular)
                </h2>
                <p className="text-xs text-white/45">
                  CUIT y datos del emisor. Al escribir el CUIT o al sincronizar, el
                  padrón trae razón social y la lista de actividades. El inicio de
                  actividades y el texto de ingresos brutos los cargás vos (no vienen
                  fiables desde ARCA por rubro). Guardá para persistir en el punto.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="pop-cuit" className="text-white/60">
                    CUIT
                  </Label>
                  <Input
                    id="pop-cuit"
                    value={form.fiscalCuit ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fiscalCuit: e.target.value }))
                    }
                    disabled={!canUpdate}
                    placeholder="11 dígitos sin guiones"
                    className="border-white/15 bg-black/30 text-white"
                  />
                  {padron.busy ? (
                    <p className="flex items-center gap-2 text-xs text-white/45">
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                      Consultando padrón…
                    </p>
                  ) : padron.error ? (
                    <p className="text-xs text-rose-300/90">{padron.error}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="pop-rs" className="text-white/60">
                      Razón social
                    </Label>
                    <Input
                      id="pop-rs"
                      value={form.fiscalRazonSocial ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          fiscalRazonSocial: e.target.value,
                        }))
                      }
                      disabled={!canUpdate}
                      className="border-white/15 bg-black/30 text-white"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!canUpdate || padronBusy}
                    onClick={() => void onSyncPadron()}
                    className="shrink-0 border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    {padronBusy ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw className="size-4" aria-hidden />
                    )}
                    <span className="ml-2">Sincronizar padrón</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/60">Rubro / actividad (padrón)</Label>
                  <Select
                    value={
                      form.fiscalActividadSeleccionadaId?.trim() ||
                      ACTIVIDAD_SELECT_NONE
                    }
                    onValueChange={(v) => {
                      const id =
                        v === ACTIVIDAD_SELECT_NONE ? "" : v
                      const act = actividadesPadronList.find(
                        (a) => a.idActividad === id,
                      )
                      const fecha =
                        act?.inicioActividadesDate?.trim() ||
                        periodoAfipToYmdFirstDay(act?.periodo)
                      setForm((f) => ({
                        ...f,
                        fiscalActividadSeleccionadaId: id,
                        ...(fecha
                          ? { fiscalInicioActividadesDate: fecha }
                          : {}),
                      }))
                    }}
                    disabled={
                      !canUpdate ||
                      actividadesPadronList.length === 0
                    }
                  >
                    <SelectTrigger className="h-auto min-h-9 w-full max-w-full border-white/15 bg-black/30 py-2 text-left text-white [&_svg]:text-white/60">
                      <SelectValue placeholder="Elegí la actividad que usás para facturar" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[min(100vw-2rem,36rem)] border-white/15 bg-[#0c1210] text-white">
                      <SelectItem value={ACTIVIDAD_SELECT_NONE}>
                        (sin seleccionar)
                      </SelectItem>
                      {actividadesPadronList.map((a) => (
                        <SelectItem
                          key={a.idActividad}
                          value={a.idActividad}
                          className="whitespace-normal"
                        >
                          {a.descripcionActividad
                            ? `${a.descripcionActividad} (${a.idActividad})`
                            : a.idActividad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {actividadesPadronList.length === 0 ? (
                    <p className="text-[11px] text-white/35">
                      Sin actividades: cargá el CUIT y esperá la consulta al padrón,
                      o usá &quot;Sincronizar padrón&quot;.
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pop-fiscal-inicio" className="text-white/60">
                      Inicio de actividades
                    </Label>
                    <p className="text-[11px] text-white/35">
                      Suele depender del rubro. ARCA suele mandar inicio explícito o
                      el período (YYYYMM) por actividad: usamos el primer día de ese
                      mes como referencia; si no alcanza, cargá la fecha según tu
                      constancia.
                    </p>
                    <Input
                      id="pop-fiscal-inicio"
                      type="date"
                      value={form.fiscalInicioActividadesDate ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          fiscalInicioActividadesDate: e.target.value,
                        }))
                      }
                      disabled={!canUpdate}
                      className="border-white/15 bg-black/30 text-white"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="min-w-0 flex-1 space-y-2">
                        <Label htmlFor="pop-fiscal-ib" className="text-white/60">
                          Ingresos brutos (texto libre)
                        </Label>
                        <p className="text-[11px] text-white/35">
                          Número de inscripción por jurisdicción, situación o lo que
                          necesites en comprobantes. En muchos casos se repite el CUIT
                          con guiones.
                        </p>
                        <Textarea
                          id="pop-fiscal-ib"
                          value={form.fiscalIngresosBrutosText ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              fiscalIngresosBrutosText: e.target.value,
                            }))
                          }
                          disabled={!canUpdate}
                          rows={3}
                          placeholder="Ej.: 20-12345678-9 o texto según tu provincia"
                          className="border-white/15 bg-black/30 text-white resize-y min-h-18"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={
                          !canUpdate ||
                          !(form.fiscalCuit ?? "").replace(/\D/g, "").length
                        }
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            fiscalIngresosBrutosText: formatCuitHyphenated(
                              f.fiscalCuit ?? "",
                            ),
                          }))
                        }
                        className="shrink-0 self-end border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        Igual al CUIT
                      </Button>
                    </div>
                  </div>
                </div>
                {form.fiscalPadronSyncedAt ? (
                  <p className="text-[11px] text-white/35">
                    Última sync:{" "}
                    {new Date(form.fiscalPadronSyncedAt).toLocaleString("es-AR")}
                  </p>
                ) : null}
              </section>
            ) : null}

            <div className="flex justify-end border-t border-white/10 pt-4">
              <Button
                type="submit"
                disabled={!canUpdate || saving}
                className="bg-emerald-600 text-white hover:bg-emerald-500"
              >
                {saving ? "Guardando…" : "Guardar"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default withAuth(SettingsPage)
