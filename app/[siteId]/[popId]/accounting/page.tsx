"use client"

import {
  createChartAccount,
  getAccountingPageData,
  type AccountType,
  type ChartAccountRow,
  type CreateChartAccountInput,
} from "@/app/[siteId]/[popId]/accounting/actions"
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
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import {
  breadcrumbForAccountRow,
  breadcrumbForCodePrefix,
  codePrefixForLeafGroup,
} from "@/lib/accountingPlanGroupLabels"
import { popMenuHref } from "@/lib/popRoutes"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  BookMarked,
  FileSpreadsheet,
  Landmark,
  Leaf,
  Maximize2,
  Minimize2,
  Plus,
  ScrollText,
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

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "activo_corriente", label: "Current assets" },
  { value: "activo_no_corriente", label: "Non-current assets" },
  { value: "pasivo_corriente", label: "Current liabilities" },
  { value: "pasivo_no_corriente", label: "Non-current liabilities" },
  { value: "patrimonio_neto", label: "Equity" },
  { value: "ingresos", label: "Revenue" },
  { value: "costos", label: "Cost of sales" },
  { value: "gastos", label: "Expenses" },
]

function defaultCreateForm(): CreateChartAccountInput {
  return {
    code: "",
    name: "",
    accountType: "gastos",
    nature: "deudora",
    level: 4,
    isMovementAccount: true,
  }
}

function formatAccountType(t: AccountType): string {
  return ACCOUNT_TYPES.find((o) => o.value === t)?.label ?? t
}

function compareAccountsByCode(a: ChartAccountRow, b: ChartAccountRow): number {
  return a.code.localeCompare(b.code, undefined, { numeric: true })
}

type AccountSection = {
  key: string
  title: string
  subtitle?: string
  rows: ChartAccountRow[]
}

function buildAccountSections(accounts: ChartAccountRow[]): AccountSection[] {
  if (accounts.length === 0) return []
  const idByRow = new Map(accounts.map((a) => [a.id, a]))
  const childrenByParent = new Map<string, ChartAccountRow[]>()
  for (const a of accounts) {
    if (a.parentId) {
      const list = childrenByParent.get(a.parentId) ?? []
      list.push(a)
      childrenByParent.set(a.parentId, list)
    }
  }
  for (const list of childrenByParent.values()) {
    list.sort(compareAccountsByCode)
  }
  const sections: AccountSection[] = []
  const parentIdsOrdered = [...childrenByParent.keys()].sort((a, b) => {
    const pa = idByRow.get(a)
    const pb = idByRow.get(b)
    if (!pa && !pb) return 0
    if (!pa) return 1
    if (!pb) return -1
    return compareAccountsByCode(pa, pb)
  })
  for (const pid of parentIdsOrdered) {
    const parent = idByRow.get(pid)
    const children = childrenByParent.get(pid) ?? []
    sections.push({
      key: `db-parent-${pid}`,
      title: parent
        ? breadcrumbForCodePrefix(parent.code)
        : "Padre no encontrado en el plan",
      subtitle: parent
        ? undefined
        : "Hay subcuentas que referencian un padre que no está en este listado.",
      rows: children,
    })
  }
  const rootsWithDbChildren = new Set(childrenByParent.keys())
  const rootsWithoutDbChildren = accounts.filter(
    (a) => a.parentId == null && !rootsWithDbChildren.has(a.id),
  )
  const prefixGroups = new Map<string, ChartAccountRow[]>()
  const singletonRoots: ChartAccountRow[] = []
  for (const a of rootsWithoutDbChildren) {
    const pfx = codePrefixForLeafGroup(a.code)
    if (pfx) {
      const list = prefixGroups.get(pfx) ?? []
      list.push(a)
      prefixGroups.set(pfx, list)
    } else {
      singletonRoots.push(a)
    }
  }
  for (const list of prefixGroups.values()) {
    list.sort(compareAccountsByCode)
  }
  const prefixKeys = [...prefixGroups.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )
  for (const pfx of prefixKeys) {
    const rows = prefixGroups.get(pfx) ?? []
    sections.push({
      key: `prefix-${pfx}`,
      title: breadcrumbForCodePrefix(pfx),
      subtitle: rows[0]
        ? formatAccountType(rows[0].accountType)
        : undefined,
      rows,
    })
  }
  singletonRoots.sort(compareAccountsByCode)
  for (const a of singletonRoots) {
    sections.push({
      key: `single-${a.id}`,
      title: breadcrumbForAccountRow(a),
      subtitle: formatAccountType(a.accountType),
      rows: [a],
    })
  }
  const orphanRows = accounts.filter(
    (r) => r.parentId != null && !idByRow.has(r.parentId),
  )
  orphanRows.sort(compareAccountsByCode)
  if (orphanRows.length > 0) {
    sections.push({
      key: "orphan-parent-ref",
      title: "Subcuentas con padre ausente",
      subtitle:
        "El parent_id no coincide con ninguna cuenta cargada para este punto de venta.",
      rows: orphanRows,
    })
  }
  return sections
}

