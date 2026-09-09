# Contract backend - Modulo hijo Rendicion de Cuentas

## 1. Ubicacion actual en frontend

- Ruta: `/dashboard/accountability`
- Archivo principal: `app/dashboard/accountability/page.tsx`
- Modulo padre actual en navegacion: `Gestion del SG-SST`
- Codigo de modulo hijo usado en navegacion: `ACCOUNTABILITY`
- Estado actual: implementacion funcional mockeada en frontend con `useState`.

La pantalla actual permite:

- crear una rendicion de cuentas anual;
- seleccionar vigencia;
- seleccionar fecha de rendicion;
- mostrar responsable SG-SST automatico;
- seleccionar representante legal;
- elegir tipo de ejecucion manual o automatica;
- generar resultados automaticos mockeados;
- consultar detalle;
- descargar PDF para firma;
- cargar documento firmado de forma simulada;
- ver estado mediante badge;
- alternar vista tarjetas/lista;
- buscar por vigencia, responsable, representante, tipo o estado.

## 2. Objetivo del modulo

Permitir registrar y conservar la rendicion de cuentas anual del SG-SST, consolidando la informacion principal de la gestion de la vigencia y generando un documento descargable para firma y archivo.

El modulo debe soportar dos tipos de ejecucion:

- `MANUAL`: se crea el registro y se carga el documento firmado/manual.
- `AUTOMATIC`: el sistema consolida indicadores de otros modulos para generar el documento automaticamente.

## 3. Flujo funcional actual

1. El usuario hace clic en `Nueva rendicion`.
2. Selecciona el ano o vigencia.
3. Selecciona fecha de rendicion.
4. El responsable SG-SST aparece automatico.
5. Selecciona representante legal.
6. Selecciona ejecucion `Manual` o `Automatica`.
7. Si es automatica, el sistema genera indicadores de la vigencia.
8. Se crea el registro en estado `PENDING_DOCUMENT`.
9. El usuario puede descargar PDF para firma.
10. Luego carga el documento firmado.
11. El registro pasa a `DOCUMENT_UPLOADED`.

## 4. Entidades sugeridas

### 4.1 AccountabilityReport

Entidad principal.

```ts
type AccountabilityReport = {
  id: string
  companyId: string
  year: number
  renditionDate: string
  sgiResponsibleEmployeeId?: string | null
  sgiResponsibleName: string
  legalRepresentativeEmployeeId?: string | null
  legalRepresentativeName: string
  executionType: "MANUAL" | "AUTOMATIC"
  status: "PENDING_DOCUMENT" | "DOCUMENT_UPLOADED" | "SIGNED" | "INACTIVE"
  observations?: string | null
  annualPlanExecution: number
  trainingsCompleted: number
  trainingsPlanned: number
  accidentsReported: number
  copasstMeetings: number
  riskMatrixUpdated: boolean
  preventiveMeasuresImplementation: number
  generatedDocumentId?: string | null
  signedDocumentId?: string | null
  createdAt: string
  updatedAt: string
  createdByUserId: string
  updatedByUserId?: string | null
}
```

### 4.2 AccountabilityReportDocument

Puede reutilizar el patron actual de documentos de SafeCloud.

