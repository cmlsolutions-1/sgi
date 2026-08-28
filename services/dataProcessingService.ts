import { apiFetch } from "@/lib/apiClient"
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"
import type {
  DataAuthorizationStatus,
  DataConsentSummary,
  EmployeeDataConsent,
  PublicConsentVerification,
  PublicDataConsent,
} from "@/types/manager/data-processing"

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

type ApiErrorResponse = {
  ok?: boolean
  message?: string
  errors?: Array<{ message?: string }>
  data?: unknown
}

type ApiResponse<T> = {
  ok: boolean
  message: string
  data: T
  errors: null | Array<{ message?: string }>
}

type GenerateConsentLinkResponse = {
  employeeId: string
  linkId: string
  url: string
  expiresAt: string
  consentVersion: string
  status: "PENDING"
}

type EmployeeDataConsentStatusResponse = {
  employeeId: string
  status: "PENDING" | "ACCEPTED"
  acceptedAt: string | null
  authorizationId: string | null
  consentVersion: string | null
  evidenceHash: string | null
  certificateAvailable: boolean
}

type PublicConsentContextResponse = {
  employeeId: string
  companyName: string
  employeeFullName: string
  maskedDocumentNumber: string
  consentVersion: string
  consentTitle: string
  consentText: string
  linkExpiresAt: string
}

type VerifiedConsentIdentityResponse = PublicConsentContextResponse & {
  verificationToken: string
  verificationExpiresAt: string
}

type AcceptDataConsentResponse = {
  authorizationId: string
  employeeId: string
  status: "ACCEPTED"
  acceptedAt: string
  consentVersion: string
  evidenceHash: string
  certificateAvailable: boolean
}

export type ConsentEvidenceType = "SIGNATURE" | "CERTIFICATE"

function getErrorMessage(json: ApiErrorResponse | null, fallbackMsg: string) {
  const detail = json?.errors?.find((error) => error.message)?.message
  const message = detail ?? json?.message ?? fallbackMsg

  if (message.includes("DATA_CONSENT_TEXT")) {
    return "No se pudo generar el enlace porque el backend no tiene configurado el texto de autorización de tratamiento de datos. Configura DATA_CONSENT_TEXT y vuelve a intentarlo."
  }

  return message
}

async function parseJsonOrThrow<T>(res: Response, fallbackMsg: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as ApiResponse<T> | ApiErrorResponse | null

  if (!res.ok || json?.ok === false || !json || !("data" in json)) {
    throw new Error(getErrorMessage(json, fallbackMsg))
  }

  return json.data as T
}

async function parseFileOrThrow(res: Response, fallbackMsg: string): Promise<{ blob: Blob; filename: string }> {
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(getErrorMessage(json, fallbackMsg))
  }

  const disposition = res.headers.get("content-disposition") ?? ""
  const filename = disposition.match(/filename="?([^"]+)"?/i)?.[1]

  return {
    blob: await res.blob(),
    filename: filename ? decodeURIComponent(filename) : "constancia-tratamiento-datos.pdf",
  }
}

function maskDocument(documentNumber?: string | null) {
  const clean = String(documentNumber ?? "").replace(/\D/g, "")
  if (!clean) return "No registrado"
  if (clean.length <= 4) return "****"
  return `${"*".repeat(Math.max(clean.length - 4, 4))}${clean.slice(-4)}`
}

function getEmployeeConsentStatus(employee: Employee): DataAuthorizationStatus {
  const status = employee.dataConsentStatus ?? employee.dataAuthorizationStatus
  return status === "ACCEPTED" ? "ACCEPTED" : "PENDING"
}

function getEmployeeConsentAcceptedAt(employee: Employee) {
  return employee.dataConsentAcceptedAt ?? employee.dataAuthorizationAcceptedAt ?? null
}

