# Contrato frontend/backend - Riesgo Especial

Este documento describe el contrato requerido para conectar el modulo hijo **Riesgo Especial** con backend. Actualmente el modulo esta implementado en frontend con datos mockeados y estado local, por lo que toda la informacion se pierde al recargar.

## Ubicacion en frontend

- Modulo padre: `Empleados`
- Modulo hijo: `Riesgo Especial`
- Codigo de modulo: `SPECIAL_RISK`
- Ruta frontend: `/dashboard/special-risk`
- Archivo principal: `app/dashboard/special-risk/page.tsx`

## Objetivo funcional

Registrar y controlar funcionarios que desarrollan actividades catalogadas como riesgo especial, incluyendo:

- funcionario asociado;
- cargo del funcionario;
- tipo de actividad especial;
- actividad personalizada cuando aplique;
- fecha de inicio;
- fecha de finalizacion;
- si requiere cotizacion especial;
- estado del registro;
- observaciones;
- evidencias documentales o fotograficas.

## Estado actual de implementacion

El frontend tiene mockeado:

- lista de funcionarios;
- lista inicial de riesgos especiales;
- creacion de registros;
- edicion de registros;
- filtros;
- detalle;
- carga de evidencias;
- descarga simulada de evidencia en `.txt`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### SpecialRisk

```ts
type SpecialRisk = {
  id: string
  companyId: string
  employeeId: string
  employee: {
    id: string
    name: string
    lastName: string
    documentNumber?: string
  }
  jobId: string | null
  job: {
    id: string
    name: string
  } | null
  activity: SpecialRiskActivity
  customActivity: string | null
  startDate: string
  endDate: string
  specialContribution: boolean
  status: SpecialRiskStatus
  observations: string | null
  evidenceCount: number
  createdAt: string
  updatedAt: string
}
```

### SpecialRiskDocument

Se recomienda reutilizar la entidad global de documentos usada por los demas modulos.

```ts
type SpecialRiskDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "SPECIAL_RISK"
  referenceId: string
  type: "SPECIAL_RISK_EVIDENCE"
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
enum SpecialRiskStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

enum SpecialRiskActivity {
  MINERIA_SUBTERRANEA = 'MINERIA_SUBTERRANEA',
  ALTAS_TEMPERATURAS = 'ALTAS_TEMPERATURAS',
  RADIACIONES_IONIZANTES = 'RADIACIONES_IONIZANTES',
  BOMBEROS = 'BOMBEROS',
  AVIACION = 'AVIACION',
  TRABAJO_TUNELES = 'TRABAJO_TUNELES',
  SUSTANCIAS_PELIGROSAS = 'SUSTANCIAS_PELIGROSAS',
  OTRA = 'OTRA',
}
```

## Campos del formulario

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `employeeId` | uuid | si | Funcionario asociado al riesgo especial. |
| `activity` | enum | si | Tipo de actividad especial. |
| `customActivity` | string | condicional | Requerido si `activity` es `OTRA`. |
| `startDate` | date | si | Fecha de inicio de la exposicion o actividad. |
| `endDate` | date | si | Fecha de finalizacion. No puede ser anterior al inicio. |
| `specialContribution` | boolean | si | Define si aplica cotizacion especial. |
| `status` | enum | si | `ACTIVE` o `FINISHED`. |
| `observations` | string | no | Observaciones, controles o contexto. |

## Endpoints administrativos

### Crear riesgo especial

`POST /api/special-risks`

Request body:

```json
{
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "activity": "ALTAS_TEMPERATURAS",
  "customActivity": null,
  "startDate": "2026-09-09",
  "endDate": "2026-12-31",
  "specialContribution": true,
  "status": "ACTIVE",
  "observations": "Exposicion programada por labores en area de calderas."
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
    "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "employee": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Carlos",
      "lastName": "Ramirez"
    },
    "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "job": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Operario de mantenimiento"
    },
    "activity": "ALTAS_TEMPERATURAS",
    "customActivity": null,
    "startDate": "2026-09-09",
    "endDate": "2026-12-31",
    "specialContribution": true,
    "status": "ACTIVE",
    "observations": "Exposicion programada por labores en area de calderas.",
    "evidenceCount": 0,
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/special-risks",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar riesgos especiales

`GET /api/special-risks`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por funcionario, cargo o actividad. |
| `employeeId` | uuid | no | Filtra por funcionario. |
| `activity` | enum | no | Filtra por tipo de actividad especial. |
| `status` | enum | no | `ACTIVE` o `FINISHED`. |
| `specialContribution` | boolean | no | Filtra registros con cotizacion especial. |
| `startDate` | date | no | Fecha inicial para rango. |
| `endDate` | date | no | Fecha final para rango. |

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
        "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "employee": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Carlos",
          "lastName": "Ramirez"
        },
        "jobId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "job": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Operario de mantenimiento"
        },
        "activity": "ALTAS_TEMPERATURAS",
        "customActivity": null,
        "startDate": "2026-09-09",
        "endDate": "2026-12-31",
        "specialContribution": true,
        "status": "ACTIVE",
        "observations": "Exposicion programada por labores en area de calderas.",
        "evidenceCount": 1,
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
    "path": "/api/special-risks",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener riesgo especial por ID

`GET /api/special-risks/{id}`

Debe retornar el mismo objeto completo de `SpecialRisk`.

### Actualizar riesgo especial

`PUT /api/special-risks/{id}`

Request body:

```json
{
  "employeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "activity": "RADIACIONES_IONIZANTES",
  "customActivity": null,
  "startDate": "2026-09-10",
  "endDate": "2026-10-15",
  "specialContribution": false,
  "status": "FINISHED",
  "observations": "Actividad finalizada con seguimiento documental completo."
}
```

### Cambiar estado

Se recomienda separar el cambio de estado para mantener el mismo patron de otros modulos.

`PUT /api/special-risks/change-status/{id}`

Request body:

```json
{
  "status": "ACTIVE"
}
```

Valores permitidos:

- `ACTIVE`
- `FINISHED`

### Eliminar riesgo especial

`DELETE /api/special-risks/{id}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/special-risks/{id}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Catalogos requeridos

