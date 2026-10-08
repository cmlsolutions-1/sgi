import type { ApiResponse } from "./company"

export type CustodyStatus = "PENDING_SUPPORTS" | "COMPLETE" | "INACTIVE"
export type CustodyDocumentType =
  | "CUSTODY_SUPPORT"
  | "CONFIDENTIALITY_COMMITMENT_SIGNED"
  | "CONFIDENTIALITY_COMMITMENT_GENERATED"

export type CustodyDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: string
  referenceId: string
  type: CustodyDocumentType
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

export type CustodyRecord = {
  id: string
  companyId: string
  custodianInstitution: string
  responsiblePerson: string
  custodyStartDate: string
  observations?: string | null
  status: CustodyStatus
  custodyEvidenceId?: string | null
  custodyEvidence?: CustodyDocument | null
  confidentialityEvidenceId?: string | null
  confidentialityEvidence?: CustodyDocument | null
  isComplete: boolean
  createdAt: string
  updatedAt: string
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export type CustodyList = {
  items: CustodyRecord[]
  total: number
  page: number
  limit: number
}

export type CustodySummary = {
  total: number
  withCustodyEvidence: number
  withConfidentiality: number
  complete: number
  pending: number
}

export type CustodyFilters = {
  page?: number
  limit?: number
  search?: string
  status?: CustodyStatus
  startDate?: string
  endDate?: string
  hasCustodyEvidence?: boolean
  hasConfidentialityEvidence?: boolean
}

export type UpsertCustodyDto = {
  custodianInstitution: string
  responsiblePerson: string
  custodyStartDate: string
  observations?: string
}

export type UploadCustodyDocumentDto = {
  file: File
  type: CustodyDocumentType
  description?: string
  isConfirmed?: boolean
}

export type CustodyResponse = ApiResponse<CustodyRecord>
export type CustodyListResponse = ApiResponse<CustodyList>
export type CustodySummaryResponse = ApiResponse<CustodySummary>
export type CustodyDocumentResponse = ApiResponse<CustodyDocument>
export type CustodyDocumentsResponse = ApiResponse<CustodyDocument[]>
