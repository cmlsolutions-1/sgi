# Contrato frontend/backend - Comunicaciones SST

Este documento describe el contrato requerido para conectar el modulo hijo **Comunicaciones SST** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend, maneja archivos con URLs locales temporales y conserva los registros solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Gestion del SG-SST`
- Modulo hijo: `Comunicaciones SST`
- Codigo de modulo: `SST_COMMUNICATIONS`
- Ruta frontend: `/dashboard/sst-communications`
- Archivo principal: `app/dashboard/sst-communications/page.tsx`

## Objetivo funcional

Permitir registrar los mecanismos internos y externos de comunicacion del SG-SST, conservar la evidencia inicial de implementacion, generar un PDF para firma de gerencia y cargar posteriormente el documento firmado.

El modulo contempla:

- creacion y edicion de mecanismos de comunicacion SST;
- tipo de comunicacion interna o externa;
- medio de comunicacion;
- responsable empleado o gerente;
- fecha de implementacion;
- observaciones;
- confirmacion de si se informo al COPASST;
- carga de evidencia inicial desde las acciones del registro;
- habilitacion del PDF para firma solo cuando exista evidencia inicial;
- inclusion de imagen de evidencia inicial dentro del PDF cuando el archivo es imagen;
- carga del documento firmado por gerencia;
- visualizacion de evidencia inicial y documento firmado;
- descarga del documento firmado;
- eliminacion del registro;
- busqueda por mecanismo, medio, responsable o archivo.

## Regla funcional principal

El flujo obligatorio es:

1. Crear la comunicacion SST.
2. Cargar la evidencia inicial desde los tres puntos del registro.
3. Descargar el PDF para firma de gerencia.
4. Subir el documento firmado.

Mientras no exista evidencia inicial, no se debe permitir descargar el PDF para firma ni cargar la evidencia firmada.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- empleados mockeados;
- creacion, edicion y eliminacion local;
- carga local de evidencia inicial;
- carga local de documento firmado;
- vista previa local para PDF, imagen o texto;
- descarga simulada de evidencias;
- PDF generado en frontend con `jsPDF` y `jspdf-autotable`;
- inclusion de imagen de evidencia inicial en el PDF cuando aplica.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### SstCommunication

Entidad principal del mecanismo de comunicacion SST.

```ts
type SstCommunication = {
  id: string
  companyId: string
  mechanismName: string
  type: SstCommunicationType
  medium: SstCommunicationMedium
  customMedium: string | null
  responsibleType: SstCommunicationResponsibleType
  responsibleEmployeeId: string | null
  responsibleEmployee: {
    id: string
    name: string
    lastName: string
    email?: string
    job?: {
      id: string
      name: string
    } | null
  } | null
  managerName: string | null
  implementationDate: string
  observations: string | null
  informedCopasst: boolean
  initialEvidenceId: string | null
  initialEvidence: SstCommunicationDocument | null
  signedEvidenceId: string | null
  signedEvidence: SstCommunicationDocument | null
  status: SstCommunicationStatus
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### SstCommunicationDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type SstCommunicationDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "SST_COMMUNICATION"
  referenceId: string
  type: SstCommunicationDocumentType
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

### SstCommunicationType

```ts
enum SstCommunicationType {
  INTERNAL = 'INTERNAL',
  EXTERNAL = 'EXTERNAL',
}
```

Labels frontend:

- `INTERNAL`: Interno
- `EXTERNAL`: Externo

### SstCommunicationMedium

```ts
enum SstCommunicationMedium {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  MAILBOX = 'MAILBOX',
  FORM = 'FORM',
  VERBAL = 'VERBAL',
  MEETING = 'MEETING',
  OTHER = 'OTHER',
}
```

Labels frontend:

- `WHATSAPP`: WhatsApp
- `EMAIL`: Correo
- `MAILBOX`: Buzon
- `FORM`: Formulario
- `VERBAL`: Verbal
- `MEETING`: Reunion
- `OTHER`: Otro

### SstCommunicationResponsibleType

```ts
enum SstCommunicationResponsibleType {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
}
```

Labels frontend:

- `EMPLOYEE`: Empleado
- `MANAGER`: Gerente

### SstCommunicationDocumentType

```ts
enum SstCommunicationDocumentType {
  INITIAL_EVIDENCE = 'INITIAL_EVIDENCE',
  SIGNED_EVIDENCE = 'SIGNED_EVIDENCE',
}
```

Labels frontend:

- `INITIAL_EVIDENCE`: Evidencia inicial
- `SIGNED_EVIDENCE`: Documento firmado

### SstCommunicationStatus

```ts
enum SstCommunicationStatus {
  PENDING_INITIAL_EVIDENCE = 'PENDING_INITIAL_EVIDENCE',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
}
```

Labels frontend sugeridos:

- `PENDING_INITIAL_EVIDENCE`: Pendiente de evidencia inicial
- `PENDING_SIGNATURE`: Pendiente de firma
- `SIGNED`: Firmada

## Campos del formulario de comunicacion

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `mechanismName` | string | si | Nombre del mecanismo. |
| `type` | enum | si | `INTERNAL` o `EXTERNAL`. |
| `medium` | enum | si | Medio de comunicacion. |
| `customMedium` | string | condicional | Requerido si `medium` es `OTHER`. |
| `responsibleType` | enum | si | `EMPLOYEE` o `MANAGER`. |
| `responsibleEmployeeId` | uuid | condicional | Requerido si `responsibleType` es `EMPLOYEE`. |
| `managerName` | string | condicional | Requerido si `responsibleType` es `MANAGER`. |
| `implementationDate` | date | si | Fecha de implementacion del mecanismo. |
| `observations` | string | no | Observaciones del mecanismo. |
| `informedCopasst` | boolean | si | Define si se informo a miembros del COPASST. |

## Campos de evidencia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de evidencia inicial o documento firmado. |
| `description` | string | no | Observacion sobre el archivo. |
| `isConfirmed` | boolean | no | Por defecto `true`. |

Archivos permitidos sugeridos:

- PDF;
- PNG;
- JPG/JPEG;
- WEBP;
- TXT;
- DOC/DOCX si el gestor documental global ya los soporta.

## Reglas de negocio

1. La comunicacion pertenece siempre a la empresa del usuario autenticado.
2. Backend debe resolver `companyId` desde el JWT; frontend no envia `companyId`.
3. `mechanismName`, `type`, `medium`, `responsibleType`, `implementationDate` e `informedCopasst` son obligatorios.
4. Si `medium` es `OTHER`, `customMedium` es obligatorio.
5. Si `responsibleType` es `EMPLOYEE`, `responsibleEmployeeId` es obligatorio y debe pertenecer a un funcionario activo de la misma empresa.
6. Si `responsibleType` es `MANAGER`, `managerName` es obligatorio.
7. Al crear una comunicacion sin evidencia, el estado debe ser `PENDING_INITIAL_EVIDENCE`.
8. Al cargar evidencia inicial, el estado debe cambiar a `PENDING_SIGNATURE`.
9. El PDF para firma solo se puede generar/descargar si existe `initialEvidence`.
10. El documento firmado solo se puede cargar si existe `initialEvidence`.
11. Al cargar documento firmado, el estado debe cambiar a `SIGNED`.
12. Si se reemplaza la evidencia inicial luego de existir documento firmado, backend debe definir si invalida el firmado o conserva trazabilidad. Recomendado: conservar historico y mantener el firmado vigente salvo que usuario cargue uno nuevo.
13. La evidencia inicial y el documento firmado deben poder visualizarse en navegador si son PDF, imagen o texto.
14. La eliminacion del registro debe eliminar o desvincular los documentos asociados segun la politica global de documentos de SafeCloud.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear comunicacion SST

`POST /api/sst-communications`

Request body:

```json
{
  "mechanismName": "Comunicacion interna de novedades SST",
  "type": "INTERNAL",
  "medium": "WHATSAPP",
  "customMedium": null,
  "responsibleType": "EMPLOYEE",
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "managerName": null,
  "implementationDate": "2026-09-01",
  "observations": "Canal usado para reportes rapidos y divulgacion de alertas SST.",
  "informedCopasst": true
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
    "mechanismName": "Comunicacion interna de novedades SST",
    "type": "INTERNAL",
    "medium": "WHATSAPP",
    "customMedium": null,
    "responsibleType": "EMPLOYEE",
    "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "responsibleEmployee": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Diana",
      "lastName": "Mendoza",
      "email": "diana@example.com",
      "job": {
        "id": "job-id",
        "name": "Responsable SG-SST"
      }
    },
    "managerName": null,
    "implementationDate": "2026-09-01",
    "observations": "Canal usado para reportes rapidos y divulgacion de alertas SST.",
    "informedCopasst": true,
    "initialEvidence": null,
    "signedEvidence": null,
    "status": "PENDING_INITIAL_EVIDENCE",
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-communications",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar comunicaciones SST

`GET /api/sst-communications`

Query params:

| Parametro | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `page` | number | no | Numero de pagina. |
| `limit` | number | no | Registros por pagina. |
| `type` | enum | no | `INTERNAL`, `EXTERNAL`. |
| `medium` | enum | no | Medio de comunicacion. |
| `responsibleType` | enum | no | `EMPLOYEE`, `MANAGER`. |
| `status` | enum | no | Estado documental. |
| `informedCopasst` | boolean | no | Filtro por COPASST informado/pendiente. |
| `startDate` | date | no | Fecha inicial de implementacion. |
| `endDate` | date | no | Fecha final de implementacion. |
| `search` | string | no | Busca por mecanismo, medio, responsable o archivo. |

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
        "mechanismName": "Comunicacion interna de novedades SST",
        "type": "INTERNAL",
        "medium": "WHATSAPP",
        "customMedium": null,
        "responsibleType": "EMPLOYEE",
        "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "responsibleEmployee": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Diana",
          "lastName": "Mendoza",
          "email": "diana@example.com"
        },
        "managerName": null,
        "implementationDate": "2026-09-01",
        "observations": "Canal usado para reportes rapidos y divulgacion de alertas SST.",
        "informedCopasst": true,
        "initialEvidence": {
          "id": "document-id",
          "type": "INITIAL_EVIDENCE",
          "originalName": "soporte-canal-whatsapp-sst.pdf",
          "mimeType": "application/pdf",
          "downloadUrl": "/api/sst-communications/communication-id/documents/document-id"
        },
        "signedEvidence": null,
        "status": "PENDING_SIGNATURE",
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
    "path": "/api/sst-communications",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Consultar comunicacion por id

`GET /api/sst-communications/{id}`

Debe retornar la comunicacion con evidencia inicial y documento firmado.

### Actualizar comunicacion SST

`PUT /api/sst-communications/{id}`

Request body:

```json
{
  "mechanismName": "Comunicacion interna de novedades SST",
  "type": "INTERNAL",
  "medium": "WHATSAPP",
  "customMedium": null,
  "responsibleType": "EMPLOYEE",
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "managerName": null,
  "implementationDate": "2026-09-01",
  "observations": "Canal usado para reportes rapidos y divulgacion de alertas SST.",
  "informedCopasst": true
}
```

### Eliminar comunicacion SST

`DELETE /api/sst-communications/{id}`

### Cargar evidencia inicial

`POST /api/sst-communications/{id}/initial-evidence`

Content-Type: `multipart/form-data`

Form data:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `file` | binary | si |
| `description` | string | no |
| `isConfirmed` | boolean | no |

Al cargar correctamente debe actualizar el estado a `PENDING_SIGNATURE`.

### Cargar documento firmado

`POST /api/sst-communications/{id}/signed-evidence`

Content-Type: `multipart/form-data`

Form data:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `file` | binary | si |
| `description` | string | no |
| `isConfirmed` | boolean | no |

Regla: solo se permite si ya existe evidencia inicial.

Al cargar correctamente debe actualizar el estado a `SIGNED`.

### Listar documentos de comunicacion

`GET /api/sst-communications/{id}/documents`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": [
    {
      "id": "document-id",
      "companyId": "company-id",
      "referenceType": "SST_COMMUNICATION",
      "referenceId": "communication-id",
      "type": "INITIAL_EVIDENCE",
      "originalName": "soporte-canal-whatsapp-sst.pdf",
      "mimeType": "application/pdf",
      "size": 204800,
      "storageProvider": "LOCAL",
      "isConfirmed": true,
      "downloadUrl": "/api/sst-communications/communication-id/documents/document-id",
      "description": "Evidencia de implementacion del canal.",
      "createdAt": "2026-09-10T12:00:00.000Z",
      "createdBy": "user-id"
    }
  ],
  "errors": null,
  "meta": {
    "path": "/api/sst-communications/communication-id/documents",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Ver/descargar documento

`GET /api/sst-communications/{id}/documents/{documentId}`

Debe permitir:

- visualizar PDF, imagen o texto en navegador;
- descargar el archivo original;
- validar que el documento pertenezca a la comunicacion y a la empresa autenticada.

### Eliminar documento

`DELETE /api/sst-communications/{id}/documents/{documentId}`

Si se elimina evidencia inicial y existia documento firmado, backend debe definir regla. Recomendado: bloquear eliminacion si hay documento firmado, salvo que se eliminen ambos o se cree una nueva version.

### Descargar PDF para firma

`GET /api/sst-communications/{id}/signature-pdf`

Response:

- Media type: `application/pdf`
- Archivo: acta de comunicacion SST para firma de gerencia.

Regla: solo se permite si existe `initialEvidence`.

El PDF debe incluir:

- nombre del mecanismo;
- tipo;
- medio;
- responsable;
- fecha de implementacion;
- si informo al COPASST;
- evidencia inicial relacionada;
- observaciones;
- espacio para firma de gerencia;
- espacio para responsable SG-SST;
- si la evidencia inicial es imagen, incluirla en el documento.

Si backend no genera el PDF, el frontend puede seguir generandolo con `jsPDF` usando los datos reales y `downloadUrl` de la evidencia inicial.

## Validaciones esperadas

1. `mechanismName` es obligatorio.
2. `type` debe pertenecer al enum `SstCommunicationType`.
3. `medium` debe pertenecer al enum `SstCommunicationMedium`.
4. `customMedium` es obligatorio cuando `medium = OTHER`.
5. `responsibleType` debe pertenecer al enum `SstCommunicationResponsibleType`.
6. `responsibleEmployeeId` es obligatorio cuando `responsibleType = EMPLOYEE`.
7. `responsibleEmployeeId` debe pertenecer a un funcionario activo de la misma empresa.
8. `managerName` es obligatorio cuando `responsibleType = MANAGER`.
9. `implementationDate` es obligatoria.
10. No permitir cargar documento firmado si no existe evidencia inicial.
11. No permitir descargar PDF para firma si no existe evidencia inicial.
12. La comunicacion consultada, editada o eliminada debe pertenecer a la empresa autenticada.
13. Si el modulo hijo `SST_COMMUNICATIONS` no esta habilitado para la empresa, backend debe responder `403`.

## Integracion con empleados

Para responsables tipo empleado, el frontend necesita listar funcionarios de la empresa.

Puede reutilizar:

`GET /api/employees`

Campos minimos esperados:

```json
{
  "id": "string",
  "name": "string",
  "lastName": "string",
  "email": "string",
  "job": {
    "id": "string",
    "name": "string"
  }
}
```

## Integracion con modulo de permisos

El backend debe exponer este modulo en `GET /api/modules/me` cuando la empresa tenga habilitado el modulo hijo.

Estructura esperada:

```json
{
  "id": "uuid-del-modulo-hijo",
  "code": "SST_COMMUNICATIONS",
  "name": "Comunicaciones SST",
  "route": "/sst-communications",
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
      "message": "Primero carga la evidencia inicial para poder generar el PDF de firma"
    }
  ],
  "meta": {
    "path": "/api/sst-communications/communication-id/signature-pdf",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 400
  }
}
```

## Notas para integracion frontend

Cuando backend este listo, se deben reemplazar los mocks por:

- `services/sstCommunicationsService.ts`;
- `types/manager/sstCommunications.ts`;
- carga inicial desde `GET /api/sst-communications`;
- creacion desde `POST /api/sst-communications`;
- edicion desde `PUT /api/sst-communications/{id}`;
- eliminacion desde `DELETE /api/sst-communications/{id}`;
- carga de evidencia inicial desde `POST /api/sst-communications/{id}/initial-evidence`;
- carga de documento firmado desde `POST /api/sst-communications/{id}/signed-evidence`;
- visualizacion/descarga desde `GET /api/sst-communications/{id}/documents/{documentId}`;
- descarga de PDF desde `GET /api/sst-communications/{id}/signature-pdf` o PDF frontend con datos reales.

La interfaz actual ya tiene:

- lista tipo tabla;
- barra compacta de indicadores;
- buscador;
- menu de tres puntos;
- modal de crear/editar;
- modal de carga de evidencia;
- vista previa de archivo;
- detalle del registro;
- descarga PDF para firma.

Por eso, la integracion puede hacerse conservando el diseno actual y cambiando solamente la fuente de datos.
