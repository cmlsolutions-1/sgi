# Contrato frontend/backend - Auditorías SST

Este documento describe el contrato requerido para conectar el modulo hijo **Auditorías SST** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y conserva auditorias, documentos y acciones ACPM solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Gestion del SG-SST`
- Modulo hijo: `Auditorías SST`
- Codigo de modulo: `SST_AUDITS`
- Ruta frontend: `/dashboard/audits`
- Archivo principal: `app/dashboard/audits/page.tsx`

## Objetivo funcional

Permitir gestionar el plan anual de auditorias SST de la empresa, relacionando procedimientos documentales, auditor interno o equipo auditor externo, documentos de apertura/cierre/informe y acciones ACPM derivadas.

El modulo contempla:

- creacion y edicion de auditorias SST;
- vigencia anual;
- fecha programada;
- auditoria interna o externa;
- seleccion de funcionario auditor cuando la auditoria es interna;
- registro de equipo auditor cuando la auditoria es externa;
- metodologia presencial o virtual;
- estado de la auditoria;
- relacion con procedimiento documental;
- alcance de auditoria;
- carga de actas, informes u otras evidencias;
- acciones ACPM derivadas;
- filtros por vigencia, estado y busqueda;
- vista tipo tabla;
- detalle de la auditoria;
- descarga PDF del plan/informe de auditoria.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registro inicial de auditoria;
- creacion y edicion en memoria;
- carga simulada de documentos por nombre de archivo;
- acciones ACPM en memoria;
- filtros locales;
- estadisticas locales;
- detalle en modal;
- PDF generado en frontend con `jsPDF` y `jspdf-autotable`.

El frontend ya consume catalogos reales para:

- funcionarios desde `GET /api/employees`;
- documentos/procedimientos desde el servicio de gestion documental.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### SstAudit

Entidad principal de auditoria SST.

```ts
type SstAudit = {
  id: string
  companyId: string
  year: number
  name: string
  scheduledDate: string
  auditType: SstAuditType
  internalAuditorId: string | null
  internalAuditor: {
    id: string
    name: string
    lastName: string
    email?: string
  } | null
  externalAuditTeam: string | null
  scope: string
  methodology: SstAuditMethodology
  status: SstAuditStatus
  procedureId: string
  procedure: {
    id: string
    name: string
    code?: string | null
  } | null
  evidencesCount: number
  actionsCount: number
  evidences?: SstAuditDocument[]
  actions?: SstAuditAction[]
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### SstAuditDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type SstAuditDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "SST_AUDIT"
  referenceId: string
  type: SstAuditDocumentType
  label: string
  originalName: string
  mimeType: string
  size: number
  storageProvider: "LOCAL" | "DIGITAL_OCEAN_SPACES"
  isConfirmed: boolean
  downloadUrl: string
  description: string | null
  createdAt: string
  createdBy: string | null
}
```

### SstAuditAction

Accion ACPM derivada de auditoria. Puede ser una entidad propia o integrarse directamente con el modulo ACPM.

```ts
type SstAuditAction = {
  id: string
  companyId: string
  auditId: string
  acpmId: string | null
  type: AcpmType
  name: string
  responsible: string
  dueDate: string
  status: SstAuditActionStatus
  createdAt: string
  updatedAt: string
}
```

## Enums requeridos

### SstAuditType

```ts
enum SstAuditType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}
```

Labels frontend:

- `INTERNAL`: Interna
- `EXTERNAL`: Externa

### SstAuditMethodology

```ts
enum SstAuditMethodology {
  PRESENTIAL = 'PRESENTIAL',
  VIRTUAL = 'VIRTUAL',
}
```

Labels frontend:

- `PRESENTIAL`: Presencial
- `VIRTUAL`: Virtual

### SstAuditStatus

```ts
enum SstAuditStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  FINISHED = 'FINISHED',
}
```

Labels frontend:

- `ACTIVE`: Activa
- `EXPIRED`: Vencida
- `FINISHED`: Finalizada

### SstAuditDocumentType

```ts
enum SstAuditDocumentType {
  OPENING_MINUTES = 'OPENING_MINUTES',
  CLOSING_MINUTES = 'CLOSING_MINUTES',
  AUDIT_REPORT = 'AUDIT_REPORT',
  OTHER_EVIDENCE = 'OTHER_EVIDENCE',
}
```

Labels frontend:

- `OPENING_MINUTES`: Acta de inicio de auditoria
- `CLOSING_MINUTES`: Acta de fin de auditoria
- `AUDIT_REPORT`: Informe de auditoria
- `OTHER_EVIDENCE`: Otra evidencia

### AcpmType

Debe reutilizar el enum del modulo ACPM.

```ts
enum AcpmType {
  PREVENTIVE = 'PREVENTIVE',
  CORRECTIVE = 'CORRECTIVE',
  IMPROVEMENT = 'IMPROVEMENT',
}
```

### SstAuditActionStatus

```ts
enum SstAuditActionStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}
```

Labels frontend:

- `PENDING`: Pendiente
- `IN_PROGRESS`: En proceso
- `DONE`: Finalizada

## Campos del formulario de auditoria

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `year` | number | si | Vigencia del plan anual. |
| `name` | string | si | Nombre de la auditoria. |
| `scheduledDate` | date | si | Fecha programada de auditoria. |
| `auditType` | enum | si | `INTERNAL` o `EXTERNAL`. |
| `internalAuditorId` | uuid | condicional | Requerido cuando `auditType` es `INTERNAL`. |
| `externalAuditTeam` | string | condicional | Requerido cuando `auditType` es `EXTERNAL`. |
| `scope` | string | si | Alcance: procesos, sedes, modulos o requisitos cubiertos. |
| `methodology` | enum | si | `PRESENTIAL` o `VIRTUAL`. |
| `status` | enum | si | Estado de la auditoria. |
| `procedureId` | uuid | si | Documento/procedimiento relacionado desde Gestion Documental. |

## Campos de documento de auditoria

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo real a cargar. En el mock actual solo se guarda `fileName`. |
| `type` | enum | si | Tipo de documento de auditoria. |
| `description` | string | no | Descripcion del soporte. |
| `isConfirmed` | boolean | no | Por defecto `true`. |

## Campos de accion ACPM derivada

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `type` | enum | si | `PREVENTIVE`, `CORRECTIVE`, `IMPROVEMENT`. |
| `name` | string | si | Nombre o descripcion corta de la accion. |
| `responsible` | string | si | Responsable de ejecutar la accion. |
| `dueDate` | date | si | Fecha limite. |
| `status` | enum | no | Por defecto `PENDING`. |

## Reglas de negocio

1. La auditoria pertenece siempre a la empresa del usuario autenticado.
2. Backend debe resolver `companyId` desde el JWT; frontend no envia `companyId`.
3. `year`, `name`, `scheduledDate`, `scope` y `procedureId` son obligatorios.
4. Si `auditType` es `INTERNAL`, `internalAuditorId` es obligatorio y debe pertenecer a un funcionario activo de la misma empresa.
5. Si `auditType` es `EXTERNAL`, `externalAuditTeam` es obligatorio.
6. `procedureId` debe corresponder a un documento de Gestion Documental de la misma empresa. Idealmente de tipo `PROCEDURE`.
7. Si no existen documentos tipo `PROCEDURE`, frontend puede mostrar otros documentos como referencia, pero backend debe validar que el documento pertenezca a la empresa.
8. El estado `EXPIRED` puede calcularse automaticamente si `scheduledDate` ya paso y la auditoria no esta `FINISHED`, aunque frontend tambien permite enviarlo manualmente.
9. Una auditoria puede tener multiples documentos/evidencias.
10. Una auditoria puede tener multiples acciones ACPM derivadas.
11. La accion ACPM derivada puede crear un registro real en el modulo ACPM usando `origin = AUDIT`, o quedar como accion interna relacionada mientras backend define la integracion.
12. La descarga PDF puede generarse en frontend con los datos recibidos o backend puede ofrecer endpoint de exportacion.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear auditoria SST

`POST /api/sst-audits`

Request body:

```json
{
  "year": 2026,
  "name": "Auditoría interna del SG-SST",
  "scheduledDate": "2026-10-20",
  "auditType": "INTERNAL",
  "internalAuditorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "externalAuditTeam": null,
  "scope": "Verificar el cumplimiento documental y operativo del SG-SST.",
  "methodology": "PRESENTIAL",
  "status": "ACTIVE",
  "procedureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
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
    "year": 2026,
    "name": "Auditoría interna del SG-SST",
    "scheduledDate": "2026-10-20",
    "auditType": "INTERNAL",
    "internalAuditorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "internalAuditor": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Laura",
      "lastName": "Martinez",
      "email": "laura@example.com"
    },
    "externalAuditTeam": null,
    "scope": "Verificar el cumplimiento documental y operativo del SG-SST.",
    "methodology": "PRESENTIAL",
    "status": "ACTIVE",
    "procedureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "procedure": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Procedimiento de auditoría interna",
      "code": "PROC-AUD-001"
    },
    "evidencesCount": 0,
    "actionsCount": 0,
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-audits",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar auditorias SST

