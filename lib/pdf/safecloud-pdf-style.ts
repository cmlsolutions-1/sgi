import jsPDF, { type jsPDFOptions } from "jspdf"
import { applyPlugin } from "jspdf-autotable"

applyPlugin(jsPDF)

export const SAFE_CLOUD_PDF_COLORS = {
  navy: [18, 59, 103] as [number, number, number],
  blue: [30, 111, 174] as [number, number, number],
  turquoise: [15, 174, 184] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  muted: [71, 85, 105] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  softBackground: [248, 250, 252] as [number, number, number],
  noteBackground: [240, 249, 255] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
} as const

export const SAFE_CLOUD_PDF_STYLE = {
  font: "helvetica",
  titleSize: 15,
  subtitleSize: 10,
  sectionSize: 11,
  subsectionSize: 10,
  bodySize: 9,
  labelSize: 8.5,
  captionSize: 7.5,
  lineHeight: 1.35,
  marginX: 14,
  marginTop: 16,
  marginBottom: 18,
  sectionSpacing: 7,
  paragraphSpacing: 4,
  textColor: SAFE_CLOUD_PDF_COLORS.text,
  mutedColor: SAFE_CLOUD_PDF_COLORS.muted,
  primaryColor: SAFE_CLOUD_PDF_COLORS.blue,
  accentColor: SAFE_CLOUD_PDF_COLORS.turquoise,
  tableHeaderColor: SAFE_CLOUD_PDF_COLORS.navy,
  tableBorderColor: SAFE_CLOUD_PDF_COLORS.border,
} as const

type AutoTableDefaultsDocument = jsPDF & {
  autoTableSetDefaults?: (defaults: Record<string, unknown>) => void
}

type LineHeightDocument = jsPDF & {
  setLineHeightFactor: (value: number) => jsPDF
}

export type PdfMetadataItem = {
  label: string
  value: string | number | null | undefined
}

export type PdfSignatureField = {
  label: string
  detail?: string
}

export type PdfPhotoOptions = {
  dataUrl: string
  format: "JPEG" | "PNG"
  sourceWidth: number
  sourceHeight: number
  caption?: string
  y?: number
}

export function applySafeCloudPdfDefaults(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "normal")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.bodySize)
  ;(doc as LineHeightDocument).setLineHeightFactor(SAFE_CLOUD_PDF_STYLE.lineHeight)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.textColor)

  ;(doc as AutoTableDefaultsDocument).autoTableSetDefaults?.({
    margin: {
      left: SAFE_CLOUD_PDF_STYLE.marginX,
      right: SAFE_CLOUD_PDF_STYLE.marginX,
      top: SAFE_CLOUD_PDF_STYLE.marginTop,
      bottom: SAFE_CLOUD_PDF_STYLE.marginBottom,
    },
    showHead: "everyPage",
    pageBreak: "auto",
    rowPageBreak: "avoid",
    styles: {
      font: SAFE_CLOUD_PDF_STYLE.font,
      fontSize: SAFE_CLOUD_PDF_STYLE.bodySize,
      cellPadding: { top: 2.8, right: 3, bottom: 2.8, left: 3 },
      lineColor: SAFE_CLOUD_PDF_STYLE.tableBorderColor,
      lineWidth: 0.15,
      textColor: SAFE_CLOUD_PDF_STYLE.textColor,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: SAFE_CLOUD_PDF_STYLE.tableHeaderColor,
      textColor: SAFE_CLOUD_PDF_COLORS.white,
      fontStyle: "bold",
      halign: "left",
      lineColor: SAFE_CLOUD_PDF_STYLE.tableHeaderColor,
      lineWidth: 0.15,
    },
    alternateRowStyles: {
      fillColor: SAFE_CLOUD_PDF_COLORS.softBackground,
    },
  })

  return doc
}

export function createSafeCloudPdf(options: jsPDFOptions = {}) {
  return applySafeCloudPdfDefaults(
    new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
      putOnlyUsedFonts: true,
      compress: true,
      ...options,
    }),
  )
}

