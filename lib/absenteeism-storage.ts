import type { AbsenteeismRecord } from "@/lib/mock-data"

const KEY = "sgsst:absenteeism:v1"

function safeParse<T>(v: string | null, fallback: T): T {
  if (!v) return fallback
  try { return JSON.parse(v) as T } catch { return fallback }
}

export function getAbsenteeismAll(): AbsenteeismRecord[] {
  return safeParse(localStorage.getItem(KEY), [])
}

export function getAbsenteeismByEmployee(employeeId: string): AbsenteeismRecord[] {
  return getAbsenteeismAll().filter(r => r.employeeId === employeeId)
}

export function upsertAbsenteeism(record: AbsenteeismRecord) {
  const all = getAbsenteeismAll()
  const idx = all.findIndex(r => r.id === record.id)
  const next = idx >= 0 ? all.map(r => r.id === record.id ? record : r) : [record, ...all]
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function deleteAbsenteeism(recordId: string) {
  const all = getAbsenteeismAll()
  const next = all.filter(r => r.id !== recordId)
  localStorage.setItem(KEY, JSON.stringify(next))
}
