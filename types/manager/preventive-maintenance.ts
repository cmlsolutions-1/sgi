import type { ApiResponse } from "./company"

export type PreventiveMaintenanceAction = "PREVENTIVE" | "CORRECTIVE" | "IMPROVEMENT"
export type PreventiveMaintenanceStatus = "ACTIVE" | "INACTIVE"
export type PreventiveMaintenanceDocumentType = "PREVENTIVE_MAINTENANCE" | "OTHER"

export type PreventiveMaintenanceEmployee = {
  id: string
  name: string
  lastName: string
  email: string
}

export type PreventiveMaintenance = {
  id: string
  companyId: string
  action: PreventiveMaintenanceAction
  description: string
  date: string
  responsibleEmployeeId: string
  responsibleEmployee?: PreventiveMaintenanceEmployee | null
  observations: string
  status: PreventiveMaintenanceStatus
}

export type PreventiveMaintenanceList = {
  items: PreventiveMaintenance[]
  total: number
  page: number
  limit: number
}

export type UpsertPreventiveMaintenanceDto = {
  action: PreventiveMaintenanceAction
  description: string
  date: string
  responsibleEmployeeId: string
  observations: string
}

export type PreventiveMaintenanceFilters = {
  page?: string | number
  limit?: string | number
  action?: PreventiveMaintenanceAction | "all"
  status?: PreventiveMaintenanceStatus | "all"
  responsibleEmployeeId?: string
  startDate?: string
  endDate?: string
  search?: string
}

export type PreventiveMaintenanceDocument = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: "PREVENTIVE_MAINTENANCE" | string
  referenceId: string
  type: PreventiveMaintenanceDocumentType | string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy?: string | null
}

export type UploadPreventiveMaintenanceDocumentDto = {
  file: File
  type?: PreventiveMaintenanceDocumentType | string
  isConfirmed?: boolean
}

export type PreventiveMaintenanceResponse = ApiResponse<PreventiveMaintenance>
export type PreventiveMaintenanceListResponse = ApiResponse<PreventiveMaintenanceList>
export type PreventiveMaintenanceDocumentResponse = ApiResponse<PreventiveMaintenanceDocument>
export type PreventiveMaintenanceDocumentsResponse = ApiResponse<PreventiveMaintenanceDocument[]>
