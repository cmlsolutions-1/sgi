import { listManagedDocuments } from "@/services/documentManagementService"
import { getEmployeeById, getSgiResponsible, listEmployeeDocuments, listEmployees } from "@/services/employeeService"
import { listIncidents } from "@/services/incidentService"
import { listPreventiveMeasures } from "@/services/preventiveMeasureService"
import { listRisks } from "@/services/riskService"
import { listTraining } from "@/services/trainingService"
import type { DashboardIntelligenceData } from "@/lib/intelligence-engine"
import type { Employee, EmployeeDocument } from "@/types/manager/employee"
import type { IntelligenceInsight } from "@/types/intelligence"

type AssistantModule = "employees" | "risks" | "measures" | "trainings" | "documents" | "incidents" | "responsible"

type AssistantSnapshot = DashboardIntelligenceData & {
  unavailableModules: AssistantModule[]
}

type AskSafeCloudOptions = {
  data?: DashboardIntelligenceData
  insights?: IntelligenceInsight[]
}

type AffiliationDefinition = {
  label: string
  documentType: string
  matches: RegExp
  getId: (employee: Employee) => string | null | undefined
  getEntity: (employee: Employee) => Employee["eps"]
}

const affiliations: AffiliationDefinition[] = [
  {
    label: "EPS",
    documentType: "EPS",
    matches: /\beps\b/,
    getId: (employee) => employee.epsId,
    getEntity: (employee) => employee.eps,
  },
  {
    label: "ARL",
    documentType: "ARL",
    matches: /\barl\b/,
    getId: (employee) => employee.arlId,
    getEntity: (employee) => employee.arl,
  },
  {
    label: "pensión",
    documentType: "PENSION",
    matches: /pension/,
    getId: (employee) => employee.pensionId,
    getEntity: (employee) => employee.pension,
  },
  {
    label: "caja de compensación",
    documentType: "COMPENSATION",
    matches: /caja|compensacion/,
    getId: (employee) => employee.compensationId,
    getEntity: (employee) => employee.compensation,
  },
]

let cachedSnapshot: { data: AssistantSnapshot; loadedAt: number } | null = null
const CACHE_DURATION_MS = 30_000

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim()
}

