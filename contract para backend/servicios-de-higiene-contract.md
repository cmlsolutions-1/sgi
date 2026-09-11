# Contrato frontend/backend - Servicios de Higiene

Este documento describe el contrato requerido para conectar el modulo hijo **Servicios de Higiene** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y conserva registros/evidencias solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Gestion Sanitaria`
- Modulo hijo: `Servicios de Higiene`
- Codigo de modulo: `HYGIENE_SERVICES`
- Ruta frontend: `/dashboard/hygiene-services`
- Archivo principal: `app/dashboard/hygiene-services/page.tsx`

## Objetivo funcional

Permitir registrar evidencias diarias o constantes sobre condiciones de higiene, suministro de agua potable, servicios sanitarios y disposicion adecuada de residuos, ademas de programas/procedimientos asociados al control sanitario basico.

El modulo contempla dos tipos de registros:

- `DAILY_EVIDENCE`: evidencia diaria o periodica.
- `PROGRAM`: programa o procedimiento institucional.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- creacion y edicion de evidencias diarias;
- creacion y edicion de programas;
- consulta real de funcionarios desde `GET /api/employees`;
- vista lista/tarjetas;
- filtros locales;
- carga simulada de evidencia;
- detalle en modal;
- PDF generado en frontend con `jsPDF` y `jspdf-autotable`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### HygieneDailyEvidence

```ts
type HygieneDailyEvidence = {
  id: string
  companyId: string
  kind: "DAILY_EVIDENCE"
  recordName: string
  implementationType: HygieneImplementationType
  otherImplementation: string | null
  classification: HygieneClassification
  date: string
  responsibleEmployeeId: string
  responsibleEmployee: {
    id: string
    name: string
    lastName: string
    email?: string
  }
  observations: string | null
  evidence: HygieneServiceDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### HygieneProgram

```ts
type HygieneProgram = {
  id: string
  companyId: string
  kind: "PROGRAM"
  name: string
  procedureType: HygieneProgramProcedureType
  date: string
  evidence: HygieneServiceDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### HygieneServiceDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type HygieneServiceDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "HYGIENE_SERVICE"
  referenceId: string
  type: "HYGIENE_SERVICE_EVIDENCE"
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

```ts
enum HygieneRecordKind {
  DAILY_EVIDENCE = 'DAILY_EVIDENCE',
  PROGRAM = 'PROGRAM',
}

enum HygieneImplementationType {
  FORMAT = 'FORMAT',
  PROCEDURE = 'PROCEDURE',
  OTHER = 'OTHER',
}

enum HygieneClassification {
  HYGIENE = 'HYGIENE',
  POTABLE_WATER = 'POTABLE_WATER',
}

enum HygieneProgramProcedureType {
  HYGIENE = 'HYGIENE',
  POTABLE_WATER = 'POTABLE_WATER',
  WASTE_DISPOSAL = 'WASTE_DISPOSAL',
  SANITARY_SERVICES = 'SANITARY_SERVICES',
}
```

Labels frontend:

- `DAILY_EVIDENCE`: Evidencia diaria
- `PROGRAM`: Programa
- `FORMAT`: Formato
- `PROCEDURE`: Procedimiento
- `OTHER`: Otro
- `HYGIENE`: Higiene
- `POTABLE_WATER`: Agua potable
- `WASTE_DISPOSAL`: Disposicion de residuos
- `SANITARY_SERVICES`: Servicios sanitarios

## Campos de evidencia diaria

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `recordName` | string | si | Nombre del registro. |
| `implementationType` | enum | si | `FORMAT`, `PROCEDURE`, `OTHER`. |
| `otherImplementation` | string | condicional | Requerido si `implementationType` es `OTHER`. |
| `classification` | enum | si | `HYGIENE` o `POTABLE_WATER`. |
| `date` | date | si | Fecha del registro. |
| `responsibleEmployeeId` | uuid | si | Responsable del registro. |
| `observations` | string | no | Observaciones. |

## Campos de programa

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `name` | string | si | Nombre del programa/procedimiento. |
| `procedureType` | enum | si | Tipo de programa. |
| `date` | date | si | Fecha del programa. |

## Campos de evidencia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de soporte. |
| `description` | string | si | Descripcion de la evidencia. |
| `isConfirmed` | boolean | no | Por defecto `true`. |

## Reglas de negocio

1. Todo registro pertenece a la empresa del usuario autenticado.
2. Backend debe resolver `companyId` desde el JWT; frontend no envia `companyId`.
3. En evidencia diaria, `recordName`, `date` y `responsibleEmployeeId` son obligatorios.
4. Si `implementationType` es `OTHER`, `otherImplementation` es obligatorio.
5. `responsibleEmployeeId` debe pertenecer a un funcionario activo de la empresa.
6. En programa, `name` y `date` son obligatorios.
7. La evidencia se carga posteriormente desde acciones del registro.
8. Un registro puede ser evidencia diaria o programa, pero no ambos al mismo tiempo.
9. La evidencia debe poder visualizarse si el gestor documental global soporta vista previa.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear evidencia diaria

`POST /api/hygiene-services/daily-evidence`

```json
{
  "recordName": "Verificación diaria de punto de agua potable",
  "implementationType": "FORMAT",
  "otherImplementation": null,
  "classification": "POTABLE_WATER",
  "date": "2026-09-10",
  "responsibleEmployeeId": "uuid",
  "observations": "Punto de agua disponible y señalizado."
}
```

### Crear programa

`POST /api/hygiene-services/programs`

```json
{
  "name": "Programa de higiene y agua potable",
  "procedureType": "POTABLE_WATER",
  "date": "2026-09-10"
}
```

### Listar registros

`GET /api/hygiene-services`

Query params:

| Parametro | Tipo | Requerido |
| --- | --- | --- |
| `page` | number | no |
| `limit` | number | no |
| `kind` | enum | no |
| `implementationType` | enum | no |
| `classification` | enum | no |
| `procedureType` | enum | no |
| `responsibleEmployeeId` | uuid | no |
| `startDate` | date | no |
| `endDate` | date | no |
| `hasEvidence` | boolean | no |
| `search` | string | no |

### Consultar registro

`GET /api/hygiene-services/{id}`

### Actualizar evidencia diaria

`PUT /api/hygiene-services/daily-evidence/{id}`

### Actualizar programa

`PUT /api/hygiene-services/programs/{id}`

### Eliminar registro

`DELETE /api/hygiene-services/{id}`

### Cargar evidencia

`POST /api/hygiene-services/{id}/evidence`

Content-Type: `multipart/form-data`

Campos: `file`, `description`, `isConfirmed`.

### Ver/descargar evidencia

`GET /api/hygiene-services/{id}/evidence/{documentId}`

### Eliminar evidencia

`DELETE /api/hygiene-services/{id}/evidence/{documentId}`

### Exportar PDF

`GET /api/hygiene-services/{id}/export`

## Integracion con empleados

Puede reutilizar:

`GET /api/employees`

## Integracion con permisos

```json
{
  "code": "HYGIENE_SERVICES",
  "name": "Servicios de Higiene",
  "route": "/hygiene-services",
  "parentCode": "SANITARY_MANAGEMENT"
}
```

## Notas frontend

Cuando backend este listo, crear:

- `services/hygieneServicesService.ts`
- `types/manager/hygieneServices.ts`