### Funcionarios disponibles

El frontend puede reutilizar el endpoint general de empleados, pero para selects se recomienda un endpoint liviano:

`GET /api/employee/options`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Carlos",
      "lastName": "Ramirez",
      "job": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Operario de mantenimiento"
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

### Actividades de riesgo especial

Puede manejarse como enum fijo en frontend o exponerse como catalogo:

`GET /api/special-risks/catalogs/activities`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "code": "MINERIA_SUBTERRANEA",
      "name": "Mineria subterranea"
    },
    {
      "code": "ALTAS_TEMPERATURAS",
      "name": "Exposicion a altas temperaturas"
    },
    {
      "code": "RADIACIONES_IONIZANTES",
      "name": "Exposicion a radiaciones ionizantes"
    },
    {
      "code": "BOMBEROS",
      "name": "Bomberos"
    },
    {
      "code": "AVIACION",
      "name": "Aviacion"
    },
    {
      "code": "TRABAJO_TUNELES",
      "name": "Trabajo en tuneles"
    },
    {
      "code": "SUSTANCIAS_PELIGROSAS",
      "name": "Manipulacion de sustancias peligrosas"
    },
    {
      "code": "OTRA",
      "name": "Otra"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/special-risks/catalogs/activities",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Evidencias documentales

### Estado actual

La evidencia se maneja en memoria:

```ts
type SpecialRiskEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
}
```

Se requiere implementar documentos reales con el mismo patron usado en otros modulos de SafeCloud.

### Subir evidencia

`POST /api/special-risks/{specialRiskId}/documents`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de evidencia. |
| `type` | string | no | Sugerido: `SPECIAL_RISK_EVIDENCE`. |
| `isConfirmed` | boolean | no | Confirmacion del soporte. |
| `description` | string | no | Descripcion visible del soporte. |

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "string",
    "companyId": "string",
    "ownerType": "EMPLOYEE",
    "ownerId": "string",
    "referenceType": "SPECIAL_RISK",
    "referenceId": "string",
    "type": "SPECIAL_RISK_EVIDENCE",
    "originalName": "soporte-riesgo-especial.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "storageProvider": "DIGITAL_OCEAN_SPACES",
    "isConfirmed": true,
    "downloadUrl": "string",
    "createdAt": "2026-09-09T15:30:00.000Z",
    "createdBy": "string"
  },
  "errors": null,
  "meta": {
    "path": "/api/special-risks/{specialRiskId}/documents",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar evidencias

`GET /api/special-risks/{specialRiskId}/documents`

Debe retornar una lista de documentos asociados al registro de riesgo especial.

### Obtener evidencia

`GET /api/special-risks/{specialRiskId}/documents/{documentId}`

Debe retornar el metadato del documento o el archivo segun el patron global del backend.

### Eliminar evidencia

`DELETE /api/special-risks/{specialRiskId}/documents/{documentId}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/special-risks/{specialRiskId}/documents/{documentId}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Reglas de negocio

- Todo registro debe pertenecer a la empresa autenticada por `companyId`.
- El funcionario seleccionado debe existir, estar activo y pertenecer a la misma empresa.
- El cargo mostrado debe tomarse del funcionario en backend para evitar inconsistencias.
- `customActivity` solo debe aceptarse cuando `activity` sea `OTRA`.
- `endDate` no puede ser anterior a `startDate`.
- No se debe permitir consultar, editar o eliminar registros de otra empresa.
- Las evidencias no deben eliminarse fisicamente si existe una politica de auditoria; se puede manejar borrado logico.
- El estado `FINISHED` debe conservar el historial y las evidencias.

## Validaciones esperadas

- `employeeId`: requerido, UUID valido.
- `activity`: requerido, enum valido.
- `customActivity`: requerido si `activity = OTRA`.
- `startDate`: requerido, formato `YYYY-MM-DD`.
- `endDate`: requerido, formato `YYYY-MM-DD`, mayor o igual a `startDate`.
- `specialContribution`: requerido, boolean.
- `status`: requerido, enum valido.
- `observations`: opcional.
- Archivos: validar extension, MIME type y tamano maximo segun politica global.

## Permisos sugeridos

Si se agregan permisos especificos para el modulo:

- `Ver riesgo especial`
- `Crear riesgo especial`
- `Editar riesgo especial`
- `Eliminar riesgo especial`

Si se reutilizan permisos existentes del modulo de empleados, se recomienda mantenerlo al menos restringido a usuarios con permisos de gestion de empleados o SG-SST.

## Pendientes frontend cuando backend este listo

Cuando backend implemente el contrato, el frontend debe:

- crear `services/specialRiskService.ts`;
- crear `types/manager/special-risk.ts`;
- reemplazar `initialRecords` por `GET /api/special-risks`;
- reemplazar `employees` mock por endpoint real de empleados/opciones;
- enviar `POST`, `PUT` y cambio de estado a backend;
- reemplazar `EvidenceDialog` mock por panel documental real;
- conectar vista/descarga con `downloadUrl`;
- agregar manejo de loading y errores con `toast`.
