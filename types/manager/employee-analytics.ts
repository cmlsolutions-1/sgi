import type { ApiResponse } from "./company"
import type { IncidentType } from "./incident"

export type EmployeeAnalyticsPeriodicity = "ANNUAL" | "SEMESTER" | "QUARTER" | "BIMONTHLY" | "MONTHLY"
export type EmployeeAnalyticsImprovementStatus = "OPEN" | "CLOSED"

export type EmployeeAnalyticsResponsible = {
  id: string
  name: string
  lastName: string
  email?: string | null
  job?: { id: string; name: string } | null
}

export type EmployeeAnalyticsChartDatum = {
  name?: string
  total?: number
  [key: string]: unknown
}

export type EmployeeAnalyticsIndicator = {
  id: string
  reportId: string
  key: string
  name: string
  value: number
  unit: string
  description: string
  chartData: EmployeeAnalyticsChartDatum[]
}

export type EmployeeAnalyticsImprovementAction = {
  id: string
  reportId: string
  description: string
  responsible: string
  dueDate: string
  status: EmployeeAnalyticsImprovementStatus
  createdAt: string
  updatedAt: string
}

export type EmployeeAnalyticsDocument = {
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

export type EmployeeAnalyticsReport = {
  id: string
  companyId: string
  periodicity: EmployeeAnalyticsPeriodicity
  year: number
  period: string
  responsibleEmployeeId: string
  responsibleEmployee: EmployeeAnalyticsResponsible
  analysisDate: string
  incidentType: IncidentType
  indicators: EmployeeAnalyticsIndicator[]
  improvementAction?: EmployeeAnalyticsImprovementAction | null
  evidenceCount: number
  latestEvidence?: EmployeeAnalyticsDocument | null
  evidences?: EmployeeAnalyticsDocument[]
  createdAt: string
  updatedAt: string
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export type EmployeeAnalyticsList = {
  items: EmployeeAnalyticsReport[]
  total: number
  page: number
  limit: number
}

export type EmployeeAnalyticsFilters = {
  page?: number
  limit?: number
  search?: string
  year?: number
  periodicity?: EmployeeAnalyticsPeriodicity
  period?: string
  incidentType?: IncidentType
  responsibleEmployeeId?: string
  startDate?: string
  endDate?: string
}

export type UpsertEmployeeAnalyticsDto = {
  periodicity: EmployeeAnalyticsPeriodicity
  year: number
  period: string
  responsibleEmployeeId: string
  analysisDate: string
  incidentType: IncidentType
}

export type SaveEmployeeAnalyticsImprovementDto = {
  description: string
  responsible: string
  dueDate: string
  status: EmployeeAnalyticsImprovementStatus
}

export type UploadEmployeeAnalyticsDocumentDto = {
  file: File
  description: string
  isConfirmed?: boolean
}

export type EmployeeAnalyticsResponse = ApiResponse<EmployeeAnalyticsReport>
export type EmployeeAnalyticsListResponse = ApiResponse<EmployeeAnalyticsList>
export type EmployeeAnalyticsImprovementResponse = ApiResponse<EmployeeAnalyticsImprovementAction>
export type EmployeeAnalyticsDocumentResponse = ApiResponse<EmployeeAnalyticsDocument>
export type EmployeeAnalyticsDocumentsResponse = ApiResponse<EmployeeAnalyticsDocument[]>
