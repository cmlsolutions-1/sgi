# Contract backend - Modulo hijo Investigaciones

## 1. Ubicacion actual en frontend

- Ruta: `/dashboard/investigations`
- Archivo principal: `app/dashboard/investigations/page.tsx`
- Modulo padre actual en navegacion: `Empleados`
- Codigo de modulo hijo usado en navegacion: `INVESTIGATIONS`
- Estado actual: implementacion funcional mockeada en frontend con `useState`.

La pantalla ya tiene una experiencia completa para:

- crear una investigacion asociada a una novedad laboral;
- asignar responsable;
- agregar personas que revisan la investigacion;
- registrar analisis de causas;
- registrar acciones correctivas, preventivas y de mejora;
- relacionar referencia ACPM o documento;
- subir evidencia;
- verificar eficacia;
- consultar detalle;
- consultar trazabilidad;
- alternar vista de tarjetas y lista;
- filtrar por texto y estado de eficacia.

## 2. Objetivo del modulo

Permitir gestionar la investigacion de novedades laborales, accidentes, incidentes, enfermedades laborales u otros eventos reportados en SafeCloud, conservando:

- causa raiz o analisis de causas;
- responsables;
- equipo investigador;
- plan de acciones;
- relacion con ACPM o documento de gestion;
- evidencias documentales;
- verificacion de eficacia;
- cierre automatico cuando la evidencia sea eficaz;
- trazabilidad completa para auditoria.

## 3. Dependencias funcionales

El backend debe conectar este modulo con entidades ya existentes:

- Empresa (`companyId`)
- Novedades laborales / incidentes (`incidentId`)
- Funcionarios (`employeeId`)
- ACPM, si aplica
- Gestion documental, si aplica
- Archivos o evidencias
- Usuario autenticado que crea, carga evidencia o verifica

Actualmente en frontend los funcionarios y novedades laborales estan quemados en el archivo del modulo.

## 4. Entidades sugeridas

### 4.1 Investigation

Entidad principal de la investigacion.

Campos sugeridos:

```ts
type Investigation = {
  id: string
  companyId: string
  consecutive: string
  incidentId: string
  responsibleEmployeeId: string
  causeAnalysis: string
  correctiveActions?: string | null
  preventiveActions?: string | null
  improvementActions?: string | null
  acpmSource: "ACPM" | "DOCUMENT_MANAGEMENT" | "OTHER"
  acpmReference: string
  acpmId?: string | null
  documentManagementId?: string | null
  expectedClosureDate?: string | null
  efficacyStatus: "REPORTADO" | "PENDIENTE_VERIFICACION" | "EFICAZ"
  reviewDate?: string | null
  closureDate?: string | null
  closedByUserId?: string | null
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
  createdByUserId: string
  updatedByUserId?: string | null
}
```

### 4.2 InvestigationReviewer

Personas que revisan o hacen parte del equipo investigador.

```ts
type InvestigationReviewer = {
  id: string
  investigationId: string
  type: "EMPLOYEE" | "EXTERNAL"
  employeeId?: string | null
  externalName?: string | null
  createdAt: string
}
```

Reglas:

- Si `type = EMPLOYEE`, `employeeId` es requerido.
- Si `type = EXTERNAL`, `externalName` es requerido.
- Debe existir al menos un revisor valido por investigacion.

### 4.3 InvestigationEvidence

Evidencias cargadas en la investigacion.

Puede reutilizar el patron de documentos que ya existe en otros modulos.

```ts
type InvestigationEvidence = {
  id: string
  companyId: string
  investigationId: string
  fileId: string
  originalName: string
  mimeType: string
  size: number
  downloadUrl: string
  observation?: string | null
  uploadedByUserId: string
  uploadedAt: string
  isConfirmed: boolean
}
```

### 4.4 InvestigationTrace

Trazabilidad para auditoria.

```ts
type InvestigationTrace = {
  id: string
  investigationId: string
  type:
    | "CREATED"
    | "UPDATED"
    | "EVIDENCE_UPLOADED"
    | "VERIFIED_EFFECTIVE"
    | "VERIFIED_NOT_EFFECTIVE"
    | "STATUS_CHANGED"
  title: string
  description: string
  actorUserId?: string | null
  actorName: string
  createdAt: string
}
```

## 5. Catalogos y enums

### EfficacyStatus

```ts
enum InvestigationEfficacyStatus {
  REPORTADO = "REPORTADO",
  PENDIENTE_VERIFICACION = "PENDIENTE_VERIFICACION",
  EFICAZ = "EFICAZ",
}
```

Labels frontend:

- `REPORTADO`: Reportado
- `PENDIENTE_VERIFICACION`: Pendiente de verificacion
- `EFICAZ`: Eficaz

### AcpmSource

```ts
enum InvestigationAcpmSource {
  ACPM = "ACPM",
  DOCUMENT_MANAGEMENT = "DOCUMENT_MANAGEMENT",
  OTHER = "OTHER",
}
```

Labels frontend:

- `ACPM`: Consecutivo ACPM
- `DOCUMENT_MANAGEMENT`: Documento de gestion documental
- `OTHER`: Otro

### ReviewerType

```ts
enum InvestigationReviewerType {
  EMPLOYEE = "EMPLOYEE",
  EXTERNAL = "EXTERNAL",
}
```

### InvestigationStatus

```ts
enum InvestigationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
```

## 6. Endpoints requeridos

Todos los endpoints administrativos requieren JWT Bearer y deben validar `companyId` del usuario autenticado.

### 6.1 Crear investigacion

`POST /api/investigations`

Request body:

```json
{
  "incidentId": "uuid",
  "responsibleEmployeeId": "uuid",
  "reviewers": [
    {
      "type": "EMPLOYEE",
      "employeeId": "uuid"
    },
    {
      "type": "EXTERNAL",
      "externalName": "Asesor ARL"
    }
  ],
  "causeAnalysis": "Se identifica falta de senalizacion temporal durante limpieza.",
  "correctiveActions": "Reubicar senalizacion y reforzar inspeccion diaria.",
  "preventiveActions": "Actualizar charla de autocuidado.",
  "improvementActions": "Incluir punto de verificacion en lista de chequeo.",
  "acpmSource": "ACPM",
  "acpmReference": "ACPM-2026-014",
  "acpmId": "uuid opcional",
  "documentManagementId": "uuid opcional",
  "expectedClosureDate": "2026-09-12"
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
    "consecutive": "INV-001",
    "incidentId": "uuid",
    "incident": {
      "id": "uuid",
      "consecutive": "INC-1",
      "type": "INCIDENTE",
      "description": "Caida al mismo nivel en zona de empaque",
      "date": "2026-08-18",
      "employee": {
        "id": "uuid",
        "name": "Daniela",
        "lastName": "Ruiz"
      }
    },
    "responsibleEmployeeId": "uuid",
    "responsibleEmployee": {
      "id": "uuid",
      "name": "Andres",
      "lastName": "Rojas",
      "job": {
        "id": "uuid",
        "name": "Supervisor operativo"
      }
    },
    "reviewers": [
      {
        "id": "uuid",
        "type": "EMPLOYEE",
        "employeeId": "uuid",
        "employee": {
          "id": "uuid",
          "name": "Laura",
          "lastName": "Martinez"
        }
      }
    ],
    "causeAnalysis": "string",
    "correctiveActions": "string",
    "preventiveActions": "string",
    "improvementActions": "string",
    "acpmSource": "ACPM",
    "acpmReference": "ACPM-2026-014",
    "expectedClosureDate": "2026-09-12",
    "efficacyStatus": "REPORTADO",
    "reviewDate": null,
    "closureDate": null,
    "closedBy": null,
    "evidences": [],
    "traceability": [
      {
        "id": "uuid",
        "type": "CREATED",
        "title": "Investigacion creada",
        "description": "La investigacion quedo reportada y a la espera de evidencia del responsable.",
        "actorName": "Sistema",
        "createdAt": "2026-08-24T08:15:00.000Z"
      }
    ],
    "status": "ACTIVE",
    "createdAt": "2026-08-24T08:15:00.000Z",
    "updatedAt": "2026-08-24T08:15:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

### 6.2 Listar investigaciones

`GET /api/investigations`

Query params sugeridos:

- `page`
- `limit`
- `search`
- `efficacyStatus`: `REPORTADO`, `PENDIENTE_VERIFICACION`, `EFICAZ`
- `status`: `ACTIVE`, `INACTIVE`
- `incidentId`
- `responsibleEmployeeId`
- `acpmSource`
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
        "consecutive": "INV-001",
        "incidentId": "uuid",
        "incident": {
          "id": "uuid",
          "consecutive": "INC-1",
          "type": "INCIDENTE",
          "description": "Caida al mismo nivel en zona de empaque",
          "date": "2026-08-18"
        },
        "responsibleEmployeeId": "uuid",
        "responsibleEmployee": {
          "id": "uuid",
          "name": "Andres",
          "lastName": "Rojas"
        },
        "acpmSource": "ACPM",
        "acpmReference": "ACPM-2026-014",
        "expectedClosureDate": "2026-09-12",
        "reviewDate": null,
        "closureDate": null,
        "efficacyStatus": "PENDIENTE_VERIFICACION",
        "evidencesCount": 1,
        "status": "ACTIVE",
        "createdAt": "2026-08-24T08:15:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 6.3 Ver detalle

`GET /api/investigations/{id}`

Debe retornar:

- datos principales;
- novedad laboral asociada;
- responsable;
- revisores;
- acciones;
- evidencias;
- trazabilidad.

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "consecutive": "INV-001",
    "incidentId": "uuid",
    "incident": {
      "id": "uuid",
      "consecutive": "INC-1",
      "type": "INCIDENTE",
      "description": "Caida al mismo nivel en zona de empaque",
      "date": "2026-08-18",
      "employee": {
        "id": "uuid",
        "name": "Daniela",
        "lastName": "Ruiz"
      }
    },
    "responsibleEmployeeId": "uuid",
    "responsibleEmployee": {
      "id": "uuid",
      "name": "Andres",
      "lastName": "Rojas",
      "job": {
        "id": "uuid",
        "name": "Supervisor operativo"
      }
    },
    "reviewers": [
      {
        "id": "uuid",
        "type": "EMPLOYEE",
        "employeeId": "uuid",
        "employee": {
          "id": "uuid",
          "name": "Laura",
          "lastName": "Martinez"
        }
      },
      {
        "id": "uuid",
        "type": "EXTERNAL",
        "externalName": "Asesor ARL"
      }
    ],
    "causeAnalysis": "string",
    "correctiveActions": "string",
    "preventiveActions": "string",
    "improvementActions": "string",
    "acpmSource": "ACPM",
    "acpmReference": "ACPM-2026-014",
    "expectedClosureDate": "2026-09-12",
    "efficacyStatus": "PENDIENTE_VERIFICACION",
    "reviewDate": null,
    "closureDate": null,
    "closedBy": null,
    "evidences": [],
    "traceability": [],
    "status": "ACTIVE",
    "createdAt": "2026-08-24T08:15:00.000Z",
    "updatedAt": "2026-08-24T08:15:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations/uuid",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 6.4 Actualizar investigacion

`PUT /api/investigations/{id}`

Request body:

```json
{
  "incidentId": "uuid",
  "responsibleEmployeeId": "uuid",
  "reviewers": [
    {
      "type": "EMPLOYEE",
      "employeeId": "uuid"
    }
  ],
  "causeAnalysis": "string",
  "correctiveActions": "string",
  "preventiveActions": "string",
  "improvementActions": "string",
  "acpmSource": "ACPM",
  "acpmReference": "ACPM-2026-014",
  "expectedClosureDate": "2026-09-12"
}
```

Reglas:

- No debe permitir cambiar una investigacion cerrada como `EFICAZ`, salvo que backend defina permiso especial.
- No debe recibir `efficacyStatus` en este endpoint; el cambio de eficacia debe hacerse por endpoint independiente.
- Debe registrar evento `UPDATED` en trazabilidad.

### 6.5 Cambiar estado activo/inactivo

`PUT /api/investigations/change-status/{id}`

Request body:

```json
{
  "status": "ACTIVE"
}
```

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "status": "ACTIVE"
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations/change-status/uuid",
    "method": "PUT",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### 6.6 Eliminar investigacion

`DELETE /api/investigations/{id}`

Recomendado: eliminacion logica o inactivacion, conservando evidencia y trazabilidad para auditoria.

## 7. Endpoints de evidencias

La carga de evidencia debe seguir el mismo patron que los demas modulos de SafeCloud.

### 7.1 Subir evidencia

`POST /api/investigations/{investigationId}/documents`

Content-Type: `multipart/form-data`

Request body:

```txt
file: binary requerido
type: INVESTIGATION
isConfirmed: true
observation: string opcional
```

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "ownerType": "EMPLOYEE",
    "ownerId": "uuid",
    "referenceType": "INVESTIGATION",
    "referenceId": "uuid",
    "type": "INVESTIGATION",
    "originalName": "registro-fotografico.pdf",
    "mimeType": "application/pdf",
    "size": 125000,
    "storageProvider": "DIGITAL_OCEAN",
    "isConfirmed": true,
    "downloadUrl": "string",
    "createdAt": "2026-08-29T09:20:00.000Z",
    "createdBy": "uuid",
    "observation": "Se adjunta evidencia de senalizacion instalada."
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations/uuid/documents",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 201
  }
}
```

