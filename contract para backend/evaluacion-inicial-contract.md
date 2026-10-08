# Contract backend - Modulo hijo Evaluacion Inicial

## 1. Ubicacion actual en frontend

- Ruta: `/dashboard/initial-evaluation`
- Archivo principal: `app/dashboard/initial-evaluation/page.tsx`
- Modulo padre actual en navegacion: `Gestion del SG-SST`
- Codigo de modulo hijo usado en navegacion: `INITIAL_EVALUATION`
- Estado actual: integrado con los endpoints del backend. El catálogo de estándares proviene exclusivamente del backend.

La pantalla actual permite:

- crear una evaluacion inicial SG-SST;
- editar una evaluacion inicial;
- diligenciar la tabla de estandares minimos;
- calificar cada item como cumple, no cumple o no aplica;
- registrar observacion por item;
- calcular puntaje total;
- calcular porcentaje de cumplimiento;
- calcular cumplimiento por ciclo PHVA;
- listar hallazgos automaticamente;
- buscar por evaluacion, empresa, responsable o vigencia;
- descargar PDF para firma;
- ver hallazgos y acciones sugeridas.

## 2. Objetivo del modulo

Permitir que la empresa diligencie la evaluacion inicial del SG-SST con base en los estandares minimos de la Resolucion 0312 de 2019, dejando trazabilidad de:

- datos generales de la evaluacion;
- respuestas por estandar;
- puntaje obtenido;
- porcentaje de cumplimiento;
- hallazgos generados;
- acciones sugeridas;
- modulo de SafeCloud donde aplica cada accion;
- PDF descargable para firma y archivo.

## 3. Catálogo administrado por backend

El frontend consume los estándares desde `GET /api/initial-evaluations/catalogs/standard-items?status=ACTIVE`. No conserva ni completa el catálogo con datos locales: cada fila mostrada, su orden y su UUID deben provenir del backend.

Cada item tiene:

```ts
type StandardItem = {
  id: string
  cycle: "PLANEAR" | "HACER" | "VERIFICAR" | "ACTUAR"
  standard: string
  standardItem: string
  value: number
  percentageWeight: number
  possibleScore: number
  action: string
  appliesModule: string
}
```

Los items representan la tabla de valores y calificacion. Para crear o editar una evaluación, cada item debe existir en backend y tener un UUID real. Nunca debe enviarse el código `1.1.1` como `standardItemId`.

## 3.1. Seed completo obligatorio del catalogo

El backend debe crear los **60 items** siguientes. El seed debe:

- generar un UUID para `id` en cada registro;
- usar `code` como clave unica para hacer upsert;
- ser idempotente y poder ejecutarse varias veces;
- conservar exactamente `order`, puntajes, acciones y modulo relacionado;
- dejar todos los registros con `status = ACTIVE`;
- devolverlos ordenados por `order ASC`;
- no eliminar registros historicos si posteriormente se inactivan.

La suma de `possibleScore` de los 60 items debe ser **100 puntos**.

