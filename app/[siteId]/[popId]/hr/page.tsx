"use client"

import {
  deactivatePopMember,
  deletePopRole,
  getPopHrDashboard,
  getRolePermissionsEditorData,
  inviteUserToPop,
  revokePopInvitation,
  savePopRolePermissions,
  type MemberRow,
  type PendingInviteRow,
  type PermissionCatalogRow,
  type PopRoleRow,
} from "@/app/[siteId]/[popId]/hr/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  MoreVertical,
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

function groupMembersByRole(members: MemberRow[]): [string, MemberRow[]][] {
  const m = new Map<string, MemberRow[]>()
  for (const mem of members) {
    const key = mem.roleDisplayName || "—"
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(mem)
  }
  const entries = [...m.entries()]
  entries.sort((a, b) => {
    if (a[0] === "Propietario") return -1
    if (b[0] === "Propietario") return 1
    return a[0].localeCompare(b[0], "es")
  })
  return entries
}

function HrPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [popName, setPopName] = useState("")
  const [canManageInvites, setCanManageInvites] = useState(false)
  const [roles, setRoles] = useState<PopRoleRow[]>([])
  const [members, setMembers] = useState<MemberRow[]>([])
  const [pending, setPending] = useState<PendingInviteRow[]>([])
  const [banner, setBanner] = useState<{
    type: "ok" | "err" | "info"
    text: string
  } | null>(null)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRoleId, setInviteRoleId] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [inviting, setInviting] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [actionKey, setActionKey] = useState<string | null>(null)

  const [permModalRole, setPermModalRole] = useState<{
    id: string
    displayName: string
    name: string
  } | null>(null)
  const [permModalList, setPermModalList] = useState<PermissionCatalogRow[]>([])
  const [permModalSelected, setPermModalSelected] = useState<string[]>([])
  const [permModalLoading, setPermModalLoading] = useState(false)
  const [permModalSaving, setPermModalSaving] = useState(false)

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadDashboard = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getPopHrDashboard(popId)
    if (!res.success) {
      setError(res.error)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1600)
      }
      return
    }
    setPopName(res.popName)
    setCanManageInvites(res.canManageInvites)
    setRoles(res.roles)
    setMembers(res.members)
    setPending(res.pendingInvites)
    setInviteRoleId((prev) => {
      if (prev) return prev
      const assignable = res.roles.find((r) => r.name !== "owner")
      return assignable?.id ?? ""
    })
  }, [popId, siteId])

  useEffect(() => {
    if (!popId || !siteId) {
      setLoading(false)
      setError("ID de POP no encontrado")
      return
    }
    let c = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadDashboard()
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [popId, siteId, loadDashboard])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    syncFullscreen()
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () => document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen()
  }

  const groupedMembers = useMemo(() => groupMembersByRole(members), [members])
  const assignableRoles = useMemo(
    () => roles.filter((r) => r.name !== "owner"),
    [roles],
  )

  const permissionsByResource = useMemo(() => {
    const m = new Map<string, PermissionCatalogRow[]>()
    for (const p of permModalList) {
      if (!m.has(p.resource)) m.set(p.resource, [])
      m.get(p.resource)!.push(p)
    }
    return [...m.entries()].sort((a, b) =>
      a[0].localeCompare(b[0], "es", { sensitivity: "base" }),
    )
  }, [permModalList])

  const closePermModal = () => {
    setPermModalRole(null)
    setPermModalList([])
    setPermModalSelected([])
    setPermModalLoading(false)
    setPermModalSaving(false)
  }

  const handleOpenEditRole = async (r: PopRoleRow) => {
    if (!popId || !siteId || !r.popId) return
    setPermModalLoading(true)
    setPermModalRole({ id: r.id, displayName: r.displayName, name: r.name })
    setPermModalList([])
    setPermModalSelected([])
    const res = await getRolePermissionsEditorData(popId, r.id)
    setPermModalLoading(false)
    if (!res.success) {
      closePermModal()
      setBanner({ type: "err", text: res.error })
      return
    }
    setPermModalRole(res.role)
    setPermModalList(res.permissions)
    setPermModalSelected([...res.selectedGrantKeys])
  }

  const togglePermSelection = (grantKey: string) => {
    setPermModalSelected((prev) =>
      prev.includes(grantKey)
        ? prev.filter((x) => x !== grantKey)
        : [...prev, grantKey],
    )
  }

  const handleSaveRolePermissions = async () => {
    if (!popId || !siteId || !permModalRole) return
    setPermModalSaving(true)
    const res = await savePopRolePermissions(
      popId,
      permModalRole.id,
      permModalSelected,
    )
    setPermModalSaving(false)
    if (!res.success) {
      setBanner({ type: "err", text: res.error })
      return
    }
    setBanner({ type: "ok", text: "Permisos del rol actualizados." })
    closePermModal()
    await loadDashboard()
  }

  const handleDeleteRole = async (r: PopRoleRow) => {
    if (!popId || !siteId || !r.popId) return
    const ok = window.confirm(
      `¿Eliminar el rol "${r.displayName}"? Se quitarán sus permisos y no podrá usarse en nuevas invitaciones.`,
    )
    if (!ok) return
    setActionKey(`del-role-${r.id}`)
    const res = await deletePopRole(popId, r.id)
    setActionKey(null)
    if (!res.success) {
      setBanner({ type: "err", text: res.error })
      return
    }
    setBanner({ type: "ok", text: "Rol eliminado." })
    await loadDashboard()
  }

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !canManageInvites) return
    setInviting(true)
    setBanner(null)
    setLastInviteUrl(null)
    const res = await inviteUserToPop(
      popId,
      inviteEmail,
      inviteRoleId,
      inviteMessage || null,
    )
    setInviting(false)
    if (!res.success) {
      setBanner({ type: "err", text: res.error })
      return
    }
    setLastInviteUrl(res.inviteUrl)
    setInviteEmail("")
    setInviteMessage("")
    let bannerText: string
    if (res.emailSent) {
      bannerText = "Invitación enviada por correo."
    } else if (!res.resendConfigured) {
      bannerText =
        "Invitación creada. No hay RESEND_API_KEY en el servidor: no se envía correo automático. Compartí el enlace de abajo con la persona invitada."
    } else if (res.emailError) {
      bannerText = `Invitación creada pero Resend rechazó o falló el envío: ${res.emailError}. Revisá dominio verificado y RESEND_FROM en el panel de Resend, carpeta de spam, y compartí el enlace manualmente.`
    } else {
      bannerText =
        "Invitación creada pero no se pudo confirmar el envío del correo. Compartí el enlace de abajo."
    }
    setBanner({ type: "ok", text: bannerText })
    await loadDashboard()
  }

  const handleRevoke = async (id: string) => {
    if (!popId || !siteId) return
    setActionKey(`revoke-${id}`)
    const res = await revokePopInvitation(popId, id)
    setActionKey(null)
    if (!res.success) {
      setBanner({ type: "err", text: res.error || "No se pudo revocar." })
      return
    }
    setBanner({ type: "ok", text: "Invitación revocada." })
    await loadDashboard()
  }

  const handleDeactivate = async (userId: string) => {
    if (!popId || !siteId) return
    setActionKey(`deact-${userId}`)
    const res = await deactivatePopMember(popId, userId)
    setActionKey(null)
    if (!res.success) {
      setBanner({ type: "err", text: res.error || "No se pudo quitar al miembro." })
      return
    }
    setBanner({ type: "ok", text: "Usuario desvinculado del POP." })
    await loadDashboard()
  }

  const copyInviteUrl = () => {
    if (!lastInviteUrl) return
    void navigator.clipboard.writeText(lastInviteUrl)
    setBanner({ type: "ok", text: "Enlace copiado al portapapeles." })
  }

  const currentMember = useMemo(
    () => (user?.id ? members.find((m) => m.userId === user.id) : undefined),
    [members, user?.id],
  )

  const headerUserName = useMemo(() => {
    if (currentMember) {
      const n = `${currentMember.firstName} ${currentMember.lastName}`.trim()
      if (n) return n
    }
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "Usuario"
  }, [currentMember, user?.email, user?.user_metadata?.full_name])

  const headerRoleLabel =
    currentMember?.roleDisplayName ??
    (canManageInvites ? "Dueño" : "Miembro")

  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    currentMember?.imageUrl ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=1a1f1d`

  if (!popId || !siteId) {
    return (
      <div className="min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">ID de POP no encontrado</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-rootsy-hairline bg-card/98 backdrop-blur-2xl">
        <div className="grid h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={popMenuHref(siteId, popId)}
              className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/6 bg-secondary text-foreground/70 transition-all hover:border-foreground/12 hover:bg-muted hover:text-foreground"
              aria-label="Volver"
            >
              <ArrowLeft className="size-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="size-8 overflow-hidden rounded-lg ring-1 ring-border">
                <img
                  src={popLogoSrc}
                  alt=""
                  className="size-full object-cover"
                />
              </div>
              <span className="truncate text-sm font-semibold text-foreground/85">
                {popName || (loading ? "…" : "—")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <h1 className="text-[1.85rem] font-black tracking-tight text-foreground">
              RRHH
            </h1>
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
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Más opciones"
            >
              <MoreVertical className="size-4.5" />
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="size-10 ring-1 ring-border">
                  <AvatarImage src={userAvatarSrc} alt="" />
                  <AvatarFallback className="text-xs">
                    {headerUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-card bg-primary" />
              </div>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold text-foreground/85">
                  {headerUserName}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-meadow">
                  {headerRoleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Recursos humanos
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Roles del punto de venta y personas con acceso. Las invitaciones las
                gestiona el dueño del POP.
              </p>
            </div>

            {banner ? (
              <div
                role="status"
                className={cn(
                  "rounded-xl border px-4 py-3 text-sm",
                  banner.type === "ok" &&
                    "border-emerald-500/35 bg-emerald-500/10 text-foreground",
                  banner.type === "err" &&
                    "border-destructive/40 bg-destructive/10 text-destructive",
                  banner.type === "info" &&
                    "border-border bg-muted/80 text-foreground",
                )}
              >
                {banner.text}
              </div>
            ) : null}

            {lastInviteUrl ? (
              <div className="rounded-xl border border-border bg-muted/80 px-4 py-3 text-sm">
                <p className="text-muted-foreground">Enlace de invitación</p>
                <p className="mt-2 break-all font-mono text-xs text-foreground">
                  {lastInviteUrl}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={copyInviteUrl}
                >
                  Copiar enlace
                </Button>
              </div>
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
              <div className="space-y-4">
                <section className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Roles
                  </h2>
                  {roles.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No hay roles cargados.
                    </p>
                  ) : (
                    <ul className="space-y-0 divide-y divide-border">
                      {roles.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-col gap-2 py-3 first:pt-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {r.displayName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.popId
                                ? "Rol del punto de venta"
                                : "Rol de sistema (plantilla)"}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 justify-end">
                            <span className="text-xs text-muted-foreground">
                              {r.popId ? "POP" : "Sistema"}
                            </span>
                            {canManageInvites && r.popId ? (
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  disabled={
                                    actionKey?.startsWith("del-role-") ||
                                    permModalLoading ||
                                    permModalSaving
                                  }
                                  onClick={() => void handleOpenEditRole(r)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={
                                    actionKey?.startsWith("del-role-") ||
                                    permModalLoading ||
                                    permModalSaving
                                  }
                                  onClick={() => void handleDeleteRole(r)}
                                >
                                  Eliminar
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {canManageInvites ? (
                  <>
                    <section className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Nueva invitación
                      </h2>
                      <form onSubmit={(e) => void handleInvite(e)} className="space-y-4">
                        {assignableRoles.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No hay roles asignables (además del propietario). Creá roles
                            en la base o contactá soporte.
                          </p>
                        ) : (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="invEmail">Correo electrónico</Label>
                              <Input
                                id="invEmail"
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="nombre@ejemplo.com"
                                autoComplete="email"
                                required
                                className="bg-secondary"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="invRole">Rol</Label>
                              <select
                                id="invRole"
                                value={inviteRoleId}
                                onChange={(e) => setInviteRoleId(e.target.value)}
                                required
                                className="flex h-10 w-full rounded-md border border-input bg-secondary px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                {assignableRoles.map((r) => (
                                  <option key={r.id} value={r.id}>
                                    {r.displayName}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="invMsg">Mensaje (opcional)</Label>
                              <Textarea
                                id="invMsg"
                                value={inviteMessage}
                                onChange={(e) => setInviteMessage(e.target.value)}
                                placeholder="Si querés podés enviarle un mensaje"
                                className="min-h-[72px] bg-secondary"
                              />
                            </div>
                            <Button
                              type="submit"
                              disabled={inviting || assignableRoles.length === 0}
                              className="bg-primary text-primary-foreground"
                            >
                              {inviting ? "Enviando…" : "Enviar invitación"}
                            </Button>
                          </>
                        )}
                      </form>
                    </section>

                    <section className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                      <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Invitaciones pendientes
                      </h2>
                      {pending.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No hay invitaciones pendientes.
                        </p>
                      ) : (
                        <ul className="space-y-3">
                          {pending.map((p) => (
                            <li
                              key={p.id}
                              className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
                            >
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {p.email}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {p.roleDisplayName}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={actionKey === `revoke-${p.id}`}
                                onClick={() => void handleRevoke(p.id)}
                              >
                                Revocar
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  </>
                ) : (
                  <section className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                    <p className="text-sm text-muted-foreground">
                      Solo el dueño del punto de venta puede enviar invitaciones y ver las
                      pendientes.
                    </p>
                  </section>
                )}
              </div>

              <div className="space-y-4">
                <section className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-sm">
                  <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Equipo por rol
                  </h2>
                  {groupedMembers.map(([roleLabel, list]) => (
                    <div key={roleLabel}>
                      <h3 className="mt-4 first:mt-0 text-sm font-semibold text-foreground">
                        {roleLabel}
                      </h3>
                      <ul className="mt-2 space-y-0 divide-y divide-border">
                        {list.map((mem) => (
                          <li
                            key={`${mem.userId}-${roleLabel}`}
                            className="flex flex-wrap items-center justify-between gap-2 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {mem.imageUrl ? (
                                <img
                                  src={mem.imageUrl}
                                  alt=""
                                  className="size-10 shrink-0 rounded-full object-cover ring-1 ring-border"
                                />
                              ) : (
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
                                  {(mem.firstName || mem.lastName || "?")
                                    .slice(0, 1)
                                    .toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                  {`${mem.firstName} ${mem.lastName}`.trim() ||
                                    "Sin nombre"}
                                </p>
                                {mem.invitedAt ? (
                                  <p className="text-xs text-muted-foreground">
                                    Desde{" "}
                                    {new Date(mem.invitedAt).toLocaleDateString("es-AR")}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            {canManageInvites && !mem.isOwner ? (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                disabled={actionKey === `deact-${mem.userId}`}
                                onClick={() => void handleDeactivate(mem.userId)}
                              >
                                Quitar
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </section>

                <Button
                  type="button"
                  variant="outline"
                  className="border-border"
                  onClick={() =>
                    popId && siteId
                      ? router.push(popMenuHref(siteId, popId))
                      : undefined
                  }
                >
                  Volver al menú
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Dialog
        open={permModalRole !== null}
        onOpenChange={(open) => {
          if (!open && !permModalSaving) closePermModal()
        }}
      >
        <DialogContent
          showCloseButton={!permModalSaving}
          className="max-h-[min(88vh,640px)] max-w-lg overflow-hidden border-border bg-card p-0 gap-0 sm:max-w-lg"
        >
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Permisos del rol</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {permModalLoading ? "Cargando…" : permModalRole?.displayName}
            </p>
          </DialogHeader>
          <div className="max-h-[min(52vh,420px)] overflow-y-auto px-6 py-4">
            {permModalLoading ? (
              <p className="text-sm text-muted-foreground">
                Obteniendo permisos disponibles…
              </p>
            ) : permissionsByResource.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay permisos en el catálogo de la app (POP_PAGES). Revisá{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  lib/popPageCrudConstants.ts
                </code>
                .
              </p>
            ) : (
              <div className="space-y-4">
                {permissionsByResource.map(([resource, plist]) => (
                  <div key={resource}>
                    <p className="mb-2 text-sm font-semibold capitalize text-foreground">
                      {resource}
                    </p>
                    <ul className="space-y-2">
                      {plist.map((p) => (
                        <li
                          key={p.key}
                          className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2"
                        >
                          <Checkbox
                            id={`perm-${p.key.replace(/:/g, "-")}`}
                            checked={permModalSelected.includes(p.key)}
                            onCheckedChange={() => togglePermSelection(p.key)}
                            className="mt-0.5"
                          />
                          <label
                            htmlFor={`perm-${p.key.replace(/:/g, "-")}`}
                            className="flex-1 cursor-pointer text-sm text-foreground"
                          >
                            <span className="font-medium">{p.action}</span>
                            {p.description ? (
                              <span className="mt-0.5 block text-xs text-muted-foreground">
                                {p.description}
                              </span>
                            ) : null}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={permModalSaving || permModalLoading}
              onClick={closePermModal}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={permModalSaving || permModalLoading}
              onClick={() => void handleSaveRolePermissions()}
            >
              {permModalSaving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(HrPage)
