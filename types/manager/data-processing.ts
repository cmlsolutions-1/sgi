export type DataAuthorizationStatus =
  | "PENDING"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "REVOKED"
  | "REQUIRES_REACCEPTANCE"
  | "EXPIRED"

export type DataConsentAuditEvent =
  | "CONSENT_LINK_CREATED"
  | "CONSENT_LINK_OPENED"
  | "IDENTITY_VERIFIED"
  | "IDENTITY_VERIFICATION_FAILED"
  | "CONSENT_ACCEPTED"
  | "CONSENT_REJECTED"
  | "CONSENT_REVOKED"
  | "CONSENT_PDF_GENERATED"
  | "CONSENT_LINK_EXPIRED"
  | "REACCEPTANCE_REQUIRED"

export type DataConsentEmployee = {
  id: string
  companyId: string
  companyName: string
  name: string
  lastName: string
  documentType: string
  documentNumber: string
  documentNumberMasked: string
  birthDate: string
  email: string
  phone: string
  dataAuthorizationStatus: DataAuthorizationStatus
  dataAuthorizationAcceptedAt?: string | null
}

export type DataProcessingConsentTemplate = {
  id: string
  companyId?: string | null
  title: string
  version: string
  content: string
  effectiveDate: string
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}

export type ConsentAuditLog = {
  id: string
  event: DataConsentAuditEvent
  timestamp: string
  actor: "ADMIN" | "EMPLOYEE" | "SYSTEM"
  metadata?: Record<string, string | number | boolean | null>
}

export type EmployeeDataConsent = {
  id: string
  companyId: string
  employeeId: string
  employee: DataConsentEmployee
  templateId: string
  template: DataProcessingConsentTemplate
  templateVersion: string
  status: DataAuthorizationStatus
  token?: string | null
  publicUrl?: string | null
  sentAt?: string | null
  expiresAt?: string | null
  acceptedAt?: string | null
  rejectedAt?: string | null
  revokedAt?: string | null
  verificationMethod?: "DOCUMENT_AND_BIRTH_DATE" | null
  signatureFileId?: string | null
  documentNumberMasked: string
  birthDateVerified?: boolean
  ipAddress?: string | null
  userAgent?: string | null
  browser?: string | null
  operatingSystem?: string | null
  deviceType?: string | null
  consentTextHash?: string | null
  evidenceHash?: string | null
  verificationCode?: string | null
  certificateAvailable?: boolean
  attempts: number
  blockedUntil?: string | null
  auditLogs: ConsentAuditLog[]
  createdAt: string
  updatedAt: string
}

export type DataConsentSummary = {
  totalEmployees: number
  accepted: number
  pending: number
  expired: number
  requiresReacceptance: number
}

export type PublicDataConsent = {
  id: string
  companyName: string
  employeeName: string
  documentType: string
  documentNumberMasked: string
  templateTitle: string
  templateVersion: string
  templateContent?: string
  status: DataAuthorizationStatus
  expiresAt?: string | null
  verificationToken?: string
  verificationExpiresAt?: string
}

export type PublicConsentVerification = {
  valid: boolean
  companyName: string
  protectedEmployeeName: string
  acceptedAt: string
  templateVersion: string
  status: DataAuthorizationStatus
  verificationCode: string
}
