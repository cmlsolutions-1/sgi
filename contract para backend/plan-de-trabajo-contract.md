# Contrato frontend/backend - Plan de Trabajo

Este documento describe el contrato requerido para conectar el modulo hijo **Plan de Trabajo** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y estado local, por lo que las actividades, aprobaciones y evidencias firmadas se pierden al recargar.

## Ubicacion en frontend

- Modulo padre: `Planificacion`
- Modulo hijo: `Plan de Trabajo`
- Codigo de modulo: `WORK_PLAN`
- Ruta frontend: `/dashboard/work-plan`
- Archivo principal: `app/dashboard/work-plan/page.tsx`

## Objetivo funcional

Permitir construir el plan anual de trabajo SG-SST, generar un documento PDF para firma del jefe y controlar la aprobacion de las actividades por medio de evidencia firmada.

El modulo contempla:

- creacion de actividades del plan anual;
- consecutivo automatico por vigencia;
- responsable asignado;
- presupuesto;
- evidencia esperada;
- estado de aprobacion;
- seleccion multiple de actividades pendientes;
- generacion de PDF consolidado para firma;
- carga del documento firmado;
- aprobacion masiva de actividades seleccionadas;
- visualizacion y descarga de evidencia firmada.

## Estado actual de implementacion

Todo el modulo esta mockeado en memoria:

- empleados/responsables;
- actividades iniciales;
- creacion de actividades;
- filtros por busqueda, anio y estado;
- seleccion multiple de actividades pendientes;
- generacion de PDF en frontend con `jsPDF` y `jspdf-autotable`;
- aprobacion de actividades seleccionadas;
- carga simulada de archivo firmado;
- descarga simulada de evidencia en `.txt`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### WorkPlanItem

```ts
type WorkPlanItem = {
  id: string
  companyId: string
  consecutive: string
  year: number
  activity: string
  objective: string
  budget: number
  responsibleEmployeeId: string
  responsibleEmployee: {
    id: string
    name: string
    lastName: string
    email?: string
    job?: {
      id: string
      name: string
    } | null
  }
  expectedEvidence: string
  status: WorkPlanStatus
  approvedBy: string | null
  approvedAt: string | null
  signedEvidenceId: string | null
  signedEvidence: WorkPlanDocument | null
  createdAt: string
  updatedAt: string
}
```

### WorkPlanApproval

Representa una aprobacion masiva o individual de actividades del plan.

```ts
type WorkPlanApproval = {
  id: string
  companyId: string
  year: number
  approvedBy: string
  approvedAt: string
  workPlanItemIds: string[]
  documentId: string
  document: WorkPlanDocument
  createdAt: string
  updatedAt: string
}
```

### WorkPlanDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type WorkPlanDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "WORK_PLAN" | "WORK_PLAN_APPROVAL"
  referenceId: string
  type: "WORK_PLAN_SIGNED" | "WORK_PLAN_GENERATED"
  originalName: string
  mimeType: string
  size: number
  storageProvider: "LOCAL" | "DIGITAL_OCEAN_SPACES"
  isConfirmed: boolean
  downloadUrl: string
  createdAt: string
  createdBy: string | null
}
```

## Enums requeridos

```ts
enum WorkPlanStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
}