function toEmployeeDataConsent(
  employee: Employee,
  statusDetail?: EmployeeDataConsentStatusResponse | null,
  link?: GenerateConsentLinkResponse | null,
): EmployeeDataConsent {
  const status = (statusDetail?.status ?? getEmployeeConsentStatus(employee)) as DataAuthorizationStatus
  const acceptedAt = statusDetail?.acceptedAt ?? getEmployeeConsentAcceptedAt(employee)
  const version = statusDetail?.consentVersion ?? link?.consentVersion ?? "Pendiente"

  return {
    id: statusDetail?.authorizationId ?? employee.id,
    companyId: employee.companyId,
    employeeId: employee.id,
    employee: {
      id: employee.id,
      companyId: employee.companyId,
      companyName: "Empresa actual",
      name: employee.name,
      lastName: employee.lastName,
      documentType: String(employee.documentType ?? ""),
      documentNumber: String(employee.documentNumber ?? ""),
      documentNumberMasked: maskDocument(employee.documentNumber),
      birthDate: employee.birthDate,
      email: employee.email,
      phone: employee.phone,
      dataAuthorizationStatus: status,
      dataAuthorizationAcceptedAt: acceptedAt,
    },
    templateId: version,
    template: {
      id: version,
      companyId: employee.companyId,
      title: "Autorización para el Tratamiento de Datos Personales",
      version,
      content: "El texto exacto aceptado queda custodiado por backend y se consulta desde el enlace público.",
      effectiveDate: "",
      status: "ACTIVE",
      createdAt: "",
      updatedAt: "",
    },
    templateVersion: version,
    status,
    token: null,
    publicUrl: link?.url ?? null,
    sentAt: link ? new Date().toISOString() : null,
    expiresAt: link?.expiresAt ?? null,
    acceptedAt,
    rejectedAt: null,
    revokedAt: null,
    verificationMethod: acceptedAt ? "DOCUMENT_AND_BIRTH_DATE" : null,
    signatureFileId: null,
    documentNumberMasked: maskDocument(employee.documentNumber),
    birthDateVerified: Boolean(acceptedAt),
    ipAddress: null,
    userAgent: null,
    browser: null,
    operatingSystem: null,
    deviceType: null,
    consentTextHash: null,
    evidenceHash: statusDetail?.evidenceHash ?? null,
    verificationCode: statusDetail?.authorizationId ?? null,
    attempts: 0,
    blockedUntil: null,
    auditLogs: [],
    createdAt: "",
    updatedAt: "",
  }
}

function toPublicConsent(data: PublicConsentContextResponse | VerifiedConsentIdentityResponse): PublicDataConsent {
  return {
    id: data.employeeId,
    companyName: data.companyName,
    employeeName: data.employeeFullName,
    documentType: "",
    documentNumberMasked: data.maskedDocumentNumber,
    templateTitle: data.consentTitle,
    templateVersion: data.consentVersion,
    templateContent: data.consentText,
    status: "PENDING",
    expiresAt: data.linkExpiresAt,
    verificationToken: "verificationToken" in data ? data.verificationToken : undefined,
    verificationExpiresAt: "verificationExpiresAt" in data ? data.verificationExpiresAt : undefined,
  }
}

async function getEmployeeConsentStatusDetail(employeeId: string) {
  const res = await apiFetch(`/api/employee-data-consents/${employeeId}`, { method: "GET" })
  return parseJsonOrThrow<EmployeeDataConsentStatusResponse>(res, "No se pudo consultar el estado de autorización")
}

export async function listDataConsentAuthorizations() {
  const employees = await listEmployees()

  return Promise.all(
    employees.map(async (employee) => {
      try {
        const statusDetail = await getEmployeeConsentStatusDetail(employee.id)
        return toEmployeeDataConsent(employee, statusDetail)
      } catch {
        return toEmployeeDataConsent(employee)
      }
    }),
  )
}

