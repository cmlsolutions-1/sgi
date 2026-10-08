export type PesvModule = "objectives" | "programs" | "work-plan" | "training" | "behavior" | "emergencies"
export type Values = Record<string, string | string[]>
export type Option = { value: string; label: string; description?: string; eligible?: boolean; year?: string }
export type Reference = "policies" | "risks" | "objectives" | "programs" | "people" | "competencies" | "trainingActivities" | "procedures" | "routes" | "vehicles" | "emergencyPlans" | "workActivities"
export type Field = {
  key: string; label: string; section: string
  type?: "text" | "textarea" | "number" | "date" | "year" | "money" | "select" | "reference"
  required?: boolean; options?: string[]; reference?: Reference; multiple?: boolean
  min?: number; max?: number; showFor?: string[]; showWhen?: [string, string]; wide?: boolean
  requiredWhen?: [string, string[]]
  criticalOnly?: boolean
}
export type Kind = {
  id: string; title: string; singular: string; fields: Field[]
  columns: string[]; tracking?: boolean; annualReview?: boolean; diffusion?: boolean; activities?: boolean
}
export type ModuleConfig = { title: string; subtitle: string; kinds: Kind[] }
export type Activity = { id: string; name: string; responsible: string; startDate: string; endDate: string; budget: string }
export type Evidence = { id: string; name: string; mime: string; url: string; uploadedAt: string; targetId?: string }
export type Entry = {
  id: string; kind: "FOLLOW_UP" | "ANNUAL_REVIEW" | "DIFFUSION"; date: string
  observations: string; progress?: number; measuredValue?: number; medium?: string; audience?: string
  conclusion?: string; nextReviewDate?: string
  attendeeIds?: string[]; learningResult?: string
  responseMinutes?: number
}
export type RecordItem = {
  id: string; kind: string; values: Values; activities: Activity[]; entries: Entry[]
  evidence: Evidence[]; createdAt: string; updatedAt: string
  history: { at: string; action: string; snapshot?: Values; activities?: Activity[] }[]
  links: Record<string, Option[]>
}
export type Catalogs = Record<Reference, Option[]>
export const dateToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" })
export const currentYear = () => Number(dateToday().slice(0, 4))
export const storageKey = (module: PesvModule) => `safecloud:pesv-${module}`
export const text = (value: string | string[] | undefined) => Array.isArray(value) ? value.join(", ") : value ?? ""
export const ids = (value: string | string[] | undefined): string[] => Array.isArray(value) ? value : value ? [value] : []
const field = (key: string, label: string, section: string, type: Field["type"] = "text", extra: Partial<Field> = {}): Field => ({ key, label, section, type, required: true, ...extra })
const nameYear = (section: string) => [field("name", "Nombre", section), field("year", "Vigencia", section, "year")]
const policy = (section: string) => field("policyId", "Política de Seguridad Vial relacionada", section, "reference", { reference: "policies" })
const person = (key: string, label: string, section: string) => field(key, label, section, "reference", { reference: "people" })
const dates = (section: string) => [field("startDate", "Fecha de inicio", section, "date"), field("endDate", "Fecha de finalización", section, "date")]
export const programTypes = ["Velocidad segura", "Prevención de la fatiga", "Prevención de la distracción", "Cero tolerancia al alcohol y sustancias psicoactivas", "Protección de actores viales vulnerables", "Otro"]
export const competencyRoles = ["Líder PESV", "Miembro del Comité de Seguridad Vial", "Capacitador en seguridad vial", "Planificador de rutas / coordinador de desplazamientos", "Coordinador / técnico de mantenimiento", "Auditor de seguridad vial", "Brigadista vial / primer respondiente", "Investigador interno de siniestros viales", "Conductor en desplazamientos laborales"]
export const configs: Record<PesvModule, ModuleConfig> = {
  emergencies: {
    title: "Plan de preparación y respuesta ante emergencias viales", subtitle: "PPRAEV · Planes de respuesta, formación y simulacros anuales",
    kinds: [
      { id: "emergency-plan", title: "Planes de emergencias viales", singular: "plan de emergencias", annualReview: true, diffusion: true,
        columns: ["name", "year", "responsibleId", "routeIds"], fields: [
          ...nameYear("Plan y rutas"), field("version", "Versión", "Plan y rutas"), person("responsibleId", "Responsable del plan", "Plan y rutas"),
          field("scope", "Alcance y desplazamientos cubiertos", "Plan y rutas", "textarea", { wide: true }),
          field("routeIds", "Rutas del diagnóstico PESV", "Plan y rutas", "reference", { reference: "routes", multiple: true, required: false }),
          field("riskIds", "Riesgos viales relacionados", "Plan y rutas", "reference", { reference: "risks", multiple: true, required: false }),
          field("routeRisks", "Riesgos de las rutas y puntos de referencia", "Plan y rutas", "textarea", { wide: true }),
          field("accidentReporting", "Procedimiento de reporte de siniestros viales", "Reporte y cadena de llamado", "textarea"),
          field("callChain", "Cadena interna de llamado: orden, cargos y teléfonos", "Reporte y cadena de llamado", "textarea"),
          field("emergencyNumber", "Número único de emergencias", "Reporte y cadena de llamado"),
          field("externalContacts", "Organismos de socorro y contactos externos", "Reporte y cadena de llamado", "textarea"),
          field("medicalCenters", "Centros de atención: nombre, ubicación, teléfono y ruta de acceso", "Atención y recursos", "textarea", { wide: true }),
          field("responderIds", "Brigadistas viales / primeros respondientes", "Atención y recursos", "reference", { reference: "people", multiple: true }),
          field("responderProtocol", "Protocolo del brigadista o primer respondiente", "Atención y recursos", "textarea"),
          field("pasProtect", "PAS · Proteger", "Atención y recursos", "textarea"), field("pasAlert", "PAS · Avisar", "Atención y recursos", "textarea"),
          field("pasAssist", "PAS · Socorrer", "Atención y recursos", "textarea"),
          field("equipment", "Equipos, cantidades, ubicación y responsables", "Atención y recursos", "textarea", { wide: true }),
          field("trainingProtocol", "Formación en protocolos de atención a víctimas", "Formación, simulacros y revisión", "textarea"),
          field("trainingIds", "Actividades del plan de formación PESV", "Formación, simulacros y revisión", "reference", { reference: "trainingActivities", multiple: true, required: false }),
          field("drillStrategy", "Escenarios, frecuencia y coordinación de simulacros", "Formación, simulacros y revisión", "textarea"),
          field("communityCoordination", "Participación de socorro, comités y comunidad de las rutas", "Formación, simulacros y revisión", "textarea"),
          field("nextReviewDate", "Próxima revisión del plan", "Formación, simulacros y revisión", "date"),
        ] },
      { id: "road-drill", title: "Simulacros viales", singular: "simulacro vial", tracking: true,
        columns: ["name", "year", "planId", "responsibleId", "startDate"], fields: [
          ...nameYear("Simulacro"), field("planId", "Plan de emergencias relacionado", "Simulacro", "reference", { reference: "emergencyPlans" }),
          field("scenario", "Escenario / siniestro simulado", "Simulacro", "textarea"), field("place", "Lugar / ruta", "Simulacro"),
          person("responsibleId", "Responsable del simulacro", "Simulacro"), ...dates("Cronograma y participantes"),
          field("participantIds", "Colaboradores convocados", "Cronograma y participantes", "reference", { reference: "people", multiple: true }),
          field("externalParticipants", "Organismos de socorro, comités y comunidad participantes", "Cronograma y participantes", "textarea", { required: false }),
          field("objective", "Objetivo y protocolos a evaluar", "Evaluación del ejercicio", "textarea"),
          field("equipment", "Equipos y recursos del ejercicio", "Evaluación del ejercicio", "textarea"),
          field("expectedResponseMinutes", "Tiempo de respuesta esperado (minutos)", "Evaluación del ejercicio", "number", { min: 0.1 }),
          field("evaluationCriteria", "Criterios de evaluación y acciones de mejora", "Evaluación del ejercicio", "textarea"),
        ] },
    ],
  },
  objectives: {
    title: "Objetivos y metas del PESV", subtitle: "Objetivos, medición, evaluación anual y comunicación",
    kinds: [{ id: "objective", title: "Objetivos", singular: "objetivo", tracking: true, annualReview: true, diffusion: true,
      columns: ["name", "year", "target", "responsibleId", "endDate"], fields: [
        ...nameYear("Objetivo y alineación"), policy("Objetivo y alineación"), field("description", "Descripción del objetivo preventivo", "Objetivo y alineación", "textarea", { wide: true }),
        field("alignment", "Coherencia con la política y requisitos legales aplicables", "Objetivo y alineación", "textarea", { wide: true }),
        field("indicator", "Indicador", "Meta y medición"), field("formula", "Fórmula / forma de medición", "Meta y medición"),
        field("unit", "Unidad de medida", "Meta y medición", "select", { options: ["Porcentaje (%)", "Número", "Tasa", "Horas", "Kilómetros", "Otro"] }),
        field("customUnit", "Otra unidad de medida", "Meta y medición", "text", { showWhen: ["unit", "Otro"] }),
        field("baseline", "Línea base (valor)", "Meta y medición", "number", { min: 0 }), field("target", "Valor esperado / meta", "Meta y medición", "number", { min: 0 }),
        field("direction", "Sentido de la meta", "Meta y medición", "select", { options: ["Aumentar", "Reducir"] }),
        field("frequency", "Frecuencia de seguimiento", "Meta y medición", "select", { options: ["Mensual", "Trimestral", "Semestral", "Anual"] }),
        person("responsibleId", "Responsable del seguimiento", "Responsabilidad y plazos"), ...dates("Responsabilidad y plazos"),
        field("nextReviewDate", "Próxima revisión anual", "Responsabilidad y plazos", "date"),
        field("observations", "Observaciones", "Responsabilidad y plazos", "textarea", { required: false, wide: true }),
      ] }],
  },
  programs: {
    title: "Programas de gestión de riesgos críticos", subtitle: "Intervención de riesgos viales y factores de desempeño",
    kinds: [{ id: "program", title: "Programas", singular: "programa", tracking: true, annualReview: true, diffusion: true, activities: true,
      columns: ["name", "type", "year", "responsibleIds", "endDate"], fields: [
        ...nameYear("Programa y riesgos asociados"), field("type", "Tipo de programa", "Programa y riesgos asociados", "select", { options: programTypes }),
        field("customType", "Nombre del otro programa", "Programa y riesgos asociados", "text", { showWhen: ["type", "Otro"] }),
        field("riskIds", "Riesgos con valoración crítica", "Programa y riesgos asociados", "reference", { reference: "risks", multiple: true, wide: true, criticalOnly: true }),
        field("scope", "Lineamientos, límites y alcance", "Programa y riesgos asociados", "textarea", { wide: true }),
        field("objectiveIds", "Objetivos del PESV relacionados", "Objetivos, metas e indicadores", "reference", { reference: "objectives", multiple: true, required: false }),
        field("objective", "Objetivo de intervención", "Objetivos, metas e indicadores", "textarea"), field("goal", "Meta cuantificable", "Objetivos, metas e indicadores"),
        field("baseline", "Línea base", "Objetivos, metas e indicadores"), field("indicator", "Indicadores del programa", "Objetivos, metas e indicadores"),
        field("measurement", "Fórmula y forma de medición", "Objetivos, metas e indicadores", "textarea"),
        field("performanceFactors", "Factores de desempeño relacionados", "Objetivos, metas e indicadores", "textarea"),
        ...dates("Recursos y seguimiento"), field("budget", "Presupuesto (COP)", "Recursos y seguimiento", "money", { min: 0 }),
        field("responsibleIds", "Responsables del programa", "Recursos y seguimiento", "reference", { reference: "people", multiple: true }),
        field("evaluationFrequency", "Frecuencia de evaluación de resultados", "Recursos y seguimiento", "select", { options: ["Mensual", "Trimestral", "Semestral", "Anual"] }),
        field("trackingMechanism", "Mecanismos de seguimiento", "Recursos y seguimiento", "textarea"),
        field("nextReviewDate", "Próxima actualización anual", "Recursos y seguimiento", "date"),
        field("controlMechanism", "Mecanismo o equipo de medición / control", "Procedimiento de intervención", "textarea", { showFor: programTypes.slice(0, 4) }),
        field("calibration", "Frecuencia de mantenimiento y calibración", "Procedimiento de intervención", "text", { showFor: [programTypes[0]] }),
        field("speedLimits", "Límites de velocidad y enfoque del sistema seguro", "Procedimiento de intervención", "textarea", { showFor: [programTypes[0]] }),
        field("workHours", "Jornada, horas de conducción y descansos", "Procedimiento de intervención", "textarea", { showFor: [programTypes[1]] }),
        field("tripPlanning", "Planificación de viajes y cumplimiento de políticas laborales", "Procedimiento de intervención", "textarea", { showFor: [programTypes[1]] }),
        field("distractions", "Distracciones identificadas y controles", "Procedimiento de intervención", "textarea", { showFor: [programTypes[2]] }),
        field("detectionStrategy", "Estrategias de detección, acciones y correctivos", "Procedimiento de intervención", "textarea", { showFor: [programTypes[3]] }),
        field("vulnerableGuidelines", "Directrices para peatones, pasajeros, ciclistas y motociclistas", "Procedimiento de intervención", "textarea", { showFor: [programTypes[4]] }),
        field("implementationTracking", "Seguimiento a las directrices y reducción de exposición", "Procedimiento de intervención", "textarea", { showFor: [programTypes[4]] }),
        field("sstArticulation", "Articulación con programas SG-SST / otros riesgos", "Procedimiento de intervención", "textarea", { showFor: [programTypes[5]] }),
        field("breachProcedure", "Procedimiento ante incumplimientos y casos reiterativos", "Procedimiento de intervención", "textarea"),
        field("communication", "Mecanismos de comunicación y campañas preventivas", "Procedimiento de intervención", "textarea"),
      ] }],
  },
  "work-plan": {
    title: "Plan anual de trabajo del PESV", subtitle: "Estrategias, actividades, recursos y cumplimiento anual",
    kinds: [{ id: "work-activity", title: "Actividades del plan", singular: "actividad", tracking: true,
      columns: ["name", "year", "responsibleId", "budget", "endDate"], fields: [
        ...nameYear("Actividad y alineación"), policy("Actividad y alineación"),
        field("objectiveIds", "Objetivos PESV", "Actividad y alineación", "reference", { reference: "objectives", multiple: true }),
        field("programIds", "Programas relacionados", "Actividad y alineación", "reference", { reference: "programs", multiple: true, required: false }),
        field("description", "Estrategia / descripción de la actividad", "Actividad y alineación", "textarea", { wide: true }),
        field("nationalPlanAlignment", "Alineación con el Plan Nacional de Seguridad Vial", "Actividad y alineación", "textarea"),
        field("sstArticulation", "Articulación con el SG-SST", "Actividad y alineación", "textarea"),
        person("responsibleId", "Responsable", "Cronograma y recursos"), ...dates("Cronograma y recursos"),
        field("budget", "Presupuesto (COP)", "Cronograma y recursos", "money", { min: 0 }),
        field("resources", "Recursos humanos y técnicos", "Cronograma y recursos", "textarea"),
        field("deliverable", "Resultado esperado / evidencia de cumplimiento", "Cronograma y recursos", "textarea"),
        field("goal", "Meta de la actividad", "Cronograma y recursos"),
      ] }],
  },
  training: {
    title: "Competencia y plan anual de formación", subtitle: "Perfiles por rol, evaluación de competencia y formación en seguridad vial",
    kinds: [
      { id: "competency", title: "Competencias por rol", singular: "perfil de competencia", annualReview: true,
        columns: ["name", "role", "personId", "evaluationDate", "result"], fields: [
          ...nameYear("Cargo y rol"), field("role", "Cargo / rol en seguridad vial", "Cargo y rol", "select", { options: competencyRoles }),
          person("personId", "Colaborador evaluado", "Cargo y rol"),
          field("educationRequired", "Educación mínima requerida", "Competencia requerida"), field("trainingRequired", "Formación requerida en seguridad vial", "Competencia requerida", "textarea"),
          field("experienceRequired", "Experiencia en conducción / funciones del cargo", "Competencia requerida", "textarea"),
          field("actualEducation", "Educación acreditada", "Evaluación de competencia", "text", { required: false, requiredWhen: ["result", ["Competente", "Requiere formación"]] }), field("actualTraining", "Formación acreditada", "Evaluación de competencia", "textarea", { required: false, requiredWhen: ["result", ["Competente", "Requiere formación"]] }),
          field("actualExperience", "Experiencia acreditada", "Evaluación de competencia", "textarea", { required: false, requiredWhen: ["result", ["Competente", "Requiere formación"]] }),
          field("evaluationDate", "Fecha de evaluación", "Evaluación de competencia", "date"),
          person("evaluatorId", "Evaluador", "Evaluación de competencia"),
          field("result", "Resultado de evaluación", "Evaluación de competencia", "select", { options: ["Pendiente de evaluación", "Competente", "Requiere formación"] }),
          field("gaps", "Brechas / necesidades de formación", "Evaluación de competencia", "textarea", { required: false, requiredWhen: ["result", ["Requiere formación"]] }),
          field("nextReviewDate", "Próxima revisión", "Evaluación de competencia", "date"),
        ] },
      { id: "training-activity", title: "Plan anual de formación", singular: "actividad de formación", tracking: true,
        columns: ["name", "year", "trainerId", "startDate", "durationHours"], fields: [
          ...nameYear("Formación y participantes"), field("topic", "Tema de seguridad vial", "Formación y participantes"),
          field("competencyIds", "Perfiles de competencia relacionados", "Formación y participantes", "reference", { reference: "competencies", multiple: true, required: false }),
          field("participantIds", "Colaboradores convocados", "Formación y participantes", "reference", { reference: "people", multiple: true }),
          field("objective", "Objetivo de formación", "Formación y participantes", "textarea"),
          person("trainerId", "Capacitador / responsable", "Cronograma y evaluación"), ...dates("Cronograma y evaluación"),
          field("durationHours", "Duración (horas)", "Cronograma y evaluación", "number", { min: 0.5 }),
          field("modality", "Modalidad", "Cronograma y evaluación", "select", { options: ["Presencial", "Virtual", "Mixta"] }),
          field("budget", "Presupuesto (COP)", "Cronograma y evaluación", "money", { min: 0 }),
          field("evaluationMethod", "Método de evaluación del aprendizaje", "Cronograma y evaluación", "textarea"),
        ] },
    ],
  },
  behavior: {
    title: "Responsabilidad y comportamiento seguro", subtitle: "Paso 11 · Aplicable al nivel avanzado",
    kinds: [
      { id: "procedure", title: "Procedimientos y responsabilidades", singular: "procedimiento", annualReview: true, diffusion: true,
        columns: ["name", "version", "responsibleId", "nextReviewDate"], fields: [
          ...nameYear("Procedimiento"), field("version", "Versión", "Procedimiento"), person("responsibleId", "Responsable", "Procedimiento"),
          field("contractRequirements", "Requisitos de contratación: pruebas teóricas, prácticas y exámenes médicos", "Contratación y responsabilidades", "textarea", { wide: true }),
          field("accidentReporting", "Responsabilidad de reportar siniestros viales laborales", "Contratación y responsabilidades", "textarea"),
          field("trainingParticipation", "Participación en capacitaciones de seguridad vial", "Contratación y responsabilidades", "textarea"),
          field("legalCommitment", "Compromiso con la legislación y lineamientos internos", "Contratación y responsabilidades", "textarea"),
          field("healthReporting", "Reporte oportuno y veraz de condiciones de salud", "Contratación y responsabilidades", "textarea"),
          field("evaluationProcedure", "Procedimiento de evaluación anual y criterios de refuerzo", "Evaluación y hábitos seguros", "textarea", { wide: true }),
          field("safeHabitsStrategy", "Estrategia de hábitos seguros y corresponsabilidad", "Evaluación y hábitos seguros", "textarea", { wide: true }),
          field("nextReviewDate", "Próxima revisión anual", "Evaluación y hábitos seguros", "date"),
        ] },
      { id: "behavior-evaluation", title: "Evaluaciones anuales", singular: "evaluación anual", diffusion: true,
        columns: ["name", "year", "personId", "evaluationDate", "result"], fields: [
          ...nameYear("Evaluación anual"), person("personId", "Colaborador", "Evaluación anual"),
          field("procedureId", "Procedimiento de evaluación relacionado", "Evaluación anual", "reference", { reference: "procedures" }),
          field("evaluationDate", "Fecha de evaluación", "Evaluación anual", "date"),
          field("periodStart", "Inicio del período evaluado", "Evaluación anual", "date"), field("periodEnd", "Fin del período evaluado", "Evaluación anual", "date"),
          person("evaluatorId", "Evaluador", "Evaluación anual"),
          field("accidents", "Siniestros viales en el período", "Comportamiento observado", "number", { min: 0 }),
          field("infractions", "Infracciones de tránsito en el período", "Comportamiento observado", "number", { min: 0 }),
          field("complaints", "Quejas por comportamientos inseguros", "Comportamiento observado", "number", { min: 0 }),
          field("trainings", "Capacitaciones recibidas en el período", "Comportamiento observado", "textarea"),
          field("findings", "Análisis de siniestros, infracciones y quejas", "Comportamiento observado", "textarea"),
          field("result", "Resultado", "Conclusión y formación", "select", { options: ["Comportamiento seguro", "Requiere refuerzo"] }),
          field("reinforcement", "Refuerzo de formación requerido", "Conclusión y formación", "textarea", { showWhen: ["result", "Requiere refuerzo"] }),
          field("trainingIds", "Actividades de formación vinculadas", "Conclusión y formación", "reference", { reference: "trainingActivities", multiple: true, required: false }),
          field("communication", "Comunicación de responsabilidades y resultado al colaborador", "Conclusión y formación", "textarea"),
        ] },
    ],
  },
}

