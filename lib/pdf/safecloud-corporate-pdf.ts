"use client"

import type jsPDF from "jspdf"
import { PDFDocument, StandardFonts, rgb, type PDFEmbeddedPage, type PDFImage, type PDFFont, type PDFPage } from "pdf-lib"
import { decodeJwt } from "@/lib/jwt"
import { getCompanyById, getCurrentCompany, listCompanies } from "@/services/companyService"
import { getUserById } from "@/services/userService"
import { useAuthStore } from "@/store/auth.store"

export type CorporatePdfMetadata = {
  documentName: string
  code?: string
  version?: string
  date?: string
  companyName?: string
  nit?: string
}

type CompanyIdentity = { name: string; nit: string }

const DEFAULT_IDENTITY: CompanyIdentity = {
  name: "Empresa no identificada",
  nit: "NIT no disponible",
}

let logoBytesPromise: Promise<ArrayBuffer> | null = null
let corporateTemplateBytesPromise: Promise<ArrayBuffer> | null = null
let companyIdentityCache: { sessionKey: string; promise: Promise<CompanyIdentity> } | null = null

const COMPANY_CLAIMS = new Set([
  "company",
  "companyid",
  "company_id",
  "companyuuid",
  "company_uuid",
  "organizationid",
  "organization_id",
  "tenantid",
  "tenant_id",
])
const USER_CLAIMS = new Set(["sub", "userid", "user_id", "id", "_id"])
const NESTED_TOKEN_CONTAINERS = new Set(["user", "account", "context", "session", "data", "claims", "auth"])
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function validCompanyId(value: string) {
  return UUID_PATTERN.test(value) ? value : ""
}

function identifierFromValue(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim()
  if (typeof value === "number" && Number.isFinite(value)) return String(value)
  if (!value || typeof value !== "object" || Array.isArray(value)) return ""

  const object = value as Record<string, unknown>
  for (const key of ["id", "_id", "uuid", "value", "companyId", "company_id", "tenantId", "tenant_id"]) {
    const identifier = identifierFromValue(object[key])
    if (identifier) return identifier
  }
  return ""
}

function claimValue(payload: Record<string, unknown> | null, claims: Set<string>, depth = 0): string {
  if (!payload || depth > 3) return ""

  for (const [key, value] of Object.entries(payload)) {
    if (claims.has(key.toLowerCase())) {
      const identifier = identifierFromValue(value)
      if (identifier) return identifier
    }
  }

  for (const [key, value] of Object.entries(payload)) {
    if (!NESTED_TOKEN_CONTAINERS.has(key.toLowerCase()) || !value || typeof value !== "object" || Array.isArray(value)) continue
    const identifier = claimValue(value as Record<string, unknown>, claims, depth + 1)
    if (identifier) return identifier
  }

  return ""
}

function normalizeCompanyKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function companyText(company: unknown, keys: string[], depth = 0): string {
  if (!company || typeof company !== "object") return ""
  const values = company as Record<string, unknown>
  const normalizedKeys = new Set(keys.map(normalizeCompanyKey))

  for (const [key, value] of Object.entries(values)) {
    if (!normalizedKeys.has(normalizeCompanyKey(key))) continue
    if (typeof value === "string" && value.trim()) return value.trim()
    if (typeof value === "number" && Number.isFinite(value)) return String(value)
  }

  if (depth >= 3) return ""
  for (const value of Object.values(values)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue
    const nestedValue: string = companyText(value, keys, depth + 1)
    if (nestedValue) return nestedValue
  }
  return ""
}

function identityFromCompany(company: unknown): CompanyIdentity | null {
  const name = companyText(company, ["name", "companyName", "businessName", "legalName", "razonSocial", "razon_social"])
  const nit = companyText(company, [
    "nit",
    "taxId",
    "taxIdentification",
    "taxIdentificationNumber",
    "documentNumber",
    "identificationNumber",
    "numeroDocumento",
    "numeroIdentificacion",
    "companyNit",
  ])
  if (!name && !nit) return null
  return { name, nit }
}

