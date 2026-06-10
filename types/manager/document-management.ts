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

export type ManagedDocumentFile = {
  id: string
  companyId: string
  ownerType: string
  ownerId: string
  referenceType: "DOCUMENT_MANAGEMENT" | string
  referenceId: string
  type: "DOCUMENT_MANAGEMENT" | string
  originalName: string
  mimeType: string
  size: number
  storageProvider: string
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string
}

export type UploadManagedDocumentFileDto = {
  file: File
  type?: string
  isConfirmed?: boolean
}

export type ManagedDocumentResponse = ApiResponse<ManagedDocument>
export type ManagedDocumentsResponse = ApiResponse<ManagedDocument[]>
export type ManagedDocumentFileResponse = ApiResponse<ManagedDocumentFile>
export type ManagedDocumentFilesResponse = ApiResponse<ManagedDocumentFile[]>
