import type { ManagedDocument } from "@/types/manager/document-management"
import type { Employee, EmployeeSgiResponsible } from "@/types/manager/employee"
import type { Incident } from "@/types/manager/incident"
import type { PreventiveMeasure } from "@/types/manager/preventiveMeasure"
import type { Risk } from "@/types/manager/risk"
import type { Training } from "@/types/manager/training"
import type { IntelligenceInsight, IntelligencePriority } from "@/types/intelligence"

export type DashboardIntelligenceData = {
  employees: Employee[]
  risks: Risk[]
  preventiveMeasures: PreventiveMeasure[]
  trainings: Training[]
  documents: ManagedDocument[]
  incidents: Incident[]
  sgiResponsible: EmployeeSgiResponsible | null
}

export type InspectionIntelligenceRecord = {
  id: string
  elementName: string
  result: "COMPLIES" | "DOES_NOT_COMPLY" | "PARTIAL"
  copasstParticipated: boolean
  evidence?: unknown
}

const priorityWeight: Record<IntelligencePriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
}

function startOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

function isPast(value?: string | null) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  date.setHours(0, 0, 0, 0)
  return date.getTime() < startOfToday().getTime()
}

function daysUntil(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - startOfToday().getTime()) / 86_400_000)
}

export function sortInsights(insights: IntelligenceInsight[]) {
  return [...insights].sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
}

export function buildDashboardInsights(data: DashboardIntelligenceData): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = []
  const overdueMeasures = data.preventiveMeasures.filter(
    (measure) => measure.status === "PENDING" && measure.type === "DATE" && isPast(measure.dueDate),
  )
  const highRisks = data.risks.filter(
    (risk) => risk.status === "ACTIVE" && (["I", "II"].includes(risk.riskLevelName) || Number(risk.riskLevel) >= 150),
  )
  const incompleteSocialSecurity = data.employees.filter(
    (employee) => employee.status && (!employee.epsId || !employee.arlId || !employee.pensionId || !employee.compensationId),
  )
  const openAccidents = data.incidents.filter(
    (incident) => incident.status === "ACTIVE" && incident.type === "ACCIDENTE" && incident.caseStatus !== "CERRADO",
  )
  const upcomingTrainings = data.trainings.filter((training) => {
    const remainingDays = daysUntil(training.date)
    return training.status === "ACTIVE" && remainingDays !== null && remainingDays >= 0 && remainingDays <= 7
  })
  const inactiveDocuments = data.documents.filter((document) => document.status === "INACTIVE")

  if (!data.sgiResponsible) {
    insights.push({
      id: "dashboard-sgi-responsible",
      module: "Configuracion SGI",
      priority: "critical",
      title: "No hay un responsable SG-SST designado",
      description: "La operacion del sistema no tiene una persona responsable visible para coordinar seguimientos.",
      reason: "La asignacion permite dirigir alertas, tareas y vencimientos a una persona concreta.",
      actions: [{ id: "assign-responsible", label: "Designar responsable", href: "/dashboard/sgi-responsible", emphasis: true }],
    })
  }

  if (overdueMeasures.length > 0) {
    insights.push({
      id: "dashboard-overdue-measures",
      module: "Medidas preventivas",
      priority: "critical",
      count: overdueMeasures.length,
      title: `${overdueMeasures.length} ${overdueMeasures.length === 1 ? "medida esta vencida" : "medidas estan vencidas"}`,
      description: "Hay compromisos pendientes cuya fecha de cumplimiento ya termino.",
      reason: "Un vencimiento sin cierre aumenta la exposicion y rompe la trazabilidad del plan de accion.",
      actions: [{ id: "review-overdue", label: "Revisar vencimientos", href: "/dashboard/preventiveMeasures", emphasis: true }],
    })
  }

  if (openAccidents.length > 0) {
    insights.push({
      id: "dashboard-open-accidents",
      module: "Novedades laborales",
      priority: "high",
      count: openAccidents.length,
      title: `${openAccidents.length} ${openAccidents.length === 1 ? "accidente sigue abierto" : "accidentes siguen abiertos"}`,
      description: "Estos casos requieren investigacion, acciones correctivas o confirmacion de cierre.",
      reason: "Los accidentes abiertos deben conservar seguimiento y evidencia hasta su cierre.",
      actions: [{ id: "review-accidents", label: "Revisar casos", href: "/dashboard/incidents", emphasis: true }],
    })
  }

  if (highRisks.length > 0) {
    insights.push({
      id: "dashboard-priority-risks",
      module: "Riesgos laborales",
      priority: "high",
      count: highRisks.length,
      title: `${highRisks.length} ${highRisks.length === 1 ? "riesgo requiere" : "riesgos requieren"} control prioritario`,
      description: "La matriz contiene riesgos activos con una valoracion alta o critica.",
      reason: "La priorizacion permite concentrar controles y recursos donde el impacto potencial es mayor.",
      actions: [
        { id: "review-risks", label: "Ver riesgos", href: "/dashboard/occupational/risk-matrix", emphasis: true },
        { id: "create-measure", label: "Crear medida", href: "/dashboard/preventiveMeasures" },
      ],
    })
  }

  if (incompleteSocialSecurity.length > 0) {
    insights.push({
      id: "dashboard-social-security",
      module: "Gestion de empleados",
      priority: "high",
      count: incompleteSocialSecurity.length,
      title: `${incompleteSocialSecurity.length} ${incompleteSocialSecurity.length === 1 ? "funcionario tiene" : "funcionarios tienen"} afiliaciones incompletas`,
      description: "Falta al menos una entidad entre EPS, ARL, pension o caja de compensacion.",
      reason: "Completar la seguridad social evita vacios en la cobertura y facilita las verificaciones laborales.",
      actions: [{ id: "complete-security", label: "Completar afiliaciones", href: "/dashboard/employees", emphasis: true }],
    })
  }

  if (upcomingTrainings.length > 0) {
    insights.push({
      id: "dashboard-upcoming-trainings",
      module: "Capacitaciones",
      priority: "medium",
      count: upcomingTrainings.length,
      title: `${upcomingTrainings.length} ${upcomingTrainings.length === 1 ? "capacitacion ocurre" : "capacitaciones ocurren"} en los proximos 7 dias`,
      description: "Conviene confirmar responsable, asistentes y soportes antes de la fecha programada.",
      reason: "La preparacion anticipada reduce inasistencias y registros incompletos.",
      actions: [{ id: "review-trainings", label: "Revisar agenda", href: "/dashboard/trainingPlan", emphasis: true }],
    })
  }

  if (inactiveDocuments.length > 0) {
    insights.push({
      id: "dashboard-inactive-documents",
      module: "Gestion documental",
      priority: "low",
      count: inactiveDocuments.length,
      title: `${inactiveDocuments.length} ${inactiveDocuments.length === 1 ? "documento esta inactivo" : "documentos estan inactivos"}`,
      description: "Revisa si deben actualizarse, reemplazarse o mantenerse fuera de circulacion.",
      reason: "La depuracion periodica evita que el equipo consulte versiones que ya no aplican.",
      actions: [{ id: "review-documents", label: "Revisar documentos", href: "/dashboard/documents" }],
    })
  }

  return sortInsights(insights)
}

