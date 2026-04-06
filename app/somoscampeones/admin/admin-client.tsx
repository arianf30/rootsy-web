"use client"

import { saveRootsyConfiguration, type RootsyAdminConfigView } from "./actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import withAuth from "@/hoc/withAuth"
import { useActionState } from "react"

const initialSaveState = { ok: false, message: "" }

function formatCuitDisplay(cuit: string | null): string {
  if (!cuit || cuit.length !== 11) return ""
  return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
}

function AdminRootsyFormInner({ initial }: { initial: RootsyAdminConfigView }) {
  const [state, formAction, pending] = useActionState(
    saveRootsyConfiguration,
    initialSaveState,
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-12">
        <Card className="border-border bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Configuración global Rootsy</CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
              CUIT y certificados ARCA padrón (.crt y .key) para consultas desde el
              servidor. Los archivos se guardan en un bucket privado de Supabase; solo
              el backend (con clave de servicio) puede leerlos, no el navegador con la
              anon key.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-5">
              {initial.updatedAt ? (
                <p className="text-sm text-muted-foreground">
                  Última actualización:{" "}
                  {new Date(initial.updatedAt).toLocaleString("es-AR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              ) : null}
              <div className="flex flex-col gap-2">
                <Label htmlFor="afipCuit">CUIT (representado)</Label>
                <Input
                  id="afipCuit"
                  name="afipCuit"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="20-12345678-9"
                  defaultValue={formatCuitDisplay(initial.afipCuit)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="arcaCrt">Certificado público (.crt)</Label>
                <Input
                  id="arcaCrt"
                  name="arcaCrt"
                  type="file"
                  accept=".crt,.pem,text/plain,application/x-pem-file,application/pkix-cert"
                />
                <p className="text-xs text-muted-foreground">
                  Estado:{" "}
                  {initial.hasArcaCrt
                    ? "archivo cargado (dejá vacío para no reemplazarlo)"
                    : "sin archivo"}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="arcaKey">Clave privada (.key)</Label>
                <Input
                  id="arcaKey"
                  name="arcaKey"
                  type="file"
                  accept=".key,.pem,text/plain,application/x-pem-file"
                />
                <p className="text-xs text-muted-foreground">
                  Estado:{" "}
                  {initial.hasArcaKey
                    ? "archivo cargado (dejá vacío para no reemplazarlo)"
                    : "sin archivo"}
                </p>
              </div>
              {state.message ? (
                <p
                  className={
                    state.ok ? "text-sm text-meadow" : "text-sm text-destructive"
                  }
                  role={state.ok ? "status" : "alert"}
                >
                  {state.message}
                </p>
              ) : null}
              <Button type="submit" disabled={pending} className="w-full sm:w-auto">
                {pending ? "Guardando…" : "Guardar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const AdminRootsyForm = withAuth(AdminRootsyFormInner)
export default AdminRootsyForm
