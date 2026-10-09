import type { Field, Kind, ModuleConfig, RecordItem, Values } from "./planning"

type OperationalModule = "managed-roads" | "journeys" | "vehicle-inspections" | "change-contractors" | "document-retention"
const f = (key: string, label: string, section: string, type: Field["type"] = "text", extra: Partial<Field> = {}): Field => ({ key, label, section, type, required: true, ...extra })
const nameYear = (section: string) => [f("name", "Nombre", section), f("year", "Vigencia", section, "year")]
const person = (key: string, label: string, section: string) => f(key, label, section, "reference", { reference: "people" })
const relation = (key: string, label: string, section: string, reference: Field["reference"], multiple = false, required = true) => f(key, label, section, "reference", { reference, multiple, required })
const prose = (key: string, label: string, section: string, required = true) => f(key, label, section, "textarea", { required, wide: true })
const procedure = (section: string) => [...nameYear(section), f("version", "Versión", section), person("responsibleId", "Responsable", section), f("nextReviewDate", "Próxima revisión", section, "date")]
const schedule = (section: string) => [f("startDate", "Fecha de inicio", section, "date"), f("endDate", "Fecha final", section, "date")]
export const inspectionChecks = [
  ["registration", "Licencia de tránsito"], ["soat", "SOAT"], ["technical", "Revisión técnico-mecánica"],
  ["license", "Licencia de conducción"], ["identity", "Documento de identidad"], ["lights", "Luces y direccionales"],
  ["tires", "Llantas y repuesto"], ["fluids", "Fluidos y niveles"], ["belts", "Cinturones de seguridad"],
  ["wipers", "Limpiabrisas"], ["mirrors", "Espejos"], ["safetyKit", "Equipo de prevención y seguridad"], ["helmet", "Casco"],
] as const
export const contractorChecks = [
  ["pesv", "PESV del contratista / justificación de no aplicabilidad"], ["vehicleRequirements", "Requisitos legales y técnicos de vehículos"],
  ["driverRequirements", "Edad, competencia y requisitos del conductor"], ["driverHistory", "Historial del conductor e infracciones"],
  ["vehicleHistory", "Historial de mantenimiento y siniestros del vehículo"], ["validDocuments", "Documentación vigente de conductor y vehículo"],
  ["socialSecurity", "Seguridad social y nivel de riesgo"], ["training", "Participación en formación PESV"],
  ["dailyInspection", "Inspección preoperacional diaria"], ["controls", "Controles administrativos y operativos"],
  ["reporting", "Reporte de siniestros"], ["health", "Reporte de condiciones de salud"],
] as const
const checkOptions = ["Sin verificar", "Cumple", "No cumple", "No aplica"]

