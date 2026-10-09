export type LegalDocumentType = "LEY" | "DECRETO" | "RESOLUCION" | "CIRCULAR" | "NORMA_TECNICA" | "OTRO"
export type LegalMatrixStatus = "ACTIVE" | "EXPIRED"

export type LegalMatrixDocument = {
  id: string
  companyId?: string
  ownerType?: string
  ownerId?: string
  referenceType?: string
  referenceId?: string
  type: "LEGAL_MATRIX_EVIDENCE"
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

export type LegalMatrixItem = {
  id: string
  companyId: string
  documentType: LegalDocumentType
  customDocumentType?: string | null
  normNumber: string
  emissionDate: string
  expirationDate: string
  issuedBy: string
  status: LegalMatrixStatus
  evidenceId?: string | null
  evidence?: LegalMatrixDocument | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
}

export type LegalMatrixList = {
  items: LegalMatrixItem[]
  total: number
  page: number
  limit: number
}

export type LegalMatrixFilters = {
  page?: number
  limit?: number
  documentType?: LegalDocumentType
  status?: LegalMatrixStatus
  startEmissionDate?: string
  endEmissionDate?: string
  startExpirationDate?: string
  endExpirationDate?: string
  search?: string
}

export type UpsertLegalMatrixDto = {
  documentType: LegalDocumentType
  customDocumentType: string | null
  normNumber: string
  emissionDate: string
  expirationDate: string
  issuedBy: string
}

export type UploadLegalMatrixEvidenceDto = {
  file: File
  description?: string
  isConfirmed?: boolean
}