export function visibleFields(kind: Kind, values: Values) {
  return kind.fields.filter(f => (!f.showFor || f.showFor.includes(text(values.type))) && (!f.showWhen || text(values[f.showWhen[0]]) === f.showWhen[1])).map(f => f.requiredWhen ? { ...f, required: f.requiredWhen[1].includes(text(values[f.requiredWhen[0]])) } : f)
}
export function initialValues(kind: Kind): Values {
  const values: Values = {}
  for (const f of kind.fields) {
    values[f.key] = f.multiple ? [] : f.type === "year" ? String(currentYear()) : f.type === "select" ? f.options?.[0] ?? "" : f.type === "date" ? dateToday() : f.type === "number" || f.type === "money" ? String(f.min ?? 0) : ""
  }
  values.nextReviewDate = `${currentYear() + 1}${dateToday().slice(4)}`
  return values
}
export function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback } catch { return fallback }
}
export function readItems(module: PesvModule): RecordItem[] { return readStore(storageKey(module), []) }
export function criticalScore(risk: { exposure: number; probability: number; reviews?: { exposure: number; probability: number }[] }) {
  const review = risk.reviews?.at(-1)
  return (review?.exposure ?? risk.exposure) * (review?.probability ?? risk.probability)
}
export function loadCatalogs(): Catalogs {
  const policies = readStore<{ id: string; name: string; version: string; scope: string; commitments: string }[]>("safecloud:pesv-policy", [
    { id: "pesv-policy-1", name: "Política de Seguridad Vial de la Organización", version: "1.0", scope: "Desplazamientos laborales y trayectos en itinere.", commitments: "Recursos para la planificación, implementación, seguimiento y mejora del PESV." },
  ])
  const risks = readStore<{ id: string; name: string; exposure: number; probability: number; reviews?: { exposure: number; probability: number }[] }[]>("safecloud:pesv-risks", [
    { id: "pesv-risk-demo-1", name: "Colisión por distracción al conducir", exposure: 2, probability: 3 },
  ])
  const diagnoses = readStore<{ id: string; year: number; collaborators: { id: string; name: string; educationLevel?: string; competencyEvaluation?: string }[]; routes: { id: string; origin: string; destination: string }[]; vehicles: { id: string; plate: string; vehicleType: string }[] }[]>("safecloud:pesv-diagnosis", [])
  const leader = readStore<{ employeeId: string; employeeName: string } | null>("safecloud:pesv-responsible", null)
  const committee = readStore<{ members: { employeeId: string; employeeName: string; role: string }[] } | null>("safecloud:pesv-committee", null)
  const people: Option[] = [
    ...diagnoses.flatMap(d => d.collaborators.map(p => ({ value: p.id, label: p.name, description: `Educación: ${p.educationLevel ?? "Sin registrar"}. Evaluación: ${p.competencyEvaluation ?? "Sin registrar"}.` }))),
    ...(leader ? [{ value: leader.employeeId, label: leader.employeeName, description: "Responsable PESV" }] : []),
    ...(committee?.members ?? []).map(p => ({ value: p.employeeId, label: p.employeeName, description: p.role })),
  ]
  if (!people.length) people.push({ value: "pesv-mock-employee-1", label: "Diana Mendoza" }, { value: "pesv-mock-employee-2", label: "Carlos Ramírez" }, { value: "pesv-mock-employee-3", label: "Valentina Suárez" }, { value: "pesv-mock-employee-4", label: "Andrés Torres" })
  const toOptions = (items: RecordItem[]) => items.map(r => ({ value: r.id, label: `${text(r.values.name)} · ${text(r.values.year)}`, year: text(r.values.year), description: text(r.values.description) || text(r.values.objective) }))
  return {
    policies: policies.map(p => ({ value: p.id, label: `${p.name} · v${p.version}`, description: `${p.scope}\n${p.commitments}` })),
    risks: risks.map(r => ({ value: r.id, label: r.name, eligible: criticalScore(r) >= 6, description: `Valoración actual: ${criticalScore(r)}${criticalScore(r) >= 6 ? " · Crítico" : " · Fuera de nivel crítico"}` })),
    people: [...new Map(people.map(p => [p.value, p])).values()],
    objectives: toOptions(readItems("objectives")), programs: toOptions(readItems("programs")),
    competencies: toOptions(readItems("training").filter(r => r.kind === "competency")),
    trainingActivities: toOptions(readItems("training").filter(r => r.kind === "training-activity")),
    procedures: toOptions(readItems("behavior").filter(r => r.kind === "procedure")),
    routes: [...new Map(diagnoses.flatMap(d => (d.routes ?? []).map(r => ({ value: `${d.id}:${r.id}`, label: `${r.origin} → ${r.destination} · ${d.year}`, year: String(d.year) }))).map(r => [r.value, r])).values()],
    vehicles: [...new Map(diagnoses.flatMap(d => (d.vehicles ?? []).map(v => ({ value: `${d.id}:${v.id}`, label: `${v.plate} · ${v.vehicleType} · ${d.year}`, year: String(d.year) }))).map(v => [v.value, v])).values()],
    emergencyPlans: toOptions(readItems("emergencies").filter(r => r.kind === "emergency-plan")),
    workActivities: toOptions(readItems("work-plan")),
  }
}
export function completion(item: RecordItem) {
  if (item.kind === "objective") {
    const value = item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)?.measuredValue
    if (value === undefined) return 0
    const base = Number(item.values.baseline), target = Number(item.values.target)
    const increasing = item.values.direction === "Aumentar"
    if (increasing ? value >= target : value <= target) return 100
    const distance = increasing ? target - base : base - target
    return distance > 0 ? Math.max(0, Math.min(100, Math.round(((increasing ? value - base : base - value) / distance) * 100))) : 0
  }
  return item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)?.progress ?? 0
}
export function itemStatus(item: RecordItem) {
  if (item.kind === "competency" || item.kind === "behavior-evaluation") return text(item.values.result)
  if (item.kind === "procedure" || item.kind === "emergency-plan") return "Documentado"
  if (item.kind === "road-drill" && completion(item) === 100 && !item.evidence.some(e => e.targetId === item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)?.id)) return "Pendiente de evidencia"
  const progress = completion(item)
  return progress >= 100 ? "Cumplido" : progress > 0 ? "En ejecución" : "Pendiente"
}
export function nextReview(item: RecordItem) {
  return item.entries.filter(e => e.kind === "ANNUAL_REVIEW").at(-1)?.nextReviewDate ?? text(item.values.nextReviewDate)
}
export function validateRecord(kind: Kind, values: Values, activities: Activity[], catalogs: Catalogs, previous?: RecordItem) {
  for (const f of visibleFields(kind, values)) {
    const value = values[f.key]
    if (f.required && !text(value).trim()) return `Completa el campo: ${f.label}.`
    if ((f.type === "number" || f.type === "year" || f.type === "money") && text(value)) {
      const number = Number(value)
      if (!Number.isFinite(number) || (f.min !== undefined && number < f.min) || (f.max !== undefined && number > f.max)) return `Revisa el valor de ${f.label}.`
      if ((f.type === "year" || ["accidents", "infractions", "complaints"].includes(f.key)) && !Number.isInteger(number)) return `${f.label} debe ser un número entero.`
    }
    if (f.reference) {
      for (const id of ids(value)) {
        const option = catalogs[f.reference].find(o => o.value === id)
        const retained = ids(previous?.values[f.key]).includes(id)
        if (!option && !retained) return `La selección de ${f.label} ya no está disponible.`
        if (f.criticalOnly && option?.eligible === false && !retained) return "Selecciona únicamente riesgos con valoración crítica."
        if (f.reference === "emergencyPlans" && option?.year && option.year !== text(values.year)) return "Selecciona un plan de emergencias de la misma vigencia del simulacro."
        if ((f.reference === "objectives" || f.reference === "programs") && option?.year && option.year !== text(values.year)) return "Relaciona objetivos y programas de la misma vigencia del registro."
      }
    }
  }
  if (text(values.endDate) && text(values.startDate) > text(values.endDate)) return "La fecha final no puede ser anterior a la inicial."
  if (text(values.periodEnd) && text(values.periodStart) > text(values.periodEnd)) return "Revisa el rango del período evaluado."
  if (text(values.periodEnd) && text(values.evaluationDate) < text(values.periodEnd)) return "La evaluación no puede ser anterior al final del período evaluado."
  if (text(values.evaluationDate) > dateToday()) return "La fecha de evaluación no puede estar en el futuro."
  if (text(values.startDate) && (Number(text(values.startDate).slice(0, 4)) !== Number(values.year) || Number(text(values.endDate).slice(0, 4)) !== Number(values.year))) return "Las fechas del plan deben pertenecer a la vigencia seleccionada."
  if (kind.id === "objective") {
    const base = Number(values.baseline), target = Number(values.target)
    if (values.direction === "Aumentar" ? target <= base : target >= base) return "La meta debe ser mayor que la línea base al aumentar, o menor al reducir."
    if (values.unit === "Porcentaje (%)" && (base > 100 || target > 100)) return "Los valores porcentuales deben estar entre 0 y 100."
  }
  const reviewDate = text(values.nextReviewDate)
  if (reviewDate && reviewDate <= (text(values.startDate) || text(values.evaluationDate) || dateToday())) return "La próxima revisión debe ser posterior al inicio o evaluación del registro."
  const reviewBase = text(values.evaluationDate) || text(values.startDate) || dateToday()
  if (reviewDate && reviewDate > `${Number(reviewBase.slice(0, 4)) + 1}${reviewBase.slice(4)}`) return "Programa la próxima revisión o actualización dentro de un año."
  if (kind.activities) {
    if (!activities.length) return "Agrega al menos una actividad al cronograma."
    for (const activity of activities) {
      if (!activity.name.trim() || !activity.responsible.trim() || !activity.startDate || !activity.endDate) return "Completa la actividad, responsable y fechas del cronograma."
      if (activity.endDate < activity.startDate || activity.startDate < text(values.startDate) || activity.endDate > text(values.endDate)) return "Las actividades deben estar dentro de las fechas del programa."
      if (!Number.isFinite(Number(activity.budget)) || Number(activity.budget) < 0) return "El presupuesto de las actividades no puede ser negativo."
    }
  }
  return null
}