enum WorkPlanDocumentType {
  WORK_PLAN_GENERATED = 'WORK_PLAN_GENERATED',
  WORK_PLAN_SIGNED = 'WORK_PLAN_SIGNED',
}
```

## Campos del formulario de actividad

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `year` | number | si | Vigencia del plan. Debe ser el anio actual o posterior. |
| `activity` | string | si | Actividad del plan de trabajo. |
| `objective` | string | si | Objetivo de la actividad. |
| `budget` | number | si | Presupuesto en COP. |
| `responsibleId` | uuid | si | Funcionario responsable. |
| `evidence` | string | si | Evidencia esperada para la actividad. |

## Campos de aprobacion

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `workPlanItemIds` | uuid[] | si | Actividades pendientes seleccionadas para aprobar. |
| `approvedBy` | string | si | Nombre del jefe o persona que aprueba. |
| `file` | binary | si | Documento firmado cargado como evidencia. |
| `isConfirmed` | boolean | no | Confirmacion del soporte. |

## Endpoints administrativos

### Crear actividad del plan

`POST /api/work-plan`

Request body:

```json
{
  "year": 2026,
  "activity": "Inspeccion locativa trimestral",
  "objective": "Identificar condiciones inseguras y establecer acciones de mejora.",
  "budget": 850000,
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "expectedEvidence": "Informe de inspeccion con registro fotografico."
}
```

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "consecutive": "PT-2026-001",
    "year": 2026,
    "activity": "Inspeccion locativa trimestral",
    "objective": "Identificar condiciones inseguras y establecer acciones de mejora.",
    "budget": 850000,
    "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "responsibleEmployee": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Laura",
      "lastName": "Martinez",
      "job": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Coordinadora SST"
      }
    },
    "expectedEvidence": "Informe de inspeccion con registro fotografico.",
    "status": "PENDING_APPROVAL",
    "approvedBy": null,
    "approvedAt": null,
    "signedEvidenceId": null,
    "signedEvidence": null,
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/work-plan",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar actividades del plan

`GET /api/work-plan`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por consecutivo, actividad, objetivo o responsable. |
| `year` | number | no | Filtra por vigencia. |
| `status` | enum | no | `PENDING_APPROVAL` o `APPROVED`. |
| `responsibleEmployeeId` | uuid | no | Filtra por responsable. |

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "consecutive": "PT-2026-001",
        "year": 2026,
        "activity": "Inspeccion locativa trimestral",
        "objective": "Identificar condiciones inseguras y establecer acciones de mejora.",
        "budget": 850000,
        "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "responsibleEmployee": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Laura",
          "lastName": "Martinez",
          "job": {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "name": "Coordinadora SST"
          }
        },
        "expectedEvidence": "Informe de inspeccion con registro fotografico.",
        "status": "PENDING_APPROVAL",
        "approvedBy": null,
        "approvedAt": null,
        "signedEvidenceId": null,
        "signedEvidence": null,
        "createdAt": "2026-09-09T15:30:00.000Z",
        "updatedAt": "2026-09-09T15:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/work-plan",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener actividad por ID

`GET /api/work-plan/{id}`

Debe retornar el mismo objeto completo de `WorkPlanItem`.

### Actualizar actividad

`PUT /api/work-plan/{id}`

Request body:

```json
{
  "year": 2026,
  "activity": "Inspeccion locativa trimestral",
  "objective": "Identificar condiciones inseguras y establecer acciones de mejora.",
  "budget": 850000,
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "expectedEvidence": "Informe de inspeccion con registro fotografico."
}
```

Nota: se recomienda permitir edicion solo mientras la actividad este en `PENDING_APPROVAL`, o registrar trazabilidad si se modifica una actividad ya aprobada.

### Eliminar actividad

`DELETE /api/work-plan/{id}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/work-plan/{id}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Generacion de documento para firma

Actualmente el PDF se genera en frontend con las actividades pendientes seleccionadas. El backend puede manejarlo de dos formas:

1. Mantener generacion en frontend y solo subir el firmado.
2. Generar el PDF desde backend para tener trazabilidad y formato centralizado.

Se recomienda la opcion 2 para produccion.

### Generar PDF del plan seleccionado

`POST /api/work-plan/generate-document`

Request body:

```json
{
  "year": 2026,
  "workPlanItemIds": [
    "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  ]
}
```

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "documentId": "string",
    "fileName": "Plan_Trabajo_2026_Pendiente_Aprobacion.pdf",
    "downloadUrl": "string",
    "expiresAt": "2026-09-09T16:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/work-plan/generate-document",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

Contenido esperado del PDF:

- encabezado `PLAN ANUAL DE TRABAJO SG-SST`;
- vigencia;
- fecha de generacion;
- alcance del documento;
- tabla con actividades seleccionadas;
- responsable;
- presupuesto;
- evidencia esperada;
- seccion de revision y aprobacion;
- espacio para nombre y firma del jefe;
- paginacion.

## Aprobacion y carga de documento firmado

### Aprobar actividades seleccionadas

