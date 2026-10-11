import { listAccountabilityReports } from "@/services/accountabilityService"
import { listAcpms } from "@/services/acpmService"
import { listCommittees, listMeetings } from "@/services/committeeService"
import { listCustodyRecords } from "@/services/custodyService"
import { listEmergencyBrigades, listEmergencyManagement } from "@/services/emergencyService"
import { listEnvironmentalMeasurements } from "@/services/environmentalMeasurementsService"
import { listHazardousSubstances } from "@/services/hazardousSubstancesService"
import { listHealthyLifestyles } from "@/services/healthyLifestyleService"
import { listHygieneServices } from "@/services/hygieneServicesService"
import { listInitialEvaluations } from "@/services/initialEvaluationService"
import { listInspections } from "@/services/inspectionsService"
import { listInvestigations } from "@/services/investigationService"
import { listJobs } from "@/services/jobService"
import { listLegalMatrixItems } from "@/services/legalMatrixService"
import { listPreventiveMaintenance } from "@/services/preventiveMaintenanceService"
import { listHygieneSupplies, listPestControls, listSanitationRecords } from "@/services/sanitaryService"
import { listSpecialRisks } from "@/services/specialRiskService"
import { listSstAudits } from "@/services/sstAuditService"
import { listSstCommunications } from "@/services/sstCommunicationService"
import { listSstIndicatorReports } from "@/services/sstIndicatorsService"
import { listSstObjectives } from "@/services/sstObjectiveService"
import { listSstPolicies } from "@/services/sstPolicyService"
import { listSstTrainingCertifications } from "@/services/sstTrainingCertificationService"
import { listWasteManagement } from "@/services/wasteManagementService"
import { listWorkAreas } from "@/services/workAreaService"
import { listWorkPlanItems } from "@/services/workPlanService"
import type { IntelligenceInsight } from "@/types/intelligence"

type UnknownRecord = Record<string, unknown>

export type SystemModuleKnowledge = {
  id: string
  label: string
  href: string
  aliases: string[]
  total: number
  loaded: number
  pending: number
  completed: number
  overdue: number
  available: boolean
  examples: string[]
}

type ModuleDefinition = Pick<SystemModuleKnowledge, "id" | "label" | "href" | "aliases"> & {
  load: () => Promise<unknown>
}

const pendingStatuses = new Set([
  "PENDING",
  "PENDING_APPROVAL",
  "PENDING_SUPPORTS",
  "IN_PROGRESS",
  "EN_PROCESO",
  "OPEN",
  "OPENED",
  "REPORTED",
  "POR_VERIFICAR",
  "DRAFT",
])
const completedStatuses = new Set([
  "DONE",
  "COMPLETE",
  "COMPLETED",
  "APPROVED",
  "FINISHED",
  "FINALIZED",
  "FINALIZADO",
  "FINALIZADA",
  "CLOSED",
  "CERRADO",
  "CERRADA",
  "VERIFIED",
])

