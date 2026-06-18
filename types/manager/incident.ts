import type { ApiResponse } from "./company"

export type IncidentEmployee = {
  id: string
  name: string
  lastName: string
}

export type IncidentStatus = "ACTIVE" | "INACTIVE"
export type IncidentType = "INCIDENTE" | "ACCIDENTE" | "ENFERMEDAD_LABORAL"

export type Incident = {
  id: string
  consecutive: string
  employeeId: string
  date: string
  place: string
  description: string
  type?: IncidentType | null
  consequences: string
  correctiveActions: string
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
  place: string
  description: string
  type: IncidentType
  consequences: string
  correctiveActions: string
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
