"use server"

import { siteIdFromPopRow, siteIdFromPopSettings } from "@/lib/popRoutes"
import { createClient } from "@/utils/supabase/server"
import { requireAuthenticatedUser } from "@/lib/authHelpers"

export type GetPopByIdOptions = {
  includeOwnerUserId?: boolean
}

async function isPopActive(popId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("is_pop_active", {
      pop_id: popId,
    })
    if (error) return false
    return data === true
  } catch {
    return false
  }
}

export async function getPopById(popId: string, options?: GetPopByIdOptions) {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data: hasAccess, error: accessError } = await supabase.rpc(
      "user_has_pop_access",
      {
        pop_id: popId,
        user_id: user.uid,
      },
    )

    if (accessError || !hasAccess) {
      return {
        success: false,
        error: "No tienes acceso a este POP",
      }
    }

    const { data: pop, error: popError } = await supabase
      .from("pops")
      .select(
        "id, name, image_url, site_id, settings, owner_user_id, business_type_id, country, state, city, street_address, postal_code, phone, background_image_url, invoice_logo_url, fiscal_cuit, fiscal_razon_social, fiscal_padron_synced_at, fiscal_inicio_actividades_date, fiscal_ingresos_brutos_text, fiscal_padron_actividades_json, fiscal_actividad_seleccionada_id",
      )
      .eq("id", popId)
      .single()

    if (popError || !pop) {
      return {
        success: false,
        error: "Error al obtener datos del POP",
      }
    }

    const lineFromColumns = [
      pop.street_address,
      pop.city,
      pop.state,
      pop.country,
    ]
      .filter(Boolean)
      .join(", ")
    const address =
      lineFromColumns || (pop.settings?.address as string | undefined) || null

    const base = {
      id: pop.id,
      name: pop.name,
      siteId: siteIdFromPopRow({
        site_id: pop.site_id as string | null | undefined,
        settings: pop.settings,
      }),
      imageUrl: pop.image_url,
      address,
      country: pop.country ?? null,
      state: pop.state ?? null,
      city: pop.city ?? null,
      streetAddress: pop.street_address ?? null,
      postalCode: pop.postal_code ?? null,
      phone: pop.phone ?? null,
      backgroundImageUrl: pop.background_image_url ?? null,
      invoiceLogoUrl: pop.invoice_logo_url ?? null,
      fiscalCuit: pop.fiscal_cuit != null ? String(pop.fiscal_cuit) : null,
      fiscalRazonSocial: pop.fiscal_razon_social != null
        ? String(pop.fiscal_razon_social)
        : null,
      fiscalPadronSyncedAt:
        pop.fiscal_padron_synced_at != null
          ? String(pop.fiscal_padron_synced_at)
          : null,
      fiscalInicioActividadesDate:
        pop.fiscal_inicio_actividades_date != null
          ? String(pop.fiscal_inicio_actividades_date).slice(0, 10)
          : null,
      fiscalIngresosBrutosText:
        pop.fiscal_ingresos_brutos_text != null
          ? String(pop.fiscal_ingresos_brutos_text)
          : null,
      fiscalPadronActividadesJson:
        pop.fiscal_padron_actividades_json != null
          ? JSON.stringify(pop.fiscal_padron_actividades_json)
          : null,
      fiscalActividadSeleccionadaId:
        pop.fiscal_actividad_seleccionada_id != null
          ? String(pop.fiscal_actividad_seleccionada_id)
          : null,
      settings: pop.settings || {},
    }

    if (options?.includeOwnerUserId) {
      return {
        success: true,
        pop: {
          ...base,
          ownerUserId: (pop.owner_user_id as string | null) ?? null,
        },
      }
    }

    return {
      success: true,
      pop: base,
    }
  } catch {
    return {
      success: false,
      error: "Error inesperado al obtener datos del POP",
    }
  }
}

export async function validatePopAccess(popId: string): Promise<{
  hasAccess: boolean
  isActive: boolean
  error?: string
}> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()

    const { data: hasAccess, error: accessError } = await supabase.rpc(
      "user_has_pop_access",
      {
        pop_id: popId,
        user_id: user.uid,
      },
    )

    if (accessError || !hasAccess) {
      return {
        hasAccess: false,
        isActive: false,
        error: "No tienes acceso a este POP",
      }
    }

    const active = await isPopActive(popId)

    if (!active) {
      return {
        hasAccess: true,
        isActive: false,
        error:
          "Este POP no está activo. La prueba gratuita ha expirado o la suscripción está vencida. Por favor, actualiza tu suscripción para continuar.",
      }
    }

    return {
      hasAccess: true,
      isActive: true,
    }
  } catch {
    return {
      hasAccess: false,
      isActive: false,
      error: "Error al validar acceso al POP",
    }
  }
}

export async function getPopSiteId(popId: string): Promise<string> {
  try {
    const user = await requireAuthenticatedUser()
    const supabase = await createClient()
    const { data: hasAccess } = await supabase.rpc("user_has_pop_access", {
      pop_id: popId,
      user_id: user.uid,
    })
    if (!hasAccess) {
      return siteIdFromPopSettings(undefined)
    }
    const { data } = await supabase
      .from("pops")
      .select("site_id, settings")
      .eq("id", popId)
      .maybeSingle()
    return siteIdFromPopRow({
      site_id: data?.site_id as string | null | undefined,
      settings: data?.settings,
    })
  } catch {
    return siteIdFromPopSettings(undefined)
  }
}