```json
[
  {
    "code": "1.1.1",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Designar responsable SG-SST y conservar soporte documental.",
    "appliesModule": "Responsable SG-SST",
    "order": 1
  },
  {
    "code": "1.1.2",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Responsabilidades en el Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Definir, comunicar y documentar responsabilidades SG-SST.",
    "appliesModule": "Gestión documental",
    "order": 2
  },
  {
    "code": "1.1.3",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Asignación de recursos para el Sistema de Gestión en Seguridad y Salud en el Trabajo SG-SST",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Registrar recursos humanos, técnicos, financieros y tecnológicos.",
    "appliesModule": "Plan de Trabajo",
    "order": 3
  },
  {
    "code": "1.1.4",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Afiliación al Sistema General de Riesgos Laborales",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Verificar afiliación ARL de los trabajadores.",
    "appliesModule": "Gestión Empleados",
    "order": 4
  },
  {
    "code": "1.1.5",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Identificación de trabajadores de alto riesgo y cotización de pensión especial",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Identificar cargos o actividades con riesgo especial.",
    "appliesModule": "Riesgo Especial",
    "order": 5
  },
  {
    "code": "1.1.6",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Conformación COPASST",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Conformar y documentar el COPASST.",
    "appliesModule": "Gestión de Comités",
    "order": 6
  },
  {
    "code": "1.1.7",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Capacitación COPASST",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Programar capacitación de integrantes COPASST.",
    "appliesModule": "Capacitaciones",
    "order": 7
  },
  {
    "code": "1.1.8",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Conformación Comité de Convivencia Laboral",
    "value": 0.5,
    "percentageWeight": 4,
    "possibleScore": 0.5,
    "action": "Conformar y documentar el Comité de Convivencia Laboral.",
    "appliesModule": "Gestión de Comités",
    "order": 8
  },
  {
    "code": "1.2.1",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Programa Capacitación promoción y prevención PYP",
    "value": 2,
    "percentageWeight": 6,
    "possibleScore": 2,
    "action": "Crear programa anual de capacitación, promoción y prevención.",
    "appliesModule": "Capacitaciones",
    "order": 9
  },
  {
    "code": "1.2.2",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Inducción y Reinducción en SG-SST, actividades de Promoción y Prevención PYP",
    "value": 2,
    "percentageWeight": 6,
    "possibleScore": 2,
    "action": "Registrar inducción y reinducción con participantes y evidencias.",
    "appliesModule": "Capacitaciones",
    "order": 10
  },
  {
    "code": "1.2.3",
    "cycle": "PLANEAR",
    "standard": "RECURSOS (10%)",
    "standardItem": "Responsables del SG-SST con curso virtual de 50 horas",
    "value": 2,
    "percentageWeight": 6,
    "possibleScore": 2,
    "action": "Cargar certificado de 50 horas o actualización del responsable.",
    "appliesModule": "Formación y Certificaciones",
    "order": 11
  },
  {
    "code": "2.1.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Política del SG-SST firmada, fechada y comunicada al COPASST",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Crear, firmar, fechar y divulgar política SST.",
    "appliesModule": "Objetivos SST",
    "order": 12
  },
  {
    "code": "2.2.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Objetivos definidos, claros, medibles, cuantificables, con metas, documentados y revisados",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Definir objetivos SST con metas e indicadores.",
    "appliesModule": "Objetivos SST",
    "order": 13
  },
  {
    "code": "2.3.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Evaluación e identificación de prioridades del SG-SST",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Realizar evaluación inicial y priorizar plan de mejora.",
    "appliesModule": "Evaluación Inicial",
    "order": 14
  },
  {
    "code": "2.4.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Plan Anual de Trabajo",
    "value": 2,
    "percentageWeight": 2,
    "possibleScore": 2,
    "action": "Crear plan anual de trabajo firmado y con responsables.",
    "appliesModule": "Plan de Trabajo",
    "order": 15
  },
  {
    "code": "2.5.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Archivo o retención documental del SG-SST",
    "value": 2,
    "percentageWeight": 2,
    "possibleScore": 2,
    "action": "Organizar documentos SG-SST y evidencias por tipo.",
    "appliesModule": "Gestión documental",
    "order": 16
  },
  {
    "code": "2.6.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Rendición sobre el desempeño",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Registrar rendición de cuentas del SG-SST.",
    "appliesModule": "Reuniones",
    "order": 17
  },
  {
    "code": "2.7.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Matriz legal",
    "value": 2,
    "percentageWeight": 2,
    "possibleScore": 2,
    "action": "Actualizar matriz legal aplicable a la empresa.",
    "appliesModule": "Gestión documental",
    "order": 18
  },
  {
    "code": "2.8.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Mecanismos de comunicación, auto reporte en SG-SST",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Definir canales de comunicación y autorreporte.",
    "appliesModule": "Gestión documental",
    "order": 19
  },
  {
    "code": "2.9.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Identificación, evaluación para adquisición de bienes y servicios",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Definir criterios SST para compras y contratación.",
    "appliesModule": "Gestión documental",
    "order": 20
  },
  {
    "code": "2.10.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Evaluación y selección de proveedores y contratistas",
    "value": 2,
    "percentageWeight": 2,
    "possibleScore": 2,
    "action": "Definir requisitos SST para evaluación de proveedores y contratistas.",
    "appliesModule": "Gestión documental",
    "order": 21
  },
  {
    "code": "2.11.1",
    "cycle": "PLANEAR",
    "standard": "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    "standardItem": "Gestión del cambio",
    "value": 1,
    "percentageWeight": 1,
    "possibleScore": 1,
    "action": "Documentar cambios internos o externos que impacten el SG-SST.",
    "appliesModule": "Gestión documental",
    "order": 22
  },
  {
    "code": "3.1.1",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Evaluación Médica Ocupacional",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Registrar evaluaciones médicas ocupacionales y conceptos.",
    "appliesModule": "Gestión Empleados",
    "order": 23
  },
  {
    "code": "3.1.2",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Actividades de Promoción y Prevención en Salud",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Programar actividades de promoción y prevención.",
    "appliesModule": "Capacitaciones",
    "order": 24
  },
  {
    "code": "3.1.3",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Información al médico de perfiles de cargo",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Remitir perfiles de cargos al médico ocupacional.",
    "appliesModule": "Cargos",
    "order": 25
  },
  {
    "code": "3.1.4",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Realización de exámenes médicos ocupacionales",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Registrar ejecución de exámenes médicos ocupacionales.",
    "appliesModule": "Gestión Empleados",
    "order": 26
  },
  {
    "code": "3.1.5",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Custodia de historias clínicas",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Registrar custodia por institución o médico competente.",
    "appliesModule": "Gestión documental",
    "order": 27
  },
  {
    "code": "3.1.6",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Restricciones y recomendaciones médico laborales",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Registrar restricciones, recomendaciones y seguimiento médico laboral.",
    "appliesModule": "Gestión Empleados",
    "order": 28
  },
  {
    "code": "3.1.7",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Estilos de vida y entorno saludable",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Registrar actividades de promoción de estilos de vida saludables.",
    "appliesModule": "Capacitaciones",
    "order": 29
  },
  {
    "code": "3.1.8",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Agua potable, servicios sanitarios y disposición de basuras",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Conservar soportes de condiciones sanitarias básicas.",
    "appliesModule": "Gestión Sanitaria",
    "order": 30
  },
  {
    "code": "3.1.9",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Eliminación adecuada de residuos sólidos, líquidos o gaseosos",
    "value": 1,
    "percentageWeight": 9,
    "possibleScore": 1,
    "action": "Registrar manejo y disposición de residuos aplicables.",
    "appliesModule": "Gestión Sanitaria",
    "order": 31
  },
  {
    "code": "3.2.1",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Reporte de accidentes de trabajo y enfermedades laborales",
    "value": 2,
    "percentageWeight": 5,
    "possibleScore": 2,
    "action": "Registrar y reportar novedades laborales.",
    "appliesModule": "Novedades Laborales",
    "order": 32
  },
  {
    "code": "3.2.2",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Investigación de incidentes, accidentes y enfermedades laborales",
    "value": 2,
    "percentageWeight": 5,
    "possibleScore": 2,
    "action": "Crear investigación con acciones y trazabilidad.",
    "appliesModule": "Investigaciones",
    "order": 33
  },
  {
    "code": "3.2.3",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Registro y análisis estadístico de accidentes y enfermedades laborales",
    "value": 1,
    "percentageWeight": 5,
    "possibleScore": 1,
    "action": "Mantener estadística y análisis de novedades laborales.",
    "appliesModule": "Novedades Laborales",
    "order": 34
  },
  {
    "code": "3.3.1",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Medición de la frecuencia de accidentalidad",
    "value": 1,
    "percentageWeight": 6,
    "possibleScore": 1,
    "action": "Calcular y documentar indicador de frecuencia de accidentalidad.",
    "appliesModule": "Objetivos SST",
    "order": 35
  },
  {
    "code": "3.3.2",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Medición de la severidad de accidentalidad",
    "value": 1,
    "percentageWeight": 6,
    "possibleScore": 1,
    "action": "Calcular y documentar indicador de severidad de accidentalidad.",
    "appliesModule": "Objetivos SST",
    "order": 36
  },
  {
    "code": "3.3.3",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Medición de la mortalidad por accidentes de trabajo",
    "value": 1,
    "percentageWeight": 6,
    "possibleScore": 1,
    "action": "Registrar indicador de mortalidad por accidentes de trabajo.",
    "appliesModule": "Objetivos SST",
    "order": 37
  },
  {
    "code": "3.3.4",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Medición de la prevalencia de enfermedad laboral",
    "value": 1,
    "percentageWeight": 6,
    "possibleScore": 1,
    "action": "Registrar indicador de prevalencia de enfermedad laboral.",
    "appliesModule": "Objetivos SST",
    "order": 38
  },
  {
    "code": "3.3.5",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Medición de la incidencia de enfermedad laboral",
    "value": 1,
    "percentageWeight": 6,
    "possibleScore": 1,
    "action": "Registrar indicador de incidencia de enfermedad laboral.",
    "appliesModule": "Objetivos SST",
    "order": 39
  },
  {
    "code": "3.3.6",
    "cycle": "HACER",
    "standard": "GESTIÓN DE LA SALUD (20%)",
    "standardItem": "Medición del ausentismo por causa médica",
    "value": 1,
    "percentageWeight": 6,
    "possibleScore": 1,
    "action": "Registrar indicador de ausentismo por causa médica.",
    "appliesModule": "Objetivos SST",
    "order": 40
  },
  {
    "code": "4.1.1",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Metodología para identificación de peligros, evaluación y valoración de riesgos",
    "value": 4,
    "percentageWeight": 15,
    "possibleScore": 4,
    "action": "Definir metodología de matriz de peligros.",
    "appliesModule": "Laborales",
    "order": 41
  },
  {
    "code": "4.1.2",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Identificación de peligros con participación de todos los niveles de la empresa",
    "value": 4,
    "percentageWeight": 15,
    "possibleScore": 4,
    "action": "Actualizar matriz de peligros con participación documentada.",
    "appliesModule": "Laborales",
    "order": 42
  },
  {
    "code": "4.1.3",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Identificación de sustancias catalogadas como carcinógenas o con toxicidad aguda",
    "value": 3,
    "percentageWeight": 15,
    "possibleScore": 3,
    "action": "Identificar sustancias peligrosas y definir controles documentados.",
    "appliesModule": "Laborales",
    "order": 43
  },
  {
    "code": "4.1.4",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Mediciones ambientales",
    "value": 4,
    "percentageWeight": 15,
    "possibleScore": 4,
    "action": "Registrar mediciones higiénicas o ambientales cuando apliquen.",
    "appliesModule": "Laborales",
    "order": 44
  },
  {
    "code": "4.2.1",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Medidas de prevención y control frente a peligros/riesgos identificados",
    "value": 2.5,
    "percentageWeight": 15,
    "possibleScore": 2.5,
    "action": "Definir medidas de prevención y controles.",
    "appliesModule": "Medidas de Prevencion",
    "order": 45
  },
  {
    "code": "4.2.2",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Aplicación de medidas de prevención y control por parte de los trabajadores",
    "value": 2.5,
    "percentageWeight": 15,
    "possibleScore": 2.5,
    "action": "Registrar seguimiento a implementación de controles.",
    "appliesModule": "Medidas de Prevencion",
    "order": 46
  },
  {
    "code": "4.2.3",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Procedimientos, instructivos y fichas técnicas de seguridad",
    "value": 2.5,
    "percentageWeight": 15,
    "possibleScore": 2.5,
    "action": "Cargar procedimientos e instructivos aplicables.",
    "appliesModule": "Gestión documental",
    "order": 47
  },
  {
    "code": "4.2.4",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Inspecciones a instalaciones, maquinaria o equipos",
    "value": 2.5,
    "percentageWeight": 15,
    "possibleScore": 2.5,
    "action": "Programar inspecciones y evidenciar hallazgos.",
    "appliesModule": "Mantenimiento Preventivo",
    "order": 48
  },
  {
    "code": "4.2.5",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Mantenimiento periódico de instalaciones, equipos, máquinas y herramientas",
    "value": 2.5,
    "percentageWeight": 15,
    "possibleScore": 2.5,
    "action": "Registrar planes y evidencias de mantenimiento.",
    "appliesModule": "Mantenimiento Preventivo",
    "order": 49
  },
  {
    "code": "4.2.6",
    "cycle": "HACER",
    "standard": "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    "standardItem": "Entrega de Elementos de Protección Personal EPP",
    "value": 2.5,
    "percentageWeight": 15,
    "possibleScore": 2.5,
    "action": "Registrar entrega, reposición y capacitación de EPP.",
    "appliesModule": "Gestión documental",
    "order": 50
  },
  {
    "code": "5.1.1",
    "cycle": "HACER",
    "standard": "GESTIÓN DE AMENAZAS (10%)",
    "standardItem": "Plan de prevención, preparación y respuesta ante emergencias",
    "value": 5,
    "percentageWeight": 10,
    "possibleScore": 5,
    "action": "Actualizar plan de emergencias y divulgarlo.",
    "appliesModule": "Gestión de Emergencias",
    "order": 51
  },
  {
    "code": "5.1.2",
    "cycle": "HACER",
    "standard": "GESTIÓN DE AMENAZAS (10%)",
    "standardItem": "Brigada de prevención, preparación y respuesta ante emergencias",
    "value": 5,
    "percentageWeight": 10,
    "possibleScore": 5,
    "action": "Conformar, capacitar y evidenciar brigada de emergencias.",
    "appliesModule": "Brigada de Emergencias",
    "order": 52
  },
  {
    "code": "6.1.1",
    "cycle": "VERIFICAR",
    "standard": "VERIFICACIÓN DEL SG-SST (5%)",
    "standardItem": "Indicadores, estructura, proceso y resultado",
    "value": 1.25,
    "percentageWeight": 5,
    "possibleScore": 1.25,
    "action": "Definir y medir indicadores del SG-SST.",
    "appliesModule": "Objetivos SST",
    "order": 53
  },
  {
    "code": "6.1.2",
    "cycle": "VERIFICAR",
    "standard": "VERIFICACIÓN DEL SG-SST (5%)",
    "standardItem": "Auditoría anual",
    "value": 1.25,
    "percentageWeight": 5,
    "possibleScore": 1.25,
    "action": "Planificar auditoría anual y registrar hallazgos.",
    "appliesModule": "Auditorías",
    "order": 54
  },
  {
    "code": "6.1.3",
    "cycle": "VERIFICAR",
    "standard": "VERIFICACIÓN DEL SG-SST (5%)",
    "standardItem": "Revisión por la alta dirección",
    "value": 1.25,
    "percentageWeight": 5,
    "possibleScore": 1.25,
    "action": "Registrar revisión por la dirección y compromisos.",
    "appliesModule": "Novedades Laborales",
    "order": 55
  },
  {
    "code": "6.1.4",
    "cycle": "VERIFICAR",
    "standard": "VERIFICACIÓN DEL SG-SST (5%)",
    "standardItem": "Planificación de auditoría con el COPASST",
    "value": 1.25,
    "percentageWeight": 5,
    "possibleScore": 1.25,
    "action": "Vincular COPASST a la planeación de auditoría.",
    "appliesModule": "Gestión de Comités",
    "order": 56
  },
  {
    "code": "7.1.1",
    "cycle": "ACTUAR",
    "standard": "MEJORAMIENTO (10%)",
    "standardItem": "Acciones preventivas y correctivas con base en resultados del SG-SST",
    "value": 2.5,
    "percentageWeight": 10,
    "possibleScore": 2.5,
    "action": "Crear ACPM derivado del hallazgo.",
    "appliesModule": "ACPM",
    "order": 57
  },
  {
    "code": "7.1.2",
    "cycle": "ACTUAR",
    "standard": "MEJORAMIENTO (10%)",
    "standardItem": "Acciones de mejora conforme a investigación de incidentes, accidentes y enfermedades laborales",
    "value": 2.5,
    "percentageWeight": 10,
    "possibleScore": 2.5,
    "action": "Relacionar acciones de mejora a investigaciones laborales.",
    "appliesModule": "Investigaciones",
    "order": 58
  },
  {
    "code": "7.1.3",
    "cycle": "ACTUAR",
    "standard": "MEJORAMIENTO (10%)",
    "standardItem": "Acciones de mejora con base en inspecciones y recomendaciones",
    "value": 2.5,
    "percentageWeight": 10,
    "possibleScore": 2.5,
    "action": "Registrar ACPM o medida preventiva según inspección.",
    "appliesModule": "ACPM",
    "order": 59
  },
  {
    "code": "7.1.4",
    "cycle": "ACTUAR",
    "standard": "MEJORAMIENTO (10%)",
    "standardItem": "Plan de mejoramiento",
    "value": 2.5,
    "percentageWeight": 10,
    "possibleScore": 2.5,
    "action": "Consolidar plan de mejora con responsables y fechas.",
    "appliesModule": "Plan de Trabajo",
    "order": 60
  }
]
```