```ts
type AccountabilityReportDocument = {
  id: string
  companyId: string
  accountabilityReportId: string
  type: "ACCOUNTABILITY_REPORT" | "ACCOUNTABILITY_SIGNED_REPORT"
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

### 4.3 AccountabilityReportIndicatorSnapshot

Opcional pero recomendado para auditoria. Permite conservar de donde salio cada indicador automatico.

```ts
type AccountabilityReportIndicatorSnapshot = {
  id: string
  accountabilityReportId: string
  key:
    | "ANNUAL_PLAN_EXECUTION"
    | "TRAININGS"
    | "ACCIDENTS"
    | "COPASST_MEETINGS"
    | "RISK_MATRIX"
    | "PREVENTIVE_MEASURES"
  label: string
  value: string
  numericValue?: number | null
  sourceModule: string
  sourceMetadata?: Record<string, unknown> | null
  createdAt: string
}
```

## 5. Enums

### ExecutionType

```ts
enum AccountabilityExecutionType {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
}
```

Labels frontend:

- `MANUAL`: Manual
- `AUTOMATIC`: Automatico

### AccountabilityStatus

```ts
enum AccountabilityStatus {
  PENDING_DOCUMENT = "PENDING_DOCUMENT",
  DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
  SIGNED = "SIGNED",
  INACTIVE = "INACTIVE",
}
```

Labels frontend:

- `PENDING_DOCUMENT`: Pendiente documento
- `DOCUMENT_UPLOADED`: Documento cargado
- `SIGNED`: Firmada
- `INACTIVE`: Inactiva

## 6. Indicadores automaticos requeridos

Cuando `executionType = AUTOMATIC`, backend debe consolidar la informacion de la vigencia seleccionada.

Indicadores actuales:

```ts
type AccountabilityResult = {
  annualPlanExecution: number
  trainingsCompleted: number
  trainingsPlanned: number
  accidentsReported: number
  copasstMeetings: number
  riskMatrixUpdated: boolean
  preventiveMeasuresImplementation: number
}
```

Resultado visual:

- Plan anual: `82% ejecutado`
- Capacitaciones: `24 de 30 realizadas`
- Accidentes: `3 reportados`
- COPASST: `10 reuniones realizadas`
- Matriz de riesgos: `actualizada`
- Medidas de prevencion: `75% implementadas`

Fuentes sugeridas:

- Plan anual: modulo `WORK_PLAN`
- Capacitaciones: modulo `TRAINING`
- Accidentes/Novedades: modulo `INCIDENTS`
- COPASST/Reuniones: modulos `COMMITTEE_MANAGEMENT` y `MEETINGS`
- Matriz de riesgos: modulo `LABOR` o matriz de riesgos
- Medidas de prevencion: modulo `PREVENTIVE_MEASURES`

## 7. Endpoints requeridos

Todos los endpoints administrativos requieren JWT Bearer y deben validar `companyId` del usuario autenticado.

### 7.1 Crear rendicion de cuentas

`POST /api/accountability-reports`

Request body:

```json
{
  "year": 2026,
  "renditionDate": "2026-12-20",
  "sgiResponsibleEmployeeId": "uuid opcional",
  "legalRepresentativeEmployeeId": "uuid opcional",
  "legalRepresentativeName": "Carlos Rodriguez",
  "executionType": "AUTOMATIC",
  "observations": "Rendición consolidada con base en los módulos del SG-SST."
}
```

Notas:

- `sgiResponsibleEmployeeId` puede resolverse automaticamente desde el responsable SG-SST configurado.
- Si no existe empleado para representante legal, permitir `legalRepresentativeName`.
- Si `executionType = AUTOMATIC`, backend debe calcular indicadores.
- Si `executionType = MANUAL`, backend puede crear los indicadores en cero o permitir que queden nulos, segun definicion final.

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "year": 2026,
    "renditionDate": "2026-12-20",
    "sgiResponsibleEmployeeId": "uuid",
    "sgiResponsibleName": "Responsable SG-SST",
    "legalRepresentativeEmployeeId": "uuid",
    "legalRepresentativeName": "Carlos Rodriguez",
    "executionType": "AUTOMATIC",
    "status": "PENDING_DOCUMENT",
    "observations": "Rendición consolidada con base en los módulos del SG-SST.",
    "result": {
      "annualPlanExecution": 82,
      "trainingsCompleted": 24,
      "trainingsPlanned": 30,
      "accidentsReported": 3,
      "copasstMeetings": 10,
      "riskMatrixUpdated": true,
      "preventiveMeasuresImplementation": 75
    },
    "document": null,
    "createdAt": "2026-12-20T14:00:00.000Z",
    "updatedAt": "2026-12-20T14:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/accountability-reports",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

### 7.2 Listar rendiciones

`GET /api/accountability-reports`

Query params sugeridos:

- `page`
- `limit`
- `search`
- `year`
- `executionType`: `MANUAL`, `AUTOMATIC`
- `status`: `PENDING_DOCUMENT`, `DOCUMENT_UPLOADED`, `SIGNED`, `INACTIVE`
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
        "year": 2026,
        "renditionDate": "2026-12-20",
        "sgiResponsibleName": "Responsable SG-SST",
        "legalRepresentativeName": "Carlos Rodriguez",
        "executionType": "AUTOMATIC",
        "status": "DOCUMENT_UPLOADED",
        "result": {
          "annualPlanExecution": 82,
          "trainingsCompleted": 24,
          "trainingsPlanned": 30,
          "accidentsReported": 3,
          "copasstMeetings": 10,
          "riskMatrixUpdated": true,
          "preventiveMeasuresImplementation": 75
        },
        "document": {
          "id": "uuid",
          "fileName": "rendicion-cuentas-2026-firmada.pdf",
          "uploadedAt": "2026-12-21T09:30:00.000Z",
          "isConfirmed": true
        },
        "createdAt": "2026-12-20T14:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/accountability-reports",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 7.3 Ver detalle

`GET /api/accountability-reports/{id}`

Debe retornar:

- informacion general;
- indicadores consolidados;
- documento generado;
- documento firmado;
- snapshots de indicadores, si existen.

### 7.4 Actualizar rendicion

`PUT /api/accountability-reports/{id}`

Request body:

```json
{
  "year": 2026,
  "renditionDate": "2026-12-20",
  "sgiResponsibleEmployeeId": "uuid opcional",
  "legalRepresentativeEmployeeId": "uuid opcional",
  "legalRepresentativeName": "Carlos Rodriguez",
  "executionType": "AUTOMATIC",
  "observations": "Observaciones actualizadas."
}
```

Reglas:

- Si cambia `year` o `executionType` y es automatico, recalcular indicadores.
- Si ya esta `SIGNED`, no permitir editar salvo permiso especial.
- No aceptar `companyId` desde frontend.

### 7.5 Cambiar estado

`PUT /api/accountability-reports/change-status/{id}`

Request body:

```json
{
  "status": "INACTIVE"
}
```

### 7.6 Eliminar rendicion

`DELETE /api/accountability-reports/{id}`

Recomendado: eliminacion logica con `status = INACTIVE`, conservando documentos e indicadores para auditoria.

## 8. Recalcular indicadores automaticos

Endpoint recomendado:

`POST /api/accountability-reports/{id}/recalculate`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "year": 2026,
    "result": {
      "annualPlanExecution": 82,
      "trainingsCompleted": 24,
      "trainingsPlanned": 30,
      "accidentsReported": 3,
      "copasstMeetings": 10,
      "riskMatrixUpdated": true,
      "preventiveMeasuresImplementation": 75
    },
    "updatedAt": "2026-12-20T14:10:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/accountability-reports/uuid/recalculate",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

## 9. PDF generado por el sistema

Actualmente el frontend genera el PDF con:

- `jsPDF`
- `jspdf-autotable`

El PDF contiene:

- titulo: Rendicion de Cuentas SG-SST;
- vigencia;
- fecha;
- tipo de ejecucion;
- responsable SG-SST;
- representante legal;
- estado;
- documento soporte;
- tabla de indicadores;
- observaciones;
- lineas de firma para responsable SG-SST y representante legal.

Endpoint recomendado:

`GET /api/accountability-reports/{id}/pdf`

Response:

- `application/pdf`
- nombre sugerido: `rendicion-cuentas-sg-sst-{year}.pdf`

Alternativa para guardar PDF generado:

`POST /api/accountability-reports/{id}/generate-pdf`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "documentId": "uuid",
    "downloadUrl": "string",
    "generatedAt": "2026-12-20T14:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/accountability-reports/uuid/generate-pdf",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

## 10. Documentos firmados

La rendicion debe permitir cargar el documento firmado.

### 10.1 Subir documento firmado

`POST /api/accountability-reports/{accountabilityReportId}/documents`

Content-Type: `multipart/form-data`

Request body:

```txt
file: binary requerido
type: ACCOUNTABILITY_SIGNED_REPORT
isConfirmed: true
```

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "ownerType": "COMPANY",
    "ownerId": "uuid",
    "referenceType": "ACCOUNTABILITY_REPORT",
    "referenceId": "uuid",
    "type": "ACCOUNTABILITY_SIGNED_REPORT",
    "originalName": "rendicion-cuentas-2026-firmada.pdf",
    "mimeType": "application/pdf",
    "size": 250000,
    "storageProvider": "DIGITAL_OCEAN",
    "isConfirmed": true,
    "downloadUrl": "string",
    "createdAt": "2026-12-21T09:30:00.000Z",
    "createdBy": "uuid"
  },
  "errors": null,
  "meta": {
    "path": "/api/accountability-reports/uuid/documents",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

Regla:

- Al cargar documento con `isConfirmed = true`, actualizar estado a `DOCUMENT_UPLOADED`.

### 10.2 Listar documentos

`GET /api/accountability-reports/{accountabilityReportId}/documents`

### 10.3 Ver documento

`GET /api/accountability-reports/{accountabilityReportId}/documents/{documentId}`

### 10.4 Eliminar documento

`DELETE /api/accountability-reports/{accountabilityReportId}/documents/{documentId}`

Reglas:

- Validar que el documento pertenezca a la rendicion y a la empresa.
- Si se elimina el documento firmado principal, devolver estado a `PENDING_DOCUMENT`.

## 11. Endpoints de soporte para selects

### Responsable SG-SST

Puede usar endpoint existente:

`GET /api/employee/sgi-responsible`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "name": "Laura",
    "lastName": "Martinez",
    "email": "laura@example.com"
  },
  "errors": null,
  "meta": {
    "path": "/api/employee/sgi-responsible",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### Representantes legales

Si backend maneja representante legal en company:

`GET /api/company/me`

Si se maneja como usuario/empleado:

`GET /api/employee/options?role=LEGAL_REPRESENTATIVE`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "uuid",
      "name": "Carlos",
      "lastName": "Rodriguez",
      "email": "carlos@example.com"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/employee/options",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

## 12. Validaciones backend

Crear/actualizar:

- `year` requerido, entero, minimo 2019.
- `renditionDate` requerida.
- `executionType` requerido y enum valido.
- `legalRepresentativeEmployeeId` o `legalRepresentativeName` requerido.
- Responsable SG-SST requerido, puede resolverse automaticamente.
- No permitir dos rendiciones activas para la misma empresa y misma vigencia.
- Si `executionType = AUTOMATIC`, calcular indicadores desde backend.
- No aceptar indicadores calculados desde frontend en modo automatico.
- No aceptar `companyId` desde frontend.

Documentos:

- `file` requerido.
- Validar tipo de archivo permitido.
- Validar tamano maximo.
- Validar pertenencia de rendicion a la empresa.

## 13. Reglas de negocio

- La rendicion de cuentas es anual.
- Debe existir una sola rendicion activa por empresa y vigencia.
- El modo automatico consolida indicadores de otros modulos.
- El modo manual crea el registro para que el usuario cargue el documento firmado.
- El PDF generado debe representar los datos guardados.
- Cargar documento firmado no debe eliminar el PDF generado por el sistema.
- Los indicadores calculados deben conservarse como snapshot para auditoria.
- Las fechas deben guardarse en UTC y mostrarse en America/Bogota.

## 14. Calculo de indicadores automaticos

Backend debe definir el calculo final. Propuesta:

### Plan anual

Modulo fuente: Plan de Trabajo.

```txt
annualPlanExecution = promedio o porcentaje de actividades ejecutadas de la vigencia
```

### Capacitaciones

Modulo fuente: Capacitaciones.

```txt
trainingsPlanned = total de capacitaciones programadas en la vigencia
trainingsCompleted = total de capacitaciones finalizadas o realizadas
```

### Accidentes

Modulo fuente: Novedades Laborales.

```txt
accidentsReported = total con type = ACCIDENTE en la vigencia
```

### COPASST

Modulo fuente: Comites/Reuniones.

```txt
copasstMeetings = total de reuniones del comite COPASST en la vigencia
```

### Matriz de riesgos

Modulo fuente: Riesgos Laborales.

```txt
riskMatrixUpdated = true si existe matriz o riesgos actualizados en la vigencia
```

### Medidas de prevencion

Modulo fuente: Medidas de Prevencion.

```txt
preventiveMeasuresImplementation = porcentaje de medidas en estado DONE o FINALIZADO
```

## 15. Permisos sugeridos

Agregar permisos:

- Ver rendicion de cuentas
- Crear rendicion de cuentas
- Editar rendicion de cuentas
- Eliminar rendicion de cuentas
- Descargar rendicion de cuentas
- Cargar soporte rendicion de cuentas
- Recalcular indicadores rendicion de cuentas

Modulo hijo:

- `ACCOUNTABILITY`

## 16. Multiempresa y seguridad

- Todas las consultas deben filtrar por `companyId`.
- No aceptar `companyId` desde frontend.
- Validar que responsable y representante legal pertenezcan a la misma empresa cuando sean empleados.
- Validar que documentos pertenezcan a la rendicion y a la empresa.
- Evitar IDOR en detalle, PDF y documentos.
- Registrar `createdByUserId`, `updatedByUserId` y `uploadedByUserId`.
- Los indicadores deben calcularse solo con datos de la empresa autenticada.

## 17. Respuesta de errores recomendada

```json
{
  "ok": false,
  "message": "Validacion fallida",
  "data": null,
  "errors": [
    {
      "message": "Ya existe una rendicion de cuentas activa para la vigencia 2026"
    }
  ],
  "meta": {
    "path": "/api/accountability-reports",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 400
  }
}
```

## 18. Servicios frontend a crear cuando exista backend

- `services/accountabilityService.ts`
- `types/manager/accountability.ts`

Funciones sugeridas:

```ts
listAccountabilityReports(filters)
getAccountabilityReport(id)
createAccountabilityReport(payload)
updateAccountabilityReport(id, payload)
changeAccountabilityReportStatus(id, status)
deleteAccountabilityReport(id)
recalculateAccountabilityReport(id)
downloadAccountabilityReportPdf(id)
uploadAccountabilityReportDocument(accountabilityReportId, formData)
listAccountabilityReportDocuments(accountabilityReportId)
deleteAccountabilityReportDocument(accountabilityReportId, documentId)
getAccountabilitySummary(filters)
```

## 19. Ajustes frontend pendientes cuando backend este listo

1. Reemplazar `initialAccountabilities` por `GET /api/accountability-reports`.
2. Reemplazar representantes legales mockeados por endpoint real.
3. Reemplazar responsable SG-SST quemado por `GET /api/employee/sgi-responsible`.
4. Enviar creacion real mediante `POST /api/accountability-reports`.
5. Conectar indicadores automaticos calculados desde backend.
6. Conectar descarga PDF real o conservar PDF frontend segun decision tecnica.
7. Reemplazar carga simulada por `multipart/form-data`.
8. Agregar vista/preview de documento cargado usando componente comun de documentos.
9. Agregar permisos por accion.
10. Agregar filtros por vigencia, estado y tipo de ejecucion.