async function resolveCompanyIdentity(): Promise<CompanyIdentity> {
  const { accessToken, refreshToken, company: sessionCompany, setCompany } = useAuthStore.getState()
  const sessionKey = `${accessToken ?? ""}:${refreshToken ?? ""}:${sessionCompany?.id ?? ""}:${sessionCompany?.nit ?? ""}`
  if (companyIdentityCache?.sessionKey === sessionKey) return companyIdentityCache.promise

  const promise = (async () => {
    const accessPayload = accessToken ? decodeJwt(accessToken) : null
    const refreshPayload = refreshToken ? decodeJwt(refreshToken) : null
    const resolved: Partial<CompanyIdentity> = {}
    const mergeIdentity = (identity: CompanyIdentity | null) => {
      if (identity?.name) resolved.name = identity.name
      if (identity?.nit) resolved.nit = identity.nit
    }

    mergeIdentity(identityFromCompany(sessionCompany))
    if (sessionCompany?.id && (!resolved.name || !resolved.nit)) {
      try {
        const company = await getCompanyById(sessionCompany.id)
        mergeIdentity(identityFromCompany(company))
        setCompany({ id: company.id, name: company.name, nit: company.nit })
      } catch (error) {
        console.warn("No se pudo completar la empresa guardada para el PDF:", error)
      }
    }
    if (resolved.name && resolved.nit) return resolved as CompanyIdentity

    try {
      const currentCompany = identityFromCompany(await getCurrentCompany())
      mergeIdentity(currentCompany)
      if (resolved.name && resolved.nit) return resolved as CompanyIdentity
    } catch (error) {
      console.warn("No se pudo cargar la empresa actual para el PDF:", error)
    }

    try {
      let companyId = validCompanyId(claimValue(accessPayload, COMPANY_CLAIMS)) || validCompanyId(claimValue(refreshPayload, COMPANY_CLAIMS))
      if (!companyId) {
        const userId = claimValue(accessPayload, USER_CLAIMS) || claimValue(refreshPayload, USER_CLAIMS)
        if (userId) companyId = validCompanyId((await getUserById(userId)).companyId)
      }
      if (companyId) {
        const company = identityFromCompany(await getCompanyById(companyId))
        mergeIdentity(company)
        if (resolved.name && resolved.nit) return resolved as CompanyIdentity
      }
    } catch (error) {
      console.warn("No se pudo cargar la empresa por identificador para el PDF:", error)
    }

    try {
      const companies = await listCompanies()
      if (companies.length === 1) mergeIdentity(identityFromCompany(companies[0]))
    } catch (error) {
      console.warn("No se pudo cargar la empresa disponible para el PDF:", error)
    }

    mergeIdentity(identityFromCompany(accessPayload))
    mergeIdentity(identityFromCompany(refreshPayload))
    return {
      name: resolved.name || DEFAULT_IDENTITY.name,
      nit: resolved.nit || DEFAULT_IDENTITY.nit,
    }
  })()

  companyIdentityCache = { sessionKey, promise }
  void promise.then(identity => {
    if (
      identity.name === DEFAULT_IDENTITY.name &&
      identity.nit === DEFAULT_IDENTITY.nit &&
      companyIdentityCache?.sessionKey === sessionKey
    ) {
      companyIdentityCache = null
    }
  })
  return promise
}

async function loadLogoBytes() {
  if (!logoBytesPromise) {
    logoBytesPromise = fetch("/logoCompletoSinfondo.png").then(async response => {
      if (!response.ok) throw new Error("No se pudo cargar el logo de SafeCloud")
      return response.arrayBuffer()
    })
  }
  return logoBytesPromise
}

async function loadCorporateTemplateBytes() {
  if (!corporateTemplateBytesPromise) {
    corporateTemplateBytesPromise = fetch("/safecloud-corporate-template.pdf").then(async response => {
      if (!response.ok) throw new Error("No se pudo cargar la plantilla corporativa de SafeCloud")
      return response.arrayBuffer()
    })
  }
  return corporateTemplateBytesPromise
}

function formatDate(date?: string) {
  if (date) {
    const parsed = new Date(date)
    if (!Number.isNaN(parsed.getTime())) return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Bogota" }).format(parsed)
  }
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Bogota" }).format(new Date())
}

function fitText(text: string, font: PDFFont, maxWidth: number, preferredSize: number, minimumSize = 6) {
  let size = preferredSize
  while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25
  return size
}

function centeredText(page: PDFPage, value: string, font: PDFFont, size: number, x: number, y: number, width: number, color = rgb(0.08, 0.2, 0.36)) {
  const safeSize = fitText(value, font, width - 10, size)
  const textWidth = font.widthOfTextAtSize(value, safeSize)
  page.drawText(value, { x: x + Math.max(5, (width - textWidth) / 2), y, size: safeSize, font, color })
}