### Validacion del seed

Al finalizar, `GET /api/initial-evaluations/catalogs/standard-items?status=ACTIVE` debe retornar los 60 items, desde `1.1.1` hasta `7.1.4`. Cada registro debe tener su UUID real de base de datos en `id`; el frontend enviara ese UUID como `standardItemId` al crear o editar una evaluacion.

## 4. Entidades sugeridas

### 4.1 InitialEvaluationStandardItem

Catalogo de estandares minimos.

```ts
type InitialEvaluationStandardItem = {
  id: string
  code: string
  cycle: "PLANEAR" | "HACER" | "VERIFICAR" | "ACTUAR"
  standard: string
  standardItem: string
  value: number
  percentageWeight: number
  possibleScore: number
  action: string
  appliesModule: string
  order: number
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}
```

Notas:

- `code` debe conservar valores como `1.1.1`, `2.4.1`, `7.1.4`.
- `order` permite mantener el orden legal/visual de la tabla.
- Este catalogo puede ser global, no necesariamente por empresa.

### 4.2 InitialEvaluation

Registro principal de una evaluacion.

```ts
type InitialEvaluation = {
  id: string
  companyId: string
  name: string
  year: number
  date: string
  responsible: string
  observations?: string | null
  totalScore: number
  totalPossible: number
  totalPercentage: number
  findingsCount: number
  status: "DRAFT" | "COMPLETED" | "SIGNED" | "INACTIVE"
  createdAt: string
  updatedAt: string
  createdByUserId: string
  updatedByUserId?: string | null
}
```

