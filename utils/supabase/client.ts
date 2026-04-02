import { createBrowserClient } from "@supabase/ssr"

/**
 * Cliente Supabase en Client Components. Usa la misma sesión que el servidor vía cookies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