const definitions: ModuleDefinition[] = [
  { id: "custody", label: "Custodia", href: "/dashboard/custody", aliases: ["custodia"], load: () => listCustodyRecords({ limit: 100 }) },
  { id: "acpm", label: "ACPM", href: "/dashboard/acpm", aliases: ["acpm", "acciones correctivas", "acciones preventivas"], load: () => listAcpms({ limit: 100 }) },
  { id: "investigations", label: "Investigaciones", href: "/dashboard/investigations", aliases: ["investigacion", "investigaciones"], load: () => listInvestigations({ limit: 100 }) },
  { id: "work-plan", label: "Plan de trabajo", href: "/dashboard/work-plan", aliases: ["plan de trabajo", "actividades del plan"], load: () => listWorkPlanItems({ limit: 100 }) },
  { id: "objectives", label: "Objetivos SST", href: "/dashboard/sst-objectives", aliases: ["objetivo sst", "objetivos sst"], load: () => listSstObjectives({ limit: 100 }) },
  { id: "sst-policy", label: "Politica SST", href: "/dashboard/occupational", aliases: ["politica sst", "politicas sst"], load: () => listSstPolicies({ limit: 100 }) },
  { id: "certifications", label: "Formacion y certificaciones", href: "/dashboard/sst-training-certifications", aliases: ["formacion y certificaciones", "certificacion", "certificaciones"], load: () => listSstTrainingCertifications({ limit: 100 }) },
  { id: "initial-evaluation", label: "Evaluacion inicial", href: "/dashboard/initial-evaluation", aliases: ["evaluacion inicial", "evaluaciones iniciales"], load: () => listInitialEvaluations({ limit: 100 }) },
  { id: "accountability", label: "Rendicion de cuentas", href: "/dashboard/accountability", aliases: ["rendicion de cuentas", "rendiciones"], load: () => listAccountabilityReports({ limit: 100 }) },
  { id: "committees", label: "Gestion de comites", href: "/dashboard/committee-management", aliases: ["comite", "comites"], load: () => listCommittees({ limit: 100 }) },
  { id: "meetings", label: "Reuniones", href: "/dashboard/meetings", aliases: ["reunion", "reuniones"], load: () => listMeetings({ limit: 100 }) },
  { id: "emergencies", label: "Gestion de emergencias", href: "/dashboard/emergency-management", aliases: ["plan de emergencia", "gestion de emergencias", "emergencias"], load: () => listEmergencyManagement({ limit: 100 }) },
  { id: "brigades", label: "Brigada de emergencias", href: "/dashboard/emergency-brigades", aliases: ["brigada", "brigadas de emergencia"], load: () => listEmergencyBrigades({ limit: 100 }) },
  { id: "maintenance", label: "Mantenimiento preventivo", href: "/dashboard/preventive-maintenance", aliases: ["mantenimiento", "mantenimiento preventivo"], load: () => listPreventiveMaintenance({ limit: 100 }) },
  { id: "special-risk", label: "Riesgo especial", href: "/dashboard/special-risk", aliases: ["riesgo especial", "riesgos especiales"], load: () => listSpecialRisks({ limit: 100 }) },
  { id: "audits", label: "Auditorias SST", href: "/dashboard/audits", aliases: ["auditoria", "auditorias sst"], load: () => listSstAudits({ limit: 100 }) },
  { id: "communications", label: "Comunicaciones SST", href: "/dashboard/sst-communications", aliases: ["comunicacion sst", "comunicaciones sst"], load: () => listSstCommunications({ limit: 100 }) },
  { id: "healthy-lifestyles", label: "Estilos de vida saludable", href: "/dashboard/healthy-lifestyles", aliases: ["vida saludable", "actividad saludable", "estilos de vida"], load: () => listHealthyLifestyles({ limit: 100 }) },
  { id: "hazardous-substances", label: "Sustancias peligrosas", href: "/dashboard/hazardous-substances", aliases: ["sustancia peligrosa", "sustancias peligrosas"], load: () => listHazardousSubstances({ limit: 100 }) },
  { id: "environmental-measurements", label: "Mediciones ambientales", href: "/dashboard/environmental-measurements", aliases: ["medicion ambiental", "mediciones ambientales"], load: () => listEnvironmentalMeasurements({ limit: 100 }) },
  { id: "inspections", label: "Inspecciones", href: "/dashboard/inspections", aliases: ["inspeccion", "inspecciones", "extintor", "extintores"], load: () => listInspections({ limit: 100 }) },
  { id: "legal-matrix", label: "Matriz legal", href: "/dashboard/legal-matrix", aliases: ["matriz legal", "normograma", "requisito legal"], load: () => listLegalMatrixItems({ limit: 100 }) },
  { id: "hygiene-services", label: "Servicios de higiene", href: "/dashboard/hygiene-services", aliases: ["servicio de higiene", "servicios de higiene"], load: () => listHygieneServices({ limit: 100 }) },
  { id: "waste", label: "Manejo de residuos", href: "/dashboard/waste-management", aliases: ["residuo", "residuos", "manejo de residuos"], load: () => listWasteManagement({ limit: 100 }) },
  { id: "hygiene-supplies", label: "Insumos de higiene", href: "/dashboard/hygiene-supplies", aliases: ["insumo de higiene", "insumos de higiene"], load: () => listHygieneSupplies({ limit: 100 }) },
  { id: "sanitation", label: "Saneamiento", href: "/dashboard/sanitation", aliases: ["saneamiento", "actividad de saneamiento"], load: () => listSanitationRecords({ limit: 100 }) },
  { id: "pest-control", label: "Control de plagas", href: "/dashboard/pest-control", aliases: ["control de plagas", "plagas"], load: () => listPestControls({ limit: 100 }) },
  { id: "indicators", label: "Indicadores SST", href: "/dashboard/sst-indicators", aliases: ["indicador sst", "indicadores sst", "estadisticas"], load: () => listSstIndicatorReports({ limit: 100 }) },
  { id: "jobs", label: "Cargos de trabajo", href: "/dashboard/jobs", aliases: ["cargo", "cargos", "puesto de trabajo"], load: () => listJobs() },
  { id: "work-areas", label: "Areas de trabajo", href: "/dashboard/work-areas", aliases: ["area de trabajo", "areas de trabajo"], load: () => listWorkAreas() },
]

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null
}

function collectionFrom(value: unknown) {
  if (Array.isArray(value)) return { items: value.filter(asRecord) as UnknownRecord[], total: value.length }
  const record = asRecord(value)
  const items = Array.isArray(record?.items) ? (record.items.filter(asRecord) as UnknownRecord[]) : []
  return { items, total: typeof record?.total === "number" ? record.total : items.length }
}

function statusOf(record: UnknownRecord) {
  const status = record.status ?? record.caseStatus ?? record.state
  return typeof status === "string" ? status.toUpperCase() : ""
}

