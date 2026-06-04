import type { ApiResponse } from "./company"
import type { Job } from "./job"
import type { WorkAreaOption } from "./work-area"

export type ManagedDocumentType = "PROCEDURE" | "MANUAL" | "INSTRUCTIVE" | "OTHERS"
export type ManagedDocumentStatus = "ACTIVE" | "INACTIVE"

export type ManagedDocument = {
  id: string
  name: string
  type: ManagedDocumentType
  version: string
  objective: string
  activities: string
  resources: string
  status: ManagedDocumentStatus
  workAreaId: string
  jobId: string
  responsibleEmployeeId: string
  consecutive: number
  code: string
  workArea?: WorkAreaOption
  job?: Pick<Job, "id" | "name" | "description">
  responsibleEmployee?: {
    id: string
    name: string
    lastName: string
    email: string
  }
}

export type ManagedDocumentFilters = {
  workAreaId?: string
}

export type UpsertManagedDocumentDto = {
  name: string
  type: ManagedDocumentType
  version: string
  objective: string
  activities: string
  resources: string
  workAreaId: string
  jobId: string
  responsibleEmployeeId: string
  consecutive: number
  code: string
}

export type ManagedDocumentResponse = ApiResponse<ManagedDocument>
export type ManagedDocumentsResponse = ApiResponse<ManagedDocument[]>
