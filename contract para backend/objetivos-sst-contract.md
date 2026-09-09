# Contrato frontend/backend - Objetivos SST

Este documento describe el contrato requerido para conectar el modulo hijo **Objetivos SST** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y estado local, por lo que las politicas, objetivos, seguimientos, difusiones y evidencias se pierden al recargar.

## Ubicacion en frontend

- Modulo padre: `Gestion del SG-SST`
- Modulo hijo: `Objetivos SST`
- Codigo de modulo: `SST_OBJECTIVES`
- Ruta frontend: `/dashboard/sst-objectives`
- Archivo principal: `app/dashboard/sst-objectives/page.tsx`

## Objetivo funcional

Permitir crear y hacer seguimiento a los objetivos del SG-SST de la empresa, relacionandolos con una politica SST y registrando su avance hasta el cumplimiento.

El modulo contempla:

- creacion de politicas SST;
- creacion y edicion de objetivos SST;
- definicion de vigencia anual;
- relacion con politica SST;
- metas e indicadores;
- responsable del seguimiento;
- registro de seguimientos;
- registro de difusion;
- evidencias documentales para seguimientos y difusiones;
- indicadores visuales por estado.

## Estado actual de implementacion

Todo el modulo esta mockeado en memoria:

- politicas iniciales;
- objetivos iniciales;
- creacion de politicas;
- creacion y edicion de objetivos;
- registro de seguimientos;
- registro de difusiones;
- carga de evidencias;
- descarga simulada de evidencia en `.txt`;
- calculo de estado `PENDING`, `IN_PROGRESS` o `FULFILLED`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### SstPolicy

```ts
type SstPolicy = {
  id: string
  companyId: string
  name: string
  description: string
  status: "ACTIVE" | "INACTIVE"
  createdAt: string
  updatedAt: string
}
```

### SstObjective

```ts
type SstObjective = {
  id: string
  companyId: string
  name: string
  year: number
  description: string
  type: ObjectiveType
  customType: string | null
  goal: string
  indicator: number
  measurementUnit: string
  expectedValue: string
  policyId: string
  policy: {
    id: string
    name: string
  }
  trackingResponsible: string
  startDate: string
  endDate: string
  observations: string | null
  status: ObjectiveStatus
  followUpsCount: number
  diffusionsCount: number
  createdAt: string
  updatedAt: string
}
```

### SstObjectiveFollowUp

```ts
type SstObjectiveFollowUp = {
  id: string
  companyId: string
  objectiveId: string
  date: string
  progress: number
  observations: string
  evidenceCount: number
  createdAt: string
  updatedAt: string
}
```

### SstObjectiveDiffusion

```ts
type SstObjectiveDiffusion = {
  id: string
  companyId: string
  objectiveId: string
  medium: string
  date: string
  evidenceCount: number
  createdAt: string
  updatedAt: string
}
```

### SstObjectiveDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type SstObjectiveDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "SST_OBJECTIVE" | "SST_OBJECTIVE_FOLLOW_UP" | "SST_OBJECTIVE_DIFFUSION"
  referenceId: string
  type: "SST_OBJECTIVE_EVIDENCE"
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
enum ObjectiveType {
  ACCIDENTALITY = 'ACCIDENTALITY',
  TRAINING = 'TRAINING',
  RISKS = 'RISKS',
  PREVENTIVE_MEDICINE = 'PREVENTIVE_MEDICINE',
  INSPECTIONS = 'INSPECTIONS',
  EMERGENCIES = 'EMERGENCIES',
  COPASST = 'COPASST',
  PPE = 'PPE',
  OTHER = 'OTHER',
}

