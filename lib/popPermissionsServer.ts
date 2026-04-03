import { cache } from "react"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { permissionRowsToKeys } from "@/lib/popPermissionConstants"
import { createClient } from "@/utils/supabase/server"

export type PopPermissionsSnapshotJSON = {
  keys: string[]
}

const fetchPopPermissionsForUser = cache(
  async (popId: string, userId: string): Promise<PopPermissionsSnapshotJSON> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("get_user_all_permissions", {
      p_pop_id: popId,
      p_user_id: userId,
    })
    if (error || !Array.isArray(data)) {
      return { keys: [] }
    }
    return { keys: permissionRowsToKeys(data) }
  },
)

export async function loadPopPermissionsSnapshot(
  popId: string,
): Promise<PopPermissionsSnapshotJSON> {
  const user = await requireAuthenticatedUser()
  return fetchPopPermissionsForUser(popId, user.uid)
}
