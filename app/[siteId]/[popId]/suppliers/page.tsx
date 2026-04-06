"use client"

import {
  createPopSupplier,
  deletePopSupplier,
  getPopSuppliersTable,
  updatePopSupplier,
  type SupplierTableRow,
  type UpsertPopSupplierInput,
} from "@/app/[siteId]/[popId]/suppliers/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { usePadronAutofillRazonSocial } from "@/hooks/usePadronAutofillRazonSocial"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Leaf,
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  Truck,
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

function emptyForm(): UpsertPopSupplierInput {
  return { name: "", email: "", phone: "", taxId: "", notes: "" }
}

function SuppliersPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [rows, setRows] = useState<SupplierTableRow[]>([])
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createBanner, setCreateBanner] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(emptyForm)

  const [editRow, setEditRow] = useState<SupplierTableRow | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editBanner, setEditBanner] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)

  const [deleteRow, setDeleteRow] = useState<SupplierTableRow | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const createPadron = usePadronAutofillRazonSocial(popId, createForm.taxId, {
    enabled: Boolean(popId) && createOpen && canCreate,
  })
  const editPadron = usePadronAutofillRazonSocial(popId, editForm.taxId, {
    enabled: Boolean(popId) && editRow !== null && canUpdate,
  })

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getPopSuppliersTable(popId)
    if (!res.success) {
      setError(res.error || "Error")
      setRows([])
      setCanCreate(false)
      setCanUpdate(false)
      setCanDelete(false)
      setPopName(res.popName ?? "")
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setRows(res.suppliers)
    setPopName(res.popName)
    setCanCreate(res.canCreate)
    setCanUpdate(res.canUpdate)
    setCanDelete(res.canDelete)
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
      setError(null)
      try {
        await load()
      } catch {
        if (!cancelled) setError("Error inesperado")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId, siteId, load])

  useEffect(() => {
    if (!createOpen || !canCreate) return
    if (createPadron.busy) return
    if (!createPadron.razonSocial.trim()) return
    setCreateForm((f) => ({ ...f, name: createPadron.razonSocial }))
  }, [createPadron.razonSocial, createPadron.busy, createOpen, canCreate])

  useEffect(() => {
    if (!editRow || !canUpdate) return
    if (editPadron.busy) return
    if (!editPadron.razonSocial.trim()) return
    setEditForm((f) => ({ ...f, name: editPadron.razonSocial }))
  }, [editPadron.razonSocial, editPadron.busy, editRow, canUpdate])

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    sync()
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen()
  }

  const openCreate = () => {
    setCreateBanner(null)
    setCreateForm(emptyForm())
    setCreateOpen(true)
  }

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId) return
    setCreateSaving(true)
    setCreateBanner(null)
    const res = await createPopSupplier(popId, createForm)
    setCreateSaving(false)
    if (!res.success) {
      setCreateBanner(res.error)
      return
    }
    setCreateOpen(false)
    await load()
  }

  const openEdit = (row: SupplierTableRow) => {
    setEditBanner(null)
    setEditRow(row)
    setEditForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      taxId: row.taxId,
      notes: row.notes,
    })
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId || !editRow) return
    setEditSaving(true)
    setEditBanner(null)
    const res = await updatePopSupplier(popId, editRow.id, editForm)
    setEditSaving(false)
    if (!res.success) {
      setEditBanner(res.error)
      return
    }
    setEditRow(null)
    await load()
  }

  const submitDelete = async () => {
    if (!popId || !siteId || !deleteRow) return
    setDeleteBusy(true)
    const res = await deletePopSupplier(popId, deleteRow.id)
    setDeleteBusy(false)
    if (!res.success) {
      setDeleteRow(null)
      return
    }
    setDeleteRow(null)
    await load()
  }

  const headerUserName = useMemo(() => {
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "Usuario"
  }, [user?.email, user?.user_metadata?.full_name])

  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=e8f5ef`

  const emptyCols = canUpdate || canDelete ? 6 : 5

  if (!popId || !siteId) {
    return (
      <div className="rootsy-app-light min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">Punto de venta no encontrado</p>
      </div>
    )
  }

  return (
    <div className="rootsy-app-light relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 motion-reduce:opacity-50"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.75_0.12_155/0.35),transparent),radial-gradient(ellipse_60%_40%_at_100%_50%,oklch(0.85_0.08_140/0.2),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(oklch(0.92_0.02_130/0.35)_1px,transparent_1px),linear-gradient(90deg,oklch(0.92_0.02_130/0.35)_1px,transparent_1px)] bg-size-[48px_48px] opacity-40" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="border-b border-rootsy-hairline bg-card/90 shadow-sm backdrop-blur-xl">
          <div className="grid h-18 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href={popMenuHref(siteId, popId)}
                className="group inline-flex size-10 items-center justify-center rounded-xl border border-foreground/10 bg-secondary text-foreground/70 transition-all hover:border-primary/25 hover:bg-muted hover:text-foreground"
                aria-label="Volver al menú"
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
                <span className="truncate text-sm font-semibold text-foreground/90">
                  {popName || (loading ? "…" : "—")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="flex items-center gap-2 text-[1.65rem] font-black tracking-tight text-foreground">
                <span className="inline-flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Truck className="size-5" aria-hidden />
                </span>
                Proveedores
              </h1>
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
                  isOnline
                    ? "border-primary/30 bg-primary/10 text-forest"
                    : "border-destructive/30 bg-destructive/10 text-destructive",
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

            <div className="flex shrink-0 items-center justify-end gap-2">
              {canCreate ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-9 gap-1.5 rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                  onClick={() => openCreate()}
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Nuevo proveedor</span>
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={
                  isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"
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
                <Avatar className="size-10 ring-1 ring-border">
                  <AvatarImage src={userAvatarSrc} alt="" />
                  <AvatarFallback className="bg-primary/10 text-xs text-primary">
                    {headerUserName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-foreground/90">
                    {headerUserName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-meadow">
                    <Leaf className="size-3" aria-hidden />
                    Compras
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando proveedores…</p>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Directorio de proveedores
                </h2>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Datos de contacto, CUIT y notas para este punto de venta. Los
                  cambios respetan tu rol y las políticas RLS.
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-md shadow-primary/5 backdrop-blur-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="font-semibold text-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Email
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Teléfono
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        CUIT / ID fiscal
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Notas
                      </TableHead>
                      {canUpdate || canDelete ? (
                        <TableHead className="text-right font-semibold text-foreground">
                          Acciones
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={emptyCols}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No hay proveedores aún o no hay permiso de lectura.
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((r) => (
                        <TableRow
                          key={r.id}
                          className="border-border/80 hover:bg-muted/30"
                        >
                          <TableCell className="font-medium text-foreground">
                            {r.name || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.email || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.phone || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.taxId || "—"}
                          </TableCell>
                          <TableCell
                            className="max-w-[180px] truncate text-muted-foreground"
                            title={r.notes}
                          >
                            {r.notes || "—"}
                          </TableCell>
                          {canUpdate || canDelete ? (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {canUpdate ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-primary hover:bg-primary/10 hover:text-forest"
                                    onClick={() => openEdit(r)}
                                  >
                                    Editar
                                  </Button>
                                ) : null}
                                {canDelete ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteRow(r)}
                                  >
                                    Eliminar
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,640px)] overflow-y-auto border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
          </DialogHeader>
          {createBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {createBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
            <div className="space-y-2">
              <Label htmlFor="sp-name">Nombre</Label>
              <Input
                id="sp-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-email">Email</Label>
              <Input
                id="sp-email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, email: e.target.value }))
                }
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-phone">Teléfono</Label>
              <Input
                id="sp-phone"
                value={createForm.phone}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-tax">CUIT / ID fiscal</Label>
              <Input
                id="sp-tax"
                value={createForm.taxId}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, taxId: e.target.value }))
                }
                className="bg-background"
                placeholder="Opcional — completa la razón social automáticamente"
              />
              {createPadron.busy ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Consultando padrón…
                </p>
              ) : createPadron.error ? (
                <p className="text-xs text-destructive">{createPadron.error}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-notes">Notas</Label>
              <Textarea
                id="sp-notes"
                rows={3}
                value={createForm.notes}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-background"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createSaving}>
                {createSaving ? "Guardando…" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editRow !== null} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,640px)] overflow-y-auto border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
          </DialogHeader>
          {editBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {editBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitEdit(e)}>
            <div className="space-y-2">
              <Label htmlFor="e-sp-name">Nombre</Label>
              <Input
                id="e-sp-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-sp-email">Email</Label>
              <Input
                id="e-sp-email"
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-sp-phone">Teléfono</Label>
              <Input
                id="e-sp-phone"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-sp-tax">CUIT / ID fiscal</Label>
              <Input
                id="e-sp-tax"
                value={editForm.taxId}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, taxId: e.target.value }))
                }
                className="bg-background"
                placeholder="Opcional — completa la razón social automáticamente"
              />
              {editPadron.busy ? (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  Consultando padrón…
                </p>
              ) : editPadron.error ? (
                <p className="text-xs text-destructive">{editPadron.error}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-sp-notes">Notas</Label>
              <Textarea
                id="e-sp-notes"
                rows={3}
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="bg-background"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setEditRow(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteRow !== null} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>¿Eliminar proveedor?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se va a quitar{" "}
            <strong className="text-foreground">
              {deleteRow?.name || "este proveedor"}
            </strong>{" "}
            de este punto de venta.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteRow(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteBusy}
              onClick={() => void submitDelete()}
            >
              {deleteBusy ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(SuppliersPage)
