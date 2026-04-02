"use client"

import { useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContextSupabase"
import { Spinner } from "@/components/ui/spinner"

const HOME_PATH = "/home"

export function withGuestAuth<P extends object>(Component: ComponentType<P>) {
  function WithGuestGuard(props: P) {
    const { user, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (loading || !user) return
      router.replace(HOME_PATH)
    }, [user, loading, router])

    if (loading) {
      return (
        <div
          className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-background text-foreground"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Spinner className="size-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando sesión…</span>
        </div>
      )
    }

    if (user) {
      return null
    }

    return <Component {...props} />
  }

  WithGuestGuard.displayName = `withGuestAuth(${Component.displayName ?? Component.name ?? "Page"})`
  return WithGuestGuard
}
