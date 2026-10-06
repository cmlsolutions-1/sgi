import type { ApiResponse } from "./company"

export type SstTrainingCompetenceType =
  | "COURSE_50_HOURS"
  | "COURSE_20_HOURS"
  | "SST_LICENSE"
  | "SST_DIPLOMA"
  | "SST_SPECIALIZATION"
  | "OTHER"

export type SstTrainingCertificationStatus = "VALID" | "EXPIRED"

export type SstTrainingCertificationEmployee = {
  id: string
  name: string
  lastName: string
  email: string
  job?: {
    id: string
    name: string
  } | null
}

export type SstTrainingCertification = {
  id: string
  companyId: string
  responsibleEmployeeId: string
  responsibleEmployee: SstTrainingCertificationEmployee
  competenceType: SstTrainingCompetenceType
  customCompetenceType?: string | null
  approvalDate: string
  certifyingEntity: string
  certificateNumber?: string | null
  expirationDate: string
  status: SstTrainingCertificationStatus
  evidenceCount: number
  createdAt: string
  updatedAt: string
}

export type SstTrainingCertificationList = {
  items: SstTrainingCertification[]
  total: number
  page: number
  limit: number
}

export type SstTrainingCertificationSummary = {
  total: number
  valid: number
  expired: number
  withEvidence: number
}

export type SstTrainingCompetenceOption = {
  code: SstTrainingCompetenceType
  name: string
}

export type SstTrainingCertificationFilters = {
  page?: number
  limit?: number
  search?: string
  responsibleEmployeeId?: string
  competenceType?: SstTrainingCompetenceType
  status?: SstTrainingCertificationStatus
  startDate?: string
  endDate?: string
  expirationStartDate?: string
  expirationEndDate?: string
}

export type UpsertSstTrainingCertificationDto = {
  responsibleEmployeeId: string
  competenceType: SstTrainingCompetenceType
  customCompetenceType?: string
  approvalDate: string
  certifyingEntity: string
  certificateNumber?: string
  expirationDate: string
}

export type SstTrainingCertificationDocument = {
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

export type UploadSstTrainingCertificationDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  observation?: string
  description?: string
}

export type SstTrainingCertificationResponse = ApiResponse<SstTrainingCertification>
export type SstTrainingCertificationListResponse = ApiResponse<SstTrainingCertificationList>
export type SstTrainingCertificationSummaryResponse = ApiResponse<SstTrainingCertificationSummary>
export type SstTrainingCompetenceOptionsResponse = ApiResponse<SstTrainingCompetenceOption[]>
export type SstTrainingCertificationDocumentResponse = ApiResponse<SstTrainingCertificationDocument>
export type SstTrainingCertificationDocumentsResponse = ApiResponse<SstTrainingCertificationDocument[]>
