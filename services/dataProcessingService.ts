import jsPDF from "jspdf"

import type {
  ConsentAuditLog,
  DataAuthorizationStatus,
  DataConsentAuditEvent,
  DataConsentEmployee,
  DataConsentSummary,
  EmployeeDataConsent,
  PublicConsentVerification,
  PublicDataConsent,
} from "@/types/manager/data-processing"

const STORAGE_KEY = "safecloud_data_processing_mock_v1"
const DEFAULT_VALIDITY_DAYS = 7
export const DEMO_CONSENT_TOKEN = "demo-autorizacion-safecloud"

export const dataAuthorizationStatusLabels: Record<DataAuthorizationStatus, string> = {
  PENDING: "Pendiente",
  SENT: "Autorización enviada",
  ACCEPTED: "Autorización aceptada",
  REJECTED: "Autorización rechazada",
  REVOKED: "Autorización revocada",
  REQUIRES_REACCEPTANCE: "Requiere nueva aceptación",
  EXPIRED: "Enlace vencido",
}

export const dataAuthorizationStatusOptions: Array<{ value: DataAuthorizationStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PENDING", label: "Pendientes" },
  { value: "SENT", label: "Enviados" },
  { value: "ACCEPTED", label: "Aceptados" },
  { value: "REJECTED", label: "Rechazados" },
  { value: "REVOKED", label: "Revocados" },
  { value: "EXPIRED", label: "Vencidos" },
  { value: "REQUIRES_REACCEPTANCE", label: "Requieren nueva aceptación" },
]

function nowIso() {
  return new Date().toISOString()
}

function addDaysIso(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function createId(prefix: string) {
  const value =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36)

  return `${prefix}_${value}`
}

function maskDocument(documentNumber: string) {
  const clean = documentNumber.replace(/\D/g, "")
  if (clean.length <= 4) return "****"
  return `${"*".repeat(Math.max(clean.length - 4, 4))}${clean.slice(-4)}`
}

function protectName(name: string, lastName: string) {
  const first = name.trim().charAt(0).toUpperCase()
  const second = lastName.trim().charAt(0).toUpperCase()
  return `${first || "T"}.${second || "D"}.`
}

async function sha256(value: string) {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(value)
    const digest = await crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  }

  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return `mock-${Math.abs(hash).toString(16)}`
}

function createAudit(event: DataConsentAuditEvent, actor: ConsentAuditLog["actor"], metadata = {}) {
  return {
    id: createId("audit"),
    event,
    actor,
    metadata,
    timestamp: nowIso(),
  } satisfies ConsentAuditLog
}

const template = {
  id: "tpl_safecloud_1",
  companyId: null,
  title: "Autorización para el Tratamiento de Datos Personales",
  version: "1.0",
  effectiveDate: "2026-08-26",
  status: "ACTIVE" as const,
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
  content:
    "Autorizo de manera libre, previa, expresa e informada a SafeCloud - Sistema de Gestión Integral y a la empresa vinculada para recolectar, almacenar, usar, circular, actualizar y tratar mis datos personales con la finalidad de gestionar mi vinculación laboral, cumplir obligaciones legales, documentar actividades del SGI, administrar información de seguridad y salud en el trabajo, emitir soportes, conservar evidencias y atender procesos internos autorizados. Declaro que conozco mis derechos como titular de datos personales, incluyendo consultar, actualizar, rectificar, solicitar prueba de la autorización, revocar la autorización cuando sea procedente y presentar reclamos ante la autoridad competente. Esta autorización no constituye una firma digital certificada; corresponde a una firma electrónica manuscrita acompañada de validación de identidad, trazabilidad y evidencia electrónica.",
}

