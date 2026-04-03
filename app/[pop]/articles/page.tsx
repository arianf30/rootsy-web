"use client"

import {
  createPopArticle,
  createPopCategory,
  deletePopArticle,
  deletePopCategory,
  getPopArticleCategories,
  getPopArticlesTable,
  updatePopArticle,
  updatePopCategory,
  type ArticleCategoryOption,
  type ArticleTableRow,
} from "@/app/[pop]/articles/actions"
import { ARTICLE_DELETE_CONFIRM_PHRASE } from "@/app/[pop]/articles/articleConstants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Leaf,
  Maximize2,
  Minimize2,
  MoreVertical,
  Package,
  Plus,
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

function formatMoney(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n)
}

function ArticlesPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const popId = params?.pop as string | undefined

  const [popName, setPopName] = useState("")
  const [articles, setArticles] = useState<ArticleTableRow[]>([])
  const [canCreate, setCanCreate] = useState(false)
  const [canUpdate, setCanUpdate] = useState(false)
  const [canDelete, setCanDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editRow, setEditRow] = useState<ArticleTableRow | null>(null)
  const [editCategories, setEditCategories] = useState<ArticleCategoryOption[]>(
    [],
  )
  const [editLoading, setEditLoading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    salePrice: "",
    iva: "",
    categoryId: "",
    isActive: true,
  })
  const [editBanner, setEditBanner] = useState<string | null>(null)

  const [deleteRow, setDeleteRow] = useState<ArticleTableRow | null>(null)
  const [deleteTyped, setDeleteTyped] = useState("")
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteBanner, setDeleteBanner] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createCategories, setCreateCategories] = useState<
    ArticleCategoryOption[]
  >([])
  const [createCatLoading, setCreateCatLoading] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createBanner, setCreateBanner] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    salePrice: "0",
    iva: "21",
    categoryId: "",
    isActive: true,
  })

  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [categoriesRows, setCategoriesRows] = useState<ArticleCategoryOption[]>(
    [],
  )
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesBanner, setCategoriesBanner] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategorySaving, setNewCategorySaving] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  )
  const [editingCategoryName, setEditingCategoryName] = useState("")
  const [categorySaveBusy, setCategorySaveBusy] = useState(false)

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const loadArticles = useCallback(async () => {
    if (!popId) return
    const res = await getPopArticlesTable(popId)
    if (!res.success) {
      setError(res.error || "Error al cargar")
      setCanCreate(false)
      setCanUpdate(false)
      setCanDelete(false)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setArticles(res.articles)
    setPopName(res.popName)
    setCanCreate(res.canCreate)
    setCanUpdate(res.canUpdate)
    setCanDelete(res.canDelete)
    setError(null)
  }, [popId])

  useEffect(() => {
    if (!popId) {
      setLoading(false)
      setError("ID de POP no encontrado")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await loadArticles()
      } catch {
        if (!cancelled) setError("Error inesperado")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId, loadArticles])

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

  const openEdit = async (row: ArticleTableRow) => {
    if (!popId) return
    setEditBanner(null)
    setEditRow(row)
    setEditForm({
      name: row.name,
      description: row.description,
      salePrice: String(row.salePrice),
      iva: String(row.iva),
      categoryId: row.categoryId,
      isActive: row.isActive,
    })
    setEditLoading(true)
    const catRes = await getPopArticleCategories(popId)
    setEditLoading(false)
    if (catRes.success) {
      setEditCategories(catRes.categories)
    } else {
      setEditBanner(catRes.error)
      setEditCategories([])
    }
  }

  const closeEdit = () => {
    setEditRow(null)
    setEditBanner(null)
  }

  const loadModalCategories = useCallback(async () => {
    if (!popId) return
    setCategoriesLoading(true)
    setCategoriesBanner(null)
    const res = await getPopArticleCategories(popId)
    setCategoriesLoading(false)
    if (res.success) {
      setCategoriesRows(res.categories)
    } else {
      setCategoriesBanner(res.error)
      setCategoriesRows([])
    }
  }, [popId])

  const openCreate = async () => {
    if (!popId) return
    setCreateBanner(null)
    setCreateForm({
      name: "",
      description: "",
      salePrice: "0",
      iva: "21",
      categoryId: "",
      isActive: true,
    })
    setCreateCatLoading(true)
    const catRes = await getPopArticleCategories(popId)
    setCreateCatLoading(false)
    if (catRes.success) {
      setCreateCategories(catRes.categories)
    } else {
      setCreateBanner(catRes.error)
      setCreateCategories([])
    }
    setCreateOpen(true)
  }

  const closeCreate = () => {
    setCreateOpen(false)
    setCreateBanner(null)
  }

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId) return
    setCreateSaving(true)
    setCreateBanner(null)
    const res = await createPopArticle(popId, {
      name: createForm.name,
      description: createForm.description,
      salePrice: Number(createForm.salePrice),
      iva: Number(createForm.iva),
      categoryId: createForm.categoryId,
      isActive: createForm.isActive,
    })
    setCreateSaving(false)
    if (!res.success) {
      setCreateBanner(res.error)
      return
    }
    closeCreate()
    await loadArticles()
  }

  const submitNewCategory = async () => {
    if (!popId || !newCategoryName.trim()) return
    setNewCategorySaving(true)
    setCategoriesBanner(null)
    const res = await createPopCategory(popId, newCategoryName)
    setNewCategorySaving(false)
    if (!res.success) {
      setCategoriesBanner(res.error)
      return
    }
    setNewCategoryName("")
    await loadModalCategories()
  }

  const startEditCategory = (c: ArticleCategoryOption) => {
    setEditingCategoryId(c.id)
    setEditingCategoryName(c.name)
    setCategoriesBanner(null)
  }

  const cancelEditCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryName("")
  }

  const saveEditCategory = async () => {
    if (!popId || !editingCategoryId) return
    setCategorySaveBusy(true)
    setCategoriesBanner(null)
    const res = await updatePopCategory(
      popId,
      editingCategoryId,
      editingCategoryName,
    )
    setCategorySaveBusy(false)
    if (!res.success) {
      setCategoriesBanner(res.error)
      return
    }
    cancelEditCategory()
    await loadModalCategories()
  }

  const removeCategory = async (id: string, label: string) => {
    if (!popId) return
    if (
      !window.confirm(
        `¿Eliminar la categoría "${label}"? Los artículos que la usen pueden fallar si la base no lo permite.`,
      )
    ) {
      return
    }
    setCategoriesBanner(null)
    const res = await deletePopCategory(popId, id)
    if (!res.success) {
      setCategoriesBanner(res.error)
      return
    }
    await loadModalCategories()
  }

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !editRow) return
    setEditSaving(true)
    setEditBanner(null)
    const res = await updatePopArticle(popId, editRow.id, {
      name: editForm.name,
      description: editForm.description,
      salePrice: Number(editForm.salePrice),
      iva: Number(editForm.iva),
      categoryId: editForm.categoryId,
      isActive: editForm.isActive,
    })
    setEditSaving(false)
    if (!res.success) {
      setEditBanner(res.error)
      return
    }
    closeEdit()
    await loadArticles()
  }

  const openDelete = (row: ArticleTableRow) => {
    setDeleteBanner(null)
    setDeleteTyped("")
    setDeleteRow(row)
  }

  const closeDelete = () => {
    setDeleteRow(null)
    setDeleteTyped("")
    setDeleteBanner(null)
  }

  const submitDelete = async () => {
    if (!popId || !deleteRow) return
    setDeleteBusy(true)
    setDeleteBanner(null)
    const res = await deletePopArticle(popId, deleteRow.id, deleteTyped)
    setDeleteBusy(false)
    if (!res.success) {
      setDeleteBanner(res.error)
      return
    }
    closeDelete()
    await loadArticles()
  }

  const emptyCols = canUpdate || canDelete ? 7 : 6

  const headerUserName = useMemo(() => {
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "Usuario"
  }, [user?.email, user?.user_metadata?.full_name])

  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=e8f5ef`

  if (!popId) {
    return (
      <div className="rootsy-app-light min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">ID de POP no encontrado</p>
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
                href={`/${popId}/menu`}
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
                  <Package className="size-5" aria-hidden />
                </span>
                Artículos
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
                  onClick={() => void openCreate()}
                >
                  <Plus className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Nuevo artículo</span>
                </Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Más opciones"
                  >
                    <MoreVertical className="size-4.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="border-border bg-card"
                >
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => {
                      setCategoriesOpen(true)
                      void loadModalCategories()
                    }}
                  >
                    Categorías
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {headerUserName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />
                </div>
                <div className="hidden min-w-0 flex-col leading-tight sm:flex">
                  <span className="truncate text-sm font-semibold text-foreground/90">
                    {headerUserName}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-meadow">
                    <Leaf className="size-3" aria-hidden />
                    Catálogo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando artículos…</p>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Inventario del punto de venta
                  </h2>
                  <p className="max-w-xl text-sm text-muted-foreground">
                    Listado de artículos con precio, IVA y categoría. Los cambios
                    respetan tus permisos y las políticas RLS en Supabase.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-muted px-3 py-1 font-medium text-foreground/80">
                    {articles.length}{" "}
                    {articles.length === 1 ? "artículo" : "artículos"}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-md shadow-primary/5 backdrop-blur-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                      <TableHead className="font-semibold text-foreground">
                        Nombre
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Categoría
                      </TableHead>
                      <TableHead className="text-right font-semibold text-foreground">
                        Precio
                      </TableHead>
                      <TableHead className="text-right font-semibold text-foreground">
                        IVA %
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Estado
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Descripción
                      </TableHead>
                      {canUpdate || canDelete ? (
                        <TableHead className="text-right font-semibold text-foreground">
                          Acciones
                        </TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={emptyCols}
                          className="py-12 text-center text-muted-foreground"
                        >
                          No hay artículos o no tenés permiso de lectura según
                          las políticas del servidor.
                        </TableCell>
                      </TableRow>
                    ) : (
                      articles.map((a) => (
                        <TableRow
                          key={a.id}
                          className="border-border/80 hover:bg-muted/30"
                        >
                          <TableCell className="font-medium text-foreground">
                            {a.name || "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {a.categoryName}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-foreground">
                            {formatMoney(a.salePrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-muted-foreground">
                            {a.iva}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "font-normal",
                                a.isActive
                                  ? "border-primary/25 bg-primary/10 text-forest"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {a.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="max-w-[200px] truncate text-muted-foreground"
                            title={a.description}
                          >
                            {a.description || "—"}
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
                                    onClick={() => void openEdit(a)}
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
                                    onClick={() => openDelete(a)}
                                  >
                                    Borrar
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

      <Dialog open={editRow !== null} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,640px)] overflow-y-auto border-border bg-card sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Editar artículo</DialogTitle>
          </DialogHeader>
          {editBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {editBanner}
            </p>
          ) : null}
          {editLoading ? (
            <p className="text-sm text-muted-foreground">
              Cargando categorías…
            </p>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void submitEdit(e)}>
              <div className="space-y-2">
                <Label htmlFor="art-name">Nombre</Label>
                <Input
                  id="art-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="art-desc">Descripción</Label>
                <Textarea
                  id="art-desc"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="art-cat">Categoría</Label>
                <select
                  id="art-cat"
                  value={editForm.categoryId}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Elegir…</option>
                  {editCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="art-price">Precio</Label>
                  <Input
                    id="art-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.salePrice}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, salePrice: e.target.value }))
                    }
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="art-iva">IVA %</Label>
                  <Input
                    id="art-iva"
                    type="number"
                    min={0}
                    step="1"
                    value={editForm.iva}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, iva: e.target.value }))
                    }
                    required
                    className="bg-background"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, isActive: e.target.checked }))
                  }
                  className="size-4 rounded border-input"
                />
                Activo
              </label>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeEdit}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={editSaving}>
                  {editSaving ? "Guardando…" : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteRow !== null} onOpenChange={(o) => !o && closeDelete()}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="border-border bg-card sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>¿Eliminar artículo?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Vas a borrar{" "}
            <strong className="text-foreground">
              {deleteRow?.name || "este artículo"}
            </strong>
            . Esta acción no se puede deshacer desde acá.
          </p>
          <p className="text-sm text-muted-foreground">
            Para confirmar, escribí{" "}
            <strong className="text-foreground">
              {ARTICLE_DELETE_CONFIRM_PHRASE}
            </strong>{" "}
            abajo.
          </p>
          {deleteBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {deleteBanner}
            </p>
          ) : null}
          <Input
            autoComplete="off"
            value={deleteTyped}
            onChange={(e) => setDeleteTyped(e.target.value)}
            placeholder={ARTICLE_DELETE_CONFIRM_PHRASE}
            className="bg-background"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={closeDelete}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                deleteBusy ||
                deleteTyped.trim() !== ARTICLE_DELETE_CONFIRM_PHRASE
              }
              onClick={() => void submitDelete()}
            >
              {deleteBusy ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(o) => !o && closeCreate()}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,640px)] overflow-y-auto border-border bg-card sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Nuevo artículo</DialogTitle>
          </DialogHeader>
          {createBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {createBanner}
            </p>
          ) : null}
          {createCatLoading ? (
            <p className="text-sm text-muted-foreground">
              Cargando categorías…
            </p>
          ) : (
            <form className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
              <div className="space-y-2">
                <Label htmlFor="create-art-name">Nombre</Label>
                <Input
                  id="create-art-name"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-art-desc">Descripción</Label>
                <Textarea
                  id="create-art-desc"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-art-cat">Categoría</Label>
                <select
                  id="create-art-cat"
                  value={createForm.categoryId}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      categoryId: e.target.value,
                    }))
                  }
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Elegir…</option>
                  {createCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="create-art-price">Precio</Label>
                  <Input
                    id="create-art-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={createForm.salePrice}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        salePrice: e.target.value,
                      }))
                    }
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-art-iva">IVA %</Label>
                  <Input
                    id="create-art-iva"
                    type="number"
                    min={0}
                    step="1"
                    value={createForm.iva}
                    onChange={(e) =>
                      setCreateForm((f) => ({ ...f, iva: e.target.value }))
                    }
                    required
                    className="bg-background"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createForm.isActive}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      isActive: e.target.checked,
                    }))
                  }
                  className="size-4 rounded border-input"
                />
                Activo
              </label>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={closeCreate}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createSaving}>
                  {createSaving ? "Creando…" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={categoriesOpen}
        onOpenChange={(o) => {
          setCategoriesOpen(o)
          if (!o) {
            setCategoriesBanner(null)
            cancelEditCategory()
            setNewCategoryName("")
          }
        }}
      >
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="max-h-[min(90vh,560px)] overflow-y-auto border-border bg-card sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle>Categorías</DialogTitle>
          </DialogHeader>
          {categoriesBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {categoriesBanner}
            </p>
          ) : null}
          {canCreate ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="new-cat-name">Nueva categoría</Label>
                <Input
                  id="new-cat-name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre"
                  className="bg-background"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      void submitNewCategory()
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                disabled={newCategorySaving || !newCategoryName.trim()}
                onClick={() => void submitNewCategory()}
              >
                {newCategorySaving ? "Agregando…" : "Agregar"}
              </Button>
            </div>
          ) : null}
          {categoriesLoading ? (
            <p className="text-sm text-muted-foreground">
              Cargando categorías…
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-foreground">
                      Nombre
                    </TableHead>
                    {canUpdate || canDelete ? (
                      <TableHead className="text-right font-semibold text-foreground">
                        Acciones
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriesRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={canUpdate || canDelete ? 2 : 1}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No hay categorías cargadas.
                      </TableCell>
                    </TableRow>
                  ) : (
                    categoriesRows.map((c) => (
                      <TableRow key={c.id} className="border-border/80">
                        <TableCell className="font-medium text-foreground">
                          {editingCategoryId === c.id ? (
                            <Input
                              value={editingCategoryName}
                              onChange={(e) =>
                                setEditingCategoryName(e.target.value)
                              }
                              className="bg-background"
                              autoFocus
                            />
                          ) : (
                            c.name || "—"
                          )}
                        </TableCell>
                        {canUpdate || canDelete ? (
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {editingCategoryId === c.id ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditCategory}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    disabled={
                                      categorySaveBusy ||
                                      !editingCategoryName.trim()
                                    }
                                    onClick={() => void saveEditCategory()}
                                  >
                                    {categorySaveBusy ? "Guardando…" : "Guardar"}
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {canUpdate ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-primary hover:bg-primary/10 hover:text-forest"
                                      onClick={() => startEditCategory(c)}
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
                                      onClick={() =>
                                        void removeCategory(c.id, c.name)
                                      }
                                    >
                                      Eliminar
                                    </Button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(ArticlesPage)
