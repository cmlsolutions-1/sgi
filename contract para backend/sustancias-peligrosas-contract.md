# Contrato frontend/backend - Sustancias Peligrosas

Este documento describe el contrato requerido para conectar el modulo hijo **Sustancias Peligrosas** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend, pero consulta catalogos reales de empleados, riesgos, medidas preventivas y documentos/procedimientos.

## Ubicacion en frontend

- Modulo padre: `Riesgos`
- Modulo hijo: `Sustancias Peligrosas`
- Codigo de modulo: `HAZARDOUS_SUBSTANCES`
- Ruta frontend: `/dashboard/hazardous-substances`
- Archivo principal: `app/dashboard/hazardous-substances/page.tsx`

## Objetivo funcional

Registrar sustancias carcinogenas o con toxicidad aguda, asociarlas con riesgos, medidas de prevencion, procedimientos documentales y evidencias. Tambien permite registrar programas/procedimientos institucionales para el manejo de sustancias peligrosas.

El modulo contempla dos tipos de registros:

- `SUBSTANCE`: sustancia peligrosa especifica.
- `PROGRAM`: programa/procedimiento institucional.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- creacion y edicion local;
- vista lista/tarjetas;
- filtros locales;
- carga simulada de evidencia;
- PDF generado en frontend;
- consulta real de empleados, riesgos, medidas preventivas y documentos de Gestion Documental.

## Entidades sugeridas

### HazardousSubstance

```ts
type HazardousSubstance = {
  id: string
  companyId: string
  kind: "SUBSTANCE"
  substanceName: string
  type: HazardousSubstanceType
  classification: HazardousSubstanceClassification
  storageArea: string
  technicalSheet: string
  recommendation: string
  responsibleEmployeeId: string
  responsibleEmployee: EmployeeSummary
  riskId: string
  riskName: string
  preventiveMeasureId: string
  preventiveMeasureName: string
  procedureDocumentId: string
  procedureDocumentName: string
  observations: string | null
  evidence: HazardousSubstanceDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### HazardousSubstanceProgram

```ts
type HazardousSubstanceProgram = {
  id: string
  companyId: string
  kind: "PROGRAM"
  name: string
  procedureType: HazardousProgramProcedureType
  date: string
  evidence: HazardousSubstanceDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### HazardousSubstanceDocument

```ts
type HazardousSubstanceDocument = {
  id: string
  companyId: string
  referenceType: "HAZARDOUS_SUBSTANCE"
  referenceId: string
  type: "HAZARDOUS_SUBSTANCE_EVIDENCE"
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
enum HazardousSubstanceType {
  CARCINOGENIC = 'CARCINOGENIC',
  ACUTE_TOXICITY = 'ACUTE_TOXICITY',
  BOTH = 'BOTH',
}

enum HazardousSubstanceClassification {
  IARC_GROUP = 'IARC_GROUP',
  GHS_CATEGORY = 'GHS_CATEGORY',
}

enum HazardousProgramProcedureType {
  STORAGE = 'STORAGE',
  HANDLING = 'HANDLING',
  EMERGENCY = 'EMERGENCY',
  DISPOSAL = 'DISPOSAL',
  PPE = 'PPE',
}
```

Labels:

- `CARCINOGENIC`: Carcinogena
- `ACUTE_TOXICITY`: Toxicidad aguda
- `BOTH`: Ambas
- `IARC_GROUP`: Grupo IARC
- `GHS_CATEGORY`: Categoria SGA
- `STORAGE`: Almacenamiento
- `HANDLING`: Manipulacion
- `EMERGENCY`: Atencion de emergencias
- `DISPOSAL`: Disposicion final
- `PPE`: Elementos de proteccion personal

## Campos de sustancia

| Campo frontend | Tipo | Requerido |
| --- | --- | --- |
| `substanceName` | string | si |
| `type` | enum | si |
| `classification` | enum | si |
| `storageArea` | string | si |
| `technicalSheet` | string | si |
| `recommendation` | string | si |
| `responsibleEmployeeId` | uuid | si |
| `riskId` | uuid | si |
| `preventiveMeasureId` | uuid | si |
| `procedureDocumentId` | uuid | si |
| `observations` | string | no |

## Campos de programa

| Campo frontend | Tipo | Requerido |
| --- | --- | --- |
| `name` | string | si |
| `procedureType` | enum | si |
| `date` | date | si |

## Reglas de negocio

1. El registro pertenece a la empresa autenticada.
2. `responsibleEmployeeId` debe ser un funcionario activo de la empresa.
3. `riskId` debe pertenecer a la matriz de riesgos de la empresa. El frontend prioriza riesgos quimicos.
4. `preventiveMeasureId` debe pertenecer a la empresa.
5. `procedureDocumentId` debe corresponder a un documento/procedimiento de Gestion Documental de la empresa.
6. La evidencia se carga posteriormente desde acciones.
7. Un registro puede ser de tipo sustancia o programa, pero no ambos al mismo tiempo.

## Endpoints requeridos

### Crear sustancia

`POST /api/hazardous-substances`

### Crear programa

`POST /api/hazardous-substances/programs`

### Listar registros

`GET /api/hazardous-substances`

Query params: `page`, `limit`, `kind`, `type`, `classification`, `procedureType`, `responsibleEmployeeId`, `riskId`, `search`, `hasEvidence`.

### Consultar registro

`GET /api/hazardous-substances/{id}`

### Actualizar sustancia

`PUT /api/hazardous-substances/{id}`

### Actualizar programa

`PUT /api/hazardous-substances/programs/{id}`

### Eliminar registro

`DELETE /api/hazardous-substances/{id}`

### Cargar evidencia

`POST /api/hazardous-substances/{id}/evidence`

Content-Type: `multipart/form-data`

Campos: `file`, `description`, `isConfirmed`.

### Ver/descargar evidencia

`GET /api/hazardous-substances/{id}/evidence/{documentId}`

### Exportar PDF

`GET /api/hazardous-substances/{id}/export`

## Integraciones necesarias

- `GET /api/employees`
- endpoint de matriz de riesgos/laborales
- endpoint de medidas preventivas
- endpoint de Gestion Documental con filtro por procedimientos

## Permisos

```json
{
  "code": "HAZARDOUS_SUBSTANCES",
  "name": "Sustancias Peligrosas",
  "route": "/hazardous-substances",
  "parentCode": "RISKS"
}
```

## Notas frontend

Crear:

- `services/hazardousSubstancesService.ts`
- `types/manager/hazardousSubstances.ts`