function createEmployee(
  id: string,
  name: string,
  lastName: string,
  documentNumber: string,
  birthDate: string,
  status: DataAuthorizationStatus,
): DataConsentEmployee {
  return {
    id,
    companyId: "company_safecloud_demo",
    companyName: "Alfonsilla S.A.S.",
    name,
    lastName,
    documentType: "CC",
    documentNumber,
    documentNumberMasked: maskDocument(documentNumber),
    birthDate,
    email: `${name.toLowerCase().replace(/\s/g, ".")}@empresa.com`,
    phone: "3211234567",
    dataAuthorizationStatus: status,
    dataAuthorizationAcceptedAt: status === "ACCEPTED" ? "2026-08-20T14:30:00.000Z" : null,
  }
}

function createConsent(employee: DataConsentEmployee, status: DataAuthorizationStatus, token?: string): EmployeeDataConsent {
  const sentAt = status === "SENT" || status === "EXPIRED" ? "2026-08-22T13:00:00.000Z" : null
  const expiresAt = status === "EXPIRED" ? "2026-08-23T13:00:00.000Z" : status === "SENT" ? addDaysIso(2) : null
  const acceptedAt = status === "ACCEPTED" ? employee.dataAuthorizationAcceptedAt ?? "2026-08-20T14:30:00.000Z" : null
  const verificationCode = status === "ACCEPTED" ? "SC-AUT-2026-0001" : null

  return {
    id: createId("consent"),
    companyId: employee.companyId,
    employeeId: employee.id,
    employee,
    templateId: template.id,
    template,
    templateVersion: template.version,
    status,
    token: token ?? null,
    publicUrl: token ? `/autorizacion/${token}` : null,
    sentAt,
    expiresAt,
    acceptedAt,
    rejectedAt: status === "REJECTED" ? "2026-08-21T11:10:00.000Z" : null,
    revokedAt: status === "REVOKED" ? "2026-08-21T15:00:00.000Z" : null,
    verificationMethod: acceptedAt ? "DOCUMENT_AND_BIRTH_DATE" : null,
    signatureFileId: acceptedAt ? "file_signature_demo" : null,
    documentNumberMasked: employee.documentNumberMasked,
    birthDateVerified: Boolean(acceptedAt),
    ipAddress: acceptedAt ? "181.***.***.24" : null,
    userAgent: acceptedAt ? "Mozilla/5.0" : null,
    browser: acceptedAt ? "Chrome" : null,
    operatingSystem: acceptedAt ? "Android" : null,
    deviceType: acceptedAt ? "Mobile" : null,
    consentTextHash: acceptedAt ? "sha256-demo-template-1" : null,
    evidenceHash: acceptedAt ? "sha256-demo-evidence-1" : null,
    verificationCode,
    attempts: 0,
    blockedUntil: null,
    auditLogs: [
      createAudit(status === "PENDING" ? "REACCEPTANCE_REQUIRED" : "CONSENT_LINK_CREATED", "SYSTEM", {
        status,
      }),
    ],
    createdAt: "2026-08-20T12:00:00.000Z",
    updatedAt: nowIso(),
  }
}

function initialConsents() {
  const employees = [
    createEmployee("emp_1", "Mona", "Pelona", "1020304050", "1994-05-16", "SENT"),
    createEmployee("emp_2", "Carlos", "Rodríguez", "80123456", "1988-02-11", "ACCEPTED"),
    createEmployee("emp_3", "Luisa", "Fernández", "1098765432", "1999-09-08", "PENDING"),
    createEmployee("emp_4", "Andrés", "Morales", "1144556677", "1991-01-20", "EXPIRED"),
    createEmployee("emp_5", "Paola", "Gómez", "55667788", "1985-07-12", "REQUIRES_REACCEPTANCE"),
  ]

  return [
    createConsent(employees[0], "SENT", DEMO_CONSENT_TOKEN),
    createConsent(employees[1], "ACCEPTED"),
    createConsent(employees[2], "PENDING"),
    createConsent(employees[3], "EXPIRED", "enlace-vencido-demo"),
    createConsent(employees[4], "REQUIRES_REACCEPTANCE"),
  ]
}

