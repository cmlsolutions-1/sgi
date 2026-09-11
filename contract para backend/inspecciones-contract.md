# Contrato frontend/backend - Inspecciones

Este documento describe el contrato requerido para conectar el modulo hijo **Inspecciones** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y consulta catalogos reales de empleados y areas de trabajo.

## Ubicacion en frontend

- Modulo padre: `Riesgos`
- Modulo hijo: `Inspecciones`
- Codigo de modulo: `INSPECTIONS`
- Ruta frontend: `/dashboard/inspections`
- Archivo principal: `app/dashboard/inspections/page.tsx`

## Objetivo funcional

Registrar inspecciones o mantenimientos sobre instalaciones, maquinaria, equipos, elementos de emergencia u otros elementos, con responsable, area, resultado, participacion COPASST y evidencia.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- creacion y edicion en memoria;
- consulta real de funcionarios y areas;
- vista lista/tarjetas;
- filtros locales;
- carga simulada de evidencia;
- PDF generado en frontend.

## Entidades sugeridas

### InspectionRecord

```ts
type InspectionRecord = {
  id: string
  companyId: string
  elementName: string
  elementType: InspectionElementType
  action: InspectionAction
  description: string
  workAreaId: string
  workArea: {
    id: string
    name: string
  }
  date: string
  responsibleEmployeeId: string
  responsibleEmployee: EmployeeSummary
  copasstParticipated: boolean
  result: InspectionResult
  observations: string | null
  evidence: InspectionDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### InspectionDocument

```ts
type InspectionDocument = {
  id: string
  companyId: string
  referenceType: "INSPECTION"
  referenceId: string
  type: "INSPECTION_EVIDENCE"
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
enum InspectionElementType {
  INSTALLATION = 'INSTALLATION',
  MACHINERY = 'MACHINERY',
  EQUIPMENT = 'EQUIPMENT',
  EMERGENCY = 'EMERGENCY',
  OTHER = 'OTHER',
}

enum InspectionAction {
  INSPECTION = 'INSPECTION',
  MAINTENANCE = 'MAINTENANCE',
}

enum InspectionResult {
  COMPLIES = 'COMPLIES',
  DOES_NOT_COMPLY = 'DOES_NOT_COMPLY',
  PARTIAL = 'PARTIAL',
}
```

Labels:

- `INSTALLATION`: Instalacion
- `MACHINERY`: Maquinaria
- `EQUIPMENT`: Equipo
- `EMERGENCY`: Emergencia
- `OTHER`: Otro
- `INSPECTION`: Inspeccion
- `MAINTENANCE`: Mantenimiento
- `COMPLIES`: Cumple
- `DOES_NOT_COMPLY`: No cumple
- `PARTIAL`: Parcial

## Campos del formulario

| Campo frontend | Tipo | Requerido |
| --- | --- | --- |
| `elementName` | string | si |
| `elementType` | enum | si |
| `action` | enum | si |
| `description` | string | si |
| `workAreaId` | uuid | si |
| `date` | date | si |
| `responsibleEmployeeId` | uuid | si |
| `copasstParticipated` | boolean | si |
| `result` | enum | si |
| `observations` | string | no |

## Reglas de negocio

1. La inspeccion pertenece a la empresa autenticada.
2. `elementName`, `description`, `workAreaId`, `date` y `responsibleEmployeeId` son obligatorios.
3. `workAreaId` debe pertenecer a la empresa.
4. `responsibleEmployeeId` debe pertenecer a un funcionario activo de la empresa.
5. `copasstParticipated` indica si el COPASST participo en la inspeccion.
6. La evidencia se carga despues desde acciones.
7. Si `result` es `DOES_NOT_COMPLY`, backend puede sugerir crear ACPM o medida preventiva, pero no debe hacerlo automaticamente sin confirmacion si no existe regla definida.

## Endpoints requeridos

### Crear inspeccion

`POST /api/inspections`

```json
{
  "elementName": "Extintor zona administrativa",
  "elementType": "EMERGENCY",
  "action": "INSPECTION",
  "description": "Revision de estado, senalizacion y vigencia.",
  "workAreaId": "uuid",
  "date": "2026-09-10",
  "responsibleEmployeeId": "uuid",
  "copasstParticipated": true,
  "result": "COMPLIES",
  "observations": "Sin novedades"
}
```

### Listar inspecciones

`GET /api/inspections`

Query params: `page`, `limit`, `elementType`, `action`, `result`, `workAreaId`, `responsibleEmployeeId`, `copasstParticipated`, `startDate`, `endDate`, `hasEvidence`, `search`.

### Consultar inspeccion

`GET /api/inspections/{id}`

### Actualizar inspeccion

`PUT /api/inspections/{id}`

### Eliminar inspeccion

`DELETE /api/inspections/{id}`

### Cargar evidencia

`POST /api/inspections/{id}/evidence`

Content-Type: `multipart/form-data`

Campos: `file`, `description`, `isConfirmed`.

### Ver/descargar evidencia

`GET /api/inspections/{id}/evidence/{documentId}`

### Exportar PDF

`GET /api/inspections/{id}/export`

## Integraciones necesarias

- `GET /api/employees`
- endpoint de areas de trabajo
- opcional: ACPM o medidas preventivas para no conformidades.

## Permisos

```json
{
  "code": "INSPECTIONS",
  "name": "Inspecciones",
  "route": "/inspections",
  "parentCode": "RISKS"
}
```

## Notas frontend

Crear:

- `services/inspectionsService.ts`
- `types/manager/inspections.ts`

