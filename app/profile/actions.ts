"use server"

import { requireAuthenticatedUser } from "@/lib/authHelpers"
import { siteIdFromPopRow } from "@/lib/popRoutes"
import { createClient } from "@/utils/supabase/server"

export type UserProfileDTO = {
  email: string | null
  firstName: string
  lastName: string
  fullName: string
  imageUrl: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string | null
  postalCode: string | null
  dateOfBirth: string | null
  gender: string | null
  bio: string | null
  website: string | null
  timezone: string | null
  language: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  lastLoginAt: string | null
  metadata: Record<string, unknown>
}

export type UserPopListItem = {
  id: string
  siteId: string
  name: string
  imageUrl: string | null
  roleId: string
  roleName: string
  isOwner: boolean
  subscription: {
    status: string
    planName: string
    planDisplayName: string
    businessTypeName: string
    businessTypeDisplayName: string
    daysRemaining: number | null
    isActive: boolean
    trialEndsAt: string | null
    currentPeriodEnd: string | null
  } | null
}

function mapRowToDto(
  user: { email?: string | null },
  row: Record<string, unknown>,
): UserProfileDTO {
  const fn = String(row.first_name ?? "")
  const ln = String(row.last_name ?? "")
  return {
    email: user.email ?? null,
    firstName: fn,
    lastName: ln,
    fullName: `${fn} ${ln}`.trim(),
    imageUrl: (row.image_url as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    state: (row.state as string | null) ?? null,
    country: (row.country as string | null) ?? null,
    postalCode: (row.postal_code as string | null) ?? null,
    dateOfBirth: (row.date_of_birth as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    timezone: (row.timezone as string | null) ?? null,
    language: (row.language as string | null) ?? null,
    isEmailVerified: Boolean(row.is_email_verified),
    isPhoneVerified: Boolean(row.is_phone_verified),
    lastLoginAt: (row.last_login_at as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }
}

export async function getUserProfile(): Promise<UserProfileDTO> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data: userProfile, error } = await supabase
      .from("users")
      .select(
        "first_name, last_name, image_url, phone, address, city, state, country, postal_code, date_of_birth, gender, bio, website, timezone, language, is_email_verified, is_phone_verified, last_login_at, metadata",
      )
      .eq("id", user.uid)
      .single()

    if (error || !userProfile) {
      const emailName = user.email?.split("@")[0] || "Usuario"
      const { data: newProfile, error: createError } = await supabase
        .from("users")
        .insert({
          id: user.uid,
          first_name: emailName,
          last_name: "",
          country: "AR",
          timezone: "America/Argentina/Buenos_Aires",
          language: "es",
        })
        .select(
          "first_name, last_name, image_url, phone, address, city, state, country, postal_code, date_of_birth, gender, bio, website, timezone, language, is_email_verified, is_phone_verified, last_login_at, metadata",
        )
        .single()

      if (createError || !newProfile) {
        return {
          email: user.email ?? null,
          firstName: emailName,
          lastName: "",
          fullName: emailName,
          imageUrl: null,
          phone: null,
          address: null,
          city: null,
          state: null,
          country: "AR",
          postalCode: null,
          dateOfBirth: null,
          gender: null,
          bio: null,
          website: null,
          timezone: "America/Argentina/Buenos_Aires",
          language: "es",
          isEmailVerified: false,
          isPhoneVerified: false,
          lastLoginAt: null,
          metadata: {},
        }
      }

      return mapRowToDto(user, newProfile as Record<string, unknown>)
    }

    return mapRowToDto(user, userProfile as Record<string, unknown>)
  } catch {
    let email: string | null = null
    let emailName = "Usuario"
    try {
      const u = await requireAuthenticatedUser()
      email = u.email ?? null
      emailName = u.email?.split("@")[0] || "Usuario"
    } catch {
      /* sin sesión */
    }
    return {
      email,
      firstName: emailName,
      lastName: "",
      fullName: emailName,
      imageUrl: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      country: "AR",
      postalCode: null,
      dateOfBirth: null,
      gender: null,
      bio: null,
      website: null,
      timezone: "America/Argentina/Buenos_Aires",
      language: "es",
      isEmailVerified: false,
      isPhoneVerified: false,
      lastLoginAt: null,
      metadata: {},
    }
  }
}

type AccessiblePopRow = {
  pop_id: string
  pop_name: string
  role_id: string
  role_name: string
  is_owner: boolean
}

