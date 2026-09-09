# Contrato frontend/backend - Formacion y Certificaciones

Este documento describe el contrato requerido para conectar el modulo hijo **Formacion y Certificaciones** con backend. Actualmente el modulo usa el responsable SG-SST real cuando existe, pero las certificaciones, filtros, estados calculados y evidencias se manejan de forma mockeada en el frontend.

## Ubicacion en frontend

- Modulo padre: `Gestion del SG-SST`
- Modulo hijo: `Formacion y Certificaciones`
- Codigo de modulo: `SST_TRAINING_CERTIFICATIONS`
- Ruta frontend: `/dashboard/sst-training-certifications`
- Archivo principal: `app/dashboard/sst-training-certifications/page.tsx`
- Dependencia real actual: `services/employeeService.ts` mediante `getSgiResponsible()`

## Objetivo funcional

Permitir controlar la formacion, licencias, cursos y certificaciones del responsable SG-SST, incluyendo:

- responsable SG-SST asignado;
- tipo de competencia;
- competencia personalizada cuando aplique;
- fecha de aprobacion;
- entidad certificadora;
- numero del certificado;
- fecha de vencimiento;
- estado de vigencia;
- evidencias documentales.

## Estado actual de implementacion

El frontend ya consulta el responsable SG-SST desde:

- `GET /api/employee/sgi-responsible`

El resto del modulo esta mockeado en memoria:

- registros iniciales de certificaciones;
- creacion de certificacion;
- edicion de certificacion;
- calculo de estado `VALID` o `EXPIRED`;
- filtros por competencia y estado;
- carga de evidencias;
- descarga simulada de evidencia en `.txt`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### SstTrainingCertification

```ts
type SstTrainingCertification = {
  id: string
  companyId: string
  responsibleEmployeeId: string
  responsibleEmployee: {
    id: string
    name: string
    lastName: string
    email: string
    job?: {
      id: string
      name: string
    } | null
  }
  competenceType: SstCompetenceType
  customCompetenceType: string | null
  approvalDate: string
  certifyingEntity: string
  certificateNumber: string | null
  expirationDate: string
  status: SstCertificationStatus
  evidenceCount: number
  createdAt: string
  updatedAt: string
}
```

### SstTrainingCertificationDocument

Se recomienda reutilizar la entidad global de documentos que ya usa SafeCloud para otros modulos.

```ts
type SstTrainingCertificationDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "SST_TRAINING_CERTIFICATION"
  referenceId: string
  type: "SST_TRAINING_CERTIFICATION"
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
enum SstCompetenceType {
  COURSE_50_HOURS = 'COURSE_50_HOURS',
  COURSE_20_HOURS = 'COURSE_20_HOURS',
  SST_LICENSE = 'SST_LICENSE',
  SST_DIPLOMA = 'SST_DIPLOMA',
  SST_SPECIALIZATION = 'SST_SPECIALIZATION',
  OTHER = 'OTHER',
}

enum SstCertificationStatus {
  VALID = 'VALID',
  EXPIRED = 'EXPIRED',
}
```

Notas:

- El estado puede ser calculado por backend con base en `expirationDate`.
- Si backend prefiere no almacenar `status`, debe enviarlo calculado en los responses para simplificar el frontend.

## Campos del formulario

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `responsibleEmployeeId` | uuid | si | Debe salir del responsable SG-SST activo de la empresa. |
| `competenceType` | enum | si | Tipo de curso, licencia o certificacion. |
| `customCompetenceType` | string | condicional | Requerido si `competenceType` es `OTHER`. |
| `approvalDate` | date | si | Fecha de aprobacion o expedicion. |
| `certifyingEntity` | string | si | Entidad que certifica. |
| `certificateNumber` | string | no | Numero del certificado o licencia. |
| `expirationDate` | date | si | Fecha de vencimiento. No puede ser anterior a `approvalDate`. |

## Endpoints administrativos

### Crear certificacion

`POST /api/sst-training-certifications`

Request body:

```json
{
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "competenceType": "COURSE_50_HOURS",
  "customCompetenceType": null,
  "approvalDate": "2026-01-15",
  "certifyingEntity": "ARL Sura",
  "certificateNumber": "SST-50H-2026-014",
  "expirationDate": "2029-01-15"
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
    "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "responsibleEmployee": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Tomas",
      "lastName": "Alfonso",
      "email": "tomas@empresa.com",
      "job": {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "name": "Responsable SG-SST"
      }
    },
    "competenceType": "COURSE_50_HOURS",
    "customCompetenceType": null,
    "approvalDate": "2026-01-15",
    "certifyingEntity": "ARL Sura",
    "certificateNumber": "SST-50H-2026-014",
    "expirationDate": "2029-01-15",
    "status": "VALID",
    "evidenceCount": 0,
    "createdAt": "2026-09-09T15:30:00.000Z",
    "updatedAt": "2026-09-09T15:30:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-training-certifications",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar certificaciones

`GET /api/sst-training-certifications`

Parametros sugeridos:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por responsable, competencia, entidad o numero de certificado. |
| `responsibleEmployeeId` | uuid | no | Filtra por responsable. |
| `competenceType` | enum | no | Filtra por tipo de competencia. |
| `status` | enum | no | `VALID` o `EXPIRED`. |
| `startDate` | date | no | Fecha inicial de aprobacion. |
| `endDate` | date | no | Fecha final de aprobacion. |
| `expirationStartDate` | date | no | Fecha inicial de vencimiento. |
| `expirationEndDate` | date | no | Fecha final de vencimiento. |

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
        "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "responsibleEmployee": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Tomas",
          "lastName": "Alfonso",
          "email": "tomas@empresa.com",
          "job": {
            "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
            "name": "Responsable SG-SST"
          }
        },
        "competenceType": "COURSE_50_HOURS",
        "customCompetenceType": null,
        "approvalDate": "2026-01-15",
        "certifyingEntity": "ARL Sura",
        "certificateNumber": "SST-50H-2026-014",
        "expirationDate": "2029-01-15",
        "status": "VALID",
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
    "path": "/api/sst-training-certifications",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener certificacion por ID

`GET /api/sst-training-certifications/{id}`

Debe retornar el mismo objeto completo de `SstTrainingCertification`.

### Actualizar certificacion

`PUT /api/sst-training-certifications/{id}`

Request body:

```json
{
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "competenceType": "SST_LICENSE",
  "customCompetenceType": null,
  "approvalDate": "2024-08-20",
  "certifyingEntity": "Secretaria de Salud",
  "certificateNumber": "LIC-SST-78521",
  "expirationDate": "2026-08-20"
}
```

### Eliminar certificacion

`DELETE /api/sst-training-certifications/{id}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/sst-training-certifications/{id}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Catalogos requeridos

### Responsable SG-SST

Ya existe en frontend:

`GET /api/employee/sgi-responsible`

El modulo espera una respuesta que permita construir:

```ts
type ResponsibleSummary = {
  id: string
  name: string
  job: string
  email: string
}
```

### Tipos de competencia

Puede mantenerse como enum frontend o exponerse como catalogo:

`GET /api/sst-training-certifications/catalogs/competence-types`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "code": "COURSE_50_HOURS",
      "name": "Curso Virtual 50 Horas SST"
    },
    {
      "code": "COURSE_20_HOURS",
      "name": "Curso de Actualizacion 20 Horas SST"
    },
    {
      "code": "SST_LICENSE",
      "name": "Licencia SST"
    },
    {
      "code": "SST_DIPLOMA",
      "name": "Diplomado SST"
    },
    {
      "code": "SST_SPECIALIZATION",
      "name": "Especializacion SST"
    },
    {
      "code": "OTHER",
      "name": "Otro"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/sst-training-certifications/catalogs/competence-types",
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
type CertificationEvidence = {
  id: string
  fileName: string
  description: string
  uploadedAt: string
}
```

Se requiere implementar documentos reales con el mismo patron usado en otros modulos:

- crear certificacion;
- habilitar carga de documento;
- listar evidencias;
- ver o descargar;
- eliminar evidencia.

### Subir evidencia

`POST /api/sst-training-certifications/{certificationId}/documents`

Content-Type:

`multipart/form-data`

Request body:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de certificado, licencia o soporte. |
| `type` | string | no | Sugerido: `SST_TRAINING_CERTIFICATION`. |
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
    "referenceType": "SST_TRAINING_CERTIFICATION",
    "referenceId": "string",
    "type": "SST_TRAINING_CERTIFICATION",
    "originalName": "curso-50-horas-sst.pdf",
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
    "path": "/api/sst-training-certifications/{certificationId}/documents",
    "method": "POST",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 201
  }
}
```

### Listar evidencias

`GET /api/sst-training-certifications/{certificationId}/documents`

Debe retornar los documentos asociados a la certificacion.

### Obtener evidencia

`GET /api/sst-training-certifications/{certificationId}/documents/{documentId}`

Debe retornar el metadato del documento o el archivo segun el patron global del backend.

### Eliminar evidencia

`DELETE /api/sst-training-certifications/{certificationId}/documents/{documentId}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/sst-training-certifications/{certificationId}/documents/{documentId}",
    "method": "DELETE",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Reglas de negocio

- Todo registro debe pertenecer a la empresa autenticada por `companyId`.
- El responsable debe ser el empleado asignado como responsable SG-SST de la empresa.
- No debe permitirse crear certificaciones si la empresa no tiene responsable SG-SST asignado.
- `customCompetenceType` solo debe aceptarse cuando `competenceType` sea `OTHER`.
- `expirationDate` no puede ser anterior a `approvalDate`.
- El estado `EXPIRED` debe marcarse cuando `expirationDate` sea anterior a la fecha actual.
- No se debe permitir consultar, modificar o eliminar certificaciones de otra empresa.
- Las evidencias deben quedar asociadas a la certificacion y a la empresa.
- La eliminacion de evidencias deberia respetar la politica global de auditoria o borrado logico.

## Validaciones esperadas

- `responsibleEmployeeId`: requerido, UUID valido, debe pertenecer a la empresa.
- `competenceType`: requerido, enum valido.
- `customCompetenceType`: requerido si `competenceType = OTHER`.
- `approvalDate`: requerido, formato `YYYY-MM-DD`.
- `certifyingEntity`: requerido, texto no vacio.
- `certificateNumber`: opcional.
- `expirationDate`: requerido, formato `YYYY-MM-DD`, mayor o igual a `approvalDate`.
- Archivos: validar extension, MIME type y tamano maximo segun politica global de SafeCloud.

## Indicadores esperados

El frontend muestra indicadores superiores. Backend puede facilitar los datos desde la lista o mediante endpoint especifico:

`GET /api/sst-training-certifications/summary`

Response sugerido:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "total": 10,
    "valid": 7,
    "expired": 3,
    "withEvidence": 8
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-training-certifications/summary",
    "method": "GET",
    "timestamp": "2026-09-09T15:30:00.000Z",
    "statusCode": 200
  }
}
```

## Permisos sugeridos

Si se agregan permisos especificos para el modulo:

- `Ver formacion y certificaciones`
- `Crear formacion y certificaciones`
- `Editar formacion y certificaciones`
- `Eliminar formacion y certificaciones`

Si se reutilizan permisos existentes, se recomienda vincularlo al modulo `SG_SST` y al permiso de gestion del responsable SG-SST.

## Pendientes frontend cuando backend este listo

Cuando backend implemente el contrato, el frontend debe:

- crear `services/sstTrainingCertificationService.ts`;
- crear `types/manager/sst-training-certification.ts`;
- reemplazar `buildInitialRecords` por `GET /api/sst-training-certifications`;
- mantener `getSgiResponsible()` como fuente del responsable;
- enviar `POST`, `PUT` y `DELETE` reales;
- reemplazar `EvidenceDialog` mock por panel documental real;
- conectar vista/descarga con `downloadUrl`;
- eliminar la descarga `.txt` simulada;
- mantener calculo visual de vencimiento o usar `status` entregado por backend.
