"use server"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { getPopById, validatePopAccess } from "@/lib/popHelpers"
import { permissionRowsToKeys } from "@/lib/popPermissionConstants"
import { createClient } from "@/utils/supabase/server"

type AccessiblePopRow = {
  pop_id: string
  pop_name: string
  role_id: string
  role_name: string
  is_owner: boolean
}

export async function getPopMenuData(popId: string) {
  try {
    const accessValidation = await validatePopAccess(popId)

    if (!accessValidation.hasAccess) {
      return {
        success: false as const,
        error: accessValidation.error || "No tienes acceso a este POP",
        redirect: "/home",
      }
    }

    if (!accessValidation.isActive) {
      return {
        success: false as const,
        error:
          accessValidation.error || "Este POP no está activo",
        redirect: "/home",
      }
    }

    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const [popData, permRes, popsRes, profileRes] = await Promise.all([
      getPopById(popId),
      supabase.rpc("get_user_all_permissions", {
        p_pop_id: popId,
        p_user_id: user.uid,
      }),
      supabase.rpc("get_user_accessible_pops", { user_id: user.uid }),
      supabase
        .from("users")
        .select("first_name, last_name, image_url")
        .eq("id", user.uid)
        .maybeSingle(),
    ])

    if (!popData.success || !popData.pop) {
      return {
        success: false as const,
        error: popData.error || "Error al obtener datos del POP",
        redirect: "/home",
      }
    }

    if (permRes.error || !Array.isArray(permRes.data)) {
      return {
        success: false as const,
        error: "No se pudieron cargar los permisos de este punto de venta.",
        redirect: "/home",
      }
    }

    const permissionKeys = permissionRowsToKeys(permRes.data)

    const accessible = (popsRes.data as AccessiblePopRow[] | null) ?? []
    const popRow = accessible.find((p) => p.pop_id === popId)
    const roleLabel = popRow?.is_owner
      ? "Dueño"
      : (popRow?.role_name?.trim() || "Miembro")

    const profile = profileRes.data
    const fn = String(profile?.first_name ?? "")
    const ln = String(profile?.last_name ?? "")
    const fullName =
      `${fn} ${ln}`.trim() ||
      user.email?.split("@")[0] ||
      "Usuario"

    return {
      success: true as const,
      pop: popData.pop,
      permissionKeys,
      user: {
        fullName,
        email: user.email ?? null,
        imageUrl: profile?.image_url ?? null,
        roleLabel,
      },
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Error desconocido"
    return {
      success: false as const,
      error: "Error inesperado: " + message,
      redirect: "/home",
    }
  }
}
