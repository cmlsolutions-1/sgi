import jsPDF, { type jsPDFOptions } from "jspdf"
import { applyPlugin } from "jspdf-autotable"

applyPlugin(jsPDF)

export const SAFE_CLOUD_PDF_STYLE = {
  font: "helvetica",
  titleSize: 15,
  sectionSize: 11,
  bodySize: 9,
  captionSize: 8,
  lineHeight: 1.3,
  marginX: 14,
  marginTop: 18,
  marginBottom: 18,
  textColor: [31, 41, 55] as [number, number, number],
  mutedColor: [75, 85, 99] as [number, number, number],
  primaryColor: [37, 99, 235] as [number, number, number],
  tableHeaderColor: [30, 64, 175] as [number, number, number],
  tableBorderColor: [203, 213, 225] as [number, number, number],
} as const

type AutoTableDefaultsDocument = jsPDF & {
  autoTableSetDefaults?: (defaults: Record<string, unknown>) => void
}

type LineHeightDocument = jsPDF & {
  setLineHeightFactor: (value: number) => jsPDF
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
      bottom: SAFE_CLOUD_PDF_STYLE.marginBottom,
    },
    styles: {
      font: SAFE_CLOUD_PDF_STYLE.font,
      fontSize: SAFE_CLOUD_PDF_STYLE.bodySize,
      cellPadding: 3,
      lineColor: SAFE_CLOUD_PDF_STYLE.tableBorderColor,
      lineWidth: 0.15,
      textColor: SAFE_CLOUD_PDF_STYLE.textColor,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: SAFE_CLOUD_PDF_STYLE.tableHeaderColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  })

  return doc
}

export function createSafeCloudPdf(options: jsPDFOptions = {}) {
  return applySafeCloudPdfDefaults(
    new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      putOnlyUsedFonts: true,
      compress: true,
      ...options,
    }),
  )
}

export function setSafeCloudPdfTitle(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "bold")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.titleSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.primaryColor)
  return doc
}

export function setSafeCloudPdfSection(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "bold")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.sectionSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.textColor)
  return doc
}

export function setSafeCloudPdfBody(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "normal")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.bodySize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.textColor)
  return doc
}

export function setSafeCloudPdfCaption(doc: jsPDF) {
  doc.setFont(SAFE_CLOUD_PDF_STYLE.font, "normal")
  doc.setFontSize(SAFE_CLOUD_PDF_STYLE.captionSize)
  doc.setTextColor(...SAFE_CLOUD_PDF_STYLE.mutedColor)
  return doc
}