### 4.3 InitialEvaluationAnswer

Respuesta por item.

```ts
type InitialEvaluationAnswer = {
  id: string
  evaluationId: string
  standardItemId: string
  compliance: "COMPLIES" | "DOES_NOT_COMPLY" | "NOT_APPLICABLE"
  score: number
  observation?: string | null
  createdAt: string
  updatedAt: string
}
```

Regla de puntaje actual del frontend:

- `COMPLIES`: otorga el `possibleScore` completo.
- `NOT_APPLICABLE`: otorga el `possibleScore` completo.
- `DOES_NOT_COMPLY`: otorga `0`.

### 4.4 InitialEvaluationDocument

Documento generado o cargado para soporte.

Puede reutilizar el patron de documentos de SafeCloud.

```ts
type InitialEvaluationDocument = {
  id: string
  companyId: string
  evaluationId: string
  type: "INITIAL_EVALUATION"
  originalName: string
  mimeType: string
  size: number
  storageProvider: "LOCAL" | "DIGITAL_OCEAN"
  downloadUrl: string
  isConfirmed: boolean
  createdAt: string
  createdBy: string
}
```

## 5. Enums

### Cycle

```ts
enum InitialEvaluationCycle {
  PLANEAR = "PLANEAR",
  HACER = "HACER",
  VERIFICAR = "VERIFICAR",
  ACTUAR = "ACTUAR",
}
```

