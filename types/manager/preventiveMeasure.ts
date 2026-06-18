import type { ApiResponse } from "./company"

export type PreventiveMeasureKey = "ELIMINACION" | "SUSTITUCION" | "INGENIERIA" | "ADMINISTRATIVOS" | "EPP"
export type PreventiveMeasureType = "DATE" | "PERMANENT"
export type PreventiveMeasureStatus = "PENDING" | "DONE"
export type PreventiveMeasureAction = "PREVENTIVA" | "CORRECION" | "MEJORA"

export type PreventiveMeasureRiskSummary = {
  id: string
  process: string
  activity: string
  task: string
}

export type PreventiveMeasure = {
  id: string
  companyId: string
  riskId?: string | null
  key: PreventiveMeasureKey
  title: string
  description: string
  type: PreventiveMeasureType
  dueDate?: string | null
  status: PreventiveMeasureStatus
  doneDate?: string | null
  accion: PreventiveMeasureAction
  risk?: PreventiveMeasureRiskSummary | null
}

export type PreventiveMeasureDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: string
  referenceId: string
  type: string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string
}

export type PreventiveMeasureList = {
  items: PreventiveMeasure[]
  total: number
  page: number
  limit: number
}

export type PreventiveMeasureFilters = {
  page?: number
  limit?: number
  riskId?: string
  key?: PreventiveMeasureKey
  type?: PreventiveMeasureType
  status?: PreventiveMeasureStatus
  accion?: PreventiveMeasureAction
  search?: string
}

export type UpsertPreventiveMeasureDto = {
  riskId?: string
  key: PreventiveMeasureKey
  title: string
  description: string
  type: PreventiveMeasureType
  dueDate?: string
  status: PreventiveMeasureStatus
  doneDate?: string
  accion: PreventiveMeasureAction
}

export type UploadPreventiveMeasureDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
}

export type PreventiveMeasureResponse = ApiResponse<PreventiveMeasure>
export type PreventiveMeasuresResponse = ApiResponse<PreventiveMeasureList>
export type PreventiveMeasureDocumentResponse = ApiResponse<PreventiveMeasureDocument>
export type PreventiveMeasureDocumentsResponse = ApiResponse<PreventiveMeasureDocument[]>