export const operationalConfigs: Record<OperationalModule, ModuleConfig> = {
  "managed-roads": {
    title: "Vías seguras administradas por la organización", subtitle: "Vías, zonas de conflicto, inspecciones y mantenimiento de infraestructura",
    kinds: [
      { id: "road-protocol", title: "Protocolos", singular: "protocolo de vías", annualReview: true, diffusion: true, columns: ["name", "version", "responsibleId"], fields: [
        ...procedure("Protocolo"), prose("scope", "Vías públicas o privadas a cargo y alcance", "Operación"),
        prose("operation", "Operación, accesos, circulación y señalización", "Operación"), prose("conflicts", "Identificación y control de zonas de conflicto", "Operación"),
        prose("annualInspections", "Procedimiento y responsables de inspección anual", "Inspección y mantenimiento"),
        prose("preventiveMaintenance", "Mantenimiento preventivo de infraestructura y señalización", "Inspección y mantenimiento"),
        prose("accidentReporting", "Reporte de siniestros propios y de terceros con afectación a colaboradores", "Siniestros"),
      ] },
      { id: "managed-road", title: "Vías administradas", singular: "vía administrada", columns: ["name", "type", "responsibleId", "nextInspectionDate"], fields: [
        ...nameYear("Identificación"), relation("protocolId", "Protocolo de operación", "Identificación", "roadProtocols"),
        f("type", "Tipo de vía", "Identificación", "select", { options: ["Privada", "Pública administrada", "Zona de acceso / circulación interna"] }),
        f("location", "Ubicación y tramos", "Identificación"), f("administration", "Título / condición de administración o control", "Identificación"),
        person("responsibleId", "Responsable de la vía", "Identificación"), relation("routeIds", "Rutas relacionadas", "Relaciones", "routes", true, false),
        relation("riskIds", "Riesgos viales relacionados", "Relaciones", "risks", true, false),
        prose("infrastructure", "Infraestructura y señalización existentes", "Condiciones"), prose("conflictZones", "Zonas de conflicto y actores expuestos", "Condiciones"),
        f("nextInspectionDate", "Próxima inspección anual", "Control", "date"), prose("maintenancePlan", "Plan preventivo y frecuencia de mantenimiento", "Control"),
      ] },
      { id: "road-action", title: "Acciones de control", singular: "acción de control vial", tracking: true, columns: ["name", "roadId", "responsibleId", "endDate"], fields: [
        ...nameYear("Zona de conflicto"), relation("roadId", "Vía administrada", "Zona de conflicto", "managedRoads"),
        f("zone", "Zona de conflicto", "Zona de conflicto"), prose("risk", "Riesgo / hallazgo que se controla", "Zona de conflicto"),
        prose("control", "Plan de acción y control propuesto", "Acción"), person("responsibleId", "Responsable", "Acción"), ...schedule("Acción"),
        f("budget", "Presupuesto (COP)", "Acción", "money", { min: 0 }), relation("workActivityId", "Actividad del plan de trabajo", "Acción", "workActivities", false, false),
      ] },
      { id: "road-inspection", title: "Inspecciones de vías", singular: "inspección de vía", columns: ["name", "roadId", "inspectionDate", "result"], fields: [
        ...nameYear("Inspección"), relation("roadId", "Vía administrada", "Inspección", "managedRoads"), f("inspectionDate", "Fecha de inspección", "Inspección", "date"),
        person("inspectorId", "Inspector", "Inspección"), prose("surface", "Pavimento, drenaje e infraestructura", "Resultados"),
        prose("signage", "Señalización, iluminación y visibilidad", "Resultados"), prose("conflicts", "Zonas de conflicto y hallazgos", "Resultados"),
        f("result", "Resultado", "Resultados", "select", { options: ["Sin hallazgos", "Requiere intervención", "Restricción de uso"] }),
        prose("recommendations", "Acciones requeridas / recomendaciones", "Resultados"), f("nextInspectionDate", "Próxima inspección", "Resultados", "date"),
      ] },
      { id: "road-maintenance", title: "Mantenimiento de vías", singular: "mantenimiento vial", tracking: true, columns: ["name", "roadId", "responsibleId", "endDate"], fields: [
        ...nameYear("Mantenimiento"), relation("roadId", "Vía administrada", "Mantenimiento", "managedRoads"),
        f("type", "Tipo de mantenimiento", "Mantenimiento", "select", { options: ["Preventivo", "Correctivo", "Señalización"] }),
        prose("description", "Intervención y señalización a ejecutar", "Mantenimiento"), person("responsibleId", "Responsable de ejecución", "Recursos y plazos"),
        ...schedule("Recursos y plazos"), f("budget", "Presupuesto (COP)", "Recursos y plazos", "money", { min: 0 }), prose("resources", "Recursos, equipos y materiales", "Recursos y plazos"),
      ] },
      { id: "road-incident", title: "Siniestros en vías", singular: "siniestro en vía", columns: ["name", "roadId", "eventDate", "involvedParty"], fields: [
        ...nameYear("Evento"), relation("roadId", "Vía administrada", "Evento", "managedRoads"), f("eventDate", "Fecha del siniestro", "Evento", "date"),
        f("involvedParty", "Quién ocasionó el evento", "Evento", "select", { options: ["Colaborador", "Tercero", "Por determinar"] }),
        relation("affectedIds", "Colaboradores afectados", "Evento", "people", true), prose("description", "Hechos y afectaciones", "Reporte"),
        prose("immediateActions", "Acciones inmediatas y reporte", "Reporte"), relation("investigationId", "Investigación interna vinculada", "Reporte", "roadInvestigations", false, false),
      ] },
    ],
  },
  journeys: {
    title: "Planificación de desplazamientos laborales", subtitle: "Procedimientos, rutas, requisitos de salida y controles del recorrido",
    kinds: [
      { id: "journey-procedure", title: "Procedimientos", singular: "procedimiento de desplazamiento", annualReview: true, diffusion: true, columns: ["name", "version", "responsibleId"], fields: [
        ...procedure("Procedimiento"), prose("scope", "Alcance: desplazamientos y salidas extramurales", "Planificación"),
        f("noticeHours", "Antelación de planificación (horas)", "Planificación", "number", { min: 0 }),
        prose("dynamicRisks", "Identificación dinámica de puntos críticos y riesgos de ruta, origen y destino", "Planificación"),
        prose("siteAccess", "Ingreso y salida ordenados de las instalaciones", "Planificación"),
        prose("departureRequirements", "Requisitos para iniciar el viaje", "Antes de salir"), prose("driverVehicleRequirements", "Requisitos de seguridad para conductores y vehículos", "Antes de salir"),
        prose("documents", "Documentos que se portan y registros que se diligencian", "Antes de salir"),
        prose("drivingHours", "Horarios, tiempos de conducción y descanso", "Durante el recorrido"), prose("safeSpeeds", "Velocidades seguras", "Durante el recorrido"),
        prose("performanceFactors", "Factores de desempeño y prevención de fatiga, velocidad y distracción", "Durante el recorrido"),
        prose("safeStops", "Condiciones de alojamiento, restaurantes, descanso y parqueaderos", "Durante el recorrido"),
        prose("routeControls", "Controles durante el recorrido", "Durante el recorrido"), prose("arrivalRequirements", "Requisitos de finalización del viaje", "Finalización y formación"),
        prose("training", "Formación en identificación y análisis dinámico de riesgos externos", "Finalización y formación"),
        relation("trainingIds", "Formación PESV vinculada", "Finalización y formación", "trainingActivities", true, false),
      ] },
      { id: "journey", title: "Desplazamientos", singular: "desplazamiento", tracking: true, columns: ["name", "type", "driverId", "startDate", "endDate"], fields: [
        ...nameYear("Recorrido"), relation("procedureId", "Procedimiento aplicable", "Recorrido", "journeyProcedures"),
        f("type", "Tipo de desplazamiento", "Recorrido", "select", { options: ["Laboral", "Integración", "Pedagógico", "Otro extramural"] }),
        f("planningDate", "Fecha de planificación", "Recorrido", "date"), ...schedule("Recorrido"), f("departureTime", "Hora de salida (HH:mm)", "Recorrido"), f("arrivalTime", "Hora de llegada prevista (HH:mm)", "Recorrido"),
        f("origin", "Origen", "Ruta y riesgos"), f("destination", "Destino", "Ruta y riesgos"), relation("routeIds", "Rutas del diagnóstico", "Ruta y riesgos", "routes", true, false),
        relation("riskIds", "Riesgos relacionados", "Ruta y riesgos", "risks", true, false), prose("criticalPoints", "Puntos críticos y controles en ruta", "Ruta y riesgos"),
        prose("siteRisks", "Riesgos del origen y destino, incluidos sitios de terceros", "Ruta y riesgos"), prose("siteAccess", "Plan de ingreso y salida", "Ruta y riesgos"),
        person("driverId", "Conductor / responsable del desplazamiento", "Personas y vehículo"), person("supervisorId", "Supervisor del recorrido", "Personas y vehículo"),
        relation("participantIds", "Colaboradores participantes", "Personas y vehículo", "people", true), relation("vehicleId", "Vehículo del diagnóstico", "Personas y vehículo", "vehicles", false, false),
        f("vehicleIdentification", "Identificación del vehículo / medio de transporte", "Personas y vehículo"),
        prose("documents", "Documentación verificada y registros del viaje", "Verificaciones"), prose("departureCheck", "Requisitos de inicio y verificación preoperacional", "Verificaciones"),
        prose("drivingRest", "Tiempos de conducción, descansos y velocidades seguras", "Verificaciones"), prose("stops", "Paradas seguras y condiciones", "Verificaciones"),
        prose("controls", "Controles de fatiga, velocidad, distracción y reporte", "Verificaciones"), prose("arrivalCheck", "Requisitos de cierre del viaje", "Verificaciones"),
        relation("emergencyPlanId", "Plan de emergencias vinculado", "Verificaciones", "emergencyPlans", false, false),
      ] },
    ],
  },
  "vehicle-inspections": {
    title: "Inspección de vehículos y equipos", subtitle: "Hojas de vida, registros preoperacionales y trazabilidad de mantenimiento",
    kinds: [
      { id: "inspection-procedure", title: "Procedimientos", singular: "procedimiento de inspección", annualReview: true, columns: ["name", "version", "responsibleId"], fields: [
        ...procedure("Procedimiento"), prose("scope", "Vehículos automotores, no automotores y equipos cubiertos", "Inspecciones"),
        relation("inspectorIds", "Responsables de inspección preoperacional", "Inspecciones", "people", true), person("controllerId", "Responsable del control", "Inspecciones"),
        prose("frequency", "Inspección diaria, posterior al recorrido y cambio de conductor", "Inspecciones"),
        prose("criteria", "Disponibilidad, funcionamiento y niveles aceptables por elemento", "Inspecciones"),
        prose("nonCompliance", "Inmovilización, reporte y corrección de fallas", "Control y archivo"), prose("retention", "Conservación mínima de un año, acceso y protección de registros", "Control y archivo"),
        prose("expiryControl", "Control de vencimientos y mantenimiento predictivo", "Control y archivo"),
      ] },
      { id: "vehicle-profile", title: "Hojas de vida", singular: "hoja de vida de vehículo", columns: ["name", "vehicleType", "responsibleId", "soatExpiry", "technicalExpiry"], fields: [
        ...nameYear("Vehículo"), relation("diagnosisVehicleId", "Vehículo del diagnóstico PESV", "Vehículo", "vehicles", false, false),
        f("vehicleType", "Tipo de vehículo", "Vehículo", "select", { options: ["Automotor", "Motocicleta", "No automotor", "Equipo"] }),
        f("plate", "Placa / identificación interna", "Vehículo"), f("vin", "VIN / serial", "Vehículo", "text", { required: false }), f("engineNumber", "Número de motor", "Vehículo", "text", { required: false }),
        f("manufactureDate", "Fecha de fabricación", "Vehículo", "date"), f("mileage", "Kilometraje actual", "Vehículo", "number", { min: 0 }),
        prose("technicalSpecs", "Especificaciones técnicas", "Vehículo"), person("responsibleId", "Responsable del vehículo", "Adquisición y operación"),
        f("ownership", "Vinculación", "Adquisición y operación", "select", { options: ["Propio", "Afiliado", "Asociado", "Contratado", "Otro"] }),
        f("acquisitionDate", "Fecha de adquisición / vinculación", "Adquisición y operación", "date"), prose("acquisitionHistory", "Historial de adquisición / propietarios", "Adquisición y operación"),
        f("monthlyKm", "Kilómetros estimados por mes", "Adquisición y operación", "number", { min: 0 }),
        f("soatExpiry", "Vencimiento SOAT", "Documentación", "date", { showWhen: ["vehicleType", "Automotor"] }),
        f("technicalExpiry", "Vencimiento técnico-mecánica", "Documentación", "date", { showWhen: ["vehicleType", "Automotor"] }),
        f("motorcycleSoatExpiry", "Vencimiento SOAT motocicleta", "Documentación", "date", { showWhen: ["vehicleType", "Motocicleta"] }),
        f("motorcycleTechnicalExpiry", "Vencimiento técnico-mecánica motocicleta", "Documentación", "date", { showWhen: ["vehicleType", "Motocicleta"] }),
        prose("accidentHistory", "Historial de siniestros viales", "Historial"), relation("investigationIds", "Investigaciones de siniestros vinculadas", "Historial", "roadInvestigations", true, false),
        prose("maintenancePlan", "Plan de mantenimiento preventivo", "Historial"),
      ] },
      { id: "vehicle-inspection", title: "Inspecciones preoperacionales", singular: "inspección preoperacional", columns: ["name", "vehicleProfileId", "inspectionDate", "moment", "inspectorId"], fields: [
        ...nameYear("Registro"), relation("procedureId", "Procedimiento de inspección", "Registro", "inspectionProcedures"), relation("vehicleProfileId", "Hoja de vida del vehículo", "Registro", "vehicleProfiles"),
        f("inspectionDate", "Fecha de inspección", "Registro", "date"), f("inspectionTime", "Hora de inspección (HH:mm)", "Registro"),
        f("moment", "Momento", "Registro", "select", { options: ["Preoperacional diaria", "Después del recorrido", "Fin de jornada", "Cambio de conductor"] }),
        person("inspectorId", "Inspector / conductor", "Registro"), person("controllerId", "Responsable del control", "Registro"),
        f("vehicleType", "Tipo de vehículo inspeccionado", "Registro", "select", { options: ["Automotor", "Motocicleta", "No automotor", "Equipo"] }),
        relation("journeyId", "Desplazamiento relacionado", "Registro", "journeys", false, false), f("mileage", "Kilometraje", "Registro", "number", { min: 0 }),
        ...inspectionChecks.map(([key, label]) => f(`check_${key}`, label, "Lista de chequeo", "select", { options: checkOptions })),
        prose("exceptions", "Justificación de elementos no aplicables", "Hallazgos", false), prose("findings", "Hallazgos, niveles medidos y fallas", "Hallazgos", false),
        prose("corrections", "Controles, correcciones y restricciones de uso", "Hallazgos", false),
        f("soatExpiry", "Vencimiento SOAT verificado", "Vigencias", "date", { required: false }),
        f("technicalExpiry", "Vencimiento técnico-mecánica verificado", "Vigencias", "date", { required: false }),
        f("licenseExpiry", "Vencimiento licencia de conducción verificado", "Vigencias", "date", { required: false }),
      ] },
      { id: "vehicle-maintenance", title: "Mantenimiento y reparaciones", singular: "mantenimiento de vehículo", tracking: true, columns: ["name", "vehicleProfileId", "type", "responsibleId", "endDate"], fields: [
        ...nameYear("Intervención"), relation("vehicleProfileId", "Hoja de vida del vehículo", "Intervención", "vehicleProfiles"),
        f("type", "Tipo de intervención", "Intervención", "select", { options: ["Preventivo", "Correctivo", "Predictivo", "Reparación"] }),
        prose("description", "Trabajo y fallas atendidas", "Intervención"), person("responsibleId", "Responsable de ejecución", "Ejecución"),
        f("workshop", "Taller / proveedor", "Ejecución"), ...schedule("Ejecución"), f("mileage", "Kilometraje de intervención", "Ejecución", "number", { min: 0 }),
        prose("parts", "Repuestos, cantidades y referencias", "Trazabilidad"), prose("equipment", "Equipos utilizados", "Trazabilidad"),
        f("cost", "Costo (COP)", "Trazabilidad", "money", { min: 0 }), prose("acceptance", "Pruebas y criterios de entrega", "Trazabilidad"),
      ] },
    ],
  },
  "change-contractors": {
    title: "Gestión del cambio y gestión de contratistas", subtitle: "Impactos de cambios, requisitos de terceros y verificación de obligaciones",
    kinds: [
      { id: "change-procedure", title: "Procedimientos", singular: "procedimiento de cambios y contratistas", annualReview: true, diffusion: true, columns: ["name", "version", "responsibleId"], fields: [
        ...procedure("Procedimiento"), prose("changeAssessment", "Evaluación previa de cambios internos, externos, planeados y no planeados", "Cambios"),
        prose("approval", "Criterios de aprobación, responsables y controles antes de implementar", "Cambios"),
        prose("vehicleRequirements", "Requisitos de vehículos: antigüedad y seguridad activa / pasiva", "Contratistas"),
        prose("driverRequirements", "Requisitos de conductores: edad, competencia y aptitud", "Contratistas"),
        prose("legalRequirements", "Requisitos legales y verificación del PESV del contratista", "Contratistas"),
        prose("histories", "Historiales de conductor y vehículo que se deben presentar", "Contratistas"),
        prose("documents", "Documentos vigentes: control anual permanente / previo a recorrido ocasional", "Contratistas"),
        prose("obligations", "Formación, inspección diaria, controles, reporte de siniestros y salud", "Contratistas"),
        prose("otherServices", "Requisitos para proveedores de servicios con impacto en seguridad vial", "Contratistas"),
        prose("verification", "Mecanismo de evaluación y tratamiento de incumplimientos", "Supervisión"), relation("supervisorIds", "Supervisores del cumplimiento", "Supervisión", "people", true),
      ] },
      { id: "change", title: "Cambios", singular: "cambio", tracking: true, columns: ["name", "type", "planned", "responsibleId", "endDate"], fields: [
        ...nameYear("Cambio"), relation("procedureId", "Procedimiento aplicable", "Cambio", "changeProcedures"),
        f("type", "Origen del cambio", "Cambio", "select", { options: ["Interno", "Externo"] }), f("planned", "Planificación", "Cambio", "select", { options: ["Planeado", "No planeado"] }),
        f("category", "Categoría", "Cambio", "select", { options: ["Ruta", "Tecnología / equipo", "Legislación", "Cliente", "Producto / servicio", "Otro"] }),
        f("assessmentDate", "Fecha de evaluación del impacto", "Evaluación" , "date"), prose("description", "Descripción y motivo", "Evaluación"),
        prose("impacts", "Impactos, riesgos y consecuencias viales", "Evaluación"), relation("riskIds", "Riesgos vinculados", "Evaluación", "risks", true, false),
        relation("routeIds", "Rutas vinculadas", "Evaluación", "routes", true, false), prose("controls", "Controles previos a la implementación", "Control"),
        person("responsibleId", "Responsable de implementación", "Control"), person("approverId", "Responsable de aprobación", "Control"),
        f("decision", "Decisión", "Control", "select", { options: ["Pendiente", "Aprobado", "Rechazado"] }), f("approvalDate", "Fecha de aprobación", "Control", "date", { showWhen: ["decision", "Aprobado"] }),
        ...schedule("Implementación"), prose("verification", "Criterios de verificación de los controles", "Implementación"),
      ] },
      { id: "contractor", title: "Contratistas", singular: "contratista", columns: ["name", "relationship", "supervisorId", "nextVerificationDate"], fields: [
        ...nameYear("Contratista"), relation("procedureId", "Procedimiento aplicable", "Contratista", "changeProcedures"), f("identification", "NIT / documento", "Contratista"),
        f("relationship", "Vinculación", "Contratista", "select", { options: ["Permanente", "Ocasional"] }), f("service", "Producto / servicio y su impacto vial", "Contratista"),
        f("contact", "Propietario / contacto y teléfono", "Contratista"), person("supervisorId", "Supervisor de cumplimiento", "Obligaciones"),
        relation("driverIds", "Conductores relacionados", "Obligaciones", "people", true, false), relation("vehicleIds", "Vehículos relacionados", "Obligaciones", "vehicles", true, false),
        f("pesvRequired", "Obligación PESV verificada", "Obligaciones", "select", { options: ["Por verificar", "Sí", "No"] }),
        prose("pesvAssessment", "Soporte / fundamento de la obligación o no aplicabilidad", "Obligaciones"), prose("requirements", "Requisitos y obligaciones exigidos", "Obligaciones"),
        f("nextVerificationDate", "Próxima verificación documental", "Obligaciones", "date"),
      ] },
      { id: "contractor-check", title: "Verificaciones", singular: "verificación de contratista", columns: ["name", "contractorId", "verificationDate", "supervisorId"], fields: [
        ...nameYear("Verificación"), relation("contractorId", "Contratista", "Verificación", "contractors"), f("verificationDate", "Fecha de verificación", "Verificación", "date"),
        person("supervisorId", "Supervisor", "Verificación"), f("reason", "Motivo", "Verificación", "select", { options: ["Vinculación", "Anual permanente", "Previo a recorrido ocasional", "Seguimiento de incumplimientos"] }),
        relation("journeyId", "Recorrido ocasional relacionado", "Verificación", "journeys", false, false),
        ...contractorChecks.map(([key, label]) => f(`check_${key}`, label, "Requisitos", "select", { options: checkOptions })),
        prose("exceptions", "Justificación de no aplicabilidad", "Conclusión", false), prose("findings", "Incumplimientos y acciones exigidas", "Conclusión", false),
        f("nextVerificationDate", "Próxima verificación", "Conclusión", "date"),
      ] },
    ],
  },
  "document-retention": {
    title: "Archivo y retención documental", subtitle: "Control documental, conservación de evidencias y revisión trimestral",
    kinds: [
      { id: "archive-procedure", title: "Procedimientos", singular: "procedimiento de archivo", annualReview: true, columns: ["name", "version", "responsibleId"], fields: [
        ...procedure("Procedimiento"), prose("identification", "Identificación, codificación y versiones", "Control documental"),
        prose("legibility", "Legibilidad y actualización de documentos", "Control documental"), prose("access", "Accesibilidad, permisos y confidencialidad", "Control documental"),
        prose("protection", "Protección contra daño, pérdida y copias de seguridad", "Control documental"),
        prose("retention", "Conservación: cinco años general y un año preoperacionales; normas especiales", "Conservación"),
        prose("disposition", "Revisión autorizada de disposición final sin eliminación automática", "Conservación"), prose("quarterlyReview", "Revisión e indicadores trimestrales", "Conservación"),
      ] },
      { id: "archive-record", title: "Registros documentales", singular: "registro documental", columns: ["name", "category", "recordDate", "custodianId"], fields: [
        ...nameYear("Documento"), relation("procedureId", "Procedimiento de archivo", "Documento", "archiveProcedures"), f("code", "Código / consecutivo", "Documento"), f("version", "Versión", "Documento"),
        f("category", "Serie documental", "Documento", "select", { options: ["PESV general", "Inspección preoperacional", "Norma especial"] }),
        f("recordDate", "Fecha del documento / registro", "Documento", "date"), f("sourceModule", "Módulo o proceso de origen", "Documento"),
        person("custodianId", "Responsable de custodia", "Control"), f("location", "Ubicación de archivo / repositorio", "Control"),
        f("accessLevel", "Acceso", "Control", "select", { options: ["Interno", "Restringido", "Público"] }),
        f("legible", "Verificación de legibilidad", "Control", "select", { options: ["Pendiente", "Sí", "No"] }),
        f("updated", "Documento actualizado", "Control", "select", { options: ["Pendiente", "Sí", "No"] }),
        f("specialYears", "Conservación por norma especial (años, mínimo 5)", "Conservación", "number", { min: 5, max: 100, showWhen: ["category", "Norma especial"] }),
        f("specialBasis", "Norma especial / fundamento de conservación", "Conservación", "textarea", { showWhen: ["category", "Norma especial"], wide: true }),
        prose("backup", "Respaldo y medidas de protección", "Conservación"),
      ] },
      { id: "archive-review", title: "Revisiones trimestrales", singular: "revisión trimestral", columns: ["name", "year", "quarter", "reviewDate", "responsibleId"], fields: [
        ...nameYear("Revisión"), f("quarter", "Trimestre", "Revisión", "select", { options: ["1", "2", "3", "4"] }), f("reviewDate", "Fecha de revisión", "Revisión", "date"),
        person("responsibleId", "Responsable de revisión", "Revisión"), prose("accessTest", "Prueba de acceso, legibilidad y recuperación de archivos", "Resultados"),
        prose("backupTest", "Verificación de protección y respaldos", "Resultados"), prose("findings", "Hallazgos y documentos faltantes / desactualizados", "Resultados"),
        prose("actions", "Acciones de mejora, responsables y plazos", "Resultados"),
      ] },
    ],
  },
}