function drawTemplate({
  page,
  logo,
  regular,
  bold,
  identity,
  metadata,
  pageNumber,
  pageCount,
  templateArtworkApplied,
}: {
  page: PDFPage
  logo: PDFImage | null
  regular: PDFFont
  bold: PDFFont
  identity: CompanyIdentity
  metadata: CorporatePdfMetadata
  pageNumber: number
  pageCount: number
  templateArtworkApplied: boolean
}) {
  const { width, height } = page.getSize()
  const navy = rgb(0.07, 0.24, 0.42)
  const cyan = rgb(0.03, 0.67, 0.75)
  const blue = rgb(0.23, 0.48, 0.76)
  const gray = rgb(0.38, 0.43, 0.5)
  const border = rgb(0.08, 0.08, 0.08)
  const margin = Math.max(24, width * 0.055)
  const tableX = templateArtworkApplied ? width * 0.0915 : margin + width * 0.045
  const tableWidth = templateArtworkApplied ? width - tableX * 2 : width - tableX - margin
  const headerLineY = height - 55

  if (!templateArtworkApplied) {
    page.drawRectangle({ x: 0, y: height - 132, width, height: 132, color: rgb(1, 1, 1) })
    page.drawRectangle({ x: 0, y: 0, width, height: 48, color: rgb(1, 1, 1) })

    if (logo) {
      const ratio = logo.width / logo.height
      const logoHeight = Math.min(34, width * 0.045)
      page.drawImage(logo, { x: margin, y: height - 48, width: logoHeight * ratio, height: logoHeight })
    } else {
      page.drawText("SafeCloud", { x: margin, y: height - 38, size: 16, font: bold, color: navy })
    }

    const systemTitle = "SISTEMA DE GESTIÓN INTEGRAL"
    const systemSize = fitText(systemTitle, bold, width * 0.36, 11)
    page.drawText(systemTitle, { x: width - margin - bold.widthOfTextAtSize(systemTitle, systemSize), y: height - 34, size: systemSize, font: bold, color: navy })
    page.drawLine({ start: { x: margin, y: headerLineY }, end: { x: width - margin, y: headerLineY }, thickness: 1.4, color: blue })
  }

  const tableTop = templateArtworkApplied ? height - 50 : height - 62
  const tableBottom = templateArtworkApplied ? height - 104 : height - 122
  const companyWidth = tableWidth * 0.33
  const documentWidth = tableWidth * 0.34
  const controlX = tableX + companyWidth + documentWidth
  const controlWidth = tableWidth - companyWidth - documentWidth
  const labelWidth = controlWidth * 0.5
  const rowHeight = (tableTop - tableBottom) / 4

  page.drawRectangle({ x: tableX, y: tableBottom, width: tableWidth, height: tableTop - tableBottom, color: rgb(1, 1, 1), borderColor: border, borderWidth: 0.8 })
  page.drawLine({ start: { x: tableX + companyWidth, y: tableBottom }, end: { x: tableX + companyWidth, y: tableTop }, thickness: 0.8, color: border })
  page.drawLine({ start: { x: controlX, y: tableBottom }, end: { x: controlX, y: tableTop }, thickness: 0.8, color: border })
  page.drawLine({ start: { x: controlX + labelWidth, y: tableBottom }, end: { x: controlX + labelWidth, y: tableTop }, thickness: 0.8, color: border })
  for (let row = 1; row < 4; row += 1) page.drawLine({ start: { x: controlX, y: tableTop - row * rowHeight }, end: { x: tableX + tableWidth, y: tableTop - row * rowHeight }, thickness: 0.8, color: border })

  centeredText(page, metadata.companyName?.trim() || identity.name, bold, 9, tableX, tableBottom + 36, companyWidth, navy)
  centeredText(page, metadata.nit?.trim() || identity.nit, bold, 8, tableX, tableBottom + 22, companyWidth, gray)
  centeredText(page, metadata.documentName, bold, 9, tableX + companyWidth, tableBottom + 27, documentWidth, navy)

  const controlRows = [
    ["Código:", metadata.code || "-"],
    ["Fecha:", formatDate(metadata.date)],
    ["Versión:", metadata.version || "1"],
    ["Página:", `${pageNumber} de ${pageCount}`],
  ]
  controlRows.forEach(([label, value], index) => {
    const rowY = tableTop - (index + 1) * rowHeight
    page.drawText(label, { x: controlX + 5, y: rowY + 4, size: 7.2, font: bold, color: navy })
    centeredText(page, value, index === 0 ? regular : bold, 7.2, controlX + labelWidth, rowY + 4, controlWidth - labelWidth, navy)
  })

  if (!templateArtworkApplied) {
    page.drawLine({ start: { x: tableX, y: 35 }, end: { x: width - margin, y: 35 }, thickness: 1.2, color: cyan })
    const footerY = 20
    const leftFooter = "Plataforma SafeCloud"
    const middleFooter = "Desarrollado por CML Solutions"
    const contactFooter = "cmlsolutions.co · WhatsApp +57 321 890 0642"
    const footerSize = Math.min(7.5, width / 85)
    const combinedWidth = regular.widthOfTextAtSize(`${leftFooter}  |  ${middleFooter}`, footerSize)
    const footerX = Math.max(margin, (width - combinedWidth) / 2)
    page.drawText(leftFooter, { x: footerX, y: footerY, size: footerSize, font: regular, color: navy })
    page.drawText("  |  ", { x: footerX + regular.widthOfTextAtSize(leftFooter, footerSize), y: footerY, size: footerSize, font: regular, color: gray })
    page.drawText(middleFooter, { x: footerX + regular.widthOfTextAtSize(`${leftFooter}  |  `, footerSize), y: footerY, size: footerSize, font: regular, color: gray })
    centeredText(page, contactFooter, regular, footerSize, margin, 9, width - margin * 2, cyan)
  }
}

