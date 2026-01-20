//src/lib/preventive-procedure-storage.ts

export type PreventiveProcedureFilled = {
    id: string
    documentId: string
  
    date: string
    company: string
  
    department: string
    workArea: string

    documentType: "manual" | "procedure" | "instruction" | "policy"
    documentName: string
  
    objective: string
    activities: string
    resources: string
  
    responsibleName: string
    responsibleRole: string
  
    // firma en imagen
    //signatureDataUrl: string
  
    createdAtISO: string
  }
  
  const KEY = "sgsst:preventiveProcedureFilled:v1"
  
  function safeParse<T>(v: string | null, fallback: T): T {
    if (!v) return fallback
    try { return JSON.parse(v) as T } catch { return fallback }
  }
  
  export function getPreventiveProceduresFilled(): PreventiveProcedureFilled[] {
    return safeParse(localStorage.getItem(KEY), [])
  }
  
  export function upsertPreventiveProcedureFilled(item: PreventiveProcedureFilled) {
    const list = getPreventiveProceduresFilled()
    const idx = list.findIndex(x => x.id === item.id)
    const next = idx >= 0 ? list.map(x => x.id === item.id ? item : x) : [item, ...list]
    localStorage.setItem(KEY, JSON.stringify(next))
  }
  
  export function getFilledByDocumentId(documentId: string) {
    return getPreventiveProceduresFilled().find(p => p.documentId === documentId)
  }
  