const value = (v: Values, key: string) => typeof v[key] === "string" ? v[key] as string : ""
export function retentionUntil(date: string, years: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return ""
  const [y, m, d] = date.split("-").map(Number)
  return `${y + years}-${String(m).padStart(2, "0")}-${String(Math.min(d, new Date(Date.UTC(y + years, m, 0)).getUTCDate())).padStart(2, "0")}`
}
export function archiveYears(values: Values) { return values.category === "Inspección preoperacional" ? 1 : values.category === "Norma especial" ? Math.max(5, Number(values.specialYears) || 5) : 5 }
export function checksStatus(values: Values, checks: readonly (readonly [string, string])[]) {
  const results = checks.map(([key]) => value(values, `check_${key}`))
  return results.includes("No cumple") ? "No apto" : results.some(r => !r || r === "Sin verificar") ? "Pendiente de verificación" : "Apto"
}
export function operationalStatus(item: RecordItem, today: string): string | null {
  const v = item.values
  if (["road-protocol", "journey-procedure", "inspection-procedure", "change-procedure", "archive-procedure"].includes(item.kind)) return "Documentado"
  if (item.kind === "vehicle-inspection") {
    const result = checksStatus(v, inspectionChecks)
    if (["soatExpiry", "technicalExpiry", "licenseExpiry"].some(k => value(v, k) && value(v, k) < value(v, "inspectionDate"))) return "No apto"
    return result === "Apto" && !item.evidence.length ? "Pendiente de evidencia" : result
  }
  if (item.kind === "contractor-check") {
    const result = checksStatus(v, contractorChecks)
    return result === "No apto" ? "Incumplimientos" : result === "Apto" ? item.evidence.length ? "Verificado" : "Pendiente de evidencia" : result
  }
  if (item.kind === "vehicle-profile") return ["soatExpiry", "technicalExpiry", "motorcycleSoatExpiry", "motorcycleTechnicalExpiry"].some(k => value(v, k) && value(v, k) < today) ? "Documentación vencida" : "Registrado"
  if (item.kind === "managed-road") return value(v, "nextInspectionDate") < today ? "Inspección vencida" : "Registrada"
  if (item.kind === "road-inspection") return value(v, "result")
  if (item.kind === "road-incident") return "Reportado"
  if (item.kind === "contractor") return value(v, "nextVerificationDate") < today ? "Verificación vencida" : "Registrado"
  if (item.kind === "change" && value(v, "decision") !== "Aprobado") return value(v, "decision") === "Rechazado" ? "Rechazado" : "Pendiente de aprobación"
  if (item.kind === "archive-record") return v.legible === "No" || v.updated === "No" ? "Requiere revisión" : v.legible !== "Sí" || v.updated !== "Sí" ? "Pendiente de control" : item.evidence.length ? "Controlado" : "Pendiente de evidencia"
  if (item.kind === "archive-review") return item.evidence.length ? "Documentada" : "Pendiente de evidencia"
  if (["journey", "road-action", "road-maintenance", "vehicle-maintenance", "change"].includes(item.kind)) {
    const latest = item.entries.filter(e => e.kind === "FOLLOW_UP").at(-1)
    if (latest?.progress === 100 && !item.evidence.some(e => e.targetId === latest.id)) return "Pendiente de evidencia"
  }
  return null
}

