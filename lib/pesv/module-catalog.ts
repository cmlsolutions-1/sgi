import type { LucideIcon } from "lucide-react"
import {
  Archive,
  BarChart3,
  Car,
  ClipboardCheck,
  ClipboardList,
  FileCheck2,
  FileSearch,
  FileSignature,
  FlameKindling,
  GraduationCap,
  Handshake,
  Route,
  ShieldCheck,
  ShieldPlus,
  Target,
  TriangleAlert,
  UserCheck,
  Users,
  UsersRound,
} from "lucide-react"

export type PesvGroupId = "governance" | "planning" | "operations" | "verification"

export type PesvModuleCatalogItem = {
  code: string
  name: string
  description: string
  href: string
  steps: number[]
  group: PesvGroupId
  storageKey: string
  icon: LucideIcon
}

export const pesvGroups: { id: PesvGroupId; name: string; description: string }[] = [
  {
    id: "governance",
    name: "Gobierno y dirección",
    description: "Responsables, participación, política y liderazgo del PESV.",
  },
  {
    id: "planning",
    name: "Planificación",
    description: "Diagnóstico, riesgos, objetivos, programas y recursos para la gestión vial.",
  },
  {
    id: "operations",
    name: "Gestión operacional",
    description: "Controles, preparación, investigación y operación segura de los desplazamientos.",
  },
  {
    id: "verification",
    name: "Verificación y mejora",
    description: "Indicadores, análisis, auditoría, mejora continua y comunicación.",
  },
]