### Compliance

```ts
enum InitialEvaluationCompliance {
  COMPLIES = "COMPLIES",
  DOES_NOT_COMPLY = "DOES_NOT_COMPLY",
  NOT_APPLICABLE = "NOT_APPLICABLE",
}
```

Labels frontend:

- `COMPLIES`: Cumple totalmente
- `DOES_NOT_COMPLY`: No cumple
- `NOT_APPLICABLE`: No aplica

### Status

```ts
enum InitialEvaluationStatus {
  DRAFT = "DRAFT",
  COMPLETED = "COMPLETED",
  SIGNED = "SIGNED",
  INACTIVE = "INACTIVE",
}
```

Labels sugeridos:

- `DRAFT`: Borrador
- `COMPLETED`: Completada
- `SIGNED`: Firmada
- `INACTIVE`: Inactiva

## 6. Endpoints requeridos

Todos los endpoints administrativos requieren JWT Bearer y deben validar `companyId` del usuario autenticado.

### 6.1 Listar catalogo de estandares

`GET /api/initial-evaluations/catalogs/standard-items`

Query params opcionales:

- `cycle`
- `search`
- `status`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "uuid",
      "code": "1.1.1",
      "cycle": "PLANEAR",
      "standard": "RECURSOS (10%)",
      "standardItem": "Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST",
      "value": 0.5,
      "percentageWeight": 4,
      "possibleScore": 0.5,
      "action": "Designar responsable SG-SST y conservar soporte documental.",
      "appliesModule": "Responsable SG-SST",
      "order": 1,
      "status": "ACTIVE"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations/catalogs/standard-items",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 6.2 Crear evaluacion inicial