`GET /api/sst-audits`

Query params:

| Parametro | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `page` | number | no | Numero de pagina. |
| `limit` | number | no | Registros por pagina. |
| `year` | number | no | Filtro por vigencia. |
| `status` | enum | no | `ACTIVE`, `EXPIRED`, `FINISHED`. |
| `auditType` | enum | no | `INTERNAL`, `EXTERNAL`. |
| `methodology` | enum | no | `PRESENTIAL`, `VIRTUAL`. |
| `search` | string | no | Busca por nombre, alcance, auditor/equipo o procedimiento. |

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
        "year": 2026,
        "name": "Auditoría interna del SG-SST",
        "scheduledDate": "2026-10-20",
        "auditType": "INTERNAL",
        "internalAuditorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "internalAuditor": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Laura",
          "lastName": "Martinez",
          "email": "laura@example.com"
        },
        "externalAuditTeam": null,
        "scope": "Verificar el cumplimiento documental y operativo del SG-SST.",
        "methodology": "PRESENTIAL",
        "status": "ACTIVE",
        "procedureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "procedure": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Procedimiento de auditoría interna",
          "code": "PROC-AUD-001"
        },
        "evidencesCount": 1,
        "actionsCount": 1,
        "createdAt": "2026-09-10T12:00:00.000Z",
        "updatedAt": "2026-09-10T12:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-audits",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Consultar auditoria por id

