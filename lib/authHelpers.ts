"use server"

import { createClient } from "@/utils/supabase/server"

export async function requireAuthenticatedUser() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error("Unauthorized: No authenticated user")
  }

  return {
    uid: user.id,
    email: user.email,
  }
}

export async function getAuthenticatedUserOrNull(): Promise<{
  uid: string
  email: string | undefined
} | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return null
  return { uid: user.id, email: user.email ?? undefined }
}
