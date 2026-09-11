# Contrato frontend/backend - Mediciones Ambientales

Este documento describe el contrato requerido para conectar el modulo hijo **Mediciones Ambientales** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y consulta catalogos reales de empleados, riesgos y documentos/procedimientos.

## Ubicacion en frontend

- Modulo padre: `Riesgos`
- Modulo hijo: `Mediciones Ambientales`
- Codigo de modulo: `ENVIRONMENTAL_MEASUREMENTS`
- Ruta frontend: `/dashboard/environmental-measurements`
- Archivo principal: `app/dashboard/environmental-measurements/page.tsx`

## Objetivo funcional

Registrar mediciones ambientales asociadas a riesgos relevantes del SG-SST y conservar procedimientos/formato relacionados y evidencias.

El modulo contempla dos tipos de registros:

- `MEASUREMENT`: medicion ambiental.
- `PROCEDURE`: procedimiento o formato institucional asociado a mediciones.

## Entidades sugeridas

### EnvironmentalMeasurement

```ts
type EnvironmentalMeasurement = {
  id: string
  companyId: string
  kind: "MEASUREMENT"
  name: string
  procedureDocumentId: string
  procedureDocumentName: string
  measurementType: EnvironmentalMeasurementType
  riskId: string
  riskName: string
  measurementDate: string
  laboratory: string
  responsibleEmployeeId: string
  responsibleEmployee: EmployeeSummary
  result: EnvironmentalMeasurementResult
  observations: string | null
  evidence: EnvironmentalMeasurementDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### EnvironmentalProcedure

```ts
type EnvironmentalProcedure = {
  id: string
  companyId: string
  kind: "PROCEDURE"
  name: string
  procedureType: EnvironmentalProcedureType
  relatedProcedureId: string
  relatedProcedureName: string
  date: string
  evidence: EnvironmentalMeasurementDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### EnvironmentalMeasurementDocument

```ts
type EnvironmentalMeasurementDocument = {
  id: string
  companyId: string
  referenceType: "ENVIRONMENTAL_MEASUREMENT"
  referenceId: string
  type: "ENVIRONMENTAL_MEASUREMENT_EVIDENCE"
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
enum EnvironmentalMeasurementType {
  NOISE = 'NOISE',
  LIGHTING = 'LIGHTING',
  VIBRATION = 'VIBRATION',
  CHEMICAL = 'CHEMICAL',
  BIOLOGICAL = 'BIOLOGICAL',
  TEMPERATURE = 'TEMPERATURE',
  OTHER = 'OTHER',
}

enum EnvironmentalMeasurementResult {
  COMPLIES = 'COMPLIES',
  DOES_NOT_COMPLY = 'DOES_NOT_COMPLY',
  IN_EVALUATION = 'IN_EVALUATION',
}

enum EnvironmentalProcedureType {
  FORMATO = 'FORMATO',
  PROCEDIMIENTO = 'PROCEDIMIENTO',
  OTRO = 'OTRO',
}
```

## Campos de medicion

| Campo frontend | Tipo | Requerido |
| --- | --- | --- |
| `name` | string | si |
| `procedureDocumentId` | uuid | si |
| `measurementType` | enum | si |
| `riskId` | uuid | si |
| `measurementDate` | date | si |
| `laboratory` | string | si |
| `responsibleEmployeeId` | uuid | si |
| `result` | enum | si |
| `observations` | string | no |

## Campos de procedimiento

| Campo frontend | Tipo | Requerido |
| --- | --- | --- |
| `name` | string | si |
| `procedureType` | enum | si |
| `relatedProcedureId` | uuid | si |
| `date` | date | si |

## Reglas de negocio

1. Todo registro pertenece a la empresa autenticada.
2. `procedureDocumentId` y `relatedProcedureId` deben pertenecer a Gestion Documental.
3. `riskId` debe pertenecer a la empresa. El frontend prioriza riesgos quimicos, fisicos, biologicos, ruido, iluminacion, temperatura o vibracion.
4. `responsibleEmployeeId` debe pertenecer a un funcionario activo.
5. La evidencia es opcional al crear y se carga despues desde acciones.
6. El resultado debe ser `COMPLIES`, `DOES_NOT_COMPLY` o `IN_EVALUATION`.

## Endpoints requeridos

### Crear medicion

`POST /api/environmental-measurements`

### Crear procedimiento/formato

`POST /api/environmental-measurements/procedures`

### Listar registros

`GET /api/environmental-measurements`

Query params: `page`, `limit`, `kind`, `measurementType`, `result`, `procedureType`, `responsibleEmployeeId`, `riskId`, `startDate`, `endDate`, `hasEvidence`, `search`.

### Consultar registro

`GET /api/environmental-measurements/{id}`

### Actualizar medicion

`PUT /api/environmental-measurements/{id}`

### Actualizar procedimiento

`PUT /api/environmental-measurements/procedures/{id}`

### Eliminar registro

`DELETE /api/environmental-measurements/{id}`

### Cargar evidencia

`POST /api/environmental-measurements/{id}/evidence`

Content-Type: `multipart/form-data`

Campos: `file`, `description`, `isConfirmed`.

### Ver/descargar evidencia

`GET /api/environmental-measurements/{id}/evidence/{documentId}`

### Exportar PDF

`GET /api/environmental-measurements/{id}/export`

## Permisos

```json
{
  "code": "ENVIRONMENTAL_MEASUREMENTS",
  "name": "Mediciones Ambientales",
  "route": "/environmental-measurements",
  "parentCode": "RISKS"
}
```

## Notas frontend

Crear:

- `services/environmentalMeasurementsService.ts`
- `types/manager/environmentalMeasurements.ts`

