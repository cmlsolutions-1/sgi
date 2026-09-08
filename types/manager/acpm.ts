import type { ApiResponse } from "./company"

export type AcpmType = "CORRECTIVE" | "PREVENTIVE" | "IMPROVEMENT"
export type AcpmOrigin = "INVESTIGATION" | "AUDIT" | "INSPECTION" | "INDICATOR" | "OTHER"
export type AcpmStatus = "ACTIVE" | "INACTIVE"

export type AcpmEmployeeSummary = {
  id: string
  name: string
  lastName: string
  email: string
}

export type Acpm = {
  id: string
  companyId: string
  year: number
  type: AcpmType
  origin: AcpmOrigin
  name: string
  description: string
  responsibleEmployeeId: string
  responsibleEmployee?: AcpmEmployeeSummary | null
  dueDate: string
  nonConformityDescription: string
  detectionDate: string
  relatedDocument?: string | null
  currentCompletionPercentage: number
  status: AcpmStatus
}

export type AcpmList = {
  items: Acpm[]
  total: number
  page: number
  limit: number
}

export type AcpmFilters = {
  page?: number
  limit?: number
  year?: number
  type?: AcpmType
  origin?: AcpmOrigin
  status?: AcpmStatus
  responsibleEmployeeId?: string
  startDueDate?: string
  endDueDate?: string
  search?: string
}

export type CreateAcpmDto = {
  year: number
  type: AcpmType
  origin: AcpmOrigin
  name: string
  description: string
  responsibleEmployeeId: string
  dueDate: string
  nonConformityDescription: string
  detectionDate: string
  relatedDocument?: string | null
}

export type UpdateAcpmDto = Partial<
  Pick<
    CreateAcpmDto,
    "type" | "origin" | "name" | "description" | "responsibleEmployeeId" | "nonConformityDescription" | "relatedDocument"
  >
>

export type ChangeAcpmStatusDto = {
  status: AcpmStatus
}

export type AcpmFollowUp = {
  id: string
  companyId: string
  acpmId: string
  followUpDate: string
  completionPercentage: number
  observations: string
  evidence?: string | null
  createdAt: string
  createdBy?: string | null
}

export type CreateAcpmFollowUpDto = {
  followUpDate: string
  completionPercentage: number
  observations: string
  evidence?: string | null
}

export type AcpmResponse = ApiResponse<Acpm>
export type AcpmListResponse = ApiResponse<AcpmList>
export type AcpmFollowUpResponse = ApiResponse<AcpmFollowUp>
export type AcpmFollowUpsResponse = ApiResponse<AcpmFollowUp[]>
