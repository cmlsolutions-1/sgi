# Contract backend - Modulo hijo Evaluacion Inicial

## 1. Ubicacion actual en frontend

- Ruta: `/dashboard/initial-evaluation`
- Archivo principal: `app/dashboard/initial-evaluation/page.tsx`
- Modulo padre actual en navegacion: `Gestion del SG-SST`
- Codigo de modulo hijo usado en navegacion: `INITIAL_EVALUATION`
- Estado actual: implementacion funcional mockeada en frontend con `useState`.

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

## 3. Datos quemados actualmente

El frontend contiene en el archivo `app/dashboard/initial-evaluation/page.tsx` un arreglo local llamado `standardItems`.

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

Estos items representan la tabla de valores y calificacion. Backend debe mover este catalogo a base de datos o a seed controlado para que el frontend pueda consultarlo.

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

## 18. Servicios frontend a crear cuando exista backend

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

## 19. Ajustes frontend pendientes cuando backend este listo

1. Reemplazar `standardItems` local por catalogo del backend.
2. Reemplazar `initialEvaluations` local por `GET /api/initial-evaluations`.
3. Enviar respuestas como arreglo, no como objeto local `Record<string, EvaluationAnswer>`, salvo que backend prefiera recibirlo como mapa.
4. Quitar `company` del formulario o cargarlo automaticamente desde la empresa autenticada.
5. Conectar guardado, edicion y descarga real del PDF.
6. Agregar estados de carga y toasts con mensajes backend.
7. Agregar documentos firmados con el mismo componente visual usado en otros modulos.
8. Agregar permisos por accion.
9. Validar responsive del modal de tabla, ya que la tabla es amplia y debe conservar scroll horizontal.
