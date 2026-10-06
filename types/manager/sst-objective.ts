import type { ApiResponse } from "./company"

export type SstObjectiveType =
  | "ACCIDENTALITY"
  | "TRAINING"
  | "RISKS"
  | "PREVENTIVE_MEDICINE"
  | "INSPECTIONS"
  | "EMERGENCIES"
  | "COPASST"
  | "PPE"
  | "OTHER"

export type SstObjectiveStatus = "PENDING" | "IN_PROGRESS" | "FULFILLED"

export type SstObjectiveDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: string
  referenceId: string
  type: string
  originalName: string
  mimeType: string
  observation?: string | null
  description?: string | null
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string
}

export type SstObjectiveFollowUp = {
  id: string
  companyId: string
  objectiveId: string
  date: string
  progress: number
  observations: string
  evidenceCount: number
  createdAt: string
  updatedAt: string
  evidences?: SstObjectiveDocument[]
}

export type SstObjectiveDiffusion = {
  id: string
  companyId: string
  objectiveId: string
  medium: string
  date: string
  evidenceCount: number
  createdAt: string
  updatedAt: string
  evidences?: SstObjectiveDocument[]
}

export type SstObjective = {
  id: string
  companyId: string
  name: string
  year: number
  description: string
  type: SstObjectiveType
  customType?: string | null
  goal: string
  indicator: number
  measurementUnit: string
  expectedValue: string
  policyId: string
  policy?: { id: string; name: string } | null
  trackingResponsible: string
  startDate: string
  endDate: string
  observations: string
  status: SstObjectiveStatus
  followUpsCount: number
  diffusionsCount: number
  createdAt: string
  updatedAt: string
  followUps?: SstObjectiveFollowUp[]
  diffusions?: SstObjectiveDiffusion[]
}

export type SstObjectiveList = { items: SstObjective[]; total: number; page: number; limit: number }
export type SstObjectiveSummary = {
  policies: number
  total: number
  pending: number
  inProgress: number
  fulfilled: number
}

export type SstObjectiveFilters = {
  page?: number
  limit?: number
  search?: string
  year?: number
  type?: SstObjectiveType
  status?: SstObjectiveStatus
  policyId?: string
  startDate?: string
  endDate?: string
}

export type UpsertSstObjectiveDto = {
  name: string
  year: number
  description: string
  type: SstObjectiveType
  customType?: string
  goal: string
  indicator: number
  measurementUnit: string
  expectedValue: string
  policyId: string
  trackingResponsible: string
  startDate: string
  endDate: string
  observations: string
}

export type UpsertSstObjectiveFollowUpDto = { date: string; progress: number; observations: string }
export type UpsertSstObjectiveDiffusionDto = { medium: string; date: string }
export type UploadSstObjectiveDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  observation?: string
  description?: string
}

export type SstObjectiveResponse = ApiResponse<SstObjective>
export type SstObjectiveListResponse = ApiResponse<SstObjectiveList>
export type SstObjectiveSummaryResponse = ApiResponse<SstObjectiveSummary>
export type SstObjectiveFollowUpResponse = ApiResponse<SstObjectiveFollowUp>
export type SstObjectiveFollowUpsResponse = ApiResponse<SstObjectiveFollowUp[]>
export type SstObjectiveDiffusionResponse = ApiResponse<SstObjectiveDiffusion>
export type SstObjectiveDiffusionsResponse = ApiResponse<SstObjectiveDiffusion[]>
export type SstObjectiveDocumentResponse = ApiResponse<SstObjectiveDocument>
export type SstObjectiveDocumentsResponse = ApiResponse<SstObjectiveDocument[]>
