# Contrato frontend/backend - Modulos mockeados

Este archivo documenta los modulos que actualmente tienen comportamiento parcial o datos mockeados en el frontend de SafeCloud, para que el backend pueda implementar los contratos necesarios y luego conectarlos sin cambiar la experiencia visual ya construida.

## Modulo hijo: Cargos

### Ubicacion en frontend

- Modulo padre: `Empleados`
- Modulo hijo: `Cargos`
- Ruta frontend: `/dashboard/jobs`
- Archivo principal: `app/dashboard/jobs/page.tsx`
- Servicio actual: `services/jobService.ts`
- Tipos actuales: `types/manager/job.ts`
- Catalogo relacionado: `services/workAreaService.ts`

### Objetivo funcional

Permitir administrar los cargos o puestos de trabajo de la empresa, vinculados a un area de trabajo, con informacion del perfil ocupacional que sirve como soporte para remitir al medico ocupacional:

- nombre del cargo;
- area de trabajo;
- descripcion de tareas;
- medio donde desarrolla la labor;
- nivel de riesgo;
- estado;
- evidencias documentales del perfil de cargo.

### Estado actual de implementacion

El frontend ya consume endpoints reales para crear, listar, editar, eliminar y activar cargos:

- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/options`
- `GET /api/jobs/{id}`
- `PUT /api/jobs/{id}`
- `DELETE /api/jobs/{id}`
- `PUT /api/jobs/active/{id}`

Sin embargo, estos campos todavia se manejan como estado local/mock en el frontend y se pierden al recargar:

- `workEnvironment`
- `riskLevel`
- `evidences`

La carga de evidencias tambien esta mockeada: actualmente solo registra nombre, descripcion y fecha en memoria, y genera una descarga `.txt` local como simulacion.

### Entidad requerida

Se recomienda ampliar la entidad existente `Job` o `JobPosition`.

```ts
type Job = {
  id: string
  companyId: string
  name: string
  description: string
  workAreaId: string
  workArea: {
    id: string
    name: string
  }
  workEnvironment: string | null
  riskLevel: JobRiskLevel
  status: JobStatus
  createdAt: string
  updatedAt: string
}
```

### Enums requeridos

```ts
enum JobStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

enum JobRiskLevel {
  RIESGO_I = 'RIESGO_I',
  RIESGO_II = 'RIESGO_II',
  RIESGO_III = 'RIESGO_III',
  RIESGO_IV = 'RIESGO_IV',
  RIESGO_V = 'RIESGO_V',
}
```

### Campos del formulario

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `name` | string | si | Nombre del cargo. |
| `workAreaId` | uuid | si | Debe pertenecer a la misma empresa. |
| `description` | string | no | Descripcion de tareas principales. |
| `workEnvironment` | string | no | Medio donde desarrolla la labor. Actualmente mockeado. |
| `riskLevel` | enum | si | Actualmente mockeado. Valor por defecto: `RIESGO_I`. |
| `status` | enum | no | Solo visible al editar. |

### Crear cargo

`POST /api/jobs`

Request body esperado:

```json
{
  "name": "Analista SST",
  "description": "Realiza seguimiento documental y operativo del sistema de gestion.",
  "workAreaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workEnvironment": "Oficina administrativa y visitas ocasionales a planta.",
  "riskLevel": "RIESGO_I"
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
    "name": "Analista SST",
    "description": "Realiza seguimiento documental y operativo del sistema de gestion.",
    "workAreaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "workArea": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Administracion"
    },
    "workEnvironment": "Oficina administrativa y visitas ocasionales a planta.",
    "riskLevel": "RIESGO_I",
    "status": "ACTIVE",
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/jobs",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar cargos

`GET /api/jobs`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por cargo, descripcion, area, medio de labor o nivel de riesgo. |
| `workAreaId` | uuid | no | Filtra por area de trabajo. |
| `status` | enum | no | `ACTIVE` o `INACTIVE`. |
| `riskLevel` | enum | no | Filtra por nivel de riesgo. |

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
        "name": "Analista SST",
        "description": "Realiza seguimiento documental y operativo del sistema de gestion.",
        "workAreaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "workArea": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Administracion"
        },
        "workEnvironment": "Oficina administrativa y visitas ocasionales a planta.",
        "riskLevel": "RIESGO_I",
        "status": "ACTIVE",
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
    "path": "/api/jobs",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener cargo por ID

`GET /api/jobs/{id}`

Debe retornar el mismo objeto completo de `Job`, incluyendo:

- `workArea`;
- `workEnvironment`;
- `riskLevel`;
- `status`;
- contador o listado resumido de evidencias, si aplica.

### Actualizar cargo

`PUT /api/jobs/{id}`

Request body esperado:

```json
{
  "name": "Analista SST",
  "description": "Actualizacion de tareas del cargo.",
  "workAreaId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workEnvironment": "Oficina administrativa, planta y campo ocasional.",
  "riskLevel": "RIESGO_II",
  "status": "ACTIVE"
}
```

Notas:

- `status` puede mantenerse si el backend ya lo acepta en el PUT.
- Si el backend prefiere cambio de estado independiente, se debe usar endpoint separado y el PUT no deberia exigir `status`.

### Eliminar cargo

`DELETE /api/jobs/{id}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/jobs/{id}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Activar/Inactivar cargo

Actualmente el frontend usa:

`PUT /api/jobs/active/{id}`

Para una gestion mas clara se recomienda soportar tambien:

`PUT /api/jobs/change-status/{id}`

Request body:

```json
{
  "status": "ACTIVE"
}
```

Valores permitidos:

- `ACTIVE`
- `INACTIVE`

### Opciones de cargos

`GET /api/jobs/options`

Uso frontend:

- selects de empleados;
- modulos relacionados donde se necesita seleccionar cargo sin cargar toda la entidad.

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Analista SST"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/jobs/options",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Evidencias documentales del cargo

### Estado actual

La evidencia del perfil de cargo esta mockeada en frontend mediante:

```ts
type JobEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
}
```

El frontend necesita reemplazar esto por carga real de documentos, con el mismo patron usado en otros modulos:

- crear o tener un registro principal;
- habilitar panel de documentos;
- subir archivo;
- listar documentos cargados;
- ver o descargar;
- eliminar.

### Tipo de documento sugerido

Agregar un tipo especifico para evitar errores de validacion por recurso:

```ts
enum DocumentType {
  JOB_PROFILE = 'JOB_PROFILE'
}
```

Si el backend maneja tipos globales por recurso, el tipo enviado desde frontend para cargos debe ser:

```json
{
  "type": "JOB_PROFILE",
  "isConfirmed": true
}
```

### Subir evidencia

`POST /api/jobs/{jobId}/documents`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de soporte. |
| `type` | string | no | Sugerido: `JOB_PROFILE`. |
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
    "ownerType": "COMPANY",
    "ownerId": "string",
    "referenceType": "JOB",
    "referenceId": "string",
    "type": "JOB_PROFILE",
    "originalName": "perfil-cargo.pdf",
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
    "path": "/api/jobs/{jobId}/documents",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar evidencias

`GET /api/jobs/{jobId}/documents`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "string",
      "companyId": "string",
      "ownerType": "COMPANY",
      "ownerId": "string",
      "referenceType": "JOB",
      "referenceId": "string",
      "type": "JOB_PROFILE",
      "originalName": "perfil-cargo.pdf",
      "mimeType": "application/pdf",
      "size": 123456,
      "storageProvider": "DIGITAL_OCEAN_SPACES",
      "isConfirmed": true,
      "downloadUrl": "string",
      "createdAt": "2026-09-09T15:30:00.000Z",
      "createdBy": "string"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/jobs/{jobId}/documents",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener evidencia

`GET /api/jobs/{jobId}/documents/{documentId}`

Debe retornar el metadato del documento o el archivo segun el patron actual del backend.

### Eliminar evidencia

`DELETE /api/jobs/{jobId}/documents/{documentId}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/jobs/{jobId}/documents/{documentId}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Reglas de negocio

- Un cargo siempre debe pertenecer a una empresa por `companyId`.
- Un cargo debe estar vinculado a un area de trabajo existente y activa de la misma empresa.
- No debe permitirse asociar un cargo a un area de otra empresa.
- No deberia eliminarse fisicamente un cargo si ya tiene empleados vinculados; en ese caso se recomienda inactivarlo.
- `workEnvironment` y `riskLevel` deben persistirse en backend para que el perfil ocupacional no se pierda al recargar.
- Las evidencias documentales deben guardarse en el sistema de archivos usado por SafeCloud, actualmente DigitalOcean Spaces cuando aplique.
- La visualizacion del frontend espera poder conocer cuantas evidencias tiene cada cargo.

## Validaciones esperadas

- `name`: requerido, texto no vacio.
- `workAreaId`: requerido, UUID valido, debe existir y pertenecer a la empresa.
- `description`: texto opcional.
- `workEnvironment`: texto opcional.
- `riskLevel`: requerido, enum valido.
- `status`: enum valido cuando se permita actualizar.
- Archivos: validar tamano maximo, extension y MIME type segun politica global de SafeCloud.

## Permisos sugeridos

Si se mantiene el esquema actual de permisos, el modulo debe respetar:

- `Ver puestos de trabajo`
- `Crear puestos de trabajo`
- `Editar puestos de trabajo`
- `Eliminar puestos de trabajo`

Si se renombra oficialmente a Cargos, se recomienda mantener compatibilidad interna con `JOBS` y solo cambiar etiquetas visibles.

## Pendientes frontend cuando backend este listo

Cuando el backend implemente los campos y documentos de cargos, el frontend debe:

- agregar `workEnvironment` y `riskLevel` a `types/manager/job.ts`;
- enviar esos campos desde `createJob` y `updateJob`;
- eliminar `profileMetadata` local de `app/dashboard/jobs/page.tsx`;
- reemplazar el modal mock de evidencia por un panel documental real;
- usar `evidenceCount` o documentos reales para mostrar el contador de evidencias;
- conectar descarga/vista previa con `downloadUrl`.
