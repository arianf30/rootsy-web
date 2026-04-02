"use client"

import { Moon, Sun } from "lucide-react"

import { useOfficeAppearance } from "@/components/app-appearance-shell"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function OfficeThemeToggle({ className }: { className?: string }) {
  const { isOffice, officeTheme, setOfficeTheme } = useOfficeAppearance()

  if (!isOffice) {
    return null
  }

  const isDark = officeTheme === "dark"

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-3 py-2",
        className,
      )}
    >
      <Sun
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Switch
          id="office-theme-dark"
          checked={isDark}
          onCheckedChange={(on) => setOfficeTheme(on ? "dark" : "light")}
          aria-label={
            isDark
              ? "Cambiar a modo claro en Office"
              : "Cambiar a modo oscuro en Office"
          }
        />
        <div className="min-w-0">
          <Label
            htmlFor="office-theme-dark"
            className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Tema Office
          </Label>
          <p className="text-xs font-medium text-foreground">
            {isDark ? "Oscuro" : "Claro"}
          </p>
        </div>
      </div>
      <Moon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </div>
  )
}