export function getSafeCloudPdfMetrics(doc: jsPDF) {
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()
  return {
    width,
    height,
    left: SAFE_CLOUD_PDF_STYLE.marginX,
    right: width - SAFE_CLOUD_PDF_STYLE.marginX,
    top: SAFE_CLOUD_PDF_STYLE.marginTop,
    bottom: height - SAFE_CLOUD_PDF_STYLE.marginBottom,
    contentWidth: width - SAFE_CLOUD_PDF_STYLE.marginX * 2,
  }
}

export function ensureSafeCloudPdfSpace(doc: jsPDF, y: number, requiredHeight: number, nextPageY = SAFE_CLOUD_PDF_STYLE.marginTop) {
  const { bottom } = getSafeCloudPdfMetrics(doc)
  if (y + requiredHeight <= bottom) return y
  doc.addPage()
  setSafeCloudPdfBody(doc)
  return nextPageY
}

export function setSafeCloudPdfTitle(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "bold")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.titleSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_COLORS.navy)
  return doc
}

export function setSafeCloudPdfSubtitle(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "normal")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.subtitleSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.mutedColor)
  return doc
}

export function setSafeCloudPdfSection(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "bold")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.sectionSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_COLORS.navy)
  return doc
}

export function setSafeCloudPdfSubsection(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "bold")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.subsectionSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.textColor)
  return doc
}

export function setSafeCloudPdfBody(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "normal")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.bodySize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.textColor)
  return doc
}

export function setSafeCloudPdfLabel(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "bold")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.labelSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.textColor)
  return doc
}

export function setSafeCloudPdfCaption(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "normal")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.captionSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.mutedColor)
  return doc
}

export function addSafeCloudPdfHeading(doc: jsPDF, title: string, subtitle?: string, y = SAFE_CLOUD_PDF_STYLE.marginTop) {
  const { left, contentWidth } = getSafeCloudPdfMetrics(doc)
  setSafeCloudPdfTitle(doc)
  const titleLines = doc.splitTextToSize(title, contentWidth) as string[]
  doc.text(titleLines, left, y)
  let nextY = y + titleLines.length * 6.5
  if (subtitle) {
    setSafeCloudPdfSubtitle(doc)
    const subtitleLines = doc.splitTextToSize(subtitle, contentWidth) as string[]
    doc.text(subtitleLines, left, nextY)
    nextY += subtitleLines.length * 4.8
  }
  return nextY + SAFE_CLOUD_PDF_STYLE.paragraphSpacing
}

export function addSafeCloudPdfSection(doc: jsPDF, title: string, y: number) {
  const { left, right } = getSafeCloudPdfMetrics(doc)
  const safeY = ensureSafeCloudPdfSpace(doc, y, 12)
  setSafeCloudPdfSection(doc)
  doc.text(title, left, safeY)
  doc.setDrawColor(...SAFE_CLOUD_PDF_STYLE.accentColor)
  doc.setLineWidth(0.45)
  doc.line(left, safeY + 2.5, right, safeY + 2.5)
  return safeY + SAFE_CLOUD_PDF_STYLE.sectionSpacing
}

export function addSafeCloudPdfParagraph(doc: jsPDF, value: string, y: number, options: { indent?: number; spacingAfter?: number } = {}) {
  const { left, contentWidth } = getSafeCloudPdfMetrics(doc)
  const indent = options.indent ?? 0
  setSafeCloudPdfBody(doc)
  const lines = doc.splitTextToSize(value || "-", contentWidth - indent) as string[]
  const height = Math.max(5, lines.length * 4.6)
  const safeY = ensureSafeCloudPdfSpace(doc, y, height)
  doc.text(lines, left + indent, safeY)
  return safeY + height + (options.spacingAfter ?? SAFE_CLOUD_PDF_STYLE.paragraphSpacing)
}

