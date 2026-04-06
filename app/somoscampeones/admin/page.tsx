import AdminRootsyForm from "@/app/somoscampeones/admin/admin-client"
import { loadRootsyAdminConfig } from "@/app/somoscampeones/admin/actions"
import { ROOTSY_PLATFORM_ADMIN_USER_ID } from "@/lib/rootsyPlatformAdmin"
import { createClient } from "@/utils/supabase/server"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin Rootsy",
  robots: { index: false, follow: false },
}

export default async function SomoscampeonesAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  if (user.id !== ROOTSY_PLATFORM_ADMIN_USER_ID) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-medium text-foreground">No autorizado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Esta sección solo está disponible para la cuenta de administración de la
          plataforma.
        </p>
      </div>
    )
  }

  const initial = await loadRootsyAdminConfig()
  if (!initial) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-lg font-medium text-foreground">Sesión requerida</h1>
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la configuración. Volvé a iniciar sesión.
        </p>
      </div>
    )
  }

  return <AdminRootsyForm initial={initial} />
}