enum ObjectiveStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FULFILLED = 'FULFILLED',
}
```

Notas:

- El frontend calcula actualmente el estado asi:
  - `FULFILLED` si `indicator >= 100`;
  - `IN_PROGRESS` si tiene seguimientos o indicador mayor a 0;
  - `PENDING` si no tiene avance.
- Se recomienda que backend devuelva `status` calculado o persistido para mantener consistencia.

## Campos de politica SST

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `name` | string | si | Nombre de la politica SST. |
| `description` | string | si | Descripcion o contenido resumido de la politica. |

## Campos de objetivo SST

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `name` | string | si | Nombre del objetivo. |
| `year` | number | si | Vigencia. Debe ser el anio actual o posterior. |
| `description` | string | si | Descripcion del objetivo. |
| `type` | enum | si | Tipo de objetivo SST. |
| `customType` | string | condicional | Requerido si `type` es `OTHER`. |
| `goal` | string | si | Meta del objetivo. |
| `indicator` | number | si | Porcentaje de avance entre 0 y 100. |
| `measurementUnit` | string | si | Unidad de medida, por defecto `%`. |
| `expectedValue` | string | si | Valor esperado, por ejemplo `90%`. |
| `policyId` | uuid | si | Politica SST relacionada. |
| `trackingResponsible` | string | si | Responsable del seguimiento. |
| `startDate` | date | si | Fecha de inicio. |
| `endDate` | date | si | Fecha fin. No puede ser anterior al inicio. |
| `observations` | string | no | Observaciones generales. |

## Campos de seguimiento

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `date` | date | si | Fecha del seguimiento. |
| `progress` | number | si | Avance entre 0 y 100. No debe disminuir frente al ultimo seguimiento. |
| `observations` | string | si | Observaciones del avance. |
| `evidence` | file | no | Evidencia del seguimiento. |
| `evidenceDescription` | string | no | Descripcion visible de la evidencia. |

## Campos de difusion

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `medium` | string | si | Medio de difusion: correo, cartelera, induccion, reunion, etc. |
| `date` | date | si | Fecha de difusion. |
| `evidence` | file | no | Evidencia de la difusion. |
| `evidenceDescription` | string | no | Descripcion visible de la evidencia. |

## Endpoints de politicas SST

### Crear politica

`POST /api/sst-policies`

Request body:

```json
{
  "name": "Politica de Seguridad y Salud en el Trabajo",
  "description": "Compromiso de prevencion de lesiones, enfermedades laborales y mejora continua del SG-SST."
}
```

### Listar politicas

`GET /api/sst-policies`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `status` | enum | no | `ACTIVE` o `INACTIVE`. |
| `search` | string | no | Busca por nombre o descripcion. |

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
        "name": "Politica de Seguridad y Salud en el Trabajo",
        "description": "Compromiso de prevencion de lesiones, enfermedades laborales y mejora continua del SG-SST.",
        "status": "ACTIVE",
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
    "path": "/api/sst-policies",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Actualizar politica

`PUT /api/sst-policies/{id}`

Request body:

```json
{
  "name": "Politica de prevencion de accidentalidad",
  "description": "Lineamientos para reducir eventos laborales mediante controles, formacion y seguimiento."
}
```

### Cambiar estado de politica

`PUT /api/sst-policies/change-status/{id}`

Request body:

```json
{
  "status": "ACTIVE"
}
```

### Eliminar politica

`DELETE /api/sst-policies/{id}`

## Endpoints de objetivos SST

### Crear objetivo

`POST /api/sst-objectives`

Request body:

```json
{
  "name": "Reducir la accidentalidad laboral",
  "year": 2026,
  "description": "Disminuir la ocurrencia de accidentes mediante intervencion de riesgos prioritarios.",
  "type": "ACCIDENTALITY",
  "customType": null,
  "goal": "Reducir en 15% los accidentes frente al periodo anterior.",
  "indicator": 0,
  "measurementUnit": "%",
  "expectedValue": "85%",
  "policyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "trackingResponsible": "Coordinador SG-SST",
  "startDate": "2026-01-15",
  "endDate": "2026-12-20",
  "observations": "Seguimiento mensual por accidentalidad e investigacion de eventos."
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
    "name": "Reducir la accidentalidad laboral",
    "year": 2026,
    "description": "Disminuir la ocurrencia de accidentes mediante intervencion de riesgos prioritarios.",
    "type": "ACCIDENTALITY",
    "customType": null,
    "goal": "Reducir en 15% los accidentes frente al periodo anterior.",
    "indicator": 0,
    "measurementUnit": "%",
    "expectedValue": "85%",
    "policyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "policy": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Politica de prevencion de accidentalidad"
    },
    "trackingResponsible": "Coordinador SG-SST",
    "startDate": "2026-01-15",
    "endDate": "2026-12-20",
    "observations": "Seguimiento mensual por accidentalidad e investigacion de eventos.",
    "status": "PENDING",
    "followUpsCount": 0,
    "diffusionsCount": 0,
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-objectives",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar objetivos

