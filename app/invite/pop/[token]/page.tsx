"use client"

import { acceptPopInvitation } from "@/app/invite/pop/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/context/AuthContextSupabase"
import withAuth from "@/hoc/withAuth"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"

function InvitePopPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const token = typeof params?.token === "string" ? params.token : ""
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onAccept = async () => {
    if (!token) {
      setErr("Enlace inválido.")
      return
    }
    setBusy(true)
    setErr(null)
    const res = await acceptPopInvitation(token)
    setBusy(false)
    if (!res.success) {
      setErr(res.error)
      return
    }
    setMsg("Listo. Ya tenés acceso al punto de venta.")
    setTimeout(() => {
      router.push(`/${res.popId}/menu`)
    }, 900)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-6 py-12">
        <Card className="border-border bg-card/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Invitación</CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
              El enlace solo funciona si iniciás sesión con el mismo correo al que
              se envió la invitación: el servidor rechaza cualquier otra cuenta,
              aunque tenga el link.
            </CardDescription>
            {user?.email ? (
              <p className="text-sm text-foreground/70 pt-1">
                Sesión actual: {user.email}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {err ? (
              <p className="text-sm text-destructive" role="alert">
                {err}
              </p>
            ) : null}
            {msg ? (
              <p className="text-sm text-meadow" role="status">
                {msg}
              </p>
            ) : null}
            <Button
              type="button"
              onClick={() => void onAccept()}
              disabled={busy || !token}
              className="w-full sm:w-auto"
            >
              {busy ? "Procesando…" : "Aceptar invitación"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withAuth(InvitePopPage)
