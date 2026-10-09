export type HazardousRecordKind = "SUBSTANCE" | "PROGRAM"
export type HazardousSubstanceType = "CARCINOGENIC" | "ACUTE_TOXICITY" | "BOTH"
export type HazardousSubstanceClassification = "IARC_GROUP" | "GHS_CATEGORY"
export type HazardousProgramProcedureType = "STORAGE" | "HANDLING" | "EMERGENCY" | "DISPOSAL" | "PPE"

export type HazardousResponsibleEmployee = {
  id: string
  name: string
  lastName?: string | null
  email?: string | null
}

export type HazardousSubstanceDocument = {
  id: string
  companyId: string
  referenceType: string
  referenceId: string
  type: string
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

export type HazardousSubstance = {
  id: string
  companyId: string
  kind: "SUBSTANCE"
  substanceName: string
  type: HazardousSubstanceType
  classification: HazardousSubstanceClassification
  storageArea: string
  technicalSheet: string
  recommendation: string
  responsibleEmployeeId: string
  responsibleEmployee?: HazardousResponsibleEmployee | null
  responsibleName?: string | null
  riskId: string
  riskName: string
  preventiveMeasureId: string
  preventiveMeasureName: string
  procedureDocumentId: string
  procedureDocumentName: string
  observations?: string | null
  evidence?: HazardousSubstanceDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type HazardousSubstanceProgram = {
  id: string
  companyId: string
  kind: "PROGRAM"
  name: string
  procedureType: HazardousProgramProcedureType
  date: string
  evidence?: HazardousSubstanceDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type HazardousSubstanceRecord = HazardousSubstance | HazardousSubstanceProgram

export type HazardousSubstanceList = {
  items: HazardousSubstanceRecord[]
  total: number
  page: number
  limit: number
}

export type HazardousSubstanceFilters = {
  page?: number
  limit?: number
  kind?: HazardousRecordKind
  type?: HazardousSubstanceType
  classification?: HazardousSubstanceClassification
  procedureType?: HazardousProgramProcedureType
  responsibleEmployeeId?: string
  riskId?: string
  search?: string
  hasEvidence?: boolean
}

export type UpsertHazardousSubstanceDto = {
  substanceName: string
  type: HazardousSubstanceType
  classification: HazardousSubstanceClassification
  storageArea: string
  technicalSheet: string
  recommendation: string
  responsibleEmployeeId: string
  riskId: string
  preventiveMeasureId: string
  procedureDocumentId: string
  observations?: string
}

export type UpsertHazardousProgramDto = {
  name: string
  procedureType: HazardousProgramProcedureType
  date: string
}

export type UploadHazardousEvidenceDto = {
  file: File
  description: string
  isConfirmed?: boolean
}
