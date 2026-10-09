export type WorkPlanStatus = "PENDING_APPROVAL" | "APPROVED"
export type WorkPlanDocumentType = "WORK_PLAN_GENERATED" | "WORK_PLAN_SIGNED"

export type WorkPlanEmployeeSummary = {
  id: string
  name: string
  lastName?: string | null
  email?: string | null
  job?: { id: string; name: string } | null
}

export type WorkPlanDocument = {
  id: string
  companyId: string
  ownerType?: string
  ownerId?: string
  referenceType: string
  referenceId: string
  type: WorkPlanDocumentType | string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy?: string | null
}

export type WorkPlanItem = {
  id: string
  companyId: string
  consecutive: string
  year: number
  activity: string
  objective: string
  budget: number
  responsibleEmployeeId: string
  responsibleEmployee?: WorkPlanEmployeeSummary | null
  expectedEvidence: string
  status: WorkPlanStatus
  approvedBy?: string | null
  approvedAt?: string | null
  signedEvidenceId?: string | null
  signedEvidence?: WorkPlanDocument | null
  createdAt: string
  updatedAt?: string
}

export type WorkPlanList = {
  items: WorkPlanItem[]
  total: number
  page: number
  limit: number
}

export type WorkPlanFilters = {
  page?: number
  limit?: number
  search?: string
  year?: number
  status?: WorkPlanStatus
  responsibleEmployeeId?: string
}

export type UpsertWorkPlanDto = {
  year: number
  activity: string
  objective: string
  budget: number
  responsibleEmployeeId: string
  expectedEvidence: string
}

export type GenerateWorkPlanDocumentDto = {
  year: number
  workPlanItemIds: string[]
}

export type GeneratedWorkPlanDocument = {
  documentId: string
  fileName: string
  downloadUrl: string
  expiresAt?: string | null
}

export type ApproveWorkPlanDto = {
  workPlanItemIds: string[]
  approvedBy: string
  file: File
  type?: WorkPlanDocumentType
  isConfirmed?: boolean
}

export type WorkPlanApprovalResult = {
  approvalId: string
  approvedBy: string
  approvedAt: string
  approvedItemIds: string[]
  document: WorkPlanDocument
}

export type WorkPlanSummary = {
  total: number
  pending: number
  approved: number
  budget: number
}

export type UploadWorkPlanDocumentDto = {
  file: File
  type?: WorkPlanDocumentType
  isConfirmed?: boolean
}
