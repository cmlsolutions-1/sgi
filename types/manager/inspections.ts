export type InspectionElementType = "INSTALLATION" | "MACHINERY" | "EQUIPMENT" | "EMERGENCY" | "OTHER"
export type InspectionAction = "INSPECTION" | "MAINTENANCE"
export type InspectionResult = "COMPLIES" | "DOES_NOT_COMPLY" | "PARTIAL"

export type InspectionEmployeeSummary = {
  id: string
  name: string
  lastName?: string | null
  email?: string | null
}

export type InspectionDocument = {
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

export type InspectionRecord = {
  id: string
  companyId: string
  elementName: string
  elementType: InspectionElementType
  action: InspectionAction
  description: string
  workAreaId: string
  workArea?: { id: string; name: string } | null
  workAreaName?: string | null
  date: string
  responsibleEmployeeId: string
  responsibleEmployee?: InspectionEmployeeSummary | null
  responsibleName?: string | null
  copasstParticipated: boolean
  result: InspectionResult
  observations?: string | null
  evidence?: InspectionDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type InspectionList = { items: InspectionRecord[]; total: number; page: number; limit: number }

export type InspectionFilters = {
  page?: number
  limit?: number
  elementType?: InspectionElementType
  action?: InspectionAction
  result?: InspectionResult
  workAreaId?: string
  responsibleEmployeeId?: string
  copasstParticipated?: boolean
  startDate?: string
  endDate?: string
  hasEvidence?: boolean
  search?: string
}

export type UpsertInspectionDto = {
  elementName: string
  elementType: InspectionElementType
  action: InspectionAction
  description: string
  workAreaId: string
  date: string
  responsibleEmployeeId: string
  copasstParticipated: boolean
  result: InspectionResult
  observations?: string
}

export type UploadInspectionEvidenceDto = { file: File; description: string; isConfirmed?: boolean }
