//src/lib/sgsst-types.ts

export type DocumentType = "manual" | "procedure" | "record" | "policy" | "instruction"
export type DocumentStatus = "draft" | "review" | "approved" | "obsolete"

export type DocumentBase = {
  id: string
  name: string
  type: DocumentType
  status: DocumentStatus
  version: string
  size: string
  department: string
  updatedAt: string
  // NUEVO
  hasOnlineForm?: boolean // si se diligencia en línea
  category?: "general" | "preventive" // para filtrar solo los del estándar 7
}

export type ProcedureFilled = {
  id: string
  documentId: string
  documentName: string

  // “Área / proceso” al que va enfocado
  department: string
  workArea: string

  title: string
  objective: string
  scope: string
  steps: string

  responsibleName: string
  responsibleRole: string

  createdAtISO: string

  // Firma (imagen subida)
  signatureDataUrl: string // base64 dataURL (png/jpg)
}

export type EvidenceFile = {
  id: string
  name: string
  mime: string
  size: number
  dataUrl: string // base64 (para demo)
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


