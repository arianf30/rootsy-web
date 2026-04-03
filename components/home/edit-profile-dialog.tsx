"use client"

import * as React from "react"
import { ImagePlus, X } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FORM_CONTROL_MD, FORM_LABEL_UPPER } from "@/lib/form-controls"
import { cn } from "@/lib/utils"

const PROFILE_DIALOG_SURFACE = cn(
  "gap-0 overflow-hidden rounded-2xl border border-border/60 bg-card p-0 shadow-2xl ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
  "sm:max-w-[min(42rem,calc(100%-2rem))] w-full",
)

const PROFILE_PRIMARY_BTN =
  "h-11 rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700"

const PROFILE_GHOST_BTN =
  "h-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"

const PROVINCIAS = [
  { value: "chaco", label: "Chaco" },
  { value: "formosa", label: "Formosa" },
  { value: "corrientes", label: "Corrientes" },
  { value: "cba", label: "Córdoba" },
  { value: "sfe", label: "Santa Fe" },
] as const

const LOCALIDADES: Record<string, { value: string; label: string }[]> = {
  chaco: [
    { value: "resistencia", label: "Resistencia" },
    { value: "charata", label: "Charata" },
    { value: "presidencia", label: "Presidencia Roque Sáenz Peña" },
  ],
  formosa: [
    { value: "formosa-capital", label: "Formosa" },
    { value: "clorinda", label: "Clorinda" },
  ],
  corrientes: [
    { value: "corrientes-capital", label: "Corrientes" },
    { value: "goya", label: "Goya" },
  ],
  cba: [
    { value: "cba-capital", label: "Córdoba" },
    { value: "villa-maria", label: "Villa María" },
  ],
  sfe: [
    { value: "rosario", label: "Rosario" },
    { value: "sfe-capital", label: "Santa Fe" },
  ],
}

export type EditProfileDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditProfileDialog({ open, onOpenChange }: EditProfileDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [nombre, setNombre] = React.useState("Francisco")
  const [apellido, setApellido] = React.useState("Ruiz")
  const [email] = React.useState("francisco.ruiz@ejemplo.com")
  const [celular, setCelular] = React.useState("")
  const [provincia, setProvincia] = React.useState("chaco")
  const [localidad, setLocalidad] = React.useState("resistencia")
  const [domicilio, setDomicilio] = React.useState("Av. Vélez Sarsfield 747")

  React.useEffect(() => {
    const list = LOCALIDADES[provincia] ?? LOCALIDADES.chaco
    setLocalidad(list[0]?.value ?? "resistencia")
  }, [provincia])

  const localidades = LOCALIDADES[provincia] ?? LOCALIDADES.chaco

  const handleGuardar = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          PROFILE_DIALOG_SURFACE,
          "text-foreground",
        )}
        aria-describedby="edit-profile-desc"
      >
        <DialogHeader className="relative space-y-0 border-b border-white/10 bg-linear-to-r from-emerald-600 to-teal-600 px-5 pb-4 pt-5 text-left sm:px-6">
          <div className="flex items-start justify-between gap-3 pr-1">
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight text-white">
                Mi perfil
              </DialogTitle>
              <p className="mt-1 text-sm text-white/85">
                Datos de tu cuenta en Rootsy
              </p>
            </div>
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-xl text-white hover:bg-white/15 hover:text-white"
                aria-label="Cerrar"
              >
                <X className="size-5" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        <DialogDescription id="edit-profile-desc" className="sr-only">
          Formulario para editar nombre, contacto y domicilio. Los cambios son
          de demostración.
        </DialogDescription>

        <div className="max-h-[min(70vh,32rem)] overflow-y-auto">
          <div className="flex flex-col gap-4 border-b border-border/50 bg-muted/20 px-5 py-5 sm:flex-row sm:items-start sm:gap-6 sm:px-6">
            <Avatar className="size-20 shrink-0 ring-2 ring-border/60 sm:size-24">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=francisco" />
              <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                FR
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold tracking-tight sm:text-xl">
                {nombre} {apellido}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {email}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-hidden
                tabIndex={-1}
              />
              <button
                type="button"
                className="mt-2.5 inline-flex max-w-full items-center gap-2 p-0 text-left text-sm font-medium text-primary transition-colors hover:text-emerald-500 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none dark:hover:text-emerald-400 dark:focus-visible:ring-offset-card"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="size-4 shrink-0" aria-hidden />
                Cambiar foto
              </button>
            </div>
          </div>

          <div className="space-y-6 px-5 py-6 sm:px-6">
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="perfil-nombre" className={FORM_LABEL_UPPER}>
                  Nombre
                </Label>
                <Input
                  id="perfil-nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="given-name"
                  className={FORM_CONTROL_MD}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-apellido" className={FORM_LABEL_UPPER}>
                  Apellido
                </Label>
                <Input
                  id="perfil-apellido"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  autoComplete="family-name"
                  className={FORM_CONTROL_MD}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-celular" className={FORM_LABEL_UPPER}>
                  Celular
                </Label>
                <Input
                  id="perfil-celular"
                  value={celular}
                  onChange={(e) => setCelular(e.target.value)}
                  inputMode="tel"
                  placeholder="Ej. 3624408476"
                  autoComplete="tel"
                  className={FORM_CONTROL_MD}
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="perfil-provincia" className={FORM_LABEL_UPPER}>
                  Provincia
                </Label>
                <Select
                  value={provincia}
                  onValueChange={(v) => {
                    setProvincia(v)
                    const next = LOCALIDADES[v]?.[0]?.value
                    if (next) setLocalidad(next)
                  }}
                >
                  <SelectTrigger
                    id="perfil-provincia"
                    size="md"
                    className={FORM_CONTROL_MD}
                  >
                    <SelectValue placeholder="Elegí provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCIAS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil-localidad" className={FORM_LABEL_UPPER}>
                  Localidad
                </Label>
                <Select value={localidad} onValueChange={setLocalidad}>
                  <SelectTrigger
                    id="perfil-localidad"
                    size="md"
                    className={FORM_CONTROL_MD}
                  >
                    <SelectValue placeholder="Elegí localidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {localidades.map((l) => (
                      <SelectItem key={l.value} value={l.value}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="perfil-domicilio" className={FORM_LABEL_UPPER}>
                  Domicilio
                </Label>
                <Input
                  id="perfil-domicilio"
                  value={domicilio}
                  onChange={(e) => setDomicilio(e.target.value)}
                  autoComplete="street-address"
                  className={FORM_CONTROL_MD}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/50 bg-muted/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <DialogClose asChild>
            <Button type="button" variant="ghost" className={PROFILE_GHOST_BTN}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            className={cn(PROFILE_PRIMARY_BTN, "w-full sm:w-auto")}
            onClick={handleGuardar}
          >
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
