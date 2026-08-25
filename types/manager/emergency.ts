import type { ApiResponse } from "./company"

export type EmergencyStatus = "ACTIVE" | "INACTIVE"

export type BrigadeType =
  | "EVACUATION"
  | "FIRST_AID"
  | "FIRE_PREVENTION_AND_CONTROL"
  | "SEARCH_AND_RESCUE"
  | "COMMUNICATION_AND_INFORMATION"

export type EmergencyEmployee = {
  id: string
  name: string
  lastName: string
  email: string
}

export type EmergencyManagement = {
  id: string
  companyId: string
  planName: string
  version: string
  preparationDate: string
  effectiveDate: string
  observations: string
  status: EmergencyStatus
}

export type EmergencyManagementList = {
  items: EmergencyManagement[]
  total: number
  page: number
  limit: number
}

export type UpsertEmergencyManagementDto = {
  planName: string
  version: string
  preparationDate: string
  effectiveDate: string
  observations: string
}

export type EmergencyManagementFilters = {
  page?: string | number
  limit?: string | number
  status?: EmergencyStatus | "all"
  startDate?: string
  endDate?: string
  search?: string
}

export type EmergencyBrigade = {
  id: string
  companyId: string
  objective: string
  functions: string
  observations: string
  employeeIds: string[]
  employees: EmergencyEmployee[]
  status: EmergencyStatus
  brigadeType: BrigadeType
}

export type EmergencyBrigadeList = {
  items: EmergencyBrigade[]
  total: number
  page: number
  limit: number
}

export type UpsertEmergencyBrigadeDto = {
  objective: string
  functions: string
  observations: string
  employeeIds: string[]
  brigadeType: BrigadeType
}

export type EmergencyBrigadeFilters = {
  page?: string | number
  limit?: string | number
  status?: EmergencyStatus | "all"
  brigadeType?: BrigadeType | "all"
  search?: string
}

export type EmergencyDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: "EMERGENCY_MANAGEMENT" | "EMERGENCY_BRIGADE" | string
  referenceId: string
  type: "EMERGENCY_MANAGEMENT" | "EMERGENCY_BRIGADE" | "OTHER" | string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy?: string | null
}

export type UploadEmergencyManagementDocumentDto = {
  file: File
  type?: "EMERGENCY_MANAGEMENT" | "OTHER" | string
  isConfirmed?: boolean
}

export type UploadEmergencyBrigadeDocumentDto = {
  file: File
  type?: "EMERGENCY_BRIGADE" | "OTHER" | string
  isConfirmed?: boolean
}

export type EmergencyManagementResponse = ApiResponse<EmergencyManagement>
export type EmergencyManagementListResponse = ApiResponse<EmergencyManagementList>
export type EmergencyBrigadeResponse = ApiResponse<EmergencyBrigade>
export type EmergencyBrigadeListResponse = ApiResponse<EmergencyBrigadeList>
export type EmergencyDocumentResponse = ApiResponse<EmergencyDocument>
export type EmergencyDocumentsResponse = ApiResponse<EmergencyDocument[]>