function entityName(entity: Employee["eps"]) {
  return entity && typeof entity.name === "string" && entity.name.trim() ? entity.name.trim() : null
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function isOverdue(dueDate?: string | null) {
  return Boolean(dueDate && dueDate.slice(0, 10) < localDateKey())
}

function joinLabels(labels: string[]) {
  if (labels.length <= 1) return labels[0] ?? ""
  return `${labels.slice(0, -1).join(", ")} y ${labels.at(-1)}`
}

async function loadResult<T>(loader: () => Promise<T>, fallback: T) {
  try {
    return { data: await loader(), available: true }
  } catch {
    return { data: fallback, available: false }
  }
}

async function loadSnapshot(): Promise<AssistantSnapshot> {
  if (cachedSnapshot && Date.now() - cachedSnapshot.loadedAt < CACHE_DURATION_MS) return cachedSnapshot.data

  const [employees, risks, preventiveMeasures, trainings, documents, incidents, sgiResponsible] = await Promise.all([
    loadResult(listEmployees, []),
    loadResult(async () => (await listRisks()).items, []),
    loadResult(async () => (await listPreventiveMeasures()).items, []),
    loadResult(async () => (await listTraining()).items, []),
    loadResult(listManagedDocuments, []),
    loadResult(listIncidents, []),
    loadResult(getSgiResponsible, null),
  ])

  const availability: Array<[AssistantModule, boolean]> = [
    ["employees", employees.available],
    ["risks", risks.available],
    ["measures", preventiveMeasures.available],
    ["trainings", trainings.available],
    ["documents", documents.available],
    ["incidents", incidents.available],
    ["responsible", sgiResponsible.available],
  ]
  const data: AssistantSnapshot = {
    employees: employees.data,
    risks: risks.data,
    preventiveMeasures: preventiveMeasures.data,
    trainings: trainings.data,
    documents: documents.data,
    incidents: incidents.data,
    sgiResponsible: sgiResponsible.data,
    unavailableModules: availability.filter(([, available]) => !available).map(([module]) => module),
  }
  cachedSnapshot = { data, loadedAt: Date.now() }
  return data
}

function findEmployeeMatches(question: string, employees: Employee[]) {
  const normalizedQuestion = normalize(question)
  const exactMatches = employees.filter((employee) => normalizedQuestion.includes(normalize(employeeFullName(employee))))
  if (exactMatches.length > 0) return exactMatches

  const questionWords = new Set(normalizedQuestion.split(" ").filter((word) => word.length >= 3))
  return employees.filter((employee) => {
    const nameParts = normalize(employeeFullName(employee)).split(" ").filter((part) => part.length >= 3)
    return nameParts.some((part) => questionWords.has(part))
  })
}

function getProfileMissingFields(employee: Employee) {
  const fields = [
    [employee.documentNumber, "documento de identidad"],
    [employee.email, "correo electrónico"],
    [employee.phone, "teléfono"],
    [employee.address, "dirección"],
    [employee.birthDate, "fecha de nacimiento"],
    [employee.jobId, "cargo"],
    [employee.workAreaId, "área de trabajo"],
  ] as const

  return fields.filter(([value]) => !value).map(([, label]) => label)
}

function getMissingAffiliations(employee: Employee) {
  return affiliations.filter((affiliation) => !affiliation.getId(employee)).map((affiliation) => affiliation.label)
}

function buildAffiliationAnswer(employee: Employee, requested: AffiliationDefinition[]) {
  const name = employeeFullName(employee)
  const definitions = requested.length > 0 ? requested : affiliations
  const lines = definitions.map((affiliation) => {
    if (!affiliation.getId(employee)) return `• ${affiliation.label}: no está registrada.`
    const registeredEntity = entityName(affiliation.getEntity(employee))
    return `• ${affiliation.label}: sí está registrada${registeredEntity ? ` (${registeredEntity})` : ""}.`
  })

  return `Según la información actual de ${name}:\n${lines.join("\n")}`
}

async function buildEmployeeDocumentAnswer(employee: Employee, question: string) {
  const name = employeeFullName(employee)
  const normalizedQuestion = normalize(question)
  const requested = affiliations.filter((affiliation) => affiliation.matches.test(normalizedQuestion))
  let documents: EmployeeDocument[]
  try {
    documents = await listEmployeeDocuments(employee.id, { kind: "employee" })
  } catch {
    return `Pude identificar a ${name}, pero no fue posible consultar sus documentos en este momento. No puedo confirmar si el soporte está cargado sin verificar ese módulo.`
  }

  if (requested.length > 0) {
    const lines = requested.map((affiliation) => {
      const matches = documents.filter((document) => document.type.toUpperCase() === affiliation.documentType)
      return matches.length > 0
        ? `• ${affiliation.label}: ${matches.length} ${matches.length === 1 ? "soporte cargado" : "soportes cargados"}.`
        : `• ${affiliation.label}: no encuentro un soporte cargado.`
    })
    return `Documentos de ${name}:\n${lines.join("\n")}`
  }

  const missingAffiliations = getMissingAffiliations(employee)
  const missingProfile = getProfileMissingFields(employee)
  const documentTypes = Array.from(new Set(documents.map((document) => document.type))).filter(Boolean)
  const parts = [
    `${name} tiene ${documents.length} ${documents.length === 1 ? "archivo general cargado" : "archivos generales cargados"}${documentTypes.length > 0 ? ` (${documentTypes.join(", ")})` : ""}.`,
    missingAffiliations.length > 0
      ? `Afiliaciones pendientes: ${joinLabels(missingAffiliations)}.`
      : "Sus cuatro afiliaciones de seguridad social están registradas.",
    missingProfile.length > 0
      ? `Datos básicos pendientes: ${joinLabels(missingProfile)}.`
      : "Sus datos básicos principales están completos.",
  ]
  return parts.join("\n")
}

function answerEmployeeQuestion(question: string, employees: Employee[]) {
  const matches = findEmployeeMatches(question, employees)
  if (matches.length === 0) return null

  if (matches.length > 1) {
    return {
      answer: `Encontré varias personas que coinciden: ${matches.slice(0, 5).map(employeeFullName).join(", ")}. Indícame el nombre completo para consultar a la persona correcta.`,
      employee: null,
    }
  }

  return { answer: null, employee: matches[0] }
}

function answerSystemCounts(question: string, data: AssistantSnapshot) {
  const normalizedQuestion = normalize(question)

  if (/(cuantos|cantidad|total|numero).*(empleado|funcionario)|(empleado|funcionario).*(tengo|hay|registrad)/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("employees")) return "No pude consultar Gestión de empleados en este momento, así que no puedo confirmar el total sin inventar una cifra."
    const active = data.employees.filter((employee) => employee.status).length
    return `Tienes ${data.employees.length} funcionarios registrados: ${active} activos y ${data.employees.length - active} inactivos.`
  }

  if (/afiliacion|seguridad social|informacion incompleta|incomplet/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("employees")) return "No pude consultar las afiliaciones de los funcionarios en este momento. Intenta nuevamente para obtener una respuesta verificada."
    const incomplete = data.employees.filter((employee) => employee.status && getMissingAffiliations(employee).length > 0)
    if (incomplete.length === 0) return "Todos los funcionarios activos tienen registradas EPS, ARL, pensión y caja de compensación."
    return `${incomplete.length} ${incomplete.length === 1 ? "funcionario activo tiene" : "funcionarios activos tienen"} afiliaciones incompletas: ${incomplete.map(employeeFullName).join(", ")}.`
  }

  if (/medida|accion preventiva|acciones preventivas/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("measures")) return "No pude consultar Medidas de Prevención en este momento, por lo que no puedo confirmar sus cantidades."
    const pending = data.preventiveMeasures.filter((measure) => measure.status === "PENDING")
    const overdue = pending.filter((measure) => measure.type === "DATE" && isOverdue(measure.dueDate))
    return `Hay ${data.preventiveMeasures.length} medidas de prevención: ${pending.length} pendientes, ${overdue.length} vencidas y ${data.preventiveMeasures.length - pending.length} cumplidas.`
  }

  if (/riesgo|matriz/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("risks")) return "No pude consultar la matriz de riesgos en este momento, por lo que no puedo confirmar sus cantidades."
    const active = data.risks.filter((risk) => risk.status === "ACTIVE").length
    const priority = data.risks.filter(
      (risk) => risk.status === "ACTIVE" && (["I", "II"].includes(risk.riskLevelName) || Number(risk.riskLevel) >= 150),
    ).length
    return `Hay ${data.risks.length} riesgos registrados: ${active} activos y ${priority} identificados como prioritarios por su nivel.`
  }

  if (/capacitacion|formacion/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("trainings")) return "No pude consultar Capacitaciones en este momento, por lo que no puedo confirmar sus cantidades."
    const active = data.trainings.filter((training) => training.status === "ACTIVE").length
    return `Hay ${data.trainings.length} capacitaciones registradas y ${active} están activas.`
  }

  if (/documento|gestion documental/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("documents")) return "No pude consultar Gestión Documental en este momento, por lo que no puedo confirmar sus cantidades."
    const active = data.documents.filter((document) => document.status === "ACTIVE").length
    return `Gestión Documental tiene ${data.documents.length} documentos registrados: ${active} activos y ${data.documents.length - active} inactivos.`
  }

  if (/novedad|incidente|accidente/.test(normalizedQuestion)) {
    if (data.unavailableModules.includes("incidents")) return "No pude consultar Novedades laborales en este momento, por lo que no puedo confirmar sus cantidades."
    const active = data.incidents.filter((incident) => incident.status === "ACTIVE").length
    const accidents = data.incidents.filter((incident) => incident.type === "ACCIDENTE").length
    return `Hay ${data.incidents.length} novedades laborales: ${active} activas y ${accidents} clasificadas como accidentes.`
  }

  return null
}

