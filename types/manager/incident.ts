import type { ApiResponse } from "./company"

export type IncidentEmployee = {
  id: string
  name: string
  lastName: string
}

export type IncidentStatus = "ACTIVE" | "INACTIVE"
export type IncidentType =
  | "INCIDENTE"
  | "ACCIDENTE"
  | "ENFERMEDAD_LABORAL"
  | "INCAPACIDAD_MEDICA"
  | "REVISION_POR_LA_DIRECCION"
  | "REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA"
  | "RECOMENDACION_DE_LA_ARL"
export type IncidentHazardOrigin = "FISICO" | "QUIMICO" | "BIOLOGICO" | "SEGURIDAD" | "PUBLICO" | "PSICOSOCIAL"
export type IncidentIncapacityOrigin = "COMUN" | "LABORAL"
export type IncidentCaseStatus = "ABIERTO" | "EN_INVESTIGACION" | "CERRADO"

export type IncidentWorkArea = {
  id: string
  name: string
}

export type IncidentJob = {
  id: string
  name: string
}

export type Incident = {
  id: string
  consecutive: string
  employeeId: string
  date: string
  workAreaId?: string | null
  workArea?: IncidentWorkArea | null
  jobId?: string | null
  job?: IncidentJob | null
  place: string
  description: string
  hazardOrigin?: IncidentHazardOrigin | null
  type?: IncidentType | null
  consequences: string
  correctiveActions: string
  incapacityDays?: number | null
  incapacityOrigin?: IncidentIncapacityOrigin | null
  incapacityStartDate?: string | null
  incapacityEndDate?: string | null
  isFatal?: boolean | null
  caseStatus?: IncidentCaseStatus | null
  status: IncidentStatus
  employee: IncidentEmployee
}

export type IncidentFilters = {
  employeeId?: string
  startDate?: string
  endDate?: string
}

export type CreateIncidentDto = {
  employeeId: string
  date: string
  workAreaId: string
  jobId: string
  place: string
  description: string
  hazardOrigin: IncidentHazardOrigin
  type: IncidentType
  consequences: string
  correctiveActions: string
  incapacityDays: number
  incapacityOrigin?: IncidentIncapacityOrigin
  incapacityStartDate?: string
  incapacityEndDate?: string
  isFatal: boolean
  caseStatus: IncidentCaseStatus
}

export type UpdateIncidentDto = CreateIncidentDto

export type IncidentDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: string
  referenceId: string
  type: string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string
}

export type UploadIncidentDocumentDto = {
  file: File
  type: string
  isConfirmed: boolean
}

export type IncidentResponse = ApiResponse<Incident>
export type IncidentsResponse = ApiResponse<Incident[]>
export type IncidentDocumentResponse = ApiResponse<IncidentDocument>
export type IncidentDocumentsResponse = ApiResponse<IncidentDocument[]>