export async function applySafeCloudCorporateTemplate(source: Blob | ArrayBuffer, metadata: CorporatePdfMetadata) {
  const sourceBytes = source instanceof Blob ? await source.arrayBuffer() : source
  const [sourcePdf, identity] = await Promise.all([PDFDocument.load(sourceBytes), resolveCompanyIdentity()])
  const outputPdf = await PDFDocument.create()
  const [regular, bold] = await Promise.all([
    outputPdf.embedFont(StandardFonts.Helvetica),
    outputPdf.embedFont(StandardFonts.HelveticaBold),
  ])

  let logo: PDFImage | null = null
  try {
    logo = await outputPdf.embedPng(await loadLogoBytes())
  } catch (error) {
    console.warn("No se pudo incorporar el logo al PDF:", error)
  }

  let corporateTemplate: PDFEmbeddedPage | null = null
  try {
    const templatePdf = await PDFDocument.load(await loadCorporateTemplateBytes())
    corporateTemplate = await outputPdf.embedPage(templatePdf.getPage(0))
  } catch (error) {
    console.warn("No se pudo incorporar la plantilla corporativa al PDF:", error)
  }

  const sourcePages = sourcePdf.getPages()
  for (let index = 0; index < sourcePages.length; index += 1) {
    const sourcePage = sourcePages[index]
    const sourceSize = sourcePage.getSize()
    const isPortrait = sourceSize.height >= sourceSize.width
    const width = isPortrait ? 612 : 792
    const height = isPortrait ? 792 : 612
    const page = outputPdf.addPage([width, height])
    const templateArtworkApplied = Boolean(corporateTemplate && isPortrait)
    if (corporateTemplate && isPortrait) page.drawPage(corporateTemplate, { x: 0, y: 0, width, height })
    const embedded = await outputPdf.embedPage(sourcePage)
    const horizontalInset = 28
    const verticalInset = isPortrait ? 36 : 22
    const contentWidth = width - horizontalInset * 2
    const contentHeight = height - verticalInset * 2
    const scale = Math.min(contentWidth / sourceSize.width, contentHeight / sourceSize.height)
    const renderedWidth = sourceSize.width * scale
    const renderedHeight = sourceSize.height * scale
    page.drawPage(embedded, {
      x: (width - renderedWidth) / 2,
      y: (height - renderedHeight) / 2,
      width: renderedWidth,
      height: renderedHeight,
    })
    drawTemplate({ page, logo, regular, bold, identity, metadata, pageNumber: index + 1, pageCount: sourcePages.length, templateArtworkApplied })
  }

  outputPdf.setTitle(metadata.documentName)
  outputPdf.setAuthor("SafeCloud - Sistema de Gestión Integral")
  outputPdf.setCreator("SafeCloud")
  outputPdf.setProducer("SafeCloud")
  const bytes = await outputPdf.save()
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  return new Blob([arrayBuffer], { type: "application/pdf" })
}

export function triggerPdfDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = filename
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function downloadCorporatePdfBlob(blob: Blob, metadata: CorporatePdfMetadata, filename: string) {
  try {
    triggerPdfDownload(await applySafeCloudCorporateTemplate(blob, metadata), filename)
  } catch (error) {
    console.error("No se pudo aplicar la plantilla corporativa al PDF:", error)
    triggerPdfDownload(blob, filename)
  }
}

export async function saveCorporatePdf(doc: jsPDF, metadata: CorporatePdfMetadata, filename: string) {
  await downloadCorporatePdfBlob(doc.output("blob"), metadata, filename)
}