function AccountingPage() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const params = useParams()
  const { user } = useAuth()
  const siteId = typeof params?.siteId === "string" ? params.siteId : ""
  const popId = typeof params?.popId === "string" ? params.popId : undefined

  const [popName, setPopName] = useState("")
  const [accounts, setAccounts] = useState<ChartAccountRow[]>([])
  const [canCreate, setCanCreate] = useState(false)
  const [journalEntryCount, setJournalEntryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createSaving, setCreateSaving] = useState(false)
  const [createBanner, setCreateBanner] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState(defaultCreateForm)

  const [journalFrom, setJournalFrom] = useState("")
  const [journalTo, setJournalTo] = useState("")
  const [ledgerFrom, setLedgerFrom] = useState("")
  const [ledgerTo, setLedgerTo] = useState("")
  const [ledgerAccountCode, setLedgerAccountCode] = useState("")

  const [isOnline, setIsOnline] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const accountSections = useMemo(
    () => buildAccountSections(accounts),
    [accounts],
  )

  const load = useCallback(async () => {
    if (!popId || !siteId) return
    const res = await getAccountingPageData(popId)
    if (!res.success) {
      setError(res.error || "Error")
      setAccounts([])
      setCanCreate(false)
      setJournalEntryCount(0)
      if (res.redirect) {
        setTimeout(() => routerRef.current.push(res.redirect!), 1200)
      }
      return
    }
    setPopName(res.popName)
    setAccounts(res.accounts)
    setCanCreate(res.canCreate)
    setJournalEntryCount(res.journalEntryCount)
    setError(null)
  }, [popId, siteId])

  useEffect(() => {
    if (!popId || !siteId) {
      setLoading(false)
      setError("Store ID not found")
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        await load()
      } catch {
        if (!cancelled) setError("Unexpected error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [popId, siteId, load])

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
    setCreateForm(defaultCreateForm())
    setCreateOpen(true)
  }

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!popId || !siteId) return
    setCreateSaving(true)
    setCreateBanner(null)
    const res = await createChartAccount(popId, createForm)
    setCreateSaving(false)
    if (!res.success) {
      setCreateBanner(res.error)
      return
    }
    setCreateOpen(false)
    await load()
  }

  const headerUserName = useMemo(() => {
    const meta = user?.user_metadata?.full_name
    if (typeof meta === "string" && meta.trim()) return meta.trim()
    return user?.email?.split("@")[0] || "User"
  }, [user?.email, user?.user_metadata?.full_name])

  const userAvatarSrc =
    user?.user_metadata?.avatar_url ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || "u")}`

  const popLogoSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(popId || "pop")}&backgroundColor=e8f5ef`

  if (!popId || !siteId) {
    return (
      <div className="rootsy-app-light min-h-screen bg-background p-10 text-foreground">
        <p className="text-sm">Store ID not found</p>
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
                aria-label="Back to menu"
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
                  <Landmark className="size-5" aria-hidden />
                </span>
                Accounting
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
                  <span className="hidden sm:inline">Add account</span>
                </Button>
              ) : null}
              <button
                type="button"
                onClick={() => void toggleFullscreen()}
                className="group inline-flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
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
                    Accounting
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 space-y-10 px-4 py-8 sm:px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Chart of accounts
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Las cuentas existentes son solo lectura. El encabezado de
                    cada caja es la jerarquía en texto (Activo &gt; Activo
                    corriente &gt; …); los códigos completos están en la tabla.
                  </p>
                </div>
                {accounts.length === 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-md shadow-primary/5 backdrop-blur-sm">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-10 text-center text-muted-foreground"
                          >
                            No accounts yet.
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {accountSections.map((section) => (
                      <div
                        key={section.key}
                        className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md shadow-primary/10"
                      >
                        <div className="border-b border-border bg-muted/45 px-4 py-3 sm:px-5">
                          <h3 className="text-sm font-medium leading-relaxed text-foreground sm:text-[0.95rem]">
                            {section.title}
                          </h3>
                          {section.subtitle ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {section.subtitle}
                            </p>
                          ) : null}
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border bg-muted/25 hover:bg-muted/25">
                              <TableHead className="font-semibold">
                                Código
                              </TableHead>
                              <TableHead className="font-semibold">
                                Nombre
                              </TableHead>
                              <TableHead className="font-semibold">
                                Tipo
                              </TableHead>
                              <TableHead className="font-semibold">
                                Naturaleza
                              </TableHead>
                              <TableHead className="text-right font-semibold">
                                Nivel
                              </TableHead>
                              <TableHead className="font-semibold">
                                Movimiento
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {section.rows.map((r) => (
                              <TableRow
                                key={r.id}
                                className="border-border/80 hover:bg-muted/30"
                              >
                                <TableCell className="font-mono text-sm tabular-nums">
                                  {r.code}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {r.name}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatAccountType(r.accountType)}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm capitalize">
                                  {r.nature}
                                </TableCell>
                                <TableCell className="text-right tabular-nums text-muted-foreground">
                                  {r.level}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {r.isMovementAccount ? "Sí" : "No"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Books &amp; reports
                  </h2>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Journal, general ledger, and financial statements will use
                    posted entries. No operations are wired yet; filters are
                    ready for when data exists.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-foreground">
                      <ScrollText className="size-5 text-primary" aria-hidden />
                      <h3 className="font-semibold">Journal (day book)</h3>
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Chronological list of journal entries for a date range.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs">From</Label>
                      <Input
                        type="date"
                        value={journalFrom}
                        onChange={(e) => setJournalFrom(e.target.value)}
                        className="bg-background"
                      />
                      <Label className="text-xs">To</Label>
                      <Input
                        type="date"
                        value={journalTo}
                        onChange={(e) => setJournalTo(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      {journalEntryCount === 0
                        ? "No journal entries in this store yet."
                        : `${journalEntryCount} entr${journalEntryCount === 1 ? "y" : "ies"} total — detailed view coming soon.`}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-foreground">
                      <BookMarked className="size-5 text-primary" aria-hidden />
                      <h3 className="font-semibold">General ledger</h3>
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Movements for one account between two dates.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-xs">Account code</Label>
                      <Input
                        placeholder="e.g. 1.1.1.01"
                        value={ledgerAccountCode}
                        onChange={(e) => setLedgerAccountCode(e.target.value)}
                        className="bg-background font-mono"
                      />
                      <Label className="text-xs">From</Label>
                      <Input
                        type="date"
                        value={ledgerFrom}
                        onChange={(e) => setLedgerFrom(e.target.value)}
                        className="bg-background"
                      />
                      <Label className="text-xs">To</Label>
                      <Input
                        type="date"
                        value={ledgerTo}
                        onChange={(e) => setLedgerTo(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <p className="mt-4 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                      Ledger drill-down will appear once entries are posted from
                      operations.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card/95 p-5 shadow-sm">
                    <div className="mb-3 flex items-center gap-2 text-foreground">
                      <FileSpreadsheet
                        className="size-5 text-primary"
                        aria-hidden
                      />
                      <h3 className="font-semibold">Financial reports</h3>
                    </div>
                    <p className="mb-4 text-sm text-muted-foreground">
                      Statement of financial position, income statement, and
                      trial balance.
                    </p>
                    <ul className="space-y-2 text-sm text-foreground/90">
                      <li className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <span>Balance sheet</span>
                        <span className="text-xs text-muted-foreground">
                          Soon
                        </span>
                      </li>
                      <li className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <span>Income statement</span>
                        <span className="text-xs text-muted-foreground">
                          Soon
                        </span>
                      </li>
                      <li className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                        <span>Trial balance</span>
                        <span className="text-xs text-muted-foreground">
                          Soon
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <DialogContent
          data-rootsy-light-shell="true"
          showCloseButton
          className="border-border bg-card text-foreground sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Add account</DialogTitle>
          </DialogHeader>
          {createBanner ? (
            <p className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {createBanner}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={(e) => void submitCreate(e)}>
            <div className="space-y-2">
              <Label htmlFor="acc-code">Code</Label>
              <Input
                id="acc-code"
                value={createForm.code}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, code: e.target.value }))
                }
                required
                className="bg-background font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-name">Name</Label>
              <Input
                id="acc-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-type">Account type</Label>
              <select
                id="acc-type"
                value={createForm.accountType}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    accountType: e.target.value as AccountType,
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ACCOUNT_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-nature">Nature</Label>
              <select
                id="acc-nature"
                value={createForm.nature}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    nature: e.target.value as CreateChartAccountInput["nature"],
                  }))
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="deudora">Debit nature (deudora)</option>
                <option value="acreedora">Credit nature (acreedora)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="acc-level">Level</Label>
              <Input
                id="acc-level"
                type="number"
                min={1}
                value={createForm.level}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    level: Number(e.target.value),
                  }))
                }
                className="bg-background"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createForm.isMovementAccount}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    isMovementAccount: e.target.checked,
                  }))
                }
                className="size-4 rounded border-input"
              />
              Movement account
            </label>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSaving}>
                {createSaving ? "Saving…" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default withAuth(AccountingPage)
