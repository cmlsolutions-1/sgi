# Contrato frontend/backend - Matriz Legal

Este documento describe el contrato requerido para conectar el modulo hijo **Matriz Legal** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y conserva el normograma/evidencias solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Riesgos`
- Modulo hijo: `Matriz Legal`
- Codigo de modulo: `LEGAL_MATRIX`
- Ruta frontend: `/dashboard/legal-matrix`
- Archivo principal: `app/dashboard/legal-matrix/page.tsx`

## Objetivo funcional

Permitir construir y mantener el normograma legal aplicable al SG-SST de la empresa, registrando norma por norma, fecha de emision, fecha de vencimiento, entidad emisora, estado vigente/vencido y soporte documental.

El modulo contempla:

- creacion y edicion de items del normograma;
- tipo de documento legal;
- numero de norma;
- fecha de emision;
- fecha de vencimiento;
- entidad emisora;
- estado calculado vigente/vencido;
- carga de documento legal de soporte desde acciones;
- visualizacion de evidencia legal;
- descarga de evidencia;
- busqueda por tipo, numero, emisor o archivo;
- tabla con estilo de normograma.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- creacion y edicion en memoria;
- carga local de evidencia;
- vista previa local de PDF, imagen o texto;
- descarga simulada de evidencia;
- estado `Vigente` o `Vencido` calculado por `expirationDate`;
- eliminacion local.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### LegalMatrixItem

```ts
type LegalMatrixItem = {
  id: string
  companyId: string
  documentType: LegalDocumentType
  customDocumentType: string | null
  normNumber: string
  emissionDate: string
  expirationDate: string
  issuedBy: string
  status: LegalMatrixStatus
  evidenceId: string | null
  evidence: LegalMatrixDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### LegalMatrixDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type LegalMatrixDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "LEGAL_MATRIX"
  referenceId: string
  type: "LEGAL_MATRIX_EVIDENCE"
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

## Enums requeridos

### LegalDocumentType

```ts
enum LegalDocumentType {
  LEY = 'LEY',
  DECRETO = 'DECRETO',
  RESOLUCION = 'RESOLUCION',
  CIRCULAR = 'CIRCULAR',
  NORMA_TECNICA = 'NORMA_TECNICA',
  OTRO = 'OTRO',
}
```

### LegalMatrixStatus

```ts
enum LegalMatrixStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
}
```

Labels frontend:

- `ACTIVE`: Vigente
- `EXPIRED`: Vencido

## Campos del formulario

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `documentType` | enum | si | Tipo de documento legal. |
| `customDocumentType` | string | condicional | Requerido si `documentType` es `OTRO`. |
| `normNumber` | string | si | Numero de norma. |
| `emissionDate` | date | si | Fecha de emision. |
| `expirationDate` | date | si | Fecha de vencimiento. |
| `issuedBy` | string | si | Entidad o autoridad emisora. |

## Campos de evidencia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Documento legal de soporte. |
| `description` | string | no | Descripcion del soporte. |
| `isConfirmed` | boolean | no | Por defecto `true`. |

## Reglas de negocio

1. El item del normograma pertenece siempre a la empresa del usuario autenticado.
2. Backend debe resolver `companyId` desde el JWT; frontend no envia `companyId`.
3. `normNumber`, `emissionDate`, `expirationDate` e `issuedBy` son obligatorios.
4. Si `documentType` es `OTRO`, `customDocumentType` es obligatorio.
5. El estado debe calcularse automaticamente:
   - si `expirationDate` es menor que la fecha actual: `EXPIRED`;
   - en caso contrario: `ACTIVE`.
6. Backend debe recalcular estado al listar/consultar para evitar estados desactualizados.
7. La evidencia se carga desde las acciones del registro, no desde el formulario de creacion.
8. La evidencia debe poder visualizarse si es PDF, imagen o texto.
9. Si el documento se elimina, el item debe quedar sin evidencia pero conservarse en el normograma.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear item

`POST /api/legal-matrix`

```json
{
  "documentType": "LEY",
  "customDocumentType": null,
  "normNumber": "1562",
  "emissionDate": "2012-07-11",
  "expirationDate": "2027-07-11",
  "issuedBy": "Congreso de Colombia"
}
```

### Listar items

`GET /api/legal-matrix`

Query params:

| Parametro | Tipo | Requerido |
| --- | --- | --- |
| `page` | number | no |
| `limit` | number | no |
| `documentType` | enum | no |
| `status` | enum | no |
| `startEmissionDate` | date | no |
| `endEmissionDate` | date | no |
| `startExpirationDate` | date | no |
| `endExpirationDate` | date | no |
| `search` | string | no |

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "uuid",
        "companyId": "uuid",
        "documentType": "LEY",
        "customDocumentType": null,
        "normNumber": "1562",
        "emissionDate": "2012-07-11",
        "expirationDate": "2027-07-11",
        "issuedBy": "Congreso de Colombia",
        "status": "ACTIVE",
        "evidence": null,
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
    "path": "/api/legal-matrix",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Consultar item

`GET /api/legal-matrix/{id}`

### Actualizar item

`PUT /api/legal-matrix/{id}`

### Eliminar item

`DELETE /api/legal-matrix/{id}`

### Cargar evidencia

`POST /api/legal-matrix/{id}/evidence`

Content-Type: `multipart/form-data`

Form data:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `file` | binary | si |
| `description` | string | no |
| `isConfirmed` | boolean | no |

### Ver/descargar evidencia

`GET /api/legal-matrix/{id}/evidence/{documentId}`

### Eliminar evidencia

`DELETE /api/legal-matrix/{id}/evidence/{documentId}`

## Integracion con permisos

El backend debe exponer este modulo en `GET /api/modules/me` cuando la empresa tenga habilitado el modulo hijo.

```json
{
  "code": "LEGAL_MATRIX",
  "name": "Matriz Legal",
  "route": "/legal-matrix",
  "parentCode": "RISKS"
}
```

## Notas frontend

Cuando backend este listo, reemplazar mocks por:

- `services/legalMatrixService.ts`;
- `types/manager/legalMatrix.ts`;
- CRUD desde `/api/legal-matrix`;
- carga y visualizacion de evidencia desde endpoints documentales del modulo.

