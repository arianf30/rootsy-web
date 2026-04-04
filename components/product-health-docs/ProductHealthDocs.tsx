import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowDown, ArrowRight } from "lucide-react"

export function ProductHealthShell({
  backHref,
  backLabel,
  children,
}: {
  backHref: string
  backLabel: string
  children: ReactNode
}) {
  return (
    <div
      className="min-h-screen w-full text-slate-900 antialiased scheme-light"
      style={{
        background:
          "linear-gradient(165deg, #f6faf8 0%, #eef6f2 38%, #f0f2fa 100%)",
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.3]"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 80, 60, 0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 80, 60, 0.035) 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative w-full px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="w-full border-b border-slate-200/80 pb-6">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">
              ←
            </span>
            {backLabel}
          </Link>
        </div>
        {children}
      </div>
    </div>
  )
}

export function InsightGrid({
  items,
}: {
  items: { icon: ReactNode; title: string; body: string }[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-xl border border-slate-200/90 bg-white/85 p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 text-emerald-800">
            {item.icon}
            <span className="text-xs font-bold uppercase tracking-wide text-slate-600">
              {item.title}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.body}</p>
        </div>
      ))}
    </div>
  )
}

export function FlowNode({
  icon,
  label,
  detail,
  variant = "default",
}: {
  icon: ReactNode
  label: string
  detail: string
  variant?: "default" | "muted" | "ok" | "err"
}) {
  const ring =
    variant === "ok"
      ? "border-emerald-300/70 bg-emerald-50/50"
      : variant === "err"
        ? "border-rose-200/80 bg-rose-50/40"
        : variant === "muted"
          ? "border-slate-200/80 bg-slate-50/60"
          : "border-slate-200/90 bg-white/90"
  return (
    <div
      className={`flex min-h-[5.5rem] flex-1 flex-col justify-center rounded-xl border-2 px-4 py-3 shadow-sm ${ring}`}
    >
      <div className="flex items-center gap-2 text-slate-800">
        <span className="text-emerald-700">{icon}</span>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <p className="mt-1.5 text-xs leading-snug text-slate-600">{detail}</p>
    </div>
  )
}

export function FlowConnector() {
  return (
    <>
      <div
        className="flex shrink-0 justify-center py-2 text-emerald-600/90 lg:hidden"
        aria-hidden
      >
        <ArrowDown className="size-6" strokeWidth={2.25} />
      </div>
      <div
        className="hidden shrink-0 items-center px-2 text-emerald-600/90 lg:flex"
        aria-hidden
      >
        <ArrowRight className="size-7" strokeWidth={2.25} />
      </div>
    </>
  )
}

export function FlowRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col items-stretch justify-center lg:flex-row lg:items-center">
      {children}
    </div>
  )
}

export type ProductHealthTableRow = [string, string, string, string]

export function ProductHealthCompactTable({ rows }: { rows: ProductHealthTableRow[] }) {
  return (
    <section className="mt-16 border-t border-slate-200/80 pt-12">
      <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
        Vista compacta
      </h3>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/90 bg-white/90 shadow-sm">
        <table className="w-full min-w-[600px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wide text-slate-600">
              <th className="px-4 py-3">Momento</th>
              <th className="px-4 py-3">Tu app / infra</th>
              <th className="px-4 py-3">Auth Supabase</th>
              <th className="px-4 py-3">Datos del negocio (RLS)</th>
            </tr>
          </thead>
          <tbody className="text-slate-700">
            {rows.map(([a, b, c, d], i) => (
              <tr
                key={i}
                className={
                  i < rows.length - 1 ? "border-b border-slate-100" : undefined
                }
              >
                <td className="px-4 py-3 font-medium text-slate-900">{a}</td>
                <td className="px-4 py-3">{b}</td>
                <td className="px-4 py-3">{c}</td>
                <td className="px-4 py-3">{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