export const pesvModuleCatalog: PesvModuleCatalogItem[] = [
  { code: "PESV_RESPONSIBLE", name: "Responsable PESV", description: "Designación, responsabilidades y soporte del líder del plan.", href: "/dashboard/pesv-responsible", steps: [1], group: "governance", storageKey: "safecloud:pesv-responsible", icon: UserCheck },
  { code: "PESV_COMMITTEE", name: "Comité de Seguridad Vial", description: "Conformación, integrantes y revisiones del comité.", href: "/dashboard/pesv-committee", steps: [2], group: "governance", storageKey: "safecloud:pesv-committee", icon: UsersRound },
  { code: "PESV_POLICY", name: "Política de Seguridad Vial", description: "Versiones, alcance, compromisos y socialización de la política.", href: "/dashboard/pesv-policy", steps: [3], group: "governance", storageKey: "safecloud:pesv-policy", icon: FileSignature },
  { code: "PESV_LEADERSHIP", name: "Liderazgo Directivo", description: "Compromisos, recursos y verificación del liderazgo directivo.", href: "/dashboard/pesv-leadership", steps: [4], group: "governance", storageKey: "safecloud:pesv-leadership", icon: Handshake },
  { code: "PESV_DIAGNOSIS", name: "Diagnóstico PESV", description: "Caracterización de personas, vehículos, rutas y operación vial.", href: "/dashboard/pesv-diagnosis", steps: [5], group: "planning", storageKey: "safecloud:pesv-diagnosis", icon: ClipboardList },
  { code: "PESV_RISKS", name: "Riesgos Viales", description: "Identificación, valoración, tratamiento y seguimiento de riesgos.", href: "/dashboard/pesv-risks", steps: [6], group: "planning", storageKey: "safecloud:pesv-risks", icon: TriangleAlert },
  { code: "PESV_OBJECTIVES", name: "Objetivos y metas", description: "Objetivos, indicadores, metas, responsables y plazos.", href: "/dashboard/pesv-objectives", steps: [7], group: "planning", storageKey: "safecloud:pesv-objectives", icon: Target },
  { code: "PESV_PROGRAMS", name: "Programas de riesgos críticos", description: "Programas, controles y actividades para riesgos prioritarios.", href: "/dashboard/pesv-programs", steps: [8], group: "planning", storageKey: "safecloud:pesv-programs", icon: ShieldPlus },
  { code: "PESV_WORK_PLAN", name: "Plan anual de trabajo", description: "Actividades, cronograma, responsables, recursos y entregables.", href: "/dashboard/pesv-work-plan", steps: [9], group: "planning", storageKey: "safecloud:pesv-work-plan", icon: ClipboardCheck },
  { code: "PESV_TRAINING", name: "Competencia y formación", description: "Perfiles de competencia y actividades de formación vial.", href: "/dashboard/pesv-training", steps: [10], group: "planning", storageKey: "safecloud:pesv-training", icon: GraduationCap },
  { code: "PESV_BEHAVIOR", name: "Comportamiento seguro", description: "Responsabilidades y evaluación del comportamiento vial.", href: "/dashboard/pesv-behavior", steps: [11], group: "operations", storageKey: "safecloud:pesv-behavior", icon: UserCheck },
  { code: "PESV_EMERGENCIES", name: "Emergencias Viales", description: "Preparación, respuesta, recursos y simulacros viales.", href: "/dashboard/pesv-emergencies", steps: [12], group: "operations", storageKey: "safecloud:pesv-emergencies", icon: FlameKindling },
  { code: "PESV_INVESTIGATIONS", name: "Investigación de Siniestros", description: "Reporte, análisis causal, acciones y cierre de siniestros.", href: "/dashboard/pesv-investigations", steps: [13], group: "operations", storageKey: "safecloud:pesv-road-investigations", icon: FileSearch },
  { code: "PESV_MANAGED_ROADS", name: "Vías administradas", description: "Protocolos, inspecciones y mantenimiento de vías a cargo.", href: "/dashboard/pesv-managed-roads", steps: [14], group: "operations", storageKey: "safecloud:pesv-managed-roads", icon: Route },
  { code: "PESV_JOURNEYS", name: "Desplazamientos laborales", description: "Planificación de rutas, personas, vehículos y controles.", href: "/dashboard/pesv-journeys", steps: [15], group: "operations", storageKey: "safecloud:pesv-journeys", icon: Route },
  { code: "PESV_VEHICLE_INSPECTIONS", name: "Inspección de vehículos", description: "Hojas de vida, inspecciones preoperacionales y mantenimiento.", href: "/dashboard/pesv-vehicle-inspections", steps: [16, 17], group: "operations", storageKey: "safecloud:pesv-vehicle-inspections", icon: Car },
  { code: "PESV_CHANGE_CONTRACTORS", name: "Cambios y contratistas", description: "Gestión de cambios y verificación de contratistas.", href: "/dashboard/pesv-change-contractors", steps: [18], group: "operations", storageKey: "safecloud:pesv-change-contractors", icon: Handshake },
  { code: "PESV_DOCUMENT_RETENTION", name: "Archivo documental", description: "Conservación, consulta y trazabilidad de registros PESV.", href: "/dashboard/pesv-document-retention", steps: [19], group: "operations", storageKey: "safecloud:pesv-document-retention", icon: Archive },
  { code: "PESV_INDICATORS", name: "Indicadores y autogestión", description: "Fichas, mediciones, revisiones y reporte de autogestión.", href: "/dashboard/pesv-indicators", steps: [20], group: "verification", storageKey: "safecloud:pesv-indicators", icon: BarChart3 },
  { code: "PESV_STATISTICS", name: "Estadísticas de siniestros", description: "Registro, análisis y nivel de pérdida de los siniestros.", href: "/dashboard/pesv-statistics", steps: [21], group: "verification", storageKey: "safecloud:pesv-statistics", icon: BarChart3 },
  { code: "PESV_AUDITS", name: "Auditoría anual", description: "Planeación, evaluación de pasos, hallazgos y seguimiento.", href: "/dashboard/pesv-audits", steps: [22], group: "verification", storageKey: "safecloud:pesv-audits", icon: ShieldCheck },
  { code: "PESV_IMPROVEMENT", name: "Mejora continua · ACPM", description: "Acciones correctivas, preventivas y de mejora del PESV.", href: "/dashboard/pesv-improvement", steps: [23], group: "verification", storageKey: "safecloud:pesv-improvement", icon: FileCheck2 },
  { code: "PESV_COMMUNICATIONS", name: "Comunicación y participación", description: "Mecanismos, comunicaciones, participación y respuestas.", href: "/dashboard/pesv-communications", steps: [24], group: "verification", storageKey: "safecloud:pesv-communications", icon: Users },
]

export const pesvModuleCodes = pesvModuleCatalog.map((module) => module.code)
export const pesvIntegratedCodes = new Set([
  "PESV_RESPONSIBLE", "PESV_COMMITTEE", "PESV_POLICY",
  "PESV_LEADERSHIP", "PESV_DIAGNOSIS", "PESV_OBJECTIVES",
])

export function isPesvModuleAllowed(code: string, allowedCodes: ReadonlySet<string>) {
  if (code === "PESV") return [...pesvIntegratedCodes].some(child => allowedCodes.has(child))
  return pesvIntegratedCodes.has(code) && allowedCodes.has(code)
}