`GET /api/sst-objectives`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por objetivo, politica, responsable, descripcion o tipo. |
| `year` | number | no | Filtra por vigencia. |
| `type` | enum | no | Filtra por tipo de objetivo. |
| `status` | enum | no | `PENDING`, `IN_PROGRESS`, `FULFILLED`. |
| `policyId` | uuid | no | Filtra por politica relacionada. |
| `startDate` | date | no | Fecha inicial del rango. |
| `endDate` | date | no | Fecha final del rango. |

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
        "name": "Reducir la accidentalidad laboral",
        "year": 2026,
        "description": "Disminuir la ocurrencia de accidentes mediante intervencion de riesgos prioritarios.",
        "type": "ACCIDENTALITY",
        "customType": null,
        "goal": "Reducir en 15% los accidentes frente al periodo anterior.",
        "indicator": 80,
        "measurementUnit": "%",
        "expectedValue": "85%",
        "policyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "policy": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Politica de prevencion de accidentalidad"
        },
        "trackingResponsible": "Coordinador SG-SST",
        "startDate": "2026-01-15",
        "endDate": "2026-12-20",
        "observations": "Seguimiento mensual por accidentalidad e investigacion de eventos.",
        "status": "IN_PROGRESS",
        "followUpsCount": 2,
        "diffusionsCount": 1,
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
    "path": "/api/sst-objectives",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener objetivo por ID

`GET /api/sst-objectives/{id}`

Debe retornar el objetivo completo con:

- politica relacionada;
- seguimientos;
- difusiones;
- evidencias resumidas o contadores.

### Actualizar objetivo

`PUT /api/sst-objectives/{id}`

Request body:

```json
{
  "name": "Reducir la accidentalidad laboral",
  "year": 2026,
  "description": "Disminuir la ocurrencia de accidentes mediante intervencion de riesgos prioritarios.",
  "type": "ACCIDENTALITY",
  "customType": null,
  "goal": "Reducir en 15% los accidentes frente al periodo anterior.",
  "indicator": 80,
  "measurementUnit": "%",
  "expectedValue": "85%",
  "policyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "trackingResponsible": "Coordinador SG-SST",
  "startDate": "2026-01-15",
  "endDate": "2026-12-20",
  "observations": "Seguimiento mensual por accidentalidad e investigacion de eventos."
}
```

### Eliminar objetivo