function readConsents() {
  if (typeof window === "undefined") return initialConsents()

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const records = initialConsents()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return records
  }

  try {
    return JSON.parse(raw) as EmployeeDataConsent[]
  } catch {
    const records = initialConsents()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return records
  }
}

function writeConsents(consents: EmployeeDataConsent[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consents))
}

function updateConsent(id: string, updater: (consent: EmployeeDataConsent) => EmployeeDataConsent) {
  const consents = readConsents()
  const updated = consents.map((consent) => (consent.id === id ? updater(consent) : consent))
  writeConsents(updated)
  return updated.find((consent) => consent.id === id) ?? null
}

export async function listDataConsentAuthorizations() {
  return readConsents()
}

export async function getDataConsentSummary(): Promise<DataConsentSummary> {
  const consents = readConsents()

  return {
    totalEmployees: consents.length,
    accepted: consents.filter((consent) => consent.status === "ACCEPTED").length,
    pending: consents.filter((consent) => consent.status === "PENDING" || consent.status === "SENT").length,
    expired: consents.filter((consent) => consent.status === "EXPIRED").length,
    requiresReacceptance: consents.filter((consent) => consent.status === "REQUIRES_REACCEPTANCE").length,
  }
}

export async function generateDataConsentLink(consentId: string) {
  const token = createId("consent_token").replace(/_/g, "-")
  return updateConsent(consentId, (consent) => ({
    ...consent,
    status: "SENT",
    token,
    publicUrl: `/autorizacion/${token}`,
    sentAt: nowIso(),
    expiresAt: addDaysIso(DEFAULT_VALIDITY_DAYS),
    attempts: 0,
    blockedUntil: null,
    updatedAt: nowIso(),
    auditLogs: [createAudit("CONSENT_LINK_CREATED", "ADMIN", { validityDays: DEFAULT_VALIDITY_DAYS }), ...consent.auditLogs],
  }))
}

export async function regenerateDataConsentLink(consentId: string) {
  return generateDataConsentLink(consentId)
}

export async function invalidateDataConsentLink(consentId: string) {
  return updateConsent(consentId, (consent) => ({
    ...consent,
    status: "EXPIRED",
    token: null,
    publicUrl: null,
    expiresAt: nowIso(),
    updatedAt: nowIso(),
    auditLogs: [createAudit("CONSENT_LINK_EXPIRED", "ADMIN"), ...consent.auditLogs],
  }))
}

export async function requestDataConsentReacceptance(consentId: string) {
  return updateConsent(consentId, (consent) => ({
    ...consent,
    status: "REQUIRES_REACCEPTANCE",
    token: null,
    publicUrl: null,
    acceptedAt: null,
    employee: {
      ...consent.employee,
      dataAuthorizationStatus: "REQUIRES_REACCEPTANCE",
      dataAuthorizationAcceptedAt: null,
    },
    updatedAt: nowIso(),
    auditLogs: [createAudit("REACCEPTANCE_REQUIRED", "ADMIN", { templateVersion: template.version }), ...consent.auditLogs],
  }))
}

export async function getPublicDataConsent(token: string): Promise<PublicDataConsent | null> {
  const consents = readConsents()
  const consent = consents.find((item) => item.token === token)
  if (!consent) return null

  if (consent.expiresAt && new Date(consent.expiresAt).getTime() < Date.now() && consent.status !== "ACCEPTED") {
    invalidateDataConsentLink(consent.id)
    return {
      id: consent.id,
      companyName: consent.employee.companyName,
      employeeName: `${consent.employee.name} ${consent.employee.lastName}`,
      documentType: consent.employee.documentType,
      documentNumberMasked: consent.documentNumberMasked,
      templateTitle: consent.template.title,
      templateVersion: consent.templateVersion,
      status: "EXPIRED",
      expiresAt: consent.expiresAt,
    }
  }

  updateConsent(consent.id, (current) => ({
    ...current,
    auditLogs: [createAudit("CONSENT_LINK_OPENED", "EMPLOYEE"), ...current.auditLogs],
  }))

  return {
    id: consent.id,
    companyName: consent.employee.companyName,
    employeeName: `${consent.employee.name} ${consent.employee.lastName}`,
    documentType: consent.employee.documentType,
    documentNumberMasked: consent.documentNumberMasked,
    templateTitle: consent.template.title,
    templateVersion: consent.templateVersion,
    status: consent.status,
    expiresAt: consent.expiresAt,
  }
}

