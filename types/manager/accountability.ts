export type AccountabilityExecutionType = "MANUAL" | "AUTOMATIC"
export type AccountabilityStatus = "PENDING_DOCUMENT" | "DOCUMENT_UPLOADED" | "SIGNED" | "INACTIVE"

export type AccountabilityResult = {
  annualPlanExecution: number
  trainingsCompleted: number
  trainingsPlanned: number
  accidentsReported: number
  copasstMeetings: number
  riskMatrixUpdated: boolean
  preventiveMeasuresImplementation: number
}

export type AccountabilityDocumentSummary = {
  id: string
  fileName: string
  uploadedAt: string
  isConfirmed: boolean
}

export type AccountabilityDocument = {
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

export type AccountabilityIndicatorSnapshot = {
  id: string
  key: string
  label: string
  value: string
  numericValue?: number | null
  sourceModule: string
  sourceMetadata?: Record<string, unknown> | null
  createdAt: string
}

export type AccountabilityReport = {
  id: string
  companyId: string
  year: number
  renditionDate: string
  sgiResponsibleEmployeeId: string
  sgiResponsibleName: string
  legalRepresentativeEmployeeId?: string | null
  legalRepresentativeName: string
  executionType: AccountabilityExecutionType
  status: AccountabilityStatus
  observations?: string | null
  result: AccountabilityResult
  document?: AccountabilityDocumentSummary | null
  generatedDocumentId?: string | null
  signedDocumentId?: string | null
  createdAt: string
  updatedAt: string
  createdByUserId?: string | null
  updatedByUserId?: string | null
}

export type AccountabilityReportDetail = AccountabilityReport & {
  documents?: AccountabilityDocument[]
  indicatorSnapshots?: AccountabilityIndicatorSnapshot[]
}

export type AccountabilityReportList = {
  items: AccountabilityReport[]
  total: number
  page: number
  limit: number
}

export type AccountabilitySummary = {
  reports: number
  pendingDocument: number
  documentUploaded: number
  signed: number
  automatic: number
  latestYear: number
}

export type AccountabilityFilters = {
  page?: number
  limit?: number
  search?: string
  year?: number
  executionType?: AccountabilityExecutionType
  status?: AccountabilityStatus
  startDate?: string
  endDate?: string
}

export type UpsertAccountabilityReportDto = {
  year: number
  renditionDate: string
  sgiResponsibleEmployeeId: string
  legalRepresentativeEmployeeId?: string
  legalRepresentativeName: string
  executionType: AccountabilityExecutionType
  observations?: string
}

export type UploadAccountabilityDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  observation?: string
  description?: string
}
