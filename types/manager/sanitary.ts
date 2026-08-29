export type RecordStatus = "ACTIVE" | "INACTIVE"

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type HygieneSupply = {
  id: string
  companyId: string
  name: string
  technicalSheet: string
  usageInstructions: string
  contraindications: string
  status: RecordStatus
}

export type CreateHygieneSupplyRequest = {
  name: string
  technicalSheet: string
  usageInstructions: string
  contraindications: string
}

export type UpdateHygieneSupplyRequest = Partial<CreateHygieneSupplyRequest>

export type HygieneSupplyFilters = {
  page?: string | number
  limit?: string | number
  status?: RecordStatus | "all"
  search?: string
}

export type SanitationType = "CLEANING_AND_DISINFECTION" | "RESERVE_TANK" | "WASTE_EXPOSURE"
export type SanitationResponsibleType = "EMPLOYEE" | "THIRD_PARTY"

export type SanitationEmployeeSummary = {
  id: string
  name: string
  lastName: string
  email: string
}

export type SanitationHygieneSupplySummary = {
  id: string
  name: string
}

export type SanitationRecord = {
  id: string
  companyId: string
  type: SanitationType
  date: string
  time: string
  responsibleType: SanitationResponsibleType
  responsibleEmployeeId: string | null
  responsibleEmployee: SanitationEmployeeSummary | null
  thirdPartyName: string | null
  hygieneSupplyIds: string[]
  hygieneSupplies: SanitationHygieneSupplySummary[]
  status: RecordStatus
}

export type CreateSanitationRequest = {
  type: SanitationType
  date: string
  time: string
  responsibleType: SanitationResponsibleType
  responsibleEmployeeId?: string
  thirdPartyName?: string
  hygieneSupplyIds?: string[]
}

export type UpdateSanitationRequest = Partial<CreateSanitationRequest>

export type SanitationFilters = {
  page?: string | number
  limit?: string | number
  type?: SanitationType | "all"
  responsibleType?: SanitationResponsibleType | "all"
  status?: RecordStatus | "all"
  responsibleEmployeeId?: string
  startDate?: string
  endDate?: string
}

export type PestControlRecord = {
  id: string
  companyId: string
  date: string
  serviceProviderCompanyName: string
  nextVisitDate: string
  status: RecordStatus
}

export type CreatePestControlRequest = {
  date: string
  serviceProviderCompanyName: string
  nextVisitDate: string
}

export type UpdatePestControlRequest = Partial<CreatePestControlRequest>

export type PestControlFilters = {
  page?: string | number
  limit?: string | number
  status?: RecordStatus | "all"
  startDate?: string
  endDate?: string
  search?: string
}

export type SanitaryDocumentType = "DOCUMENT_MANAGEMENT" | "HYGIENE_SUPPLY" | "SANITATION" | "PEST_CONTROL" | "OTHER"
export type SanitaryReferenceType = "DOCUMENT_MANAGEMENT" | "HYGIENE_SUPPLY" | "SANITATION" | "PEST_CONTROL"

export type SanitaryDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: SanitaryReferenceType
  referenceId: string
  type: SanitaryDocumentType
  originalName: string
  mimeType: string
  size: number
  storageProvider: "LOCAL" | "DIGITAL_OCEAN_SPACES"
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy?: string | null
}

export type UploadSanitaryDocumentDto = {
  file: File
  type?: SanitaryDocumentType
  isConfirmed?: boolean
}