`POST /api/initial-evaluations`

Request body:

```json
{
  "name": "Evaluación inicial SG-SST 2026",
  "year": 2026,
  "date": "2026-01-18",
  "responsible": "Responsable SG-SST",
  "observations": "Evaluación inicial realizada con base en estándares mínimos SG-SST.",
  "answers": [
    {
      "standardItemId": "uuid",
      "compliance": "COMPLIES",
      "observation": ""
    },
    {
      "standardItemId": "uuid",
      "compliance": "DOES_NOT_COMPLY",
      "observation": "No se evidencia soporte documental."
    }
  ]
}
```

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "name": "Evaluación inicial SG-SST 2026",
    "year": 2026,
    "date": "2026-01-18",
    "company": {
      "id": "uuid",
      "name": "Empresa Demo S.A.S."
    },
    "responsible": "Responsable SG-SST",
    "observations": "Evaluación inicial realizada con base en estándares mínimos SG-SST.",
    "totalScore": 52,
    "totalPossible": 60,
    "totalPercentage": 86.67,
    "findingsCount": 4,
    "status": "COMPLETED",
    "createdAt": "2026-01-18T09:00:00.000Z",
    "updatedAt": "2026-01-18T09:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

### 6.3 Listar evaluaciones

`GET /api/initial-evaluations`

Query params sugeridos:

- `page`
- `limit`
- `search`
- `year`
- `status`
- `startDate`
- `endDate`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "uuid",
        "companyId": "uuid",
        "name": "Evaluación inicial SG-SST 2026",
        "year": 2026,
        "date": "2026-01-18",
        "company": {
          "id": "uuid",
          "name": "Empresa Demo S.A.S."
        },
        "responsible": "Responsable SG-SST",
        "totalScore": 52,
        "totalPossible": 60,
        "totalPercentage": 86.67,
        "findingsCount": 4,
        "status": "COMPLETED",
        "createdAt": "2026-01-18T09:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 6.4 Ver detalle de evaluacion

`GET /api/initial-evaluations/{id}`

Debe retornar:

- datos generales;
- respuestas completas;
- item del estandar asociado a cada respuesta;
- resultados por ciclo;
- hallazgos;
- documentos asociados.

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "name": "Evaluación inicial SG-SST 2026",
    "year": 2026,
    "date": "2026-01-18",
    "company": {
      "id": "uuid",
      "name": "Empresa Demo S.A.S."
    },
    "responsible": "Responsable SG-SST",
    "observations": "Evaluación inicial realizada con base en estándares mínimos SG-SST.",
    "answers": [
      {
        "id": "uuid",
        "standardItemId": "uuid",
        "standardItem": {
          "id": "uuid",
          "code": "1.1.1",
          "cycle": "PLANEAR",
          "standard": "RECURSOS (10%)",
          "standardItem": "Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST",
          "possibleScore": 0.5,
          "action": "Designar responsable SG-SST y conservar soporte documental.",
          "appliesModule": "Responsable SG-SST"
        },
        "compliance": "COMPLIES",
        "score": 0.5,
        "observation": ""
      }
    ],
    "results": {
      "totalScore": 52,
      "totalPossible": 60,
      "totalPercentage": 86.67,
      "findingsCount": 4,
      "byCycle": [
        {
          "cycle": "PLANEAR",
          "score": 22,
          "possible": 25,
          "percentage": 88
        }
      ]
    },
    "documents": [],
    "status": "COMPLETED",
    "createdAt": "2026-01-18T09:00:00.000Z",
    "updatedAt": "2026-01-18T09:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations/uuid",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 6.5 Actualizar evaluacion

