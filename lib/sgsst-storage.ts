//src/lib/sgsst-storage.ts

import type { ProcedureFilled, PreventiveMeasure } from "./sgsst-types"

const KEY_PROCEDURES = "sgsst:proceduresFilled:v1"
const KEY_MEASURES = "sgsst:preventiveMeasures:v1"

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

// Procedures
export function getProceduresFilled(): ProcedureFilled[] {
  return safeParse(localStorage.getItem(KEY_PROCEDURES), [])
}

export function saveProceduresFilled(list: ProcedureFilled[]) {
  localStorage.setItem(KEY_PROCEDURES, JSON.stringify(list))
}

export function upsertProcedureFilled(item: ProcedureFilled) {
  const list = getProceduresFilled()
  const idx = list.findIndex((x) => x.id === item.id)
  const next = idx >= 0 ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]
  saveProceduresFilled(next)
}

// Measures
export function getPreventiveMeasures(): PreventiveMeasure[] {
  return safeParse(localStorage.getItem(KEY_MEASURES), [])
}

export function savePreventiveMeasures(list: PreventiveMeasure[]) {
  localStorage.setItem(KEY_MEASURES, JSON.stringify(list))
}

export function upsertPreventiveMeasure(item: PreventiveMeasure) {
  const list = getPreventiveMeasures()
  const idx = list.findIndex((x) => x.id === item.id)
  const next = idx >= 0 ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]
  savePreventiveMeasures(next)
}