export function buildInspectionInsights(records: InspectionIntelligenceRecord[]): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = []
  const withoutEvidence = records.filter((record) => !record.evidence)
  const nonCompliant = records.filter((record) => record.result === "DOES_NOT_COMPLY")
  const partial = records.filter((record) => record.result === "PARTIAL")
  const withoutCopasst = records.filter((record) => !record.copasstParticipated)

  if (nonCompliant.length > 0) {
    insights.push({
      id: "inspections-non-compliant",
      module: "Inspecciones",
      priority: "high",
      count: nonCompliant.length,
      title: `${nonCompliant.length} ${nonCompliant.length === 1 ? "inspeccion no cumple" : "inspecciones no cumplen"}`,
      description: "Los hallazgos requieren una accion correctiva y seguimiento hasta confirmar su cierre.",
      reason: "Un resultado no conforme que queda sin tratamiento puede convertirse en un riesgo recurrente.",
      actions: [
        { id: "review-non-compliant", label: "Revisar incumplimientos", emphasis: true },
        { id: "create-preventive-measure", label: "Crear medida", href: "/dashboard/preventiveMeasures" },
      ],
    })
  }

  if (withoutEvidence.length > 0) {
    const emergencyWithoutEvidence = withoutEvidence.filter((record) =>
      record.elementName.toLowerCase().includes("extintor"),
    )
    const subject = emergencyWithoutEvidence.length > 0 ? "extintores" : "inspecciones"
    const count = emergencyWithoutEvidence.length || withoutEvidence.length

    insights.push({
      id: "inspections-missing-evidence",
      module: "Inspecciones",
      priority: nonCompliant.some((record) => !record.evidence) ? "high" : "medium",
      count,
      title: `${count} ${subject} no ${count === 1 ? "tiene" : "tienen"} evidencia`,
      description: "El registro existe, pero no cuenta con un soporte documental o fotografico asociado.",
      reason: "La evidencia permite demostrar la inspeccion y verificar posteriormente las condiciones encontradas.",
      actions: [
        { id: "upload-evidence", label: "Cargar evidencia", emphasis: true },
        { id: "schedule-follow-up", label: "Programar seguimiento" },
      ],
    })
  }

  if (partial.length > 0) {
    insights.push({
      id: "inspections-partial-results",
      module: "Inspecciones",
      priority: "medium",
      count: partial.length,
      title: `${partial.length} ${partial.length === 1 ? "resultado parcial necesita" : "resultados parciales necesitan"} revision`,
      description: "Estas inspecciones no estan conformes por completo y pueden requerir una nueva verificacion.",
      reason: "Revisarlas evita que una condicion parcial permanezca abierta sin una decision.",
      actions: [{ id: "review-partial", label: "Revisar parciales", emphasis: true }],
    })
  }

  if (withoutCopasst.length > 0) {
    insights.push({
      id: "inspections-without-copasst",
      module: "Inspecciones",
      priority: "low",
      count: withoutCopasst.length,
      title: `${withoutCopasst.length} ${withoutCopasst.length === 1 ? "registro no incluye" : "registros no incluyen"} participacion del COPASST`,
      description: "Valida si la participacion era necesaria para el tipo de inspeccion realizada.",
      reason: "La participacion del comite fortalece la revision y la trazabilidad de ciertos hallazgos.",
      actions: [{ id: "review-copasst", label: "Revisar registros" }],
    })
  }

  return sortInsights(insights)
}
