export type HygieneRecordKind = "DAILY_EVIDENCE" | "PROGRAM"
export type HygieneImplementationType = "FORMAT" | "PROCEDURE" | "OTHER"
export type HygieneClassification = "HYGIENE" | "POTABLE_WATER"
export type HygieneProgramProcedureType = "HYGIENE" | "POTABLE_WATER" | "WASTE_DISPOSAL" | "SANITARY_SERVICES"

export type HygieneEmployeeSummary = { id: string; name: string; lastName?: string | null; email?: string | null }

export type HygieneServiceDocument = {
  id: string
  companyId: string
  ownerType?: string
  ownerId?: string
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

export type HygieneDailyEvidence = {
  id: string
  companyId: string
  kind: "DAILY_EVIDENCE"
  recordName: string
  implementationType: HygieneImplementationType
  otherImplementation?: string | null
  classification: HygieneClassification
  date: string
  responsibleEmployeeId: string
  responsibleEmployee?: HygieneEmployeeSummary | null
  responsibleName?: string | null
  observations?: string | null
  evidence?: HygieneServiceDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type HygieneProgram = {
  id: string
  companyId: string
  kind: "PROGRAM"
  name: string
  procedureType: HygieneProgramProcedureType
  date: string
  evidence?: HygieneServiceDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type HygieneServiceRecord = HygieneDailyEvidence | HygieneProgram
export type HygieneServiceList = { items: HygieneServiceRecord[]; total: number; page: number; limit: number }

export type HygieneServiceFilters = {
  page?: number
  limit?: number
  kind?: HygieneRecordKind
  implementationType?: HygieneImplementationType
  classification?: HygieneClassification
  procedureType?: HygieneProgramProcedureType
  responsibleEmployeeId?: string
  startDate?: string
  endDate?: string
  hasEvidence?: boolean
  search?: string
}

export type UpsertHygieneDailyEvidenceDto = {
  recordName: string
  implementationType: HygieneImplementationType
  otherImplementation?: string | null
  classification: HygieneClassification
  date: string
  responsibleEmployeeId: string
  observations?: string
}

export type UpsertHygieneProgramDto = { name: string; procedureType: HygieneProgramProcedureType; date: string }
export type UploadHygieneEvidenceDto = { file: File; description: string; isConfirmed?: boolean }