export async function verifyDataConsentIdentity(token: string, documentNumber: string, birthDate: string) {
  const consents = readConsents()
  const consent = consents.find((item) => item.token === token)

  if (!consent) return { ok: false, blocked: false, message: "Enlace no válido o vencido." }
  if (consent.blockedUntil && new Date(consent.blockedUntil).getTime() > Date.now()) {
    return { ok: false, blocked: true, message: "El enlace se encuentra bloqueado temporalmente. Intenta más tarde." }
  }

  const matches =
    consent.employee.documentNumber.replace(/\D/g, "") === documentNumber.replace(/\D/g, "") &&
    consent.employee.birthDate === birthDate

  if (!matches) {
    const attempts = consent.attempts + 1
    const blockedDate = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null
    updateConsent(consent.id, (current) => ({
      ...current,
      attempts,
      blockedUntil: blockedDate,
      auditLogs: [
        createAudit("IDENTITY_VERIFICATION_FAILED", "EMPLOYEE", {
          attempts,
          blocked: Boolean(blockedDate),
        }),
        ...current.auditLogs,
      ],
    }))

    return {
      ok: false,
      blocked: Boolean(blockedDate),
      message: "Los datos ingresados no coinciden con la información registrada. Verifica la información e intenta nuevamente.",
    }
  }

  const updated = updateConsent(consent.id, (current) => ({
    ...current,
    birthDateVerified: true,
    verificationMethod: "DOCUMENT_AND_BIRTH_DATE",
    attempts: 0,
    blockedUntil: null,
    auditLogs: [createAudit("IDENTITY_VERIFIED", "EMPLOYEE"), ...current.auditLogs],
  }))

  return {
    ok: true,
    blocked: false,
    consent: updated,
    publicConsent: {
      id: consent.id,
      companyName: consent.employee.companyName,
      employeeName: `${consent.employee.name} ${consent.employee.lastName}`,
      documentType: consent.employee.documentType,
      documentNumberMasked: consent.documentNumberMasked,
      templateTitle: consent.template.title,
      templateVersion: consent.templateVersion,
      templateContent: consent.template.content,
      status: consent.status,
      expiresAt: consent.expiresAt,
    } satisfies PublicDataConsent,
  }
}

export async function acceptDataConsent(token: string, signatureDataUrl: string, idempotencyKey: string) {
  const consents = readConsents()
  const consent = consents.find((item) => item.token === token)
  if (!consent) throw new Error("Enlace no válido o vencido.")

  if (consent.status === "ACCEPTED") return consent
  if (!signatureDataUrl.startsWith("data:image/png")) throw new Error("La firma del titular es obligatoria.")

  const acceptedAt = nowIso()
  const signatureFileId = createId("signature_file")
  const verificationCode = `SC-AUT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900000 + 100000)}`
  const consentTextHash = await sha256(consent.template.content)
  const evidenceHash = await sha256(
    [
      consent.employeeId,
      consent.companyId,
      consent.templateVersion,
      consentTextHash,
      acceptedAt,
      signatureFileId,
      consent.id,
      idempotencyKey,
    ].join("|"),
  )

  const updated = updateConsent(consent.id, (current) => ({
    ...current,
    status: "ACCEPTED",
    token: null,
    publicUrl: null,
    acceptedAt,
    verificationMethod: "DOCUMENT_AND_BIRTH_DATE",
    signatureFileId,
    documentNumberMasked: current.employee.documentNumberMasked,
    birthDateVerified: true,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "No disponible",
    browser: "Detectado por backend",
    operatingSystem: "Detectado por backend",
    deviceType: typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "Desktop",
    consentTextHash,
    evidenceHash,
    verificationCode,
    updatedAt: acceptedAt,
    employee: {
      ...current.employee,
      dataAuthorizationStatus: "ACCEPTED",
      dataAuthorizationAcceptedAt: acceptedAt,
    },
    auditLogs: [
      createAudit("CONSENT_ACCEPTED", "EMPLOYEE", {
        verificationCode,
        templateVersion: current.templateVersion,
      }),
      createAudit("CONSENT_PDF_GENERATED", "SYSTEM", { verificationCode }),
      ...current.auditLogs,
    ],
  }))

  return updated
}

