import type { ApiResponse } from "./company"
import type { WorkAreaOption } from "./work-area"

export type ManagedDocumentType = "PROCEDURE" | "MANUAL" | "INSTRUCTIVE" | "OTHERS"
export type ManagedDocumentStatus = "ACTIVE" | "INACTIVE"

export type ManagedDocument = {
  id: string
  name: string
  type: ManagedDocumentType
  version: string
  status: ManagedDocumentStatus
  workAreaId: string
  consecutive: number
  code: string
  workArea?: WorkAreaOption
}

export type ManagedDocumentFilters = {
  workAreaId?: string
}

export type UpsertManagedDocumentDto = {
  name: string
  type: ManagedDocumentType
  version: string
  workAreaId: string
  consecutive: number
  code: string
}

export type ManagedDocumentResponse = ApiResponse<ManagedDocument>
export type ManagedDocumentsResponse = ApiResponse<ManagedDocument[]>
