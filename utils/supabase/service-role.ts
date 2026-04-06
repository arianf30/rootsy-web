import { createClient } from "@supabase/supabase-js"

export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url?.trim() || !key?.trim()) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY o URL de Supabase no configurados.")
  }
  return createClient(url.trim(), key.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
