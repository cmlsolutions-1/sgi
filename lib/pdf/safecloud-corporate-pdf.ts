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
type PageBox = { x: number; y: number; width: number; height: number }

const DEFAULT_IDENTITY: CompanyIdentity = {
  name: "Empresa no identificada",
  nit: "NIT no disponible",
}

const LETTER_PORTRAIT: [number, number] = [612, 792]
const LETTER_LANDSCAPE: [number, number] = [792, 612]
const DOCUMENT_MARGIN = 72
const SOURCE_CROP = 22

let logoBytesPromise: Promise<ArrayBuffer> | null = null
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
    const nestedValue = companyText(value, keys, depth + 1)
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

async function resolveCompanyIdentity(metadata: CorporatePdfMetadata): Promise<CompanyIdentity> {
  if (metadata.companyName?.trim() && metadata.nit?.trim()) {
    return { name: metadata.companyName.trim(), nit: metadata.nit.trim() }
  }

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
      mergeIdentity(identityFromCompany(await getCurrentCompany()))
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
        mergeIdentity(identityFromCompany(await getCompanyById(companyId)))
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
      name: resolved.name || metadata.companyName?.trim() || DEFAULT_IDENTITY.name,
      nit: resolved.nit || metadata.nit?.trim() || DEFAULT_IDENTITY.nit,
    }
  })()

  companyIdentityCache = { sessionKey, promise }
  void promise.then(identity => {
    if (identity.name === DEFAULT_IDENTITY.name && identity.nit === DEFAULT_IDENTITY.nit && companyIdentityCache?.sessionKey === sessionKey) {
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

function formatDate(date?: string) {
  const parsed = date ? new Date(date) : new Date()
  const safeDate = Number.isNaN(parsed.getTime()) ? new Date() : parsed
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Bogota" }).format(safeDate)
}

function fitText(text: string, font: PDFFont, maxWidth: number, preferredSize: number, minimumSize = 6.5) {
  let size = preferredSize
  while (size > minimumSize && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.25
  return size
}

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number, maxLines = 2) {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }
  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length
  const remaining = words.slice(consumed).join(" ")
  if (remaining) lines.push(remaining)
  else if (current && lines.length < maxLines) lines.push(current)
  return lines.slice(0, maxLines)
}

function drawCenteredText(page: PDFPage, value: string, font: PDFFont, size: number, box: PageBox, color = rgb(0.08, 0.2, 0.36), maxLines = 1) {
  let safeSize = size
  let lines = wrapText(value || "-", font, safeSize, box.width - 10, maxLines)
  while (safeSize > 6.5 && lines.some(line => font.widthOfTextAtSize(line, safeSize) > box.width - 10)) {
    safeSize -= 0.25
    lines = wrapText(value || "-", font, safeSize, box.width - 10, maxLines)
  }
  const lineHeight = safeSize * 1.18
  const firstBaseline = box.y + (box.height + (lines.length - 1) * lineHeight) / 2 - safeSize * 0.35
  lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, safeSize)
    page.drawText(line, { x: box.x + Math.max(5, (box.width - width) / 2), y: firstBaseline - index * lineHeight, size: safeSize, font, color })
  })
}

function documentLayout(width: number, height: number, isPortrait: boolean) {
  const headerTop = isPortrait ? height - 50 : height - 62
  const headerBottom = isPortrait ? height - 104 : height - 118
  const contentTop = Math.min(headerBottom - 14, height - 142)
  return {
    headerTop,
    headerBottom,
    footerLineY: 35,
    body: {
      x: DOCUMENT_MARGIN,
      y: 50,
      width: width - DOCUMENT_MARGIN * 2,
      height: contentTop - 50,
    } satisfies PageBox,
  }
}