Regla automatica:

- Al subir evidencia, si la investigacion no esta cerrada como `EFICAZ`, backend debe actualizar `efficacyStatus` a `PENDIENTE_VERIFICACION`.
- Debe registrar evento `EVIDENCE_UPLOADED`.

### 7.2 Listar evidencias

`GET /api/investigations/{investigationId}/documents`

### 7.3 Ver una evidencia

`GET /api/investigations/{investigationId}/documents/{documentId}`

### 7.4 Eliminar evidencia

`DELETE /api/investigations/{investigationId}/documents/{documentId}`

Reglas:

- Debe validar que la evidencia pertenezca a la investigacion y a la misma empresa.
- Si se elimina la unica evidencia de una investigacion en `PENDIENTE_VERIFICACION`, se recomienda devolverla a `REPORTADO`.

## 8. Endpoint de verificacion de eficacia

### 8.1 Marcar eficaz o no eficaz

`PUT /api/investigations/{id}/efficacy`

Request body:

```json
{
  "isEffective": true,
  "observation": "La evidencia fue validada por el equipo investigador."
}
```

Response si es eficaz:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "efficacyStatus": "EFICAZ",
    "reviewDate": "2026-08-29T10:30:00.000Z",
    "closureDate": "2026-08-29T10:30:00.000Z",
    "closedBy": {
      "id": "uuid",
      "name": "Laura Martinez"
    }
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations/uuid/efficacy",
    "method": "PUT",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

