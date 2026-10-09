import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { text, type Evidence } from "./planning"
import { aggregate, definitions, evidenceDate, formulaLabel, periodLabel, quarterEnd, reportWarnings, stepNames, type AnnualReport, type CsvReview, type IndicatorDefinition, type IndicatorsState, type Level, type Measurement } from "./indicators"

export function resultLabel(result: number | null, definition: IndicatorDefinition) {
  if (result === null) return "Sin base de cálculo"
  return definition.formula === "COST" ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(result) : `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(result)} ${definition.unit}`
}
function document(title: string, subtitle: string) {
  const doc = new jsPDF()
  const header = () => {
    doc.setFillColor(30, 64, 175); doc.rect(0, 0, 210, 9, "F")
    doc.setTextColor(30, 64, 175); doc.setFont("helvetica", "bold"); doc.setFontSize(13)
    doc.text(doc.splitTextToSize(title, 180), 14, 19)
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80)
    doc.text(subtitle, 14, 32)
  }
  const table = (head: string[], body: string[][]) => {
    const previous = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
    let startY = previous ? previous + 7 : 40
    if (startY > 247) { doc.addPage(); startY = 40 }
    autoTable(doc, { head: [head], body: body.length ? body : [head.map((_, index) => index === 0 ? "Sin registros disponibles" : "")], margin: { top: 40, bottom: 20 }, startY, headStyles: { fillColor: [30, 64, 175] }, styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" }, rowPageBreak: "avoid" })
  }
  const files = (evidence: Evidence[]) => { if (evidence.length) table(["Soporte", "Fecha de carga"], evidence.map(e => [e.name, evidenceDate(e.uploadedAt)])) }
  const finish = (name: string, signature = true) => {
    if (signature) { doc.addPage(); doc.setTextColor(80); doc.setFontSize(11); doc.text("Revisión y firma", 14, 48); doc.setFontSize(10); doc.text("Nombre: ______________________________________", 14, 66); doc.text("Cargo: ________________________________________", 14, 84); doc.text("Firma: ________________________________________", 14, 102); doc.text("Fecha: ________________________________________", 14, 120) }
    const pages = doc.internal.pages.length - 1
    for (let page = 1; page <= pages; page++) { doc.setPage(page); header(); doc.setTextColor(100); doc.setFontSize(8); doc.line(14, 280, 196, 280); doc.text(`SafeCloud · PESV · Página ${page} de ${pages}`, 14, 287) }
    doc.save(name)
  }
  return { doc, table, files, finish }
}
export function downloadMeasurement(measurement: Measurement) {
  const pdf = document("Ficha y medición de indicador PESV", `${measurement.year} · ${periodLabel(measurement.definition, measurement.period)} · ${measurement.loss || "General"}`)
  pdf.table(["Campo", "Información"], [
    ["Indicador", `${measurement.definition.code} · ${measurement.sheet.name}`], ["Qué se mide", measurement.sheet.description], ["Sentido esperado", measurement.definition.direction],
    ["Fuentes y confiabilidad", `${measurement.sheet.sources}\n${measurement.sheet.sourceReliability}`], ["Línea base / meta", `${measurement.sheet.baseline} / ${measurement.sheet.target}`],
    ["Actividades vinculadas", measurement.sheet.workActivityNames.join("; ") || "Sin relación específica"], ["Fórmula aplicada", formulaLabel(measurement.definition, measurement.rateConstant, measurement.costMethod)],
    [measurement.definition.numerator, String(measurement.numerator)], [measurement.definition.denominator, String(measurement.denominator)], ["Resultado", resultLabel(measurement.result, measurement.definition)],
    ["Fuente del corte", `${measurement.source}\n${measurement.sourceDetails}`], ["Análisis", measurement.analysis], ["Fecha de registro", measurement.registeredAt],
    ...(measurement.supersedesId ? [["Rectificación", measurement.correctionReason || ""]] : []),
  ])
  pdf.files(measurement.evidence); pdf.finish(`pesv-indicador-${measurement.indicatorId}-${measurement.year}-${measurement.period}.pdf`)
}
export function downloadCsvReview(review: CsvReview) {
  const pdf = document("Análisis de indicadores · Comité de Seguridad Vial", `Vigencia ${review.year} · Corte ${quarterEnd(review.year, review.quarter)}`)
  pdf.table(["Campo", "Información"], [["Fecha de revisión", review.date], ["Revisores", review.reviewerNames.join("; ")], ["Conclusión", review.conclusion], ["Decisiones y acciones", review.decisions]])
  pdf.table(["Indicador / período", "Resultado", "Análisis"], review.measurements.map(m => [`${m.sheet.name}\n${periodLabel(m.definition, m.period)} ${m.loss}`, resultLabel(m.result, m.definition), m.analysis]))
  pdf.files(review.evidence); pdf.finish(`pesv-revision-csv-${review.year}-T${review.quarter}.pdf`)
}
export function downloadIndicatorSummary(state: IndicatorsState, year: string, quarter: number) {
  const pdf = document("Indicadores de gestión de seguridad vial", `Vigencia ${year} · Acumulado al ${quarterEnd(year, String(quarter))} · Nivel ${state.level}`)
  const rows = definitions.filter(d => d.levels.includes(state.level)).flatMap(d => (d.loss ? ["Fatalidades", "Heridos graves (más de 30 días)", "Heridos leves (hasta 30 días)", "Choques simples"] : [""]).map(loss => {
    const result = aggregate(d, state.measurements, year, quarter, loss)
    return [`${d.code} · ${d.name}\n${loss}`, result.value === null ? result.reason : resultLabel(result.value, d), result.missing.length ? `Pendientes: ${result.missing.join(", ")}` : `${result.count} medición(es)`]
  }))
  pdf.table(["Indicador", "Resultado acumulado", "Cobertura de cortes"], rows); pdf.finish(`pesv-indicadores-${year}-T${quarter}.pdf`)
}
export function downloadAnnualReport(report: AnnualReport) {
  const year = text(report.values.year)
  const warnings = reportWarnings(report, text(report.values.level) as Level)
  const pdf = document("Reporte anual de autogestión PESV", `Corte: ${year}-12-31 · ${warnings.length ? "BORRADOR · Información pendiente" : "Documento para revisión y presentación"}`)
  if (warnings.length) pdf.table(["Pendientes de validación"], warnings.map(w => [w]))
  pdf.table(["Información", "Datos de la organización"], [
    ["Razón social / NIT", `${text(report.values.companyName)}\n${text(report.values.nit)}`], ["Dirección / teléfono", `${text(report.values.address)}\n${text(report.values.phone)}`],
    ["Representante legal", text(report.values.representative)], ["Misionalidad / tamaño", `${text(report.values.mission)}\n${text(report.values.size)}`],
    ["Líder PESV", `${text(report.values.leaderName)}\n${text(report.values.leaderRole)}\n${text(report.values.leaderEmail)}`], ["Auditores del año", text(report.values.auditors)],
    ["Fecha de última auditoría interna", text(report.values.auditDate)], ["Autoridad destinataria", text(report.values.authority)], ["Fecha de generación del registro", report.createdAt],
  ])
  for (const [title, rows] of [["Flota por tipo y vinculación", report.fleet], ["Colaboradores por actor vial", report.actors], ["Contratistas, subcontratistas y terceros", report.contractors], ["Infracciones por tipo / código", report.fines]] as const) pdf.table([title, "Categoría", "Cantidad"], rows.map(r => [r.label, r.category, String(r.count)]))
  for (const [title, records] of [["Objetivos del año reportado", report.objectives], ["Objetivos propuestos para el nuevo año", report.nextObjectives], ["Programas del año reportado", report.programs], ["Programas propuestos para el nuevo año", report.nextPrograms]] as const) pdf.table([title, "Descripción / meta"], records.length ? records.map(i => [text(i.values.name), `${text(i.values.description) || text(i.values.objective)}\nMeta: ${text(i.values.target) || text(i.values.goal)}\nFactores: ${text(i.values.performanceFactors)}`]) : [["Sin registros relacionados", "Pendiente de documentar"]])
  pdf.table(["Indicador", "Resultado anual", "Cortes pendientes"], definitions.filter(d => d.levels.includes(text(report.values.level) as Level)).flatMap(d => (d.loss ? ["Fatalidades", "Heridos graves (más de 30 días)", "Heridos leves (hasta 30 días)", "Choques simples"] : [""]).map(loss => { const a = aggregate(d, report.measurements, year, 4, loss); return [`${d.code} · ${d.name}\n${loss}`, a.value === null ? a.reason : resultLabel(a.value, d), a.missing.join(", ") || "Sin cortes faltantes"] })))
  pdf.table(["Corte / indicador", "Variables / resultado", "Análisis y fuente"], report.measurements.map(m => [`${m.sheet.name}\n${periodLabel(m.definition, m.period)} · ${m.loss}`, `${m.numerator} / ${m.denominator}\n${resultLabel(m.result, m.definition)}\n${formulaLabel(m.definition, m.rateConstant, m.costMethod)}`, `${m.analysis}\nFuente: ${m.source}`]))
  pdf.table(["Revisión CSV", "Conclusiones y decisiones"], report.reviews.map(r => [`Trimestre ${r.quarter} · ${r.date}\n${r.reviewerNames.join("; ")}`, `${r.conclusion}\n${r.decisions}`]))
  pdf.table(["Paso", "Evaluación de auditoría", "Observaciones"], report.steps.map(s => [`${s.step}. ${stepNames[s.step - 1]}`, s.status, s.observations]))
  pdf.table(["Análisis anual", "Compromisos de mejora"], [[text(report.values.analysis), text(report.values.improvements)]])
  pdf.files(report.evidence)
  if (report.presentations.length) pdf.table(["Presentación", "Autoridad", "Referencia"], report.presentations.map(p => [p.date, p.authority, p.reference]))
  pdf.finish(`pesv-autogestion-${year}-${report.id.slice(0, 8)}.pdf`)
}