`PUT /api/initial-evaluations/{id}`

Request body:

```json
{
  "name": "Evaluación inicial SG-SST 2026",
  "year": 2026,
  "date": "2026-01-18",
  "responsible": "Responsable SG-SST",
  "observations": "Observaciones actualizadas.",
  "answers": [
    {
      "standardItemId": "uuid",
      "compliance": "NOT_APPLICABLE",
      "observation": "No aplica para la actividad económica actual."
    }
  ]
}
```

Reglas:

- Recalcular puntaje total, porcentaje y hallazgos al actualizar.
- No permitir modificar una evaluacion `SIGNED`, salvo permiso especial.
- No aceptar `companyId` desde frontend.

### 6.6 Cambiar estado

`PUT /api/initial-evaluations/change-status/{id}`

Request body:

```json
{
  "status": "INACTIVE"
}
```

### 6.7 Eliminar evaluacion

`DELETE /api/initial-evaluations/{id}`

Recomendado: eliminacion logica con `status = INACTIVE`, conservando respuestas y documentos para auditoria.

## 7. Hallazgos

Los hallazgos se calculan a partir de los items cuya respuesta sea:

`DOES_NOT_COMPLY`

Endpoint sugerido:

`GET /api/initial-evaluations/{id}/findings`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "standardItemId": "uuid",
      "code": "3.2.2",
      "cycle": "HACER",
      "standard": "GESTIÓN DE LA SALUD (20%)",
      "standardItem": "Investigación de incidentes, accidentes y enfermedades laborales",
      "lostScore": 2,
      "action": "Crear investigación con acciones y trazabilidad.",
      "appliesModule": "Investigaciones",
      "observation": "No se evidencia investigación documentada."
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations/uuid/findings",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

## 8. Resumen y metricas

Para las tarjetas superiores y graficas futuras.

`GET /api/initial-evaluations/summary`

Query params opcionales:

- `year`
- `startDate`
- `endDate`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "evaluations": 3,
    "latestEvaluationId": "uuid",
    "latestScore": 52,
    "latestTotalPossible": 60,
    "latestCompliancePercentage": 86.67,
    "latestFindings": 4,
    "byCycle": [
      {
        "cycle": "PLANEAR",
        "score": 22,
        "possible": 25,
        "percentage": 88
      },
      {
        "cycle": "HACER",
        "score": 18,
        "possible": 20,
        "percentage": 90
      }
    ]
  },
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations/summary",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

## 9. Generacion de PDF

Actualmente el frontend genera el PDF con:

- `jsPDF`
- `jspdf-autotable`

El PDF contiene:

- titulo: Evaluacion Inicial - Estandares Minimos SG-SST;
- referencia a Resolucion 0312 de 2019;
- datos generales;
- tabla completa de estandares;
- calificacion por item;
- hoja de hallazgos y plan de mejora;
- lineas de firma para empleador o contratante y responsable SG-SST.

Endpoint recomendado:

`GET /api/initial-evaluations/{id}/pdf`

Response:

- `application/pdf`
- nombre sugerido: `evaluacion-inicial-sg-sst-{year}.pdf`

Alternativa:

`POST /api/initial-evaluations/{id}/generate-pdf`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "documentId": "uuid",
    "downloadUrl": "string",
    "generatedAt": "2026-01-18T09:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations/uuid/generate-pdf",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

## 10. Documentos de soporte

La evaluacion inicial puede requerir cargar PDF firmado o evidencias.

### 10.1 Subir documento

`POST /api/initial-evaluations/{initialEvaluationId}/documents`

Content-Type: `multipart/form-data`

Request body:

```txt
file: binary requerido
type: INITIAL_EVALUATION
isConfirmed: true
```

### 10.2 Listar documentos

`GET /api/initial-evaluations/{initialEvaluationId}/documents`

### 10.3 Ver documento

`GET /api/initial-evaluations/{initialEvaluationId}/documents/{documentId}`

### 10.4 Eliminar documento

`DELETE /api/initial-evaluations/{initialEvaluationId}/documents/{documentId}`

