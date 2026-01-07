//src/lib/preventive-measures-storage.ts

export type EvidenceFile = {
    id: string
    name: string
    mime: string
    size: number
    dataUrl: string
    uploadedAtISO: string
  }
  
  export type PreventiveMeasure = {
    id: string
    procedureFilledId: string
  
    procedureTitle: string
    department: string
    workArea: string
  
    description: string
    dueDateISO: string
    status: "open" | "in-progress" | "closed"
  
    evidences: EvidenceFile[]
    createdAtISO: string
  }
  
  const KEY = "sgsst:preventiveMeasures:v1"
  
  function safeParse<T>(v: string | null, fallback: T): T {
    if (!v) return fallback
    try { return JSON.parse(v) as T } catch { return fallback }
  }
  
  export function getPreventiveMeasures(): PreventiveMeasure[] {
    return safeParse(localStorage.getItem(KEY), [])
  }
  
  export function savePreventiveMeasures(list: PreventiveMeasure[]) {
    localStorage.setItem(KEY, JSON.stringify(list))
  }
  
  export function upsertPreventiveMeasure(item: PreventiveMeasure) {
    const list = getPreventiveMeasures()
    const idx = list.findIndex(x => x.id === item.id)
    const next = idx >= 0 ? list.map(x => x.id === item.id ? item : x) : [item, ...list]
    savePreventiveMeasures(next)
  }
  