export async function getPublicConsentVerification(verificationCode: string): Promise<PublicConsentVerification | null> {
  const consent = readConsents().find((item) => item.verificationCode === verificationCode)
  if (!consent || !consent.acceptedAt) return null

  return {
    valid: true,
    companyName: consent.employee.companyName,
    protectedEmployeeName: protectName(consent.employee.name, consent.employee.lastName),
    acceptedAt: consent.acceptedAt,
    templateVersion: consent.templateVersion,
    status: consent.status,
    verificationCode,
  }
}

export function buildPublicConsentUrl(publicUrl?: string | null) {
  if (!publicUrl) return ""
  if (typeof window === "undefined") return publicUrl
  return `${window.location.origin}${publicUrl}`
}

export function downloadConsentCertificate(consent: EmployeeDataConsent) {
  const doc = new jsPDF("p", "mm", "a4")
  const acceptedAt = consent.acceptedAt ? new Date(consent.acceptedAt) : new Date()
  const date = acceptedAt.toLocaleString("es-CO", { timeZone: "America/Bogota" })

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text("SafeCloud - Sistema de Gestión Integral", 20, 20)
  doc.setFontSize(12)
  doc.text("Constancia de autorización para el tratamiento de datos personales", 20, 30)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text(`Empresa: ${consent.employee.companyName}`, 20, 45)
  doc.text(`Titular: ${consent.employee.name} ${consent.employee.lastName}`, 20, 52)
  doc.text(`Documento: ${consent.documentNumberMasked}`, 20, 59)
  doc.text(`Fecha y hora: ${date} (America/Bogota)`, 20, 66)
  doc.text(`Versión documento: ${consent.templateVersion}`, 20, 73)
  doc.text(`Estado: ${dataAuthorizationStatusLabels[consent.status]}`, 20, 80)
  doc.text(`Método: Validación de documento y fecha de nacimiento`, 20, 87)

  doc.setFont("helvetica", "bold")
  doc.text("Texto aceptado", 20, 102)
  doc.setFont("helvetica", "normal")
  const lines = doc.splitTextToSize(consent.template.content, 170)
  doc.text(lines, 20, 110)

  const evidenceY = Math.min(250, 116 + lines.length * 5)
  doc.setFont("helvetica", "bold")
  doc.text("Evidencia técnica", 20, evidenceY)
  doc.setFont("helvetica", "normal")
  doc.text(`Identificador: ${consent.id}`, 20, evidenceY + 8)
  doc.text(`Hash evidencia: ${consent.evidenceHash ?? "Pendiente"}`, 20, evidenceY + 15, { maxWidth: 170 })
  doc.rect(160, evidenceY + 22, 28, 28)
  doc.setFontSize(7)
  doc.text(`Verificación`, 164, evidenceY + 34)
  doc.text(consent.verificationCode ?? "Sin código", 162, evidenceY + 40, { maxWidth: 24 })

  doc.save(`constancia-autorizacion-${consent.employee.name}-${consent.employee.lastName}.pdf`)
}
