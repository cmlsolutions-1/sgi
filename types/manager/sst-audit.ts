export type SstAuditType = "INTERNAL" | "EXTERNAL"
export type SstAuditMethodology = "PRESENTIAL" | "VIRTUAL"
export type SstAuditStatus = "ACTIVE" | "EXPIRED" | "FINISHED"
export type SstAuditDocumentType = "OPENING_MINUTES" | "CLOSING_MINUTES" | "AUDIT_REPORT" | "OTHER_EVIDENCE"
export type SstAuditAcpmType = "PREVENTIVE" | "CORRECTIVE" | "IMPROVEMENT"
export type SstAuditActionStatus = "PENDING" | "IN_PROGRESS" | "DONE"

export type SstAuditEmployee = {
  id: string
  name: string
  lastName: string
  email?: string | null
}

export type SstAuditProcedure = {
  id: string
  name: string
  code?: string | null
}

export type SstAuditDocument = {
  id: string
  companyId: string
  ownerType?: string
  ownerId?: string
  referenceType: string
  referenceId: string
  type: SstAuditDocumentType
  label?: string | null
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  description?: string | null
  createdAt: string
  createdBy?: string | null
}

export type SstAuditAction = {
  id: string
  companyId: string
  auditId: string
  acpmId?: string | null
  type: SstAuditAcpmType
  name: string
  responsible: string
  dueDate: string
  status: SstAuditActionStatus
  createdAt: string
  updatedAt: string
}

export type SstAudit = {
  id: string
  companyId: string
  year: number
  name: string
  scheduledDate: string
  auditType: SstAuditType
  internalAuditorId?: string | null
  internalAuditor?: SstAuditEmployee | null
  externalAuditTeam?: string | null
  scope: string
  methodology: SstAuditMethodology
  status: SstAuditStatus
  procedureId: string
  procedure?: SstAuditProcedure | null
  evidencesCount: number
  actionsCount: number
  evidences?: SstAuditDocument[]
  actions?: SstAuditAction[]
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export type SstAuditList = {
  items: SstAudit[]
  total: number
  page: number
  limit: number
}

export type SstAuditFilters = {
  page?: number
  limit?: number
  year?: number
  status?: SstAuditStatus
  auditType?: SstAuditType
  methodology?: SstAuditMethodology
  search?: string
}

export type UpsertSstAuditDto = {
  year: number
  name: string
  scheduledDate: string
  auditType: SstAuditType
  internalAuditorId: string | null
  externalAuditTeam: string | null
  scope: string
  methodology: SstAuditMethodology
  status: SstAuditStatus
  procedureId: string
}

export type UploadSstAuditDocumentDto = {
  file: File
  type: SstAuditDocumentType
  description?: string
  isConfirmed?: boolean
}

export type UpsertSstAuditActionDto = {
  type: SstAuditAcpmType
  name: string
  responsible: string
  dueDate: string
  status: SstAuditActionStatus
}