Response base:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "ownerType": "COMPANY",
    "ownerId": "uuid",
    "referenceType": "INITIAL_EVALUATION",
    "referenceId": "uuid",
    "type": "INITIAL_EVALUATION",
    "originalName": "evaluacion-inicial-firmada.pdf",
    "mimeType": "application/pdf",
    "size": 250000,
    "storageProvider": "DIGITAL_OCEAN",
    "isConfirmed": true,
    "downloadUrl": "string",
    "createdAt": "2026-01-18T09:00:00.000Z",
    "createdBy": "uuid"
  },
  "errors": null,
  "meta": {
    "path": "/api/initial-evaluations/uuid/documents",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

## 11. Calculos backend

Backend debe calcular y persistir o retornar:

```ts
totalScore = sum(score por respuesta)
totalPossible = sum(possibleScore de todos los items activos)
totalPercentage = (totalScore / totalPossible) * 100
findings = answers donde compliance === "DOES_NOT_COMPLY"
```

Puntaje por respuesta:

```ts
if compliance === "COMPLIES" => score = possibleScore
if compliance === "NOT_APPLICABLE" => score = possibleScore
if compliance === "DOES_NOT_COMPLY" => score = 0
```

Cumplimiento por ciclo:

```ts
cycleScore = sum(score de respuestas del ciclo)
cyclePossible = sum(possibleScore de items del ciclo)
cyclePercentage = (cycleScore / cyclePossible) * 100
```

## 12. Validaciones backend

Crear/actualizar evaluacion:

- `name` requerido.
- `year` requerido, entero, minimo 2019.
- `date` requerida y fecha valida.
- `responsible` requerido.
- `answers` requerido.
- Cada `standardItemId` debe existir y estar activo.
- `compliance` debe ser enum valido.
- No aceptar `company` como texto desde frontend para persistencia principal; usar empresa del usuario autenticado.
- No aceptar `totalScore`, `totalPossible`, `totalPercentage` desde frontend. Backend debe calcularlos.

Validaciones recomendadas:

- No permitir dos evaluaciones activas con el mismo `year` para la misma empresa, salvo que se permita versionamiento.
- Si se permite versionamiento, agregar `version` o `revision`.
- Si una evaluacion esta firmada, bloquear edicion ordinaria.

## 13. Reglas de negocio

- La evaluacion se diligencia por empresa.
- Los estandares son globales.
- Los hallazgos se generan automaticamente cuando un item queda en `DOES_NOT_COMPLY`.
- Cada hallazgo debe conservar la accion sugerida y modulo aplicable del catalogo en el momento de la evaluacion.
- Se recomienda guardar snapshot del texto del item al momento de responder, para auditoria si el catalogo cambia luego.
- La ultima evaluacion registrada alimenta las tarjetas superiores del frontend.
- El PDF debe representar exactamente las respuestas guardadas.

## 14. Snapshot recomendado

Para evitar que cambios futuros en el catalogo alteren evaluaciones historicas, cada respuesta puede guardar snapshot:

```ts
type InitialEvaluationAnswerSnapshot = {
  standardItemCode: string
  cycle: string
  standard: string
  standardItem: string
  possibleScore: number
  percentageWeight: number
  action: string
  appliesModule: string
}
```

## 15. Permisos sugeridos

Agregar permisos:

- Ver evaluacion inicial
- Crear evaluacion inicial
- Editar evaluacion inicial
- Eliminar evaluacion inicial
- Descargar evaluacion inicial
- Cargar soporte evaluacion inicial

Modulo hijo:

- `INITIAL_EVALUATION`

## 16. Multiempresa y seguridad

- Todas las consultas deben filtrar por `companyId`.
- No aceptar `companyId` desde frontend.
- No permitir consultar o descargar evaluaciones de otra empresa.
- Validar permisos por accion.
- Registrar `createdByUserId` y `updatedByUserId`.
- Documentos deben validar pertenencia a la evaluacion y a la empresa.
- El PDF solo debe generarse para evaluaciones de la empresa autenticada.

## 17. Respuesta de errores recomendada

```json
{
  "ok": false,
  "message": "Validacion fallida",
  "data": null,
  "errors": [
    {
      "message": "Ingresa el nombre de la evaluación"
    }
  ],
  "meta": {
    "path": "/api/initial-evaluations",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 400
  }
}
```

## 18. Servicios frontend integrados

- `services/initialEvaluationService.ts`
- `types/manager/initial-evaluation.ts`

Funciones sugeridas:

```ts
listInitialEvaluationStandardItems(filters)
listInitialEvaluations(filters)
getInitialEvaluation(id)
createInitialEvaluation(payload)
updateInitialEvaluation(id, payload)
changeInitialEvaluationStatus(id, status)
deleteInitialEvaluation(id)
getInitialEvaluationFindings(id)
getInitialEvaluationSummary(filters)
downloadInitialEvaluationPdf(id)
uploadInitialEvaluationDocument(initialEvaluationId, formData)
listInitialEvaluationDocuments(initialEvaluationId)
deleteInitialEvaluationDocument(initialEvaluationId, documentId)
```

## 19. Verificaciones para completar la integracion

1. Ejecutar el seed completo de los 60 items incluido en este contrato.
2. Confirmar que el endpoint del catalogo devuelve 60 registros activos y ordenados.
3. Confirmar que cada registro devuelve un UUID real en `id`.
4. Verificar que la suma de `possibleScore` sea exactamente 100.
5. Probar creacion y edicion enviando las 60 respuestas.
6. Mantener snapshot de los datos del estandar en cada respuesta historica.
7. Agregar y validar permisos por accion si aun no existen.
