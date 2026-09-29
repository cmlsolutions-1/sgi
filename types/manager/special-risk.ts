import type { ApiResponse } from "./company"

export type SpecialRiskStatus = "ACTIVE" | "FINISHED"

export type SpecialRiskActivity =
  | "MINERIA_SUBTERRANEA"
  | "ALTAS_TEMPERATURAS"
  | "RADIACIONES_IONIZANTES"
  | "BOMBEROS"
  | "AVIACION"
  | "TRABAJO_TUNELES"
  | "SUSTANCIAS_PELIGROSAS"
  | "OTRA"

export type SpecialRiskEmployee = {
  id: string
  name: string
  lastName: string
  documentNumber?: string | null
}

export type SpecialRiskJob = {
  id: string
  name: string
}

export type SpecialRisk = {
  id: string
  companyId: string
  employeeId: string
  employee: SpecialRiskEmployee
  jobId?: string | null
  job?: SpecialRiskJob | null
  activity: SpecialRiskActivity
  customActivity?: string | null
  startDate: string
  endDate: string
  specialContribution: boolean
  status: SpecialRiskStatus
  observations?: string | null
  evidenceCount: number
  createdAt: string
  updatedAt: string
}

export type SpecialRiskList = {
  items: SpecialRisk[]
  total: number
  page: number
  limit: number
}

export type SpecialRiskActivityOption = {
  code: SpecialRiskActivity
  name: string
}

export type SpecialRiskFilters = {
  page?: number
  limit?: number
  search?: string
  employeeId?: string
  activity?: SpecialRiskActivity
  status?: SpecialRiskStatus
  specialContribution?: boolean
  startDate?: string
  endDate?: string
}

export type UpsertSpecialRiskDto = {
  employeeId: string
  activity: SpecialRiskActivity
  customActivity?: string
  startDate: string
  endDate: string
  specialContribution: boolean
  status: SpecialRiskStatus
  observations?: string
}

export type SpecialRiskDocument = {
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
  observation?: string | null
  description?: string | null
}

export type UploadSpecialRiskDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  observation?: string
  description?: string
}

export type SpecialRiskResponse = ApiResponse<SpecialRisk>
export type SpecialRiskListResponse = ApiResponse<SpecialRiskList>
export type SpecialRiskActivitiesResponse = ApiResponse<SpecialRiskActivityOption[]>
export type SpecialRiskDocumentResponse = ApiResponse<SpecialRiskDocument>
export type SpecialRiskDocumentsResponse = ApiResponse<SpecialRiskDocument[]>