function drawHeaderAndFooter({
  page,
  logo,
  regular,
  bold,
  identity,
  metadata,
  pageNumber,
  pageCount,
  isPortrait,
}: {
  page: PDFPage
  logo: PDFImage | null
  regular: PDFFont
  bold: PDFFont
  identity: CompanyIdentity
  metadata: CorporatePdfMetadata
  pageNumber: number
  pageCount: number
  isPortrait: boolean
}) {
  const { width, height } = page.getSize()
  const navy = rgb(0.07, 0.24, 0.42)
  const cyan = rgb(0.03, 0.67, 0.75)
  const blue = rgb(0.23, 0.48, 0.76)
  const gray = rgb(0.38, 0.43, 0.5)
  const border = rgb(0.08, 0.08, 0.08)
  const layout = documentLayout(width, height, isPortrait)
  const tableX = isPortrait ? 56 : DOCUMENT_MARGIN
  const tableWidth = width - tableX * 2

  page.drawRectangle({ x: 0, y: height - 132, width, height: 132, color: rgb(1, 1, 1) })
  page.drawRectangle({ x: 0, y: 0, width, height: 48, color: rgb(1, 1, 1) })
  if (logo) {
    const logoHeight = isPortrait ? 34 : 28
    page.drawImage(logo, { x: tableX, y: height - 48, width: logoHeight * (logo.width / logo.height), height: logoHeight })
  } else {
    page.drawText("SafeCloud", { x: tableX, y: height - 38, size: 16, font: bold, color: navy })
  }
  const systemTitle = "SISTEMA DE GESTIÓN INTEGRAL"
  const systemSize = fitText(systemTitle, bold, width * 0.36, 11)
  page.drawText(systemTitle, { x: width - tableX - bold.widthOfTextAtSize(systemTitle, systemSize), y: height - 34, size: systemSize, font: bold, color: navy })
  page.drawLine({ start: { x: tableX, y: height - 55 }, end: { x: width - tableX, y: height - 55 }, thickness: 1.4, color: blue })

  const tableTop = layout.headerTop
  const tableBottom = layout.headerBottom
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

  const companyName = metadata.companyName?.trim() || identity.name
  const companyNit = metadata.nit?.trim() || identity.nit
  drawCenteredText(page, companyName, bold, 8.5, { x: tableX, y: tableBottom + 22, width: companyWidth, height: tableTop - tableBottom - 22 }, navy, 2)
  drawCenteredText(page, companyNit, regular, 7.5, { x: tableX, y: tableBottom + 3, width: companyWidth, height: 18 }, gray)
  drawCenteredText(page, metadata.documentName, bold, 8.5, { x: tableX + companyWidth, y: tableBottom, width: documentWidth, height: tableTop - tableBottom }, navy, 2)

  const controlRows = [
    ["Código:", metadata.code?.trim() || "-"],
    [metadata.date ? "Fecha:" : "Generado:", formatDate(metadata.date)],
    ["Versión:", metadata.version?.trim() || "-"],
    ["Página:", `${pageNumber} de ${pageCount}`],
  ]
  controlRows.forEach(([label, value], index) => {
    const rowY = tableTop - (index + 1) * rowHeight
    page.drawText(label, { x: controlX + 5, y: rowY + 4, size: 7.1, font: bold, color: navy })
    drawCenteredText(page, value, regular, 7.1, { x: controlX + labelWidth, y: rowY, width: controlWidth - labelWidth, height: rowHeight }, navy)
  })

  page.drawLine({ start: { x: tableX, y: layout.footerLineY }, end: { x: width - tableX, y: layout.footerLineY }, thickness: 1.2, color: cyan })
  drawCenteredText(page, "Plataforma SafeCloud  |  Desarrollado por CML Solutions", regular, 7.2, { x: tableX, y: 17, width: tableWidth, height: 15 }, gray)
  drawCenteredText(page, "cmlsolutions.co · WhatsApp +57 321 890 0642", regular, 7.2, { x: tableX, y: 5, width: tableWidth, height: 14 }, cyan)
}

function sourceCropBox(width: number, height: number) {
  const cropX = Math.min(SOURCE_CROP, width * 0.06)
  const cropY = Math.min(SOURCE_CROP, height * 0.04)
  return { left: cropX, bottom: cropY, right: width - cropX, top: height - cropY }
}

function placeContent(page: PDFPage, embedded: PDFEmbeddedPage, body: PageBox) {
  const scale = Math.min(body.width / embedded.width, body.height / embedded.height)
  const width = embedded.width * scale
  const height = embedded.height * scale
  page.drawPage(embedded, {
    x: body.x + (body.width - width) / 2,
    y: body.y + (body.height - height) / 2,
    width,
    height,
  })
}

export async function applySafeCloudCorporateTemplate(source: Blob | ArrayBuffer, metadata: CorporatePdfMetadata) {
  const sourceBytes = source instanceof Blob ? await source.arrayBuffer() : source
  const [sourcePdf, identity] = await Promise.all([PDFDocument.load(sourceBytes), resolveCompanyIdentity(metadata)])
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

  const sourcePages = sourcePdf.getPages()
  for (let index = 0; index < sourcePages.length; index += 1) {
    const sourcePage = sourcePages[index]
    const sourceSize = sourcePage.getSize()
    const isPortrait = sourceSize.height >= sourceSize.width
    const [width, height] = isPortrait ? LETTER_PORTRAIT : LETTER_LANDSCAPE
    const page = outputPdf.addPage([width, height])
    const embedded = await outputPdf.embedPage(sourcePage, sourceCropBox(sourceSize.width, sourceSize.height))
    placeContent(page, embedded, documentLayout(width, height, isPortrait).body)
    drawHeaderAndFooter({ page, logo, regular, bold, identity, metadata, pageNumber: index + 1, pageCount: sourcePages.length, isPortrait })
  }

  outputPdf.setTitle(metadata.documentName)
  outputPdf.setAuthor("SafeCloud - Sistema de Gestión Integral")
  outputPdf.setSubject(`Documento generado por SafeCloud: ${metadata.documentName}`)
  outputPdf.setCreator("SafeCloud")
  outputPdf.setProducer("SafeCloud")
  outputPdf.setCreationDate(new Date())
  outputPdf.setModificationDate(new Date())
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