function capabilitiesAnswer() {
  return [
    "Puedes consultarme con preguntas como:",
    "• ¿Cuántos empleados tengo y cuántos están activos?",
    "• ¿Carlos tiene EPS registrada?",
    "• ¿Qué afiliaciones le faltan a Carlos?",
    "• ¿Carlos tiene soporte de EPS cargado?",
    "• ¿Qué funcionarios tienen seguridad social incompleta?",
    "• ¿Cuántas medidas están vencidas?",
    "• ¿Cuántos riesgos prioritarios tengo?",
    "• ¿Qué debo atender primero?",
    "Responderé únicamente con información disponible en SafeCloud y te diré cuando no pueda verificar un dato.",
  ].join("\n")
}

export async function askSafeCloud(question: string, options: AskSafeCloudOptions = {}) {
  const normalizedQuestion = normalize(question)
  const data: AssistantSnapshot = options.data
    ? { ...options.data, unavailableModules: [] }
    : await loadSnapshot()

  if (/que puedo preguntar|que sabes|como me ayudas|ayuda|capacidades/.test(normalizedQuestion)) {
    return capabilitiesAnswer()
  }

  const asksAboutEmployees = /empleado|funcionario|eps|arl|pension|caja|afiliacion|seguridad social/.test(normalizedQuestion)
  if (asksAboutEmployees && data.unavailableModules.includes("employees")) {
    return "No pude consultar Gestión de empleados en este momento. Prefiero indicarte que el dato no está disponible antes que asumir una respuesta."
  }

  const employeeResult = answerEmployeeQuestion(question, data.employees)
  if (employeeResult?.answer) return employeeResult.answer

  if (employeeResult?.employee) {
    let employee: Employee
    try {
      employee = await getEmployeeById(employeeResult.employee.id)
    } catch {
      return `Identifiqué a ${employeeFullName(employeeResult.employee)}, pero no pude actualizar su información en este momento. No puedo confirmar el dato sin verificar su registro más reciente.`
    }
    const requestedAffiliations = affiliations.filter((affiliation) => affiliation.matches.test(normalizedQuestion))
    const asksForDocuments = /documento|archivo|soporte|certificado|evidencia/.test(normalizedQuestion)

    if (asksForDocuments) return buildEmployeeDocumentAnswer(employee, question)

    if (requestedAffiliations.length > 0 || /afiliacion|seguridad social|que le falta|incomplet/.test(normalizedQuestion)) {
      return buildAffiliationAnswer(employee, requestedAffiliations)
    }

    const missingAffiliations = getMissingAffiliations(employee)
    return [
      `${employeeFullName(employee)} está ${employee.status ? "activo" : "inactivo"}.`,
      `Cargo: ${employee.job?.name ?? "no registrado"}. Área: ${employee.workArea?.name ?? "no registrada"}.`,
      missingAffiliations.length > 0
        ? `Le falta registrar ${joinLabels(missingAffiliations)}.`
        : "Tiene completas las cuatro afiliaciones de seguridad social.",
    ].join("\n")
  }

  if (/evidencia|soporte|foto/.test(normalizedQuestion) && options.insights) {
    const evidenceInsights = options.insights.filter((insight) =>
      /evidencia|soporte|foto/.test(normalize(`${insight.title} ${insight.description}`)),
    )
    if (evidenceInsights.length > 0) {
      return evidenceInsights.map((insight) => `• ${insight.title}. ${insight.description}`).join("\n")
    }
    return "No detecto alertas de evidencias en el contexto actual con la información disponible."
  }

  const countAnswer = answerSystemCounts(question, data)
  if (countAnswer) return countAnswer

  if (/prioridad|primero|atencion|urgente|pendiente|resumen/.test(normalizedQuestion) && options.insights?.length) {
    const summary = options.insights
      .slice(0, 4)
      .map((insight, index) => `${index + 1}. ${insight.title}. ${insight.reason}`)
      .join("\n")
    return `Estas son las situaciones que deberías revisar primero:\n${summary}`
  }

  return `No pude relacionar esa pregunta con un dato verificable. ${capabilitiesAnswer()}`
}