export async function getUserPops(): Promise<UserPopListItem[]> {
  const user = await requireAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: accessiblePops, error: popsError } = await supabase.rpc(
      "get_user_accessible_pops",
      { user_id: user.uid },
    )

    if (popsError) {
      return []
    }

    if (!accessiblePops || accessiblePops.length === 0) {
      return []
    }

    const accRows = accessiblePops as AccessiblePopRow[]
    const popIds = accRows.map((p) => p.pop_id)
    const { data: popSettingsRows } = await supabase
      .from("pops")
      .select("id, site_id, settings")
      .in("id", popIds)
    const siteByPopId = new Map<string, string>()
    for (const row of popSettingsRows || []) {
      siteByPopId.set(
        String(row.id),
        siteIdFromPopRow({
          site_id: row.site_id as string | null | undefined,
          settings: row.settings,
        }),
      )
    }

    const popsWithSubscription = await Promise.all(
      accRows.map(async (pop) => {
        try {
          const { data: subscriptionInfo, error: subscriptionError } =
            await supabase.rpc("get_pop_subscription_info", {
              pop_id: pop.pop_id,
            })

          if (
            subscriptionError ||
            !subscriptionInfo ||
            subscriptionInfo.length === 0
          ) {
            return {
              id: pop.pop_id,
              siteId:
                siteByPopId.get(pop.pop_id) ??
                siteIdFromPopRow({ site_id: null, settings: undefined }),
              name: pop.pop_name,
              imageUrl: null,
              roleId: pop.role_id,
              roleName: pop.role_name,
              isOwner: pop.is_owner,
              subscription: null,
            }
          }

          const subscription = subscriptionInfo[0] as Record<string, unknown>

          return {
            id: pop.pop_id,
            siteId:
                siteByPopId.get(pop.pop_id) ??
                siteIdFromPopRow({ site_id: null, settings: undefined }),
            name: pop.pop_name,
            imageUrl: null,
            roleId: pop.role_id,
            roleName: pop.role_name,
            isOwner: pop.is_owner,
            subscription: {
              status: String(subscription.status ?? ""),
              planName: String(subscription.plan_display_name ?? ""),
              planDisplayName: String(subscription.plan_display_name ?? ""),
              businessTypeName: String(
                subscription.business_type_display_name ?? "",
              ),
              businessTypeDisplayName: String(
                subscription.business_type_display_name ?? "",
              ),
              daysRemaining:
                subscription.days_remaining != null
                  ? Number(subscription.days_remaining)
                  : null,
              isActive: Boolean(subscription.is_active),
              trialEndsAt: (subscription.trial_ends_at as string | null) ?? null,
              currentPeriodEnd:
                (subscription.current_period_end as string | null) ?? null,
            },
          }
        } catch {
          return {
            id: pop.pop_id,
            siteId:
                siteByPopId.get(pop.pop_id) ??
                siteIdFromPopRow({ site_id: null, settings: undefined }),
            name: pop.pop_name,
            imageUrl: null,
            roleId: pop.role_id,
            roleName: pop.role_name,
            isOwner: pop.is_owner,
            subscription: null,
          }
        }
      }),
    )

    return popsWithSubscription
  } catch {
    return []
  }
}

export async function canUserCreatePop(): Promise<{
  canCreate: boolean
  reason?: string
}> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data, error } = await supabase.rpc("can_user_create_pop", {
      user_id: user.uid,
    })

    if (error) {
      return { canCreate: false, reason: "Error al verificar límite de POPs" }
    }

    if (!data) {
      const { data: userPops } = await supabase
        .from("pops")
        .select("id")
        .eq("owner_user_id", user.uid)

      if (userPops && userPops.length >= 1) {
        return {
          canCreate: false,
          reason:
            "Ya tienes un POP activo. Solo puedes tener 1 POP por cuenta.",
        }
      }
    }

    return { canCreate: data === true }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : ""
    if (msg.includes("authenticated") || msg.includes("session")) {
      return {
        canCreate: false,
        reason: "Debes iniciar sesión para crear un POP",
      }
    }
    return { canCreate: false, reason: "Error al verificar límite de POPs" }
  }
}

/**
 * Una sola invocación de server action (= un POST) para el home.
 * Antes: 3 POST en paralelo (getUserPops + getUserProfile + canUserCreatePop).
 */
export async function getHomePageData(): Promise<{
  pops: UserPopListItem[]
  profile: UserProfileDTO | null
  canCreatePop: boolean
}> {
  const [pops, profile, createInfo] = await Promise.all([
    getUserPops().catch(() => [] as UserPopListItem[]),
    getUserProfile().catch(() => null),
    canUserCreatePop().catch(() => ({ canCreate: false as boolean })),
  ])
  return {
    pops: pops ?? [],
    profile,
    canCreatePop: createInfo.canCreate === true,
  }
}
