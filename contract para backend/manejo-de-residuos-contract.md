# Contrato frontend/backend - Manejo de Residuos

Este documento describe el contrato requerido para conectar el modulo hijo **Manejo de Residuos** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y conserva registros/evidencias solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Gestion Sanitaria`
- Modulo hijo: `Manejo de Residuos`
- Codigo de modulo: `WASTE_MANAGEMENT`
- Ruta frontend: `/dashboard/waste-management`
- Archivo principal: `app/dashboard/waste-management/page.tsx`

## Objetivo funcional

Permitir controlar evidencias diarias o constantes del manejo de residuos y registrar programas/procedimientos relacionados con separacion, recoleccion, disposicion y trazabilidad de residuos generados por la operacion.

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

### WasteDailyEvidence

```ts
type WasteDailyEvidence = {
  id: string
  companyId: string
  kind: "DAILY_EVIDENCE"
  recordName: string
  wasteType: WasteType
  date: string
  responsibleEmployeeId: string
  responsibleEmployee: {
    id: string
    name: string
    lastName: string
    email?: string
  }
  observations: string | null
  evidence: WasteManagementDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### WasteProgram

```ts
type WasteProgram = {
  id: string
  companyId: string
  kind: "PROGRAM"
  name: string
  procedureType: WasteProgramProcedureType
  date: string
  evidence: WasteManagementDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### WasteManagementDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type WasteManagementDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "WASTE_MANAGEMENT"
  referenceId: string
  type: "WASTE_MANAGEMENT_EVIDENCE"
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
enum WasteRecordKind {
  DAILY_EVIDENCE = 'DAILY_EVIDENCE',
  PROGRAM = 'PROGRAM',
}

enum WasteType {
  ORDINARY = 'ORDINARY',
  RECYCLABLE = 'RECYCLABLE',
  HAZARDOUS = 'HAZARDOUS',
  LIQUID = 'LIQUID',
  GASEOUS = 'GASEOUS',
}

enum WasteProgramProcedureType {
  ORDINARY_WASTE = 'ORDINARY_WASTE',
  RECYCLING = 'RECYCLING',
  HAZARDOUS_WASTE = 'HAZARDOUS_WASTE',
  LIQUID_WASTE = 'LIQUID_WASTE',
  GASEOUS_WASTE = 'GASEOUS_WASTE',
}
```

Labels frontend:

- `DAILY_EVIDENCE`: Evidencia diaria
- `PROGRAM`: Programa
- `ORDINARY`: Ordinario
- `RECYCLABLE`: Reciclable
- `HAZARDOUS`: Peligroso
- `LIQUID`: Liquido
- `GASEOUS`: Gaseoso
- `ORDINARY_WASTE`: Residuos ordinarios
- `RECYCLING`: Reciclaje
- `HAZARDOUS_WASTE`: Residuos peligrosos
- `LIQUID_WASTE`: Residuos liquidos
- `GASEOUS_WASTE`: Residuos gaseosos

## Campos de evidencia diaria

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `recordName` | string | si | Nombre del registro. |
| `wasteType` | enum | si | Tipo de residuo. |
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
4. `responsibleEmployeeId` debe pertenecer a un funcionario activo de la empresa.
5. En programa, `name` y `date` son obligatorios.
6. La evidencia se carga posteriormente desde acciones del registro.
7. Un registro puede ser evidencia diaria o programa, pero no ambos al mismo tiempo.
8. La evidencia debe poder visualizarse si el gestor documental global soporta vista previa.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear evidencia diaria

`POST /api/waste-management/daily-evidence`

```json
{
  "recordName": "Verificación diaria de disposición de residuos",
  "wasteType": "ORDINARY",
  "date": "2026-09-10",
  "responsibleEmployeeId": "uuid",
  "observations": "Puntos de recolección disponibles y residuos ordinarios dispuestos correctamente."
}
```

### Crear programa

`POST /api/waste-management/programs`

```json
{
  "name": "Programa de separación y disposición de residuos",
  "procedureType": "RECYCLING",
  "date": "2026-09-10"
}
```

### Listar registros

`GET /api/waste-management`

Query params:

| Parametro | Tipo | Requerido |
| --- | --- | --- |
| `page` | number | no |
| `limit` | number | no |
| `kind` | enum | no |
| `wasteType` | enum | no |
| `procedureType` | enum | no |
| `responsibleEmployeeId` | uuid | no |
| `startDate` | date | no |
| `endDate` | date | no |
| `hasEvidence` | boolean | no |
| `search` | string | no |

### Consultar registro

`GET /api/waste-management/{id}`

### Actualizar evidencia diaria

`PUT /api/waste-management/daily-evidence/{id}`

### Actualizar programa

`PUT /api/waste-management/programs/{id}`

### Eliminar registro

`DELETE /api/waste-management/{id}`

### Cargar evidencia

`POST /api/waste-management/{id}/evidence`

Content-Type: `multipart/form-data`

Campos: `file`, `description`, `isConfirmed`.

### Ver/descargar evidencia

`GET /api/waste-management/{id}/evidence/{documentId}`

### Eliminar evidencia

`DELETE /api/waste-management/{id}/evidence/{documentId}`

### Exportar PDF

`GET /api/waste-management/{id}/export`

## Integracion con empleados

Puede reutilizar:

`GET /api/employees`

## Integracion con permisos

```json
{
  "code": "WASTE_MANAGEMENT",
  "name": "Manejo de Residuos",
  "route": "/waste-management",
  "parentCode": "SANITARY_MANAGEMENT"
}
```

## Notas frontend

Cuando backend este listo, crear:

- `services/wasteManagementService.ts`
- `types/manager/wasteManagement.ts`

