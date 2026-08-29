import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export type DateRangeMode = "all" | "bimester" | "quarter" | "custom"

export type DateRangeFilter = {
  mode: DateRangeMode
  year: string
  period: string
  startDate: string
  endDate: string
}

export type PdfTableColumn<T> = {
  header: string
  value: (item: T) => string | number | null | undefined
}

const monthNames = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

export const defaultDateRangeFilter = (): DateRangeFilter => {
  const today = new Date()
  return {
    mode: "all",
    year: String(today.getFullYear()),
    period: "1",
    startDate: "",
    endDate: "",
  }
}

export function formatDisplayDate(value?: string | null) {
  if (!value) return "Sin fecha"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value.slice(0, 10)

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function getRangeDates(filter: DateRangeFilter) {
  const year = Number(filter.year) || new Date().getFullYear()

  if (filter.mode === "custom") {
    return {
      startDate: filter.startDate || undefined,
      endDate: filter.endDate || undefined,
      label: filter.startDate && filter.endDate
        ? `${formatDisplayDate(filter.startDate)} a ${formatDisplayDate(filter.endDate)}`
        : "Rango personalizado",
    }
  }

  if (filter.mode === "bimester") {
    const period = Math.min(Math.max(Number(filter.period) || 1, 1), 6)
    const startMonth = (period - 1) * 2
    const endMonth = startMonth + 1
    return {
      startDate: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`,
      endDate: new Date(Date.UTC(year, endMonth + 1, 0)).toISOString().slice(0, 10),
      label: `Bimestre ${period} (${monthNames[startMonth]} - ${monthNames[endMonth]} ${year})`,
    }
  }

  if (filter.mode === "quarter") {
    const period = Math.min(Math.max(Number(filter.period) || 1, 1), 4)
    const startMonth = (period - 1) * 3
    const endMonth = startMonth + 2
    return {
      startDate: `${year}-${String(startMonth + 1).padStart(2, "0")}-01`,
      endDate: new Date(Date.UTC(year, endMonth + 1, 0)).toISOString().slice(0, 10),
      label: `Trimestre ${period} (${monthNames[startMonth]} - ${monthNames[endMonth]} ${year})`,
    }
  }

  return {
    startDate: undefined,
    endDate: undefined,
    label: "Todos los registros",
  }
}

export function isWithinRange(value: string | null | undefined, startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return true
  if (!value) return false

  const date = value.slice(0, 10)
  if (startDate && date < startDate) return false
  if (endDate && date > endDate) return false
  return true
}

export function validateDateRange(filter: DateRangeFilter) {
  if (filter.mode !== "custom") return true
  if (!filter.startDate || !filter.endDate) return false
  return filter.startDate <= filter.endDate
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = filename
  window.document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function buildReportPdf<T>({
  title,
  subtitle,
  filename,
  summary,
  rows,
  columns,
}: {
  title: string
  subtitle?: string
  filename: string
  summary?: Array<[string, string | number]>
  rows: T[]
  columns: Array<PdfTableColumn<T>>
}) {
  const doc = new jsPDF({ unit: "mm", format: "letter" })
  let y = 16

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.text(title, 14, y)
  y += 7

  if (subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text(subtitle, 14, y)
    y += 8
  }

  if (summary?.length) {
    autoTable(doc, {
      startY: y,
      head: [["Indicador", "Valor"]],
      body: summary.map(([label, value]) => [label, String(value)]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [47, 142, 216] },
      margin: { left: 14, right: 14 },
    })
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 8
  }

  autoTable(doc, {
    startY: y,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) => columns.map((column) => String(column.value(row) ?? ""))),
    styles: { fontSize: 7, cellPadding: 1.6, overflow: "linebreak" },
    headStyles: { fillColor: [47, 142, 216] },
    margin: { left: 8, right: 8 },
  })

  doc.save(filename)
}