export function validateOperationalRecord(kind: Kind, values: Values, previous: RecordItem | undefined, today: string) {
  const v = (key: string) => value(values, key)
  for (const key of ["inspectionDate", "eventDate", "verificationDate", "assessmentDate", "recordDate", "reviewDate"]) {
    if (v(key) && v(key) > today) return "Las fechas de registros realizados no pueden estar en el futuro."
    if (v(key) && v(key).slice(0, 4) !== v("year")) return "La fecha del registro debe pertenecer a su vigencia."
  }
  for (const key of ["inspectionTime", "departureTime", "arrivalTime"]) if (v(key) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v(key))) return "Ingresa las horas en formato HH:mm (00:00–23:59)."
  if (kind.id === "journey" && (v("planningDate") > v("startDate") || (v("startDate") === v("endDate") && v("arrivalTime") < v("departureTime")))) return "La planificación debe ser previa al viaje y la llegada posterior a la salida."
  if (kind.id === "vehicle-profile" && (v("manufactureDate") > v("acquisitionDate") || v("acquisitionDate") > today)) return "La fabricación debe ser anterior a la adquisición y la vinculación no puede estar en el futuro."
  if (kind.id === "contractor" && v("relationship") === "Permanente" && v("nextVerificationDate") > retentionUntil(today, 1)) return "Verifica la documentación del contratista permanente dentro de un año."
  if (kind.id === "change" && (v("assessmentDate") > v("startDate") || (v("decision") === "Aprobado" && (v("approvalDate") < v("assessmentDate") || v("approvalDate") > v("startDate") || v("approvalDate") > today)))) return "Evalúa y aprueba el impacto antes de implementar el cambio; la aprobación no puede estar en el futuro."
  if (["vehicle-inspection", "contractor-check"].includes(kind.id)) {
    const checks = kind.id === "vehicle-inspection" ? inspectionChecks : contractorChecks
    if (checks.some(([key]) => v(`check_${key}`) === "No aplica") && !v("exceptions").trim()) return "Justifica los elementos marcados como No aplica."
    if (checks.some(([key]) => v(`check_${key}`) === "No cumple") && !v("findings").trim()) return "Describe los incumplimientos y sus acciones de control."
    if (kind.id === "vehicle-inspection") {
      const motor = ["Automotor", "Motocicleta"].includes(v("vehicleType"))
      if (motor && ["registration", "soat", "technical", "license", "identity"].some(k => v(`check_${k}`) === "No aplica")) return "Los documentos de conductor y vehículo no pueden omitirse para vehículos automotores."
      if (v("vehicleType") === "Motocicleta" && v("check_helmet") === "No aplica") return "La verificación del casco aplica a motocicletas."
      for (const [check, date] of [["soat", "soatExpiry"], ["technical", "technicalExpiry"], ["license", "licenseExpiry"]]) {
        if (motor && v(`check_${check}`) === "Cumple" && !v(date)) return "Registra las fechas de vencimiento de los documentos verificados."
        if (v(`check_${check}`) === "Cumple" && v(date) && v(date) < v("inspectionDate")) return "Un documento vencido en la fecha de inspección no puede marcarse como Cumple."
      }
    }
  }
  if (v("nextInspectionDate") && (v("nextInspectionDate") <= (v("inspectionDate") || today) || v("nextInspectionDate") > retentionUntil(v("inspectionDate") || today, 1))) return "Programa la próxima inspección dentro de un año, después de la fecha actual o de inspección."
  if (v("nextVerificationDate") && v("nextVerificationDate") <= (v("verificationDate") || today)) return "La próxima verificación debe ser posterior a la actual."
  if (kind.id === "archive-record" && previous?.evidence.length && ["recordDate", "category", "specialYears"].some(k => v(k) !== value(previous.values, k))) return "Conserva las fechas y plazos del documento con evidencias; registra una nueva versión."
  if (kind.id === "archive-record" && v("category") === "Norma especial" && !Number.isInteger(Number(v("specialYears")))) return "El plazo especial debe ser un número entero de años."
  if (kind.id === "archive-review" && Math.ceil(Number(v("reviewDate").slice(5, 7)) / 3) !== Number(v("quarter"))) return "La fecha de revisión debe corresponder al trimestre seleccionado."
  if (previous?.entries.length && ["startDate", "endDate", "year"].some(k => v(k) !== value(previous.values, k))) return "Este registro ya tiene seguimiento. Conserva la vigencia y el cronograma originales para mantener la trazabilidad."
  return null
}