`POST /api/work-plan/approve`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `workPlanItemIds` | string[] | si | IDs de actividades pendientes seleccionadas. |
| `approvedBy` | string | si | Nombre de quien aprueba. |
| `file` | binary | si | PDF firmado. |
| `type` | string | no | Sugerido: `WORK_PLAN_SIGNED`. |
| `isConfirmed` | boolean | no | Confirmacion del documento. |

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "approvalId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "approvedBy": "Ricardo Salazar",
    "approvedAt": "2026-09-09T15:30:00.000Z",
    "approvedItemIds": [
      "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    ],
    "document": {
      "id": "string",
      "companyId": "string",
      "ownerType": "COMPANY",
      "ownerId": "string",
      "referenceType": "WORK_PLAN_APPROVAL",
      "referenceId": "string",
      "type": "WORK_PLAN_SIGNED",
      "originalName": "plan-trabajo-aprobado.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "storageProvider": "DIGITAL_OCEAN_SPACES",
      "isConfirmed": true,
      "downloadUrl": "string",
      "createdAt": "2026-09-09T15:30:00.000Z",
      "createdBy": "string"
    }
  },
  "errors": null,
  "meta": {
    "path": "/api/work-plan/approve",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

Al aprobar, backend debe actualizar cada actividad incluida:

- `status = APPROVED`;
- `approvedBy`;
- `approvedAt`;
- `signedEvidenceId`.

## Documentos del plan de trabajo

### Subir documento a una actividad

Si se prefiere evidencia por actividad individual:

`POST /api/work-plan/{workPlanItemId}/documents`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Documento firmado o soporte. |
| `type` | string | no | `WORK_PLAN_SIGNED` o `WORK_PLAN_GENERATED`. |
| `isConfirmed` | boolean | no | Confirmacion del soporte. |

### Listar documentos de una actividad

`GET /api/work-plan/{workPlanItemId}/documents`

### Obtener documento

`GET /api/work-plan/{workPlanItemId}/documents/{documentId}`

### Eliminar documento

`DELETE /api/work-plan/{workPlanItemId}/documents/{documentId}`

## Catalogos requeridos

### Funcionarios responsables

El frontend necesita seleccionar responsables. Puede reutilizarse el endpoint general de empleados, pero se recomienda uno liviano:

`GET /api/employee/options`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Laura",
      "lastName": "Martinez",
      "email": "laura@empresa.com",
      "job": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Coordinadora SST"
      }
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/employee/options",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Indicadores esperados

El frontend muestra indicadores superiores. Backend puede permitir calcularlos desde la lista o entregar un endpoint de resumen.

`GET /api/work-plan/summary`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `year` | number | no | Vigencia del plan. |

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "total": 10,
    "pending": 4,
    "approved": 6,
    "budget": 8500000
  },
  "errors": null,
  "meta": {
    "path": "/api/work-plan/summary",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Reglas de negocio

- Toda actividad debe pertenecer a la empresa autenticada por `companyId`.
- El responsable debe ser un empleado activo de la misma empresa.
- El consecutivo debe generarse en backend y ser unico por empresa y vigencia.
- Formato sugerido de consecutivo: `PT-{year}-{number}`.
- Una actividad nueva inicia siempre en `PENDING_APPROVAL`.
- Solo actividades pendientes pueden seleccionarse para generar documento de aprobacion.
- Solo actividades pendientes pueden aprobarse.
- Al subir el documento firmado, todas las actividades seleccionadas pasan a `APPROVED`.
- Una actividad aprobada debe conservar `approvedBy`, `approvedAt` y evidencia firmada.
- No se debe permitir consultar, editar, aprobar o eliminar actividades de otra empresa.
- Si una actividad aprobada se modifica, debe existir trazabilidad o una regla de bloqueo.
- El presupuesto debe almacenarse como numero, no como string formateado.

## Validaciones esperadas

- `year`: requerido, entero de cuatro digitos, anio actual o posterior.
- `activity`: requerido, texto no vacio.
- `objective`: requerido, texto no vacio.
- `budget`: requerido, numero mayor o igual a 0.
- `responsibleEmployeeId`: requerido, UUID valido y de la misma empresa.
- `expectedEvidence`: requerido, texto no vacio.
- `workPlanItemIds`: requerido al aprobar, debe contener al menos un ID.
- `approvedBy`: requerido al aprobar, texto no vacio.
- `file`: requerido al aprobar, preferiblemente PDF.
- Archivos: validar extension, MIME type y tamano maximo segun politica global de SafeCloud.

## Permisos sugeridos

Si se mantiene el esquema actual de permisos:

- `Ver plan de trabajo`
- `Crear plan de trabajo`
- `Editar plan de trabajo`
- `Eliminar plan de trabajo`

Permisos adicionales sugeridos:

- `Aprobar plan de trabajo`
- `Cargar evidencia plan de trabajo`
- `Descargar plan de trabajo`

## Pendientes frontend cuando backend este listo

Cuando backend implemente el contrato, el frontend debe:

- crear `services/workPlanService.ts`;
- crear `types/manager/work-plan.ts`;
- reemplazar `initialWorkPlanItems` por `GET /api/work-plan`;
- reemplazar empleados mock por endpoint real de empleados/opciones;
- enviar creacion, actualizacion y eliminacion reales;
- conectar seleccion multiple con `POST /api/work-plan/generate-document`;
- conectar aprobacion con `POST /api/work-plan/approve`;
- reemplazar la descarga `.txt` simulada por `downloadUrl`;
- mantener o retirar la generacion PDF en frontend segun decida backend;
- agregar loading, errores y `toast.success`/`toast.error` en cada accion real.
