import { cache } from "react"
import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { createClient } from "@/utils/supabase/server"

export type PopPermissionsSnapshotJSON = {
  keys: string[]
}

type PermRow = { resource: string; action: string }

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
    const keys = (data as PermRow[]).map((p) => `${p.resource}:${p.action}`)
    return { keys }
  },
)

export async function loadPopPermissionsSnapshot(
  popId: string,
): Promise<PopPermissionsSnapshotJSON> {
  const user = await requireAuthenticatedUser()
  return fetchPopPermissionsForUser(popId, user.uid)
}