function titleOf(record: UnknownRecord) {
  const value = record.name ?? record.title ?? record.activity ?? record.elementName ?? record.consecutive ?? record.custodianInstitution
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function isOverdue(record: UnknownRecord) {
  if (completedStatuses.has(statusOf(record))) return false
  const value = record.dueDate ?? record.endDate ?? record.scheduledDate
  if (typeof value !== "string") return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  date.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

function summarize(definition: ModuleDefinition, value: unknown): SystemModuleKnowledge {
  const { items, total } = collectionFrom(value)
  return {
    ...definition,
    total,
    loaded: items.length,
    pending: items.filter((item) => pendingStatuses.has(statusOf(item))).length,
    completed: items.filter((item) => completedStatuses.has(statusOf(item))).length,
    overdue: items.filter(isOverdue).length,
    available: true,
    examples: items.map(titleOf).filter((value): value is string => Boolean(value)).slice(0, 4),
  }
}

let cache: { value: SystemModuleKnowledge[]; loadedAt: number } | null = null
let pendingLoad: Promise<SystemModuleKnowledge[]> | null = null

export async function loadSystemKnowledge() {
  if (cache && Date.now() - cache.loadedAt < 30_000) return cache.value
  if (pendingLoad) return pendingLoad

  pendingLoad = Promise.all(
    definitions.map(async (definition): Promise<SystemModuleKnowledge> => {
      try {
        return summarize(definition, await definition.load())
      } catch {
        return { ...definition, total: 0, loaded: 0, pending: 0, completed: 0, overdue: 0, available: false, examples: [] }
      }
    }),
  )
  try {
    const modules = await pendingLoad
    cache = { value: modules, loadedAt: Date.now() }
    return modules
  } finally {
    pendingLoad = null
  }
}

export function findKnowledgeModules(question: string, modules: SystemModuleKnowledge[]) {
  const normalized = normalize(question)
  return modules.filter((module) => module.aliases.some((alias) => normalized.includes(normalize(alias))))
}

export function answerFromSystemKnowledge(question: string, modules: SystemModuleKnowledge[]) {
  const matches = findKnowledgeModules(question, modules)
  if (matches.length === 0) return null

  return matches.slice(0, 3).map((module) => {
    if (!module.available) return `• ${module.label}: no fue posible consultar el módulo en este momento.`
    const details = [`${module.total} ${module.total === 1 ? "registro" : "registros"}`]
    if (module.pending > 0) details.push(`${module.pending} pendientes`)
    if (module.overdue > 0) details.push(`${module.overdue} vencidos`)
    if (module.completed > 0) details.push(`${module.completed} finalizados`)
    const examples = module.examples.length > 0 ? ` Referencias recientes: ${module.examples.join(", ")}.` : ""
    return `• ${module.label}: ${details.join(", ")}.${examples}`
  }).join("\n")
}

export function answerSystemPending(modules: SystemModuleKnowledge[]) {
  const available = modules.filter((module) => module.available)
  const attention = available.filter((module) => module.pending > 0 || module.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue || b.pending - a.pending)
    .slice(0, 6)

  if (attention.length === 0) {
    return available.length === 0
      ? "No pude consultar los módulos operativos en este momento; no puedo confirmar pendientes sin datos."
      : "No encontré registros pendientes o vencidos en los módulos que pude consultar."
  }

  const lines = attention.map((module, index) => {
    const counts = [module.overdue ? `${module.overdue} vencidos` : "", module.pending ? `${module.pending} pendientes` : ""].filter(Boolean)
    return `${index + 1}. ${module.label}: ${counts.join(" y ")}.`
  })
  return `Esto es lo que requiere revisión en los módulos operativos:\n${lines.join("\n")}`
}

export function buildSystemKnowledgeInsights(modules: SystemModuleKnowledge[]): IntelligenceInsight[] {
  return modules
    .filter((module) => module.available && (module.overdue > 0 || module.pending > 0))
    .sort((a, b) => b.overdue - a.overdue || b.pending - a.pending)
    .slice(0, 6)
    .map((module) => ({
      id: `system-${module.id}`,
      module: module.label,
      priority: module.overdue > 0 ? "high" as const : "medium" as const,
      count: module.overdue || module.pending,
      title: module.overdue > 0
        ? `${module.overdue} ${module.overdue === 1 ? "registro vencido" : "registros vencidos"}`
        : `${module.pending} ${module.pending === 1 ? "registro pendiente" : "registros pendientes"}`,
      description: module.overdue > 0
        ? "La fecha registrada ya pasó y el elemento aún no figura como finalizado."
        : "El módulo contiene actividades que todavía requieren gestión o aprobación.",
      reason: "SafeCloud lo identificó al analizar el estado y las fechas disponibles del módulo.",
      actions: [{ id: `review-${module.id}`, label: "Revisar módulo", href: module.href, emphasis: true }],
    }))
}