`DELETE /api/sst-objectives/{id}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/sst-objectives/{id}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Endpoints de seguimiento

### Registrar seguimiento

`POST /api/sst-objectives/{objectiveId}/follow-ups`

Request body:

```json
{
  "date": "2026-06-30",
  "progress": 80,
  "observations": "Avance por cierre de acciones de inspeccion y capacitacion."
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
    "objectiveId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "date": "2026-06-30",
    "progress": 80,
    "observations": "Avance por cierre de acciones de inspeccion y capacitacion.",
    "evidenceCount": 0,
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-objectives/{objectiveId}/follow-ups",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar seguimientos

`GET /api/sst-objectives/{objectiveId}/follow-ups`

### Actualizar seguimiento

`PUT /api/sst-objectives/{objectiveId}/follow-ups/{followUpId}`

### Eliminar seguimiento

`DELETE /api/sst-objectives/{objectiveId}/follow-ups/{followUpId}`

## Endpoints de difusion

### Registrar difusion

`POST /api/sst-objectives/{objectiveId}/diffusions`

Request body:

```json
{
  "medium": "Comite COPASST",
  "date": "2026-02-01"
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
    "objectiveId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "medium": "Comite COPASST",
    "date": "2026-02-01",
    "evidenceCount": 0,
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-objectives/{objectiveId}/diffusions",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar difusiones

`GET /api/sst-objectives/{objectiveId}/diffusions`

### Actualizar difusion

`PUT /api/sst-objectives/{objectiveId}/diffusions/{diffusionId}`

### Eliminar difusion

`DELETE /api/sst-objectives/{objectiveId}/diffusions/{diffusionId}`

## Evidencias documentales

Las evidencias pueden estar asociadas a:

- seguimiento de objetivo;
- difusion de objetivo.

Se recomienda soportar documentos por `referenceType` para reutilizar infraestructura.

### Subir evidencia de seguimiento

`POST /api/sst-objectives/{objectiveId}/follow-ups/{followUpId}/documents`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de evidencia. |
| `type` | string | no | Sugerido: `SST_OBJECTIVE_EVIDENCE`. |
| `isConfirmed` | boolean | no | Confirmacion del soporte. |
| `description` | string | no | Descripcion visible del soporte. |

### Subir evidencia de difusion

`POST /api/sst-objectives/{objectiveId}/diffusions/{diffusionId}/documents`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de evidencia. |
| `type` | string | no | Sugerido: `SST_OBJECTIVE_EVIDENCE`. |
| `isConfirmed` | boolean | no | Confirmacion del soporte. |
| `description` | string | no | Descripcion visible del soporte. |

### Response esperado de documento

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "string",
    "companyId": "string",
    "ownerType": "COMPANY",
    "ownerId": "string",
    "referenceType": "SST_OBJECTIVE_FOLLOW_UP",
    "referenceId": "string",
    "type": "SST_OBJECTIVE_EVIDENCE",
    "originalName": "seguimiento-objetivo.pdf",
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
    "path": "/api/sst-objectives/{objectiveId}/follow-ups/{followUpId}/documents",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar evidencias de seguimiento

`GET /api/sst-objectives/{objectiveId}/follow-ups/{followUpId}/documents`

### Listar evidencias de difusion

`GET /api/sst-objectives/{objectiveId}/diffusions/{diffusionId}/documents`

### Obtener evidencia

`GET /api/sst-objectives/{objectiveId}/documents/{documentId}`

### Eliminar evidencia

`DELETE /api/sst-objectives/{objectiveId}/documents/{documentId}`

## Indicadores esperados

El frontend muestra indicadores superiores. Backend puede permitir calcularlos desde la lista o entregar un endpoint de resumen.

`GET /api/sst-objectives/summary`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "policies": 2,
    "total": 10,
    "pending": 3,
    "inProgress": 5,
    "fulfilled": 2
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-objectives/summary",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Reglas de negocio

- Todo registro debe pertenecer a la empresa autenticada por `companyId`.
- Un objetivo debe relacionarse con una politica SST de la misma empresa.
- No debe permitirse crear objetivos si no existe al menos una politica SST activa.
- `customType` solo debe aceptarse cuando `type` sea `OTHER`.
- `year` debe ser el anio actual o posterior.
- `indicator` debe estar entre 0 y 100.
- `endDate` no puede ser anterior a `startDate`.
- Un seguimiento no debe permitir disminuir el avance frente al ultimo seguimiento registrado.
- Al registrar seguimiento, el campo `indicator` del objetivo debe actualizarse al avance mas reciente.
- Si el avance llega a 100, el estado debe pasar a `FULFILLED`.
- Si tiene avances entre 1 y 99, el estado debe ser `IN_PROGRESS`.
- Si no tiene avances, el estado debe ser `PENDING`.
- Las evidencias deben quedar asociadas al seguimiento o difusion correspondiente.
- No se debe permitir consultar, editar o eliminar informacion de otra empresa.

## Validaciones esperadas

- `policy.name`: requerido, texto no vacio.
- `policy.description`: requerido, texto no vacio.
- `objective.name`: requerido.
- `objective.year`: requerido, entero de cuatro digitos.
- `objective.description`: requerido.
- `objective.type`: requerido, enum valido.
- `objective.customType`: requerido si `type = OTHER`.
- `objective.goal`: requerido.
- `objective.indicator`: requerido, entero entre 0 y 100.
- `objective.measurementUnit`: requerido.
- `objective.expectedValue`: requerido.
- `objective.policyId`: requerido, UUID valido y de la misma empresa.
- `objective.trackingResponsible`: requerido.
- `objective.startDate`: requerido, formato `YYYY-MM-DD`.
- `objective.endDate`: requerido, formato `YYYY-MM-DD`, mayor o igual a `startDate`.
- `followUp.progress`: requerido, entero entre ultimo avance y 100.
- `followUp.observations`: requerido.
- `diffusion.medium`: requerido.
- `diffusion.date`: requerido.
- Archivos: validar extension, MIME type y tamano maximo segun politica global de SafeCloud.

## Permisos sugeridos

Si se agregan permisos especificos para el modulo:

- `Ver objetivos SST`
- `Crear objetivos SST`
- `Editar objetivos SST`
- `Eliminar objetivos SST`
- `Registrar seguimiento objetivos SST`
- `Registrar difusion objetivos SST`

Si se reutilizan permisos existentes, se recomienda vincularlo al modulo padre `SG_SST`.

## Pendientes frontend cuando backend este listo

Cuando backend implemente el contrato, el frontend debe:

- crear `services/sstObjectiveService.ts`;
- crear `types/manager/sst-objective.ts`;
- reemplazar `initialPolicies` por `GET /api/sst-policies`;
- reemplazar `initialObjectives` por `GET /api/sst-objectives`;
- enviar `POST`, `PUT` y `DELETE` reales para politicas y objetivos;
- conectar seguimientos con endpoints reales;
- conectar difusiones con endpoints reales;
- reemplazar evidencias mock por panel documental real;
- eliminar la descarga `.txt` simulada;
- usar `downloadUrl` para descargar o previsualizar soportes.
