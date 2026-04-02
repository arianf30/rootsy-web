"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export type OfficeTheme = "light" | "dark"

const STORAGE_KEY = "rootsy-office-theme"

type AppearanceContextValue = {
  isOffice: boolean
  officeTheme: OfficeTheme
  setOfficeTheme: (theme: OfficeTheme) => void
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null)

export function useOfficeAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error(
      "useOfficeAppearance debe usarse dentro de AppAppearanceShell",
    )
  }
  return ctx
}

export function AppAppearanceShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isOffice = pathname?.startsWith("/office") ?? false

  const [officeTheme, setOfficeThemeState] = useState<OfficeTheme>("dark")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === "light" || raw === "dark") {
      setOfficeThemeState(raw)
    }
    setReady(true)
  }, [])

  const setOfficeTheme = useCallback((theme: OfficeTheme) => {
    setOfficeThemeState(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [])

  const useDarkChrome = !isOffice || officeTheme === "dark"
  const shellClass = !ready || useDarkChrome ? "dark" : ""

  const value = useMemo(
    () => ({ isOffice, officeTheme, setOfficeTheme }),
    [isOffice, officeTheme, setOfficeTheme],
  )

  return (
    <AppearanceContext.Provider value={value}>
      <div
        className={cn(
          shellClass,
          "min-h-screen bg-background text-foreground antialiased",
        )}
      >
        {children}
      </div>
    </AppearanceContext.Provider>
  )
}
