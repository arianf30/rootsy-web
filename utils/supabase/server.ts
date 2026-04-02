import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Cliente Supabase en Server Components, Server Actions y Route Handlers.
 * En RSC no se pueden escribir cookies; `setAll` ignora el error y el refresh
 * lo hace `middleware.ts` con `@supabase/ssr`.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            /* RSC u otro contexto sin escritura: el middleware renueva la sesión. */
          }
        },
      },
    },
  )
}
