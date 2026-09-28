import type { ApiResponse } from "./company"
import type { WorkAreaOption } from "./work-area"

export type JobStatus = "ACTIVE" | "INACTIVE"
export type JobRiskLevel = "RIESGO_I" | "RIESGO_II" | "RIESGO_III" | "RIESGO_IV" | "RIESGO_V"

export type Job = {
  id: string
  companyId: string
  name: string
  description: string
  status: JobStatus
  workAreaId: string
  workArea: WorkAreaOption
  workEnvironment: string
  riskLevel: JobRiskLevel
  evidenceCount: number
  createdAt: string
  updatedAt: string
}

export type JobOption = {
  id: string
  name: string
}

export type JobsPage = {
  items: Job[]
  total: number
  page: number
  limit: number
}

export type CreateJobDto = {
  name: string
  description: string
  workAreaId: string
  workEnvironment: string
  riskLevel: JobRiskLevel
}

export type UpdateJobDto = CreateJobDto

export type JobDocument = {
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
  description?: string | null
}

export type UploadJobDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  description?: string
}

export type JobResponse = ApiResponse<Job>
export type JobsResponse = ApiResponse<JobsPage>
export type JobOptionsResponse = ApiResponse<JobOption[]>
export type JobDocumentResponse = ApiResponse<JobDocument>
export type JobDocumentsResponse = ApiResponse<JobDocument[]>