export async function getDataConsentSummary(): Promise<DataConsentSummary> {
  const consents = await listDataConsentAuthorizations()

  return {
    totalEmployees: consents.length,
    accepted: consents.filter((consent) => consent.status === "ACCEPTED").length,
    pending: consents.filter((consent) => consent.status === "PENDING" || consent.status === "SENT").length,
    expired: consents.filter((consent) => consent.status === "EXPIRED").length,
    requiresReacceptance: consents.filter((consent) => consent.status === "REQUIRES_REACCEPTANCE").length,
  }
}

export async function generateDataConsentLink(employeeId: string) {
  const res = await apiFetch(`/api/employee-data-consents/${employeeId}/link`, { method: "POST" })
  const link = await parseJsonOrThrow<GenerateConsentLinkResponse>(res, "No se pudo generar el enlace de autorización")
  const employee = (await listEmployees()).find((item) => item.id === employeeId)

  if (!employee) {
    return {
      publicUrl: link.url,
      employeeId: link.employeeId,
    } as EmployeeDataConsent
  }

  return toEmployeeDataConsent(employee, null, link)
}

export async function regenerateDataConsentLink(employeeId: string) {
  return generateDataConsentLink(employeeId)
}

export async function invalidateDataConsentLink() {
  throw new Error("El backend aún no expone endpoint para invalidar enlaces.")
}

export async function requestDataConsentReacceptance() {
  throw new Error("El backend aún no expone endpoint para solicitar nueva aceptación.")
}

export async function getPublicDataConsent(employeeId: string, token: string): Promise<PublicDataConsent | null> {
  if (!employeeId || !token) return null

  const res = await fetch(`/api/public/data-consents/${employeeId}?token=${encodeURIComponent(token)}`, {
    method: "GET",
    referrerPolicy: "no-referrer",
  })
  const data = await parseJsonOrThrow<PublicConsentContextResponse>(res, "Enlace no válido o vencido")
  return toPublicConsent(data)
}

