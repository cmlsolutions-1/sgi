export type InitialEvaluationCycle = "PLANEAR" | "HACER" | "VERIFICAR" | "ACTUAR"
export type InitialEvaluationCompliance = "COMPLIES" | "DOES_NOT_COMPLY" | "NOT_APPLICABLE"
export type InitialEvaluationStatus = "DRAFT" | "COMPLETED" | "SIGNED" | "INACTIVE"

export type InitialEvaluationStandardItem = {
  id: string
  code: string
  cycle: InitialEvaluationCycle
  standard: string
  standardItem: string
  value: number
  percentageWeight: number
  possibleScore: number
  action: string
  appliesModule: string
  order: number
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

export type InitialEvaluationCompany = { id: string; name: string }

export type InitialEvaluation = {
  id: string
  companyId: string
  name: string
  year: number
  date: string
  company: InitialEvaluationCompany
  responsible: string
  observations: string | null
  totalScore: number
  totalPossible: number
  totalPercentage: number
  findingsCount: number
  status: InitialEvaluationStatus
  createdAt: string
  updatedAt: string
  createdByUserId: string | null
  updatedByUserId: string | null
}

export type InitialEvaluationAnswer = {
  id: string
  standardItemId: string
  standardItem: Pick<
    InitialEvaluationStandardItem,
    "id" | "code" | "cycle" | "standard" | "standardItem" | "possibleScore" | "percentageWeight" | "action" | "appliesModule"
  >
  compliance: InitialEvaluationCompliance
  score: number
  observation: string | null
}

export type InitialEvaluationCycleResult = {
  cycle: InitialEvaluationCycle
  score: number
  possible: number
  percentage: number
}

export type InitialEvaluationResults = {
  totalScore: number
  totalPossible: number
  totalPercentage: number
  findingsCount: number
  byCycle: InitialEvaluationCycleResult[]
}

export type InitialEvaluationDocument = {
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

export type InitialEvaluationDetail = InitialEvaluation & {
  answers: InitialEvaluationAnswer[]
  results: InitialEvaluationResults
  documents: InitialEvaluationDocument[]
}

export type InitialEvaluationFinding = {
  standardItemId: string
  code: string
  cycle: InitialEvaluationCycle
  standard: string
  standardItem: string
  lostScore: number
  action: string
  appliesModule: string
  observation: string | null
}

export type InitialEvaluationSummary = {
  evaluations: number
  latestEvaluationId: string | null
  latestScore: number
  latestTotalPossible: number
  latestCompliancePercentage: number
  latestFindings: number
  byCycle: InitialEvaluationCycleResult[]
}

export type InitialEvaluationList = { items: InitialEvaluation[]; total: number; page: number; limit: number }

export type InitialEvaluationFilters = {
  page?: number
  limit?: number
  search?: string
  year?: number
  status?: InitialEvaluationStatus
  startDate?: string
  endDate?: string
}

export type UpsertInitialEvaluationDto = {
  name: string
  year: number
  date: string
  responsible: string
  observations?: string
  answers: Array<{
    standardItemId: string
    compliance: InitialEvaluationCompliance
    observation?: string
  }>
}

export type UploadInitialEvaluationDocumentDto = {
  file: File
  type?: string
  isConfirmed?: boolean
  observation?: string
  description?: string
}
