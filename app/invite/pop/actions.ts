"use server"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { createClient } from "@/utils/supabase/server"

type AcceptPayload = {
  ok?: boolean
  error?: string
  pop_id?: string
}

export async function acceptPopInvitation(
  token: string,
): Promise<
  { success: true; popId: string } | { success: false; error: string }
> {
  const t = token?.trim()
  if (!t) return { success: false, error: "Token no válido." }

  await requireAuthenticatedUser()

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("accept_pop_invitation", {
    p_token: t,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  const payload = data as AcceptPayload | null
  if (!payload?.ok) {
    const code = payload?.error ?? "unknown"
    const messages: Record<string, string> = {
      not_authenticated: "Tenés que iniciar sesión.",
      no_email: "Tu cuenta no tiene correo asociado en Auth.",
      not_found: "Invitación no encontrada, vencida o ya utilizada.",
      wrong_email:
        "Esta invitación fue enviada a otro correo. Iniciá sesión con la cuenta correcta.",
    }
    return {
      success: false,
      error: messages[code] || "No se pudo aceptar la invitación.",
    }
  }

  return { success: true, popId: String(payload.pop_id) }
}
