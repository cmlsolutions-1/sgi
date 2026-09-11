import type { ApiResponse } from "./company"
import type { IncidentCaseStatus, IncidentType } from "./incident"

export type InvestigationReviewerType = "EMPLOYEE" | "EXTERNAL"
export type InvestigationEfficacyStatus = "REPORTADO" | "PENDIENTE_VERIFICACION" | "EFICAZ"
export type InvestigationAcpmSource = "ACPM" | "DOCUMENT_MANAGEMENT" | "OTHER"
export type InvestigationStatus = "ACTIVE" | "INACTIVE"

export type InvestigationEmployee = {
  id: string
  name: string
  lastName?: string
  email?: string
  job?: {
    id: string
    name: string
  } | null
}

export type InvestigationIncident = {
  id: string
  consecutive?: string
  date?: string
  type?: IncidentType | null
  caseStatus?: IncidentCaseStatus | null
  description?: string
  employeeId?: string
  employee?: InvestigationEmployee | null
}

export type InvestigationReviewer = {
  id?: string
  type: InvestigationReviewerType
  employeeId?: string | null
  employee?: InvestigationEmployee | null
  externalName?: string | null
}

export type InvestigationEvidence = {
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
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string
}

export type InvestigationTraceability = {
  id: string
  type: string
  title: string
  description: string
  actorUserId?: string | null
  actorName?: string | null
  createdAt: string
}

export type Investigation = {
  id: string
  companyId: string
  consecutive: string
  incidentId: string
  incident?: InvestigationIncident | null
  responsibleEmployeeId: string
  responsibleEmployee?: InvestigationEmployee | null
  reviewers: InvestigationReviewer[]
  causeAnalysis: string
  correctiveActions?: string | null
  preventiveActions?: string | null
  improvementActions?: string | null
  acpmSource: InvestigationAcpmSource
  acpmReference?: string | null
  acpmId?: string | null
  acpm?: {
    id: string
    year: number
    name: string
  } | null
  documentManagementId?: string | null
  documentManagement?: {
    id: string
    name: string
    code: string
    consecutive: number
    type: string
  } | null
  expectedClosureDate?: string | null
  efficacyStatus: InvestigationEfficacyStatus
  reviewDate?: string | null
  closureDate?: string | null
  closedBy?: {
    id: string
    name: string
  } | null
  evidencesCount: number
  status: InvestigationStatus
  createdAt: string
  updatedAt: string
  evidences?: InvestigationEvidence[]
  traceability?: InvestigationTraceability[]
}

export type InvestigationList = {
  items: Investigation[]
  total: number
  page: number
  limit: number
}

export type InvestigationSummary = {
  total: number
  reported: number
  pendingVerification: number
  closedEffective: number
}

export type InvestigationFilters = {
  page?: number
  limit?: number
  incidentId?: string
  responsibleEmployeeId?: string
  efficacyStatus?: InvestigationEfficacyStatus
  acpmSource?: InvestigationAcpmSource
  status?: InvestigationStatus
  startDate?: string
  endDate?: string
  search?: string
}

export type UpsertInvestigationDto = {
  incidentId: string
  responsibleEmployeeId: string
  reviewers: Array<{
    type: InvestigationReviewerType
    employeeId?: string
    externalName?: string
  }>
  causeAnalysis: string
  correctiveActions?: string
  preventiveActions?: string
  improvementActions?: string
  acpmSource: InvestigationAcpmSource
  acpmReference?: string
  acpmId?: string
  documentManagementId?: string
  expectedClosureDate?: string
}

export type ChangeInvestigationStatusDto = {
  status: InvestigationStatus
}

export type VerifyInvestigationEfficacyDto = {
  isEffective: boolean
  observation: string
}

export type UploadInvestigationEvidenceDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  observation?: string
}

export type InvestigationResponse = ApiResponse<Investigation>
export type InvestigationListResponse = ApiResponse<InvestigationList>
export type InvestigationSummaryResponse = ApiResponse<InvestigationSummary>
export type InvestigationTraceabilityResponse = ApiResponse<InvestigationTraceability[]>
export type InvestigationEvidenceResponse = ApiResponse<InvestigationEvidence>
export type InvestigationEvidencesResponse = ApiResponse<InvestigationEvidence[]>