export async function verifyDataConsentIdentity(employeeId: string, token: string, documentNumber: string, birthDate: string) {
  const res = await fetch(`/api/public/data-consents/${employeeId}/verify-identity?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    referrerPolicy: "no-referrer",
    body: JSON.stringify({ documentNumber, birthDate }),
  })

  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as ApiErrorResponse | null
    return {
      ok: false,
      blocked: res.status === 410 || res.status === 429,
      message:
        res.status === 401
          ? "Los datos ingresados no coinciden con la información registrada. Verifica la información e intenta nuevamente."
          : getErrorMessage(json, "No se pudo validar la identidad"),
    }
  }

  const data = await parseJsonOrThrow<VerifiedConsentIdentityResponse>(res, "No se pudo validar la identidad")
  return {
    ok: true,
    blocked: false,
    publicConsent: toPublicConsent(data),
    verificationToken: data.verificationToken,
    verificationExpiresAt: data.verificationExpiresAt,
  }
}

async function canvasDataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function acceptDataConsent(input: {
  employeeId: string
  token: string
  verificationToken: string
  consentVersion: string
  signatureDataUrl: string
}) {
  const signature = await canvasDataUrlToBlob(input.signatureDataUrl)
  const formData = new FormData()
  formData.append("signature", signature, "signature.png")
  formData.append("token", input.token)
  formData.append("verificationToken", input.verificationToken)
  formData.append("consentVersion", input.consentVersion)
  formData.append("accepted", "true")

  const res = await fetch(`/api/public/data-consents/${input.employeeId}/accept`, {
    method: "POST",
    body: formData,
    referrerPolicy: "no-referrer",
  })
  const data = await parseJsonOrThrow<AcceptDataConsentResponse>(res, "No se pudo registrar la autorización")

  return {
    id: data.authorizationId,
    companyId: "",
    employeeId: data.employeeId,
    employee: {
      id: data.employeeId,
      companyId: "",
      companyName: "",
      name: "",
      lastName: "",
      documentType: "",
      documentNumber: "",
      documentNumberMasked: "",
      birthDate: "",
      email: "",
      phone: "",
      dataAuthorizationStatus: "ACCEPTED",
      dataAuthorizationAcceptedAt: data.acceptedAt,
    },
    templateId: data.consentVersion,
    template: {
      id: data.consentVersion,
      title: "Autorización para el Tratamiento de Datos Personales",
      version: data.consentVersion,
      content: "",
      effectiveDate: "",
      status: "ACTIVE",
      createdAt: "",
      updatedAt: "",
    },
    templateVersion: data.consentVersion,
    status: data.status,
    acceptedAt: data.acceptedAt,
    evidenceHash: data.evidenceHash,
    certificateAvailable: data.certificateAvailable,
    verificationCode: data.authorizationId,
    documentNumberMasked: "",
    attempts: 0,
    auditLogs: [],
    createdAt: "",
    updatedAt: "",
  } satisfies EmployeeDataConsent & { certificateAvailable: boolean }
}

export async function downloadConsentEvidence(employeeId: string, evidenceType: ConsentEvidenceType) {
  const res = await apiFetch(`/api/employee-data-consents/${employeeId}/evidence/${evidenceType}`, { method: "GET" })
  return parseFileOrThrow(
    res,
    evidenceType === "CERTIFICATE" ? "No se pudo descargar la constancia" : "No se pudo descargar la firma",
  )
}

function formatCertificateDateTime(value?: string | null) {
  if (!value) return "No registrada"
  return new Date(value).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatCertificateDate(value?: string | null) {
  if (!value) return "No registrada"
  return new Date(value).toLocaleDateString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("No se pudo preparar la imagen para la constancia"))
    reader.readAsDataURL(blob)
  })
}

async function loadPublicImageDataUrl(path: string) {
  const res = await fetch(path)
  if (!res.ok) return null
  return blobToDataUrl(await res.blob())
}

function certificateFilename(consent: EmployeeDataConsent) {
  const employeeName = `${consent.employee.name} ${consent.employee.lastName}`
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return `constancia-tratamiento-datos-${employeeName || consent.employeeId}.pdf`
}

export async function downloadConsentCertificate(consent: EmployeeDataConsent) {
  const [{ default: jsPDF }, signatureEvidence] = await Promise.all([
    import("jspdf"),
    downloadConsentEvidence(consent.employeeId, "SIGNATURE"),
  ])
  const signatureDataUrl = await blobToDataUrl(signatureEvidence.blob)
  const logoDataUrl = await loadPublicImageDataUrl("/SGI-nube.png").catch(() => null)
  const doc = new jsPDF({ unit: "mm", format: "letter" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  const addWrappedText = (text: string, x: number, width: number, lineHeight = 5) => {
    const lines = doc.splitTextToSize(text || "No registrado", width) as string[]
    ensureSpace(lines.length * lineHeight + 2)
    doc.text(lines, x, y)
    y += lines.length * lineHeight
  }

  const addSectionTitle = (title: string) => {
    ensureSpace(14)
    doc.setFillColor(236, 244, 255)
    doc.roundedRect(margin, y, contentWidth, 8, 2, 2, "F")
    doc.setTextColor(30, 64, 175)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(title, margin + 4, y + 5.5)
    y += 13
    doc.setTextColor(15, 23, 42)
  }

  const addInfoRow = (label: string, value: string, x: number, rowY: number, width: number) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(71, 85, 105)
    doc.text(label, x, rowY)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(doc.splitTextToSize(value || "No registrado", width), x, rowY + 5)
  }

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", margin, y, 16, 16)
  }
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("SafeCloud - Sistema de Gestión Integral", logoDataUrl ? margin + 20 : margin, y + 6)
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text("Constancia de autorización para el tratamiento de datos personales", logoDataUrl ? margin + 20 : margin, y + 13)
  y += 26

  addSectionTitle("Datos básicos del titular")
  const leftX = margin
  const rightX = margin + contentWidth / 2 + 4
  const colWidth = contentWidth / 2 - 8
  const fullName = `${consent.employee.name} ${consent.employee.lastName}`.trim() || "No registrado"
  const document = `${consent.employee.documentType || "Documento"} ${consent.documentNumberMasked || consent.employee.documentNumberMasked}`
  const firstRowY = y
  addInfoRow("Titular", fullName, leftX, firstRowY, colWidth)
  addInfoRow("Documento", document, rightX, firstRowY, colWidth)
  y += 17
  const secondRowY = y
  addInfoRow("Fecha de nacimiento", formatCertificateDate(consent.employee.birthDate), leftX, secondRowY, colWidth)
  addInfoRow("Empresa", consent.employee.companyName || "Empresa actual", rightX, secondRowY, colWidth)
  y += 17
  const thirdRowY = y
  addInfoRow("Correo electrónico", consent.employee.email || "No registrado", leftX, thirdRowY, colWidth)
  addInfoRow("Celular", consent.employee.phone || "No registrado", rightX, thirdRowY, colWidth)
  y += 16

  addSectionTitle("Información de la autorización")
  const authRowY = y
  addInfoRow("Documento autorizado", consent.template.title, leftX, authRowY, colWidth)
  addInfoRow("Versión aceptada", consent.templateVersion, rightX, authRowY, colWidth)
  y += 17
  const acceptRowY = y
  addInfoRow("Fecha y hora de aceptación", formatCertificateDateTime(consent.acceptedAt), leftX, acceptRowY, colWidth)
  addInfoRow("Método de validación", "Documento y fecha de nacimiento", rightX, acceptRowY, colWidth)
  y += 17
  const idRowY = y
  addInfoRow("Identificador de autorización", consent.verificationCode || consent.id, leftX, idRowY, colWidth)
  addInfoRow("Estado", dataAuthorizationStatusLabels[consent.status], rightX, idRowY, colWidth)
  y += 16

  addSectionTitle("Texto autorizado")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  addWrappedText(consent.template.content, margin, contentWidth, 5)
  y += 4

  addSectionTitle("Evidencia técnica")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8.5)
  addWrappedText(`Hash de evidencia SHA-256: ${consent.evidenceHash || "No registrado"}`, margin, contentWidth, 4.5)
  addWrappedText(`Archivo de firma: ${signatureEvidence.filename}`, margin, contentWidth, 4.5)
  y += 5

  addSectionTitle("Firma del titular")
  ensureSpace(45)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2)
  const imageFormat = signatureEvidence.blob.type.includes("jpeg") ? "JPEG" : "PNG"
  doc.addImage(signatureDataUrl, imageFormat, margin + 8, y + 4, contentWidth - 16, 22, undefined, "FAST")
  y += 40
  doc.setDrawColor(15, 23, 42)
  doc.line(margin + 28, y, pageWidth - margin - 28, y)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.text(fullName, pageWidth / 2, y + 5, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text("Firma electrónica manuscrita del titular", pageWidth / 2, y + 10, { align: "center" })

  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(
      `Documento generado por SafeCloud. Página ${page} de ${pageCount}. Fecha de generación: ${formatCertificateDateTime(new Date().toISOString())}`,
      margin,
      pageHeight - 8,
    )
  }

  const blob = doc.output("blob")
  const filename = certificateFilename(consent)
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = filename
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function downloadConsentSignature(consent: EmployeeDataConsent) {
  const { blob, filename } = await downloadConsentEvidence(consent.employeeId, "SIGNATURE")
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = filename
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function buildPublicConsentUrl(publicUrl?: string | null) {
  return publicUrl ?? ""
}

export async function getPublicConsentVerification(_verificationCode?: string): Promise<PublicConsentVerification | null> {
  return null
}
