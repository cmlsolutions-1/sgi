# Contrato frontend/backend - Custodia

Este documento describe el contrato requerido para conectar el modulo hijo **Custodia** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend, genera el compromiso de confidencialidad localmente y conserva los soportes solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Empleados`
- Modulo hijo: `Custodia`
- Codigo de modulo: `CUSTODY`
- Ruta frontend: `/dashboard/custody`
- Archivo principal: `app/dashboard/custody/page.tsx`

## Objetivo funcional

Permitir registrar y evidenciar la custodia de historias clinicas ocupacionales a cargo de una IPS, medico especialista en SST o entidad/persona autorizada, conservando los soportes documentales y el compromiso de confidencialidad firmado por el responsable.

El modulo contempla:

- registro de institucion custodio;
- registro de persona responsable;
- fecha de inicio de custodia;
- observaciones;
- descarga del compromiso de confidencialidad para firma;
- carga del soporte de custodia;
- carga del compromiso de confidencialidad firmado;
- visualizacion y descarga de soportes;
- criterio de cumplimiento segun soportes cargados.

## Fundamento funcional

El item busca evidenciar que la custodia de las historias clinicas ocupacionales esta a cargo de una institucion prestadora de servicios en SST o del medico que practica las evaluaciones medicas ocupacionales.

Tambien debe conservar soportes que demuestren dicha custodia y el compromiso de confidencialidad del responsable, debido al manejo de informacion sensible.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- creacion y edicion de registros;
- eliminacion local;
- busqueda por IPS, responsable o soporte;
- descarga de compromiso de confidencialidad generado con `jsPDF` y `jspdf-autotable`;
- carga simulada de soporte de custodia;
- carga simulada de compromiso firmado;
- vista previa local de PDF, imagen o texto;
- descarga simulada de soporte.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### CustodyRecord

Entidad principal.

```ts
type CustodyRecord = {
  id: string
  companyId: string
  custodianInstitution: string
  responsiblePerson: string
  custodyStartDate: string
  observations: string | null
  status: CustodyStatus
  custodyEvidenceId: string | null
  custodyEvidence: CustodyDocument | null
  confidentialityEvidenceId: string | null
  confidentialityEvidence: CustodyDocument | null
  isComplete: boolean
  createdAt: string
  updatedAt: string
  createdByUserId: string
}
```

### CustodyDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type CustodyDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "CUSTODY"
  referenceId: string
  type: CustodyDocumentType
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

### CustodyCommitment

Opcional si backend decide guardar metadatos del compromiso generado.

```ts
type CustodyCommitment = {
  id: string
  companyId: string
  custodyRecordId: string
  generatedAt: string
  generatedByUserId: string
  documentId: string | null
  status: "GENERATED" | "SIGNED_UPLOADED"
}
```

## Enums requeridos

### CustodyStatus

```ts
enum CustodyStatus {
  PENDING_SUPPORTS = 'PENDING_SUPPORTS',
  COMPLETE = 'COMPLETE',
  INACTIVE = 'INACTIVE',
}
```

Labels frontend:

- `PENDING_SUPPORTS`: Pendiente soportes
- `COMPLETE`: Completo
- `INACTIVE`: Inactivo

### CustodyDocumentType

```ts
enum CustodyDocumentType {
  CUSTODY_SUPPORT = 'CUSTODY_SUPPORT',
  CONFIDENTIALITY_COMMITMENT_SIGNED = 'CONFIDENTIALITY_COMMITMENT_SIGNED',
  CONFIDENTIALITY_COMMITMENT_GENERATED = 'CONFIDENTIALITY_COMMITMENT_GENERATED',
}
```

## Campos del formulario de custodia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `custodianInstitution` | string | si | IPS, medico especialista o entidad/persona responsable de la custodia. |
| `responsiblePerson` | string | si | Persona responsable de la custodia. |
| `custodyStartDate` | date | si | Fecha de inicio de custodia. |
| `observations` | string | no | Alcance, condiciones o notas de custodia. |

## Campos de evidencia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo PDF, imagen o soporte documental. |
| `type` | enum | si | `CUSTODY_SUPPORT` o `CONFIDENTIALITY_COMMITMENT_SIGNED`. |
| `description` | string | no | Descripcion visible del soporte. |
| `isConfirmed` | boolean | no | Confirmacion de validez del soporte. Por defecto `true`. |

## Regla de cumplimiento

Un registro de custodia se considera completo cuando:

1. existe un documento tipo `CUSTODY_SUPPORT`; y
2. existe un documento tipo `CONFIDENTIALITY_COMMITMENT_SIGNED`.

Si falta alguno de los dos documentos, el registro debe mostrarse como pendiente.

## Reglas de negocio

1. El registro pertenece siempre a la empresa del usuario autenticado.
2. `custodianInstitution`, `responsiblePerson` y `custodyStartDate` son obligatorios.
3. El soporte de custodia debe demostrar que las historias clinicas ocupacionales estan bajo custodia de una IPS o medico autorizado.
4. El compromiso firmado debe corresponder a la persona responsable registrada.
5. La fecha de inicio de custodia no debe ser posterior a la fecha actual, salvo que backend decida permitir programaciones futuras.
6. La eliminacion puede ser fisica o logica. Para auditoria se recomienda inactivacion logica.
7. La descarga del compromiso de confidencialidad puede generarse en frontend o backend, pero backend debe poder conservar el soporte firmado.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear registro de custodia

`POST /api/custody`

Request body:

```json
{
  "custodianInstitution": "IPS Salud Ocupacional Integral",
  "responsiblePerson": "Dra. Maria Perez",
  "custodyStartDate": "2026-01-12",
  "observations": "La IPS conserva la custodia de las historias clinicas ocupacionales derivadas de evaluaciones medicas."
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
    "custodianInstitution": "IPS Salud Ocupacional Integral",
    "responsiblePerson": "Dra. Maria Perez",
    "custodyStartDate": "2026-01-12",
    "observations": "La IPS conserva la custodia de las historias clinicas ocupacionales derivadas de evaluaciones medicas.",
    "status": "PENDING_SUPPORTS",
    "custodyEvidenceId": null,
    "custodyEvidence": null,
    "confidentialityEvidenceId": null,
    "confidentialityEvidence": null,
    "isComplete": false,
    "createdAt": "2026-09-10T14:00:00.000Z",
    "updatedAt": "2026-09-10T14:00:00.000Z",
    "createdByUserId": "string"
  },
  "errors": null,
  "meta": {
    "path": "/api/custody",
    "method": "POST",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar registros de custodia

`GET /api/custody`

Parametros:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por institucion, responsable o nombre de soporte. |
| `status` | enum | no | `PENDING_SUPPORTS`, `COMPLETE`, `INACTIVE`. |
| `startDate` | date | no | Fecha inicial de custodia. |
| `endDate` | date | no | Fecha final de custodia. |
| `hasCustodyEvidence` | boolean | no | Filtra si tiene soporte de custodia. |
| `hasConfidentialityEvidence` | boolean | no | Filtra si tiene compromiso firmado. |

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
        "custodianInstitution": "IPS Salud Ocupacional Integral",
        "responsiblePerson": "Dra. Maria Perez",
        "custodyStartDate": "2026-01-12",
        "observations": "Contrato y certificacion de custodia con IPS.",
        "status": "COMPLETE",
        "custodyEvidenceId": "document-id",
        "custodyEvidence": {
          "id": "document-id",
          "originalName": "contrato-custodia-historias-clinicas.pdf",
          "mimeType": "application/pdf",
          "downloadUrl": "string",
          "createdAt": "2026-01-13T09:30:00.000Z"
        },
        "confidentialityEvidenceId": "document-id-2",
        "confidentialityEvidence": {
          "id": "document-id-2",
          "originalName": "compromiso-confidencialidad-firmado.pdf",
          "mimeType": "application/pdf",
          "downloadUrl": "string",
          "createdAt": "2026-01-14T10:00:00.000Z"
        },
        "isComplete": true,
        "createdAt": "2026-01-12T08:00:00.000Z",
        "updatedAt": "2026-01-14T10:00:00.000Z",
        "createdByUserId": "string"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/custody",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener detalle

`GET /api/custody/{id}`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "custodianInstitution": "IPS Salud Ocupacional Integral",
    "responsiblePerson": "Dra. Maria Perez",
    "custodyStartDate": "2026-01-12",
    "observations": "La IPS conserva la custodia de las historias clinicas ocupacionales.",
    "status": "COMPLETE",
    "custodyEvidence": null,
    "confidentialityEvidence": null,
    "isComplete": true,
    "createdAt": "2026-01-12T08:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "createdByUserId": "string"
  },
  "errors": null,
  "meta": {
    "path": "/api/custody/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

### Actualizar registro

`PUT /api/custody/{id}`

Request body:

```json
{
  "custodianInstitution": "IPS Salud Ocupacional Integral",
  "responsiblePerson": "Dra. Maria Perez",
  "custodyStartDate": "2026-01-12",
  "observations": "Actualizacion de alcance de custodia."
}
```

Response esperado: mismo objeto `CustodyRecord` actualizado.

### Eliminar o inactivar registro

`DELETE /api/custody/{id}`

Respuesta:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/custody/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "method": "DELETE",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

## Endpoints de documentos/evidencias

### Cargar soporte

`POST /api/custody/{id}/documents`

Request `multipart/form-data`:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de soporte. |
| `type` | enum | si | `CUSTODY_SUPPORT` o `CONFIDENTIALITY_COMMITMENT_SIGNED`. |
| `description` | string | no | Descripcion visible del documento. |
| `isConfirmed` | boolean | no | Por defecto `true`. |

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
    "referenceType": "CUSTODY",
    "referenceId": "string",
    "type": "CUSTODY_SUPPORT",
    "originalName": "contrato-custodia-historias-clinicas.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "storageProvider": "LOCAL",
    "isConfirmed": true,
    "downloadUrl": "string",
    "description": "Contrato y certificacion de custodia con IPS.",
    "createdAt": "2026-09-10T14:00:00.000Z",
    "createdBy": "string"
  },
  "errors": null,
  "meta": {
    "path": "/api/custody/string/documents",
    "method": "POST",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar documentos del registro

`GET /api/custody/{id}/documents`

Parametros opcionales:

- `type`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": [],
  "errors": null,
  "meta": {
    "path": "/api/custody/string/documents",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener documento

`GET /api/custody/{id}/documents/{documentId}`

Response esperado: objeto `CustodyDocument`.

### Eliminar documento

`DELETE /api/custody/{id}/documents/{documentId}`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/custody/string/documents/string",
    "method": "DELETE",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

## Endpoint de compromiso de confidencialidad

El frontend actualmente genera el compromiso en PDF localmente. Backend puede implementar esta generacion para mantener trazabilidad.

### Descargar compromiso generado

`GET /api/custody/{id}/confidentiality-commitment`

Response:

- `Content-Type: application/pdf`
- Archivo PDF con el compromiso de confidencialidad.

Contenido minimo:

- titulo: `Compromiso de Confidencialidad`;
- institucion custodio;
- persona responsable;
- fecha de inicio de custodia;
- observaciones;
- declaracion de confidencialidad;
- espacio para firma de responsable;
- espacio para firma de representante de la empresa;
- fecha de generacion.

## Indicadores para barra compacta

Backend puede devolverlos desde un endpoint resumen o frontend puede calcularlos a partir de la lista.

### Resumen sugerido

`GET /api/custody/summary`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "total": 10,
    "withCustodyEvidence": 8,
    "withConfidentiality": 7,
    "complete": 7,
    "pending": 3
  },
  "errors": null,
  "meta": {
    "path": "/api/custody/summary",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

## Validaciones esperadas

- `custodianInstitution` no debe estar vacio.
- `responsiblePerson` no debe estar vacio.
- `custodyStartDate` debe ser fecha valida.
- `type` de documento debe pertenecer a `CustodyDocumentType`.
- Para marcar `COMPLETE`, deben existir `CUSTODY_SUPPORT` y `CONFIDENTIALITY_COMMITMENT_SIGNED`.
- Los archivos deben respetar limites globales de tamano y tipos permitidos.
- El usuario solo puede consultar registros de su empresa.

## Integracion con otros modulos

Este modulo se relaciona con:

- `EMPLOYEE_MANAGEMENT`: por la custodia de historias clinicas ocupacionales de funcionarios.
- `MEDICAL_EVALUATIONS`: fuente conceptual de las historias clinicas ocupacionales.
- sistema documental global: almacenamiento, descarga y visualizacion de soportes.
- permisos: modulo hijo `CUSTODY` bajo modulo padre `EMPLOYEE`.

## Notas para frontend

Cuando backend este disponible, frontend debe reemplazar:

- `initialRecords`;
- estado local `records`;
- `saveRecord`;
- `saveEvidence`;
- `deleteRecord`;
- `viewEvidence` con blobs reales desde `downloadUrl`;
- `downloadCommitment` si backend ofrece PDF generado.

Se recomienda crear:

- `services/custodyService.ts`;
- `types/manager/custody.ts`;
- funciones de carga/descarga de documentos reutilizando el patron de documentos existente en SafeCloud.