export const operationalCatalogKinds = {
  "road-protocol": "roadProtocols", "managed-road": "managedRoads", "journey-procedure": "journeyProcedures", journey: "journeys",
  "vehicle-profile": "vehicleProfiles", "inspection-procedure": "inspectionProcedures", "change-procedure": "changeProcedures",
  contractor: "contractors", "archive-procedure": "archiveProcedures",
} as const

export function operationalDemo(kind: Kind, catalogs: import("./planning").Catalogs, today: string): Values | null {
  if (!Object.values(operationalConfigs).some(config => config.kinds.some(k => k.id === kind.id))) return null
  const values: Values = {}
  for (const field of kind.fields) {
    values[field.key] = field.type === "reference" ? field.multiple ? catalogs[field.reference!].slice(0, 1).map(o => o.value) : catalogs[field.reference!][0]?.value ?? ""
      : field.type === "select" ? field.options?.[0] ?? "" : field.type === "year" ? today.slice(0, 4)
      : field.type === "date" ? today : field.type === "number" || field.type === "money" ? String(field.min ?? 0)
      : field.required ? `Ejemplo de ${field.label.toLowerCase()}. Pendiente de validar por la organización.` : ""
  }
  const names: Record<string, string> = {
    "road-protocol": "Protocolo de operación de vías internas", "managed-road": "Acceso y patio de circulación",
    "road-action": "Señalizar el cruce peatonal del acceso", "road-inspection": "Inspección anual del acceso",
    "road-maintenance": "Mantenimiento de señalización del patio", "road-incident": "Reporte de evento en el acceso",
    "journey-procedure": "Procedimiento de desplazamientos laborales y extramurales", journey: "Visita laboral a sede regional",
    "inspection-procedure": "Inspección preoperacional y control de registros", "vehicle-profile": "Vehículo operativo · DEM-001",
    "vehicle-inspection": "Inspección diaria · DEM-001", "vehicle-maintenance": "Mantenimiento preventivo · DEM-001",
    "change-procedure": "Evaluación de cambios y requisitos de contratistas", change: "Evaluación de nueva ruta operativa",
    contractor: "Transportes de ejemplo", "contractor-check": "Verificación inicial del contratista",
    "archive-procedure": "Control y conservación documental del PESV", "archive-record": "Procedimiento PESV · versión inicial",
    "archive-review": "Revisión del archivo PESV",
  }
  Object.assign(values, { name: names[kind.id], version: "1.0", nextReviewDate: retentionUntil(today, 1), nextInspectionDate: retentionUntil(today, 1), nextVerificationDate: retentionUntil(today, 1), inspectionTime: "07:00", departureTime: "08:00", arrivalTime: "17:00", manufactureDate: `${Number(today.slice(0, 4)) - 2}-01-01`, plate: "DEM-001", soatExpiry: retentionUntil(today, 1), technicalExpiry: retentionUntil(today, 1), quarter: String(Math.ceil(Number(today.slice(5, 7)) / 3)), code: "PESV-ARC-001", location: "Archivo interno PESV" })
  return values
}

export type ArchivedEvidence = {
  id: string; name: string; source: string; href: string; date: string; until: string; years: number
  url: string; mime: string; uploadedAt: string
}
export function archiveInventory(items: { module: string; title: string; records: RecordItem[] }[]): ArchivedEvidence[] {
  return items.flatMap(({ module, title, records }) => records.flatMap(record => record.evidence.map(evidence => {
    const baseDate = [value(record.values, "recordDate") || value(record.values, "inspectionDate") || record.createdAt.slice(0, 10), evidence.uploadedAt.slice(0, 10)].sort().at(-1)!
    const years = record.kind === "vehicle-inspection" ? 1 : record.kind === "archive-record" ? archiveYears(record.values) : 5
    return { ...evidence, id: `${record.id}:${evidence.id}`, source: `${title} · ${value(record.values, "name")}`, href: `/dashboard/pesv-${module}`, date: baseDate, years, until: retentionUntil(baseDate, years) }
  })))
}
