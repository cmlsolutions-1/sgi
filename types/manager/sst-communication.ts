export type SstCommunicationType = "INTERNAL" | "EXTERNAL"
export type SstCommunicationMedium = "WHATSAPP" | "EMAIL" | "MAILBOX" | "FORM" | "VERBAL" | "MEETING" | "OTHER"
export type SstCommunicationResponsibleType = "EMPLOYEE" | "MANAGER"
export type SstCommunicationDocumentType = "INITIAL_EVIDENCE" | "SIGNED_EVIDENCE"
export type SstCommunicationStatus = "PENDING_INITIAL_EVIDENCE" | "PENDING_SIGNATURE" | "SIGNED"

export type SstCommunicationEmployee = {
  id: string
  name: string
  lastName: string
  email?: string | null
  job?: { id: string; name: string } | null
}

export type SstCommunicationDocument = {
  id: string
  companyId?: string
  ownerType?: string
  ownerId?: string
  referenceType?: string
  referenceId?: string
  type: SstCommunicationDocumentType
  originalName: string
  mimeType: string
  size?: number
  storageProvider?: string
  isConfirmed?: boolean
  downloadUrl: string
  description?: string | null
  createdAt?: string
  createdBy?: string | null
}

export type SstCommunication = {
  id: string
  companyId: string
  mechanismName: string
  type: SstCommunicationType
  medium: SstCommunicationMedium
  customMedium?: string | null
  responsibleType: SstCommunicationResponsibleType
  responsibleEmployeeId?: string | null
  responsibleEmployee?: SstCommunicationEmployee | null
  managerName?: string | null
  implementationDate: string
  observations?: string | null
  informedCopasst: boolean
  initialEvidenceId?: string | null
  initialEvidence?: SstCommunicationDocument | null
  signedEvidenceId?: string | null
  signedEvidence?: SstCommunicationDocument | null
  status: SstCommunicationStatus
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export type SstCommunicationList = {
  items: SstCommunication[]
  total: number
  page: number
  limit: number
}

export type SstCommunicationFilters = {
  page?: number
  limit?: number
  type?: SstCommunicationType
  medium?: SstCommunicationMedium
  responsibleType?: SstCommunicationResponsibleType
  status?: SstCommunicationStatus
  informedCopasst?: boolean
  startDate?: string
  endDate?: string
  search?: string
}

export type UpsertSstCommunicationDto = {
  mechanismName: string
  type: SstCommunicationType
  medium: SstCommunicationMedium
  customMedium: string | null
  responsibleType: SstCommunicationResponsibleType
  responsibleEmployeeId: string | null
  managerName: string | null
  implementationDate: string
  observations: string
  informedCopasst: boolean
}

export type UploadSstCommunicationEvidenceDto = {
  file: File
  description?: string
  isConfirmed?: boolean
}