export function addSafeCloudPdfMetadata(doc: jsPDF, items: PdfMetadataItem[], y: number) {
  const { left, contentWidth } = getSafeCloudPdfMetrics(doc)
  const rows = items.filter(item => item.value !== null && item.value !== undefined && String(item.value).trim())
  if (!rows.length) return y
  const lineHeight = 6.5
  const safeY = ensureSafeCloudPdfSpace(doc, y, rows.length * lineHeight + 4)
  doc.setFillColor(...SAFE_CLOUD_PDF_COLORS.softBackground)
  doc.setDrawColor(...SAFE_CLOUD_PDF_STYLE.tableBorderColor)
  doc.roundedRect(left, safeY - 4, contentWidth, rows.length * lineHeight + 4, 1.5, 1.5, "FD")
  rows.forEach((item, index) => {
    const rowY = safeY + index * lineHeight
    setSafeCloudPdfLabel(doc)
    doc.text(`${item.label}:`, left + 4, rowY)
    setSafeCloudPdfBody(doc)
    doc.text(doc.splitTextToSize(String(item.value), contentWidth * 0.66), left + contentWidth * 0.3, rowY)
  })
  return safeY + rows.length * lineHeight + SAFE_CLOUD_PDF_STYLE.sectionSpacing
}

export function addSafeCloudPdfNote(doc: jsPDF, value: string, y: number, label = "Nota") {
  const { left, contentWidth } = getSafeCloudPdfMetrics(doc)
  setSafeCloudPdfBody(doc)
  const lines = doc.splitTextToSize(value, contentWidth - 10) as string[]
  const height = Math.max(14, lines.length * 4.6 + 9)
  const safeY = ensureSafeCloudPdfSpace(doc, y, height)
  doc.setFillColor(...SAFE_CLOUD_PDF_COLORS.noteBackground)
  doc.setDrawColor(...SAFE_CLOUD_PDF_STYLE.accentColor)
  doc.roundedRect(left, safeY, contentWidth, height, 1.5, 1.5, "FD")
  setSafeCloudPdfLabel(doc)
  doc.text(label, left + 5, safeY + 6)
  setSafeCloudPdfBody(doc)
  doc.text(lines, left + 5, safeY + 11)
  return safeY + height + SAFE_CLOUD_PDF_STYLE.sectionSpacing
}

export function addSafeCloudPdfSignatures(doc: jsPDF, fields: PdfSignatureField[], y: number) {
  const { left, contentWidth } = getSafeCloudPdfMetrics(doc)
  const columns = Math.min(2, Math.max(1, fields.length))
  const rows = Math.ceil(fields.length / columns)
  const blockHeight = rows * 32
  const safeY = ensureSafeCloudPdfSpace(doc, y, blockHeight)
  const columnWidth = contentWidth / columns
  fields.forEach((field, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    const x = left + column * columnWidth + 4
    const rowY = safeY + row * 32
    doc.setDrawColor(...SAFE_CLOUD_PDF_STYLE.tableBorderColor)
    doc.line(x, rowY + 18, x + columnWidth - 12, rowY + 18)
    setSafeCloudPdfLabel(doc)
    doc.text(field.label, x, rowY + 23)
    if (field.detail) {
      setSafeCloudPdfCaption(doc)
      doc.text(field.detail, x, rowY + 28)
    }
  })
  return safeY + blockHeight
}

export function addSafeCloudPdfPhoto(doc: jsPDF, options: PdfPhotoOptions) {
  const metrics = getSafeCloudPdfMetrics(doc)
  const captionHeight = options.caption ? 10 : 0
  const preferredY = options.y ?? metrics.top
  const maxHeight = metrics.bottom - preferredY - captionHeight
  const scale = Math.min(metrics.contentWidth / options.sourceWidth, maxHeight / options.sourceHeight)
  const width = options.sourceWidth * scale
  const height = options.sourceHeight * scale
  const x = metrics.left + (metrics.contentWidth - width) / 2

  doc.setDrawColor(...SAFE_CLOUD_PDF_STYLE.tableBorderColor)
  doc.setLineWidth(0.25)
  doc.roundedRect(x - 2, preferredY - 2, width + 4, height + 4, 1.5, 1.5, "S")
  doc.addImage(options.dataUrl, options.format, x, preferredY, width, height, undefined, "FAST")
  if (options.caption) {
    setSafeCloudPdfCaption(doc)
    const lines = doc.splitTextToSize(options.caption, metrics.contentWidth) as string[]
    doc.text(lines, metrics.left, preferredY + height + 7)
  }
  return preferredY + height + captionHeight
}
