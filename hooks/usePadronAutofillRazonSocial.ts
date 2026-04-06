"use client"

import { lookupPadronForPop } from "@/app/[siteId]/[popId]/padronLookup/actions"
import type { PadronActividadItem } from "@/lib/argentinaPadronLookup"
import { DEBOUNCE_MS_SAFE } from "@/lib/debounceMs"
import { useEffect, useState } from "react"

export type UsePadronAutofillOptions = {
  enabled?: boolean
  debounceMs?: number
  /**
   * Si es true, un documento vacío o inválido no borra la razón social ya obtenida.
   * Útil mientras se hidrata el formulario (p. ej. Ajustes del POP) para no pisar datos del servidor.
   */
  suppressClear?: boolean
}

export function usePadronAutofillRazonSocial(
  popId: string | undefined,
  rawDocument: string,
  options?: UsePadronAutofillOptions,
) {
  const enabled = options?.enabled ?? true
  const debounceMs = options?.debounceMs ?? DEBOUNCE_MS_SAFE
  const suppressClear = options?.suppressClear ?? false

  const [razonSocial, setRazonSocial] = useState("")
  const [fiscalActividadesPadron, setFiscalActividadesPadron] = useState<
    PadronActividadItem[]
  >([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!popId || !enabled) return
    const raw = rawDocument.trim()
    if (!raw) {
      if (!suppressClear) {
        setRazonSocial("")
        setFiscalActividadesPadron([])
        setError(null)
      }
      return
    }
    const digits = raw.replace(/\D/g, "")
    const okLen =
      digits.length === 11 || (digits.length >= 6 && digits.length <= 9)
    if (!okLen) {
      if (!suppressClear) {
        setRazonSocial("")
        setFiscalActividadesPadron([])
        setError(null)
      }
      return
    }
    const t = setTimeout(() => {
      void (async () => {
        setBusy(true)
        setError(null)
        const res = await lookupPadronForPop(popId, raw)
        setBusy(false)
        if (!res.success) {
          setError(res.error)
          setRazonSocial("")
          setFiscalActividadesPadron([])
          return
        }
        setRazonSocial(res.razonSocial)
        setFiscalActividadesPadron(res.fiscalActividadesPadron ?? [])
        setError(null)
      })()
    }, debounceMs)
    return () => clearTimeout(t)
  }, [popId, rawDocument, enabled, debounceMs, suppressClear])

  return {
    razonSocial,
    fiscalActividadesPadron,
    busy,
    error,
  }
}