`GET /api/sst-audits/{id}`

Debe retornar la auditoria con `evidences` y `actions`.

### Actualizar auditoria SST

`PUT /api/sst-audits/{id}`

Request body:

```json
{
  "year": 2026,
  "name": "Auditoría interna del SG-SST",
  "scheduledDate": "2026-10-20",
  "auditType": "INTERNAL",
  "internalAuditorId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "externalAuditTeam": null,
  "scope": "Verificar el cumplimiento documental y operativo del SG-SST.",
  "methodology": "PRESENTIAL",
  "status": "ACTIVE",
  "procedureId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### Cambiar estado de auditoria

`PUT /api/sst-audits/{id}/status`

Request body:

```json
{
  "status": "FINISHED"
}
```

### Cargar documento de auditoria

`POST /api/sst-audits/{auditId}/documents`

Content-Type: `multipart/form-data`

Form data:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `file` | binary | si |
| `type` | enum | si |
| `description` | string | no |
| `isConfirmed` | boolean | no |

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "document-id",
    "companyId": "company-id",
    "referenceType": "SST_AUDIT",
    "referenceId": "audit-id",
    "type": "AUDIT_REPORT",
    "label": "Informe de auditoria",
    "originalName": "informe-auditoria.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "storageProvider": "LOCAL",
    "isConfirmed": true,
    "downloadUrl": "/api/sst-audits/audit-id/documents/document-id",
    "description": "Informe final de auditoria.",
    "createdAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-audits/audit-id/documents",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar documentos de auditoria

`GET /api/sst-audits/{auditId}/documents`

### Ver/descargar documento de auditoria

`GET /api/sst-audits/{auditId}/documents/{documentId}`

Debe permitir visualizar en navegador cuando sea PDF o imagen y descargar cuando aplique.

### Eliminar documento de auditoria

`DELETE /api/sst-audits/{auditId}/documents/{documentId}`

### Crear accion ACPM derivada

`POST /api/sst-audits/{auditId}/actions`

Request body:

```json
{
  "type": "CORRECTIVE",
  "name": "Actualizar matriz de seguimiento documental",
  "responsible": "Responsable SG-SST",
  "dueDate": "2026-11-15",
  "status": "PENDING"
}
```

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "action-id",
    "companyId": "company-id",
    "auditId": "audit-id",
    "acpmId": null,
    "type": "CORRECTIVE",
    "name": "Actualizar matriz de seguimiento documental",
    "responsible": "Responsable SG-SST",
    "dueDate": "2026-11-15",
    "status": "PENDING",
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-audits/audit-id/actions",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar acciones ACPM derivadas

`GET /api/sst-audits/{auditId}/actions`

### Actualizar accion ACPM derivada

`PUT /api/sst-audits/{auditId}/actions/{actionId}`

### Eliminar accion ACPM derivada

`DELETE /api/sst-audits/{auditId}/actions/{actionId}`

### Descargar plan/informe PDF

`GET /api/sst-audits/{id}/export`

Response:

- Media type: `application/pdf`
- Archivo: plan o informe de auditoria SST.

Si backend no genera el PDF, el frontend puede seguir generandolo con `jsPDF` usando la respuesta de `GET /api/sst-audits/{id}`.

## Validaciones esperadas

1. `year` debe ser numerico.
2. `scheduledDate` debe tener formato fecha valido.
3. `auditType` debe pertenecer al enum `SstAuditType`.
4. `methodology` debe pertenecer al enum `SstAuditMethodology`.
5. `status` debe pertenecer al enum `SstAuditStatus`.
6. Para auditoria interna, `internalAuditorId` es obligatorio.
7. Para auditoria externa, `externalAuditTeam` es obligatorio.
8. `procedureId` debe pertenecer a la misma empresa.
9. El documento cargado debe pertenecer a la auditoria indicada.
10. La auditoria consultada, editada o exportada debe pertenecer a la empresa autenticada.
11. Si el modulo hijo `SST_AUDITS` no esta habilitado para la empresa, backend debe responder `403`.

## Integracion con Gestion Documental

El campo `procedureId` debe relacionarse con documentos existentes de Gestion Documental.

El frontend actualmente prioriza documentos con:

```ts
document.type === "PROCEDURE"
```

Backend puede ofrecer un endpoint filtrado, por ejemplo:

`GET /api/document-management?type=PROCEDURE`

Tambien se puede reutilizar el endpoint actual de documentos si ya soporta filtro por tipo.

## Integracion con ACPM

Las acciones derivadas de auditoria pueden integrarse con ACPM de dos formas:

1. Como acciones internas del modulo Auditorias SST.
2. Como registros reales en ACPM con:

```json
{
  "origin": "AUDIT",
  "type": "CORRECTIVE",
  "name": "Actualizar matriz de seguimiento documental",
  "description": "Accion derivada de la auditoria SST.",
  "responsibleEmployeeId": "uuid-opcional",
  "dueDate": "2026-11-15",
  "relatedDocument": "Auditoria SST 2026"
}
```

Si se crea ACPM real, `SstAuditAction.acpmId` debe guardar la relacion.

## Integracion con modulo de permisos

El backend debe exponer este modulo en `GET /api/modules/me` cuando la empresa tenga habilitado el modulo hijo.

Estructura esperada:

```json
{
  "id": "uuid-del-modulo-hijo",
  "code": "SST_AUDITS",
  "name": "Auditorías SST",
  "route": "/audits",
  "index": 0,
  "parentId": "uuid-del-modulo-padre-sg-sst"
}
```

El modulo padre esperado es:

```json
{
  "code": "SG_SST",
  "name": "Gestion del SG-SST",
  "route": "/sg-sst"
}
```

## Respuesta de errores sugerida

Mantener el formato estandar de SafeCloud:

```json
{
  "ok": false,
  "message": "Validacion fallida",
  "data": null,
  "errors": [
    {
      "message": "internalAuditorId es obligatorio para auditorias internas"
    }
  ],
  "meta": {
    "path": "/api/sst-audits",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 400
  }
}
```

## Notas para integracion frontend

Cuando backend este listo, se deben reemplazar los mocks por:

- `services/sstAuditsService.ts`;
- `types/manager/sstAudits.ts`;
- carga inicial desde `GET /api/sst-audits`;
- creacion desde `POST /api/sst-audits`;
- edicion desde `PUT /api/sst-audits/{id}`;
- detalle desde `GET /api/sst-audits/{id}`;
- carga de documentos desde `POST /api/sst-audits/{auditId}/documents`;
- acciones ACPM desde `/api/sst-audits/{auditId}/actions`;
- descarga desde `GET /api/sst-audits/{id}/export` o PDF frontend con datos reales.

La interfaz actual ya tiene:

- filtro por vigencia, estado y busqueda;
- tabla del plan anual;
- acciones en menu de tres puntos;
- modal de crear/editar;
- modal de cargar documento;
- modal de accion ACPM;
- modal de detalle;
- descarga PDF.

Por eso, la integracion puede hacerse conservando el diseno actual y cambiando solamente la fuente de datos.