Response si no es eficaz:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "uuid",
    "efficacyStatus": "REPORTADO",
    "reviewDate": "2026-08-29T10:30:00.000Z",
    "closureDate": null,
    "closedBy": null
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations/uuid/efficacy",
    "method": "PUT",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

Reglas:

- Solo se debe permitir verificar eficacia cuando `efficacyStatus = PENDIENTE_VERIFICACION`.
- Para marcar como eficaz debe existir al menos una evidencia.
- Si `isEffective = true`, guardar `reviewDate`, `closureDate` y `closedByUserId`.
- Si `isEffective = false`, limpiar `closureDate` y devolver `efficacyStatus` a `REPORTADO`.
- Registrar trazabilidad:
  - `VERIFIED_EFFECTIVE`
  - `VERIFIED_NOT_EFFECTIVE`

## 9. Endpoint de trazabilidad

`GET /api/investigations/{id}/traceability`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "uuid",
      "type": "CREATED",
      "title": "Investigacion creada",
      "description": "La investigacion quedo reportada y a la espera de evidencia del responsable.",
      "actorName": "Sistema",
      "createdAt": "2026-08-24T08:15:00.000Z"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/investigations/uuid/traceability",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

## 10. Endpoint de resumen

Para las tarjetas superiores.

`GET /api/investigations/summary`

Query params opcionales:

- `startDate`
- `endDate`
- `responsibleEmployeeId`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "total": 12,
    "reported": 4,
    "pendingVerification": 3,
    "closedEffective": 5
  },
  "errors": null,
  "meta": {
    "path": "/api/investigations/summary",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

## 11. Endpoints de soporte para selects

El frontend necesita alimentar:

### Funcionarios responsables y revisores

Usar endpoint existente:

`GET /api/employee`

Recomendado para selects:

`GET /api/employee/options`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "uuid",
      "name": "Laura",
      "lastName": "Martinez",
      "job": {
        "id": "uuid",
        "name": "Coordinadora SST"
      }
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

### Novedades laborales

Usar endpoint existente:

`GET /api/incidents`

Recomendado para selects:

`GET /api/incidents/options`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "uuid",
      "consecutive": "INC-1",
      "type": "INCIDENTE",
      "title": "Caida al mismo nivel en zona de empaque",
      "date": "2026-08-18",
      "employeeName": "Daniela Ruiz"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/incidents/options",
    "method": "GET",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 200
  }
}
```

### ACPM

Si `acpmSource = ACPM`, el frontend puede seleccionar o escribir una referencia.

Endpoint sugerido:

`GET /api/acpm/options`

### Gestion documental

Si `acpmSource = DOCUMENT_MANAGEMENT`, se puede seleccionar un documento real.

Endpoint sugerido:

`GET /api/document-management?type=PROCEDURE`

## 12. Validaciones backend

Crear investigacion:

- `incidentId` requerido y debe pertenecer a la misma empresa.
- `responsibleEmployeeId` requerido y debe pertenecer a la misma empresa.
- `reviewers` requerido con minimo un registro valido.
- `causeAnalysis` requerido.
- `acpmReference` requerido mientras el frontend conserve ese campo.
- `expectedClosureDate` opcional, pero si se envia debe ser fecha valida.
- `acpmSource` debe ser enum valido.
- Si `acpmSource = ACPM`, validar `acpmId` cuando se use seleccion real.
- Si `acpmSource = DOCUMENT_MANAGEMENT`, validar `documentManagementId` cuando se use seleccion real.

Subir evidencia:

- `file` requerido.
- Validar tipo de archivo permitido.
- Validar tamano maximo.
- Validar pertenencia de la investigacion a la empresa.
- No permitir subir evidencia a investigaciones inactivas o cerradas como eficaz, salvo permiso especial.

Verificacion:

- Solo usuarios autorizados deben poder marcar eficaz/no eficaz.
- No permitir marcar eficaz sin evidencias.
- Registrar trazabilidad siempre.

## 13. Reglas de negocio

- Toda investigacion se crea en `REPORTADO`.
- Cuando se sube evidencia, pasa a `PENDIENTE_VERIFICACION`.
- Cuando la evidencia es aprobada, pasa a `EFICAZ`, registra `reviewDate`, `closureDate` y `closedBy`.
- Cuando la evidencia no es eficaz, vuelve a `REPORTADO`.
- La trazabilidad no debe eliminarse.
- La evidencia historica debe conservarse aunque la investigacion cambie de estado.
- El consecutivo debe generarse en backend por empresa, por ejemplo `INV-001`, `INV-002`.
- Las fechas deben almacenarse en UTC y mostrarse en America/Bogota desde el frontend.

## 14. Permisos sugeridos

Agregar permisos especificos:

- Ver investigaciones
- Crear investigaciones
- Editar investigaciones
- Eliminar investigaciones
- Subir evidencias de investigaciones
- Verificar eficacia de investigaciones

Los permisos deben integrarse al modulo hijo `INVESTIGATIONS`.

## 15. Comportamiento esperado en frontend al conectar backend

Reemplazar datos quemados por servicios:

- `listInvestigations(filters)`
- `getInvestigation(id)`
- `createInvestigation(payload)`
- `updateInvestigation(id, payload)`
- `changeInvestigationStatus(id, status)`
- `uploadInvestigationDocument(investigationId, formData)`
- `listInvestigationDocuments(investigationId)`
- `deleteInvestigationDocument(investigationId, documentId)`
- `verifyInvestigationEfficacy(id, payload)`
- `listInvestigationTraceability(id)`
- `listInvestigationSummary(filters)`

La UI actual puede conservarse casi igual. Solo se debe cambiar:

- los arrays mockeados por llamadas al backend;
- el campo `fileName` mock por carga real `multipart/form-data`;
- el listado de empleados por endpoint real;
- el listado de novedades por endpoint real;
- la trazabilidad local por trazabilidad enviada desde backend.

## 16. Estados visuales requeridos

Badges actuales:

- `REPORTADO`: azul
- `PENDIENTE_VERIFICACION`: amarillo/advertencia
- `EFICAZ`: verde

Acciones actuales:

- Ver detalle: siempre disponible.
- Subir evidencia: disponible si no esta `EFICAZ`.
- Marcar eficaz: disponible solo si esta `PENDIENTE_VERIFICACION`.
- Marcar no eficaz: disponible solo si esta `PENDIENTE_VERIFICACION`.

## 17. Multiempresa y seguridad

- Todas las consultas deben filtrar por `companyId` del usuario autenticado.
- No aceptar `companyId` desde frontend en payload.
- Validar que `incidentId`, `responsibleEmployeeId`, `reviewers.employeeId`, `acpmId` y `documentManagementId` pertenezcan a la empresa.
- Evitar IDOR en detalle, documentos, trazabilidad y verificacion.
- Registrar `createdByUserId`, `updatedByUserId`, `uploadedByUserId` y `closedByUserId`.
- No permitir descargar documentos de otra empresa.

## 18. Respuesta de errores recomendada

Mantener formato estandar del backend:

```json
{
  "ok": false,
  "message": "Validacion fallida",
  "data": null,
  "errors": [
    {
      "message": "Selecciona la novedad laboral asociada"
    }
  ],
  "meta": {
    "path": "/api/investigations",
    "method": "POST",
    "timestamp": "2026-01-19T12:34:56.000Z",
    "statusCode": 400
  }
}
```

## 19. Pendientes frontend despues del backend

Cuando backend entregue endpoints:

1. Crear `services/investigationService.ts`.
2. Crear `types/manager/investigation.ts`.
3. Reemplazar datos mockeados por llamadas reales.
4. Integrar loading, empty states y toast de errores backend.
5. Conectar evidencias al componente visual usado en otros modulos.
6. Conectar selects de empleados, novedades, ACPM y documentos.
7. Agregar permisos al control de acciones.
8. Validar visualmente responsive en vista tarjetas/lista y modales.
