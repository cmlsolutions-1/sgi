export type WasteRecordKind = "DAILY_EVIDENCE" | "PROGRAM"
export type WasteType = "ORDINARY" | "RECYCLABLE" | "HAZARDOUS" | "LIQUID" | "GASEOUS"
export type WasteProgramProcedureType = "ORDINARY_WASTE" | "RECYCLING" | "HAZARDOUS_WASTE" | "LIQUID_WASTE" | "GASEOUS_WASTE"

export type WasteEmployeeSummary = {
  id: string
  name: string
  lastName?: string | null
  email?: string | null
}

export type WasteManagementDocument = {
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

export type WasteDailyEvidence = {
  id: string
  companyId: string
  kind: "DAILY_EVIDENCE"
  recordName: string
  wasteType: WasteType
  date: string
  responsibleEmployeeId: string
  responsibleEmployee?: WasteEmployeeSummary | null
  responsibleName?: string | null
  observations?: string | null
  evidence?: WasteManagementDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type WasteProgram = {
  id: string
  companyId: string
  kind: "PROGRAM"
  name: string
  procedureType: WasteProgramProcedureType
  date: string
  evidence?: WasteManagementDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type WasteManagementRecord = WasteDailyEvidence | WasteProgram
export type WasteManagementList = { items: WasteManagementRecord[]; total: number; page: number; limit: number }

export type WasteManagementFilters = {
  page?: number
  limit?: number
  kind?: WasteRecordKind
  wasteType?: WasteType
  procedureType?: WasteProgramProcedureType
  responsibleEmployeeId?: string
  startDate?: string
  endDate?: string
  hasEvidence?: boolean
  search?: string
}

export type UpsertWasteDailyEvidenceDto = {
  recordName: string
  wasteType: WasteType
  date: string
  responsibleEmployeeId: string
  observations?: string
}

export type UpsertWasteProgramDto = {
  name: string
  procedureType: WasteProgramProcedureType
  date: string
}

export type UploadWasteEvidenceDto = {
  file: File
  description: string
  isConfirmed?: boolean
}
