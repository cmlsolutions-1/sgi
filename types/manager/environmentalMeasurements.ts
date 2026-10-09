export type EnvironmentalRecordKind = "MEASUREMENT" | "PROCEDURE"
export type EnvironmentalMeasurementType = "NOISE" | "LIGHTING" | "VIBRATION" | "CHEMICAL" | "BIOLOGICAL" | "TEMPERATURE" | "OTHER"
export type EnvironmentalMeasurementResult = "COMPLIES" | "DOES_NOT_COMPLY" | "IN_EVALUATION"
export type EnvironmentalProcedureType = "FORMATO" | "PROCEDIMIENTO" | "OTRO"

export type EnvironmentalResponsibleEmployee = {
  id: string
  name: string
  lastName?: string | null
  email?: string | null
}

export type EnvironmentalMeasurementDocument = {
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

export type EnvironmentalMeasurement = {
  id: string
  companyId: string
  kind: "MEASUREMENT"
  name: string
  procedureDocumentId: string
  procedureDocumentName: string
  measurementType: EnvironmentalMeasurementType
  riskId: string
  riskName: string
  measurementDate: string
  laboratory: string
  responsibleEmployeeId: string
  responsibleEmployee?: EnvironmentalResponsibleEmployee | null
  responsibleName?: string | null
  result: EnvironmentalMeasurementResult
  observations?: string | null
  evidence?: EnvironmentalMeasurementDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type EnvironmentalProcedure = {
  id: string
  companyId: string
  kind: "PROCEDURE"
  name: string
  procedureType: EnvironmentalProcedureType
  relatedProcedureId: string
  relatedProcedureName: string
  date: string
  evidence?: EnvironmentalMeasurementDocument | null
  createdAt: string
  updatedAt?: string
  createdBy?: string | null
}

export type EnvironmentalRecord = EnvironmentalMeasurement | EnvironmentalProcedure

export type EnvironmentalMeasurementList = {
  items: EnvironmentalRecord[]
  total: number
  page: number
  limit: number
}

export type EnvironmentalMeasurementFilters = {
  page?: number
  limit?: number
  kind?: EnvironmentalRecordKind
  measurementType?: EnvironmentalMeasurementType
  result?: EnvironmentalMeasurementResult
  procedureType?: EnvironmentalProcedureType
  responsibleEmployeeId?: string
  riskId?: string
  startDate?: string
  endDate?: string
  hasEvidence?: boolean
  search?: string
}

export type UpsertEnvironmentalMeasurementDto = {
  name: string
  procedureDocumentId: string
  measurementType: EnvironmentalMeasurementType
  riskId: string
  measurementDate: string
  laboratory: string
  responsibleEmployeeId: string
  result: EnvironmentalMeasurementResult
  observations?: string
}

export type UpsertEnvironmentalProcedureDto = {
  name: string
  procedureType: EnvironmentalProcedureType
  relatedProcedureId: string
  date: string
}

export type UploadEnvironmentalEvidenceDto = {
  file: File
  description: string
  isConfirmed?: boolean
}
