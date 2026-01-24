// hooks/manager/useCiiu.ts
"use client"

import { useState } from "react"
import type { NivelRiesgoItem } from "@/types/manager/super-admin"

import nivelRiesgos from "@/lib/nivelRiesgos.json"

export function useCiiu() {
  const [ciiu, setCiiu] = useState("")
  const [ciiuResults, setCiiuResults] = useState<NivelRiesgoItem[]>([])
  const [ciiuError, setCiiuError] = useState<string | null>(null)

  const consultar = () => {
    setCiiuError(null)
    setCiiuResults([])

    const cleaned = ciiu.replace(/[^\d]/g, "")
    if (!cleaned) {
      setCiiuError("Ingresa un código CIIU válido (solo números).")
      return
    }

    const code = Number(cleaned)
    if (Number.isNaN(code)) {
      setCiiuError("Código CIIU inválido.")
      return
    }

    const data = nivelRiesgos as NivelRiesgoItem[]

    const matches = data
      .filter((x) => Number(String(x["CÓDIGO CIIU"]).replace(/[^\d]/g, "")) === code)
      .sort((a, b) => (a["CODIGO ADICIONAL"] ?? 0) - (b["CODIGO ADICIONAL"] ?? 0))

    if (matches.length === 0) {
      setCiiuError(`No se encontró información para el CIIU ${code}.`)
      return
    }

    setCiiuResults(matches)
  }

  const limpiar = () => {
    setCiiu("")
    setCiiuResults([])
    setCiiuError(null)
  }

  return {
    ciiu,
    setCiiu,
    ciiuResults,
    ciiuError,
    consultar,
    limpiar,
  }
}
