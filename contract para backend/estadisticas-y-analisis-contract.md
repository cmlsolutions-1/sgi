# Contrato frontend/backend - Estadísticas y Análisis

Este documento describe el contrato requerido para conectar el modulo hijo **Estadísticas y Análisis** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend, calcula indicadores localmente y conserva los registros solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Empleados`
- Modulo hijo: `Estadísticas y Análisis`
- Codigo de modulo: `EMPLOYEE_ANALYTICS`
- Ruta frontend: `/dashboard/employee-analytics`
- Archivo principal: `app/dashboard/employee-analytics/page.tsx`

## Objetivo funcional

Permitir generar analisis estadisticos por periodo y tipo de novedad laboral, consolidando indicadores clave para la gestion del SG-SST y permitiendo registrar acciones de mejora y evidencias documentales.

El modulo contempla:

- creacion de analisis estadisticos por periodicidad;
- seleccion de vigencia, periodo, responsable y tipo de novedad laboral;
- calculo de indicadores estadisticos;
- visualizacion de graficas consolidadas;
- registro de acciones de mejora asociadas al analisis;
- carga de evidencia del analisis;
- visualizacion en tarjetas y lista;
- descarga de PDF del analisis generado.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- generacion local de indicadores;
- consulta de funcionarios reales desde `GET /api/employees`;
- filtros por busqueda y tipo de novedad;
- vista en tarjetas/lista;
- graficas con componentes locales;
- accion de mejora en memoria;
- evidencia simulada por nombre de archivo;
- PDF generado en frontend con `jsPDF` y `jspdf-autotable`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### EmployeeAnalyticsReport

Entidad principal del analisis estadistico.

```ts
type EmployeeAnalyticsReport = {
  id: string
  companyId: string
  periodicity: AnalyticsPeriodicity
  year: number
  period: string
  responsibleEmployeeId: string
  responsibleEmployee: {
    id: string
    name: string
    lastName: string
    email?: string
    job?: {
      id: string
      name: string
    } | null
  }
  analysisDate: string
  incidentType: IncidentType
  indicators: EmployeeAnalyticsIndicator[]
  improvementAction: EmployeeAnalyticsImprovementAction | null
  evidenceCount: number
  latestEvidence: EmployeeAnalyticsDocument | null
  createdAt: string
  updatedAt: string
  createdByUserId: string
}
```

### EmployeeAnalyticsIndicator

Indicadores calculados para un analisis.

```ts
type EmployeeAnalyticsIndicator = {
  id: string
  reportId: string
  key: AnalyticsIndicatorKey
  name: string
  value: number
  unit: string
  description: string
  chartData: Array<{
    name: string
    total: number
  }>
}
```

### EmployeeAnalyticsImprovementAction

Accion de mejora relacionada con el resultado del analisis.

```ts
type EmployeeAnalyticsImprovementAction = {
  id: string
  reportId: string
  description: string
  responsible: string
  dueDate: string
  status: "OPEN" | "CLOSED"
  createdAt: string
  updatedAt: string
}
```

### EmployeeAnalyticsDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type EmployeeAnalyticsDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "EMPLOYEE_ANALYTICS"
  referenceId: string
  type: "EMPLOYEE_ANALYTICS_EVIDENCE"
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

### AnalyticsPeriodicity

```ts
enum AnalyticsPeriodicity {
  ANNUAL = 'ANNUAL',
  SEMESTER = 'SEMESTER',
  QUARTER = 'QUARTER',
  BIMONTHLY = 'BIMONTHLY',
  MONTHLY = 'MONTHLY',
}
```

Labels frontend:

- `ANNUAL`: Anual
- `SEMESTER`: Semestral
- `QUARTER`: Trimestral
- `BIMONTHLY`: Bimestral
- `MONTHLY`: Mensual

### IncidentType

Debe reutilizar el enum de novedades laborales/incidentes.

```ts
enum IncidentType {
  INCIDENTE = 'INCIDENTE',
  ACCIDENTE = 'ACCIDENTE',
  ENFERMEDAD_LABORAL = 'ENFERMEDAD_LABORAL',
  INCAPACIDAD_MEDICA = 'INCAPACIDAD_MEDICA',
  LICENCIA_MATERNIDAD = 'LICENCIA_MATERNIDAD',
  LICENCIA_PATERNIDAD = 'LICENCIA_PATERNIDAD',
  VACACIONES = 'VACACIONES',
  DIAS_NO_REMUNERADO = 'DIAS_NO_REMUNERADO',
  DIA_REMUNERADO = 'DIA_REMUNERADO',
  REVISION_POR_LA_DIRECCION = 'REVISION_POR_LA_DIRECCION',
  REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA = 'REQUERIMIENTO_DE_AUTORIDAD_ADMINISTRATIVA',
  RECOMENDACION_DE_LA_ARL = 'RECOMENDACION_DE_LA_ARL',
}
```

### AnalyticsIndicatorKey

```ts
enum AnalyticsIndicatorKey {
  FREQUENCY = 'FREQUENCY',
  SEVERITY = 'SEVERITY',
  MORTALITY = 'MORTALITY',
  PREVALENCE = 'PREVALENCE',
  INCIDENCE = 'INCIDENCE',
  ABSENTEEISM = 'ABSENTEEISM',
}
```

Indicadores actuales del frontend:

- `FREQUENCY`: Frecuencia de accidentalidad
- `SEVERITY`: Severidad
- `MORTALITY`: Mortalidad
- `PREVALENCE`: Prevalencia
- `INCIDENCE`: Incidencia
- `ABSENTEEISM`: Ausentismo

## Campos del formulario de analisis

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `periodicity` | enum | si | `ANNUAL`, `SEMESTER`, `QUARTER`, `BIMONTHLY`, `MONTHLY`. |
| `year` | number | si | Vigencia del analisis. |
| `period` | string | si | `YEAR`, `Semestre 1`, `Trimestre 1`, `Enero`, etc. |
| `responsibleEmployeeId` | uuid | si | Funcionario responsable del analisis. |
| `analysisDate` | date | si | Fecha de elaboracion del analisis. |
| `incidentType` | enum | si | Tipo de novedad laboral que se va a analizar. |

## Campos de accion de mejora

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `description` | string | si | Descripcion de la accion de mejora. |
| `responsible` | string | si | Responsable de ejecutar o hacer seguimiento a la accion. |
| `dueDate` | date | si | Fecha compromiso de cumplimiento. |

## Campos de evidencia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de soporte: PDF, imagen, documento, hoja de calculo, etc. |
| `description` | string | si | Descripcion visible de la evidencia. |
| `isConfirmed` | boolean | no | Confirmacion de validez del soporte. Por defecto `true`. |

## Reglas de negocio

1. El analisis pertenece siempre a la empresa del usuario autenticado.
2. La periodicidad define las opciones validas de `period`:
   - `ANNUAL`: `YEAR`
   - `SEMESTER`: `Semestre 1`, `Semestre 2`
   - `QUARTER`: `Trimestre 1` a `Trimestre 4`
   - `BIMONTHLY`: `Bimestre 1` a `Bimestre 6`
   - `MONTHLY`: meses de enero a diciembre
3. `responsibleEmployeeId` debe pertenecer a un funcionario de la misma empresa.
4. Los indicadores deben calcularse desde datos reales de novedades laborales/incidentes de la empresa.
5. El frontend espera recibir `indicators` ya calculados por backend.
6. Una accion de mejora es opcional al crear el analisis, pero debe poder registrarse posteriormente.
7. La evidencia es opcional al crear el analisis y se carga desde las acciones del registro.
8. El PDF puede generarse en frontend con los datos recibidos o backend puede ofrecer endpoint de exportacion.

## Calculo esperado de indicadores

Backend debe calcular los indicadores usando las novedades laborales/incidentes filtrados por:

- empresa autenticada;
- tipo de novedad (`incidentType`);
- rango de fechas definido por `year`, `periodicity` y `period`.

Indicadores sugeridos:

| Indicador | Fuente sugerida | Descripcion |
| --- | --- | --- |
| `FREQUENCY` | Novedades laborales | Cantidad de eventos reportados en el periodo. |
| `SEVERITY` | Novedades laborales | Dias de incapacidad o dias asociados al evento. |
| `MORTALITY` | Novedades laborales | Cantidad de eventos marcados como fatales. |
| `PREVALENCE` | Enfermedad laboral | Casos existentes dentro del periodo analizado. |
| `INCIDENCE` | Novedades laborales | Casos nuevos reportados durante el periodo. |
| `ABSENTEEISM` | Incapacidades/licencias/vacaciones | Dias asociados a ausentismo laboral. |

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear analisis

`POST /api/employee-analytics`

Request body:

```json
{
  "periodicity": "ANNUAL",
  "year": 2026,
  "period": "YEAR",
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "analysisDate": "2026-09-10",
  "incidentType": "ACCIDENTE"
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
    "periodicity": "ANNUAL",
    "year": 2026,
    "period": "YEAR",
    "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "responsibleEmployee": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Laura",
      "lastName": "Martinez",
      "email": "laura@example.com"
    },
    "analysisDate": "2026-09-10",
    "incidentType": "ACCIDENTE",
    "indicators": [
      {
        "id": "frequency",
        "reportId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "key": "FREQUENCY",
        "name": "Frecuencia de accidentalidad",
        "value": 12,
        "unit": "casos",
        "description": "Cantidad de eventos reportados para el tipo de novedad seleccionado.",
        "chartData": [
          { "name": "Ene", "total": 2 },
          { "name": "Mar", "total": 3 }
        ]
      }
    ],
    "improvementAction": null,
    "evidenceCount": 0,
    "latestEvidence": null,
    "createdAt": "2026-09-10T14:00:00.000Z",
    "updatedAt": "2026-09-10T14:00:00.000Z",
    "createdByUserId": "string"
  },
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics",
    "method": "POST",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar analisis

`GET /api/employee-analytics`

Parametros:

| Parametro | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `page` | number | no | Pagina actual. |
| `limit` | number | no | Cantidad de registros. |
| `search` | string | no | Busca por responsable, periodo o tipo de novedad. |
| `year` | number | no | Filtra por vigencia. |
| `periodicity` | enum | no | Filtra por periodicidad. |
| `period` | string | no | Filtra por periodo especifico. |
| `incidentType` | enum | no | Filtra por tipo de novedad. |
| `responsibleEmployeeId` | uuid | no | Filtra por responsable. |
| `startDate` | date | no | Fecha inicial del analisis. |
| `endDate` | date | no | Fecha final del analisis. |

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
        "periodicity": "ANNUAL",
        "year": 2026,
        "period": "YEAR",
        "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "responsibleEmployee": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Laura",
          "lastName": "Martinez",
          "email": "laura@example.com"
        },
        "analysisDate": "2026-09-10",
        "incidentType": "ACCIDENTE",
        "indicators": [],
        "improvementAction": null,
        "evidenceCount": 0,
        "latestEvidence": null,
        "createdAt": "2026-09-10T14:00:00.000Z",
        "updatedAt": "2026-09-10T14:00:00.000Z",
        "createdByUserId": "string"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

### Obtener detalle

`GET /api/employee-analytics/{id}`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "periodicity": "ANNUAL",
    "year": 2026,
    "period": "YEAR",
    "analysisDate": "2026-09-10",
    "incidentType": "ACCIDENTE",
    "indicators": [],
    "improvementAction": null,
    "evidenceCount": 0,
    "latestEvidence": null
  },
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

### Actualizar analisis

`PUT /api/employee-analytics/{id}`

Request body:

```json
{
  "periodicity": "QUARTER",
  "year": 2026,
  "period": "Trimestre 3",
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "analysisDate": "2026-09-10",
  "incidentType": "INCAPACIDAD_MEDICA"
}
```

Notas:

- Al actualizar periodo o tipo de novedad, backend debe recalcular `indicators`.
- La accion de mejora y evidencias no deben perderse por actualizar datos generales.

### Eliminar o inactivar analisis

`DELETE /api/employee-analytics/{id}`

Respuesta:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "method": "DELETE",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

## Endpoints de accion de mejora

### Crear o actualizar accion de mejora

`PUT /api/employee-analytics/{id}/improvement-action`

Request body:

```json
{
  "description": "Reforzar inspecciones de condiciones inseguras y seguimiento a acciones correctivas.",
  "responsible": "Responsable SG-SST",
  "dueDate": "2026-10-15"
}
```

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "string",
    "reportId": "string",
    "description": "Reforzar inspecciones de condiciones inseguras y seguimiento a acciones correctivas.",
    "responsible": "Responsable SG-SST",
    "dueDate": "2026-10-15",
    "status": "OPEN",
    "createdAt": "2026-09-10T14:00:00.000Z",
    "updatedAt": "2026-09-10T14:00:00.000Z"
  },
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics/string/improvement-action",
    "method": "PUT",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

## Endpoints de evidencias

### Cargar evidencia

`POST /api/employee-analytics/{id}/documents`

Request `multipart/form-data`:

| Campo | Tipo | Requerido | Descripcion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de evidencia. |
| `description` | string | si | Descripcion del soporte. |
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
    "referenceType": "EMPLOYEE_ANALYTICS",
    "referenceId": "string",
    "type": "EMPLOYEE_ANALYTICS_EVIDENCE",
    "originalName": "analisis-accidentalidad-2026.pdf",
    "mimeType": "application/pdf",
    "size": 123456,
    "storageProvider": "LOCAL",
    "isConfirmed": true,
    "downloadUrl": "string",
    "description": "Informe estadistico firmado.",
    "createdAt": "2026-09-10T14:00:00.000Z",
    "createdBy": "string"
  },
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics/string/documents",
    "method": "POST",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar evidencias

`GET /api/employee-analytics/{id}/documents`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": [],
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics/string/documents",
    "method": "GET",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

### Eliminar evidencia

`DELETE /api/employee-analytics/{id}/documents/{documentId}`

Response:

```json
{
  "ok": true,
  "message": "OK",
  "data": {},
  "errors": null,
  "meta": {
    "path": "/api/employee-analytics/string/documents/string",
    "method": "DELETE",
    "timestamp": "2026-09-10T14:00:00.000Z",
    "statusCode": 200
  }
}
```

## Endpoints de exportacion

### Descargar PDF generado por backend

Opcional si backend decide generar el documento.

`GET /api/employee-analytics/{id}/export`

Response:

- `Content-Type: application/pdf`
- Archivo PDF del analisis estadistico.

El PDF debe incluir:

- encabezado del sistema;
- periodicidad, vigencia y periodo;
- tipo de novedad laboral;
- responsable;
- fecha de analisis;
- tabla de indicadores;
- accion de mejora;
- referencia a evidencias cargadas;
- espacio para firma si aplica.

### Exportar CSV consolidado

`GET /api/employee-analytics/export`

Parametros sugeridos:

- `year`
- `periodicity`
- `incidentType`
- `responsibleEmployeeId`
- `startDate`
- `endDate`

Response:

- `Content-Type: text/csv`
- Archivo CSV legible en Excel con analisis e indicadores.

## Validaciones esperadas

- `year` debe ser numerico de 4 digitos.
- `periodicity` debe pertenecer a `AnalyticsPeriodicity`.
- `period` debe ser valido segun `periodicity`.
- `analysisDate` debe ser una fecha valida.
- `responsibleEmployeeId` debe pertenecer a la misma empresa.
- `incidentType` debe pertenecer al enum de novedades laborales.
- En acciones de mejora, `dueDate` no deberia ser anterior a `analysisDate`.
- En evidencias, `file` es obligatorio y debe respetar limites de tamano/tipo definidos globalmente.

## Integracion con otros modulos

Este modulo depende de:

- `EMPLOYEE_MANAGEMENT`: responsables disponibles.
- `INCIDENTS`: fuente principal de novedades laborales.
- `EMPLOYEE_ANALYTICS`: codigo del modulo hijo para permisos y navegacion.
- sistema documental global: almacenamiento, descarga y visualizacion de evidencias.

## Notas para frontend

Cuando backend este disponible, frontend debe reemplazar:

- `initialRecords`;
- `generateIndicators`;
- estado local de accion de mejora;
- estado local de evidencia;
- descarga simulada de evidencia;

por servicios reales en `services/employeeAnalyticsService.ts` y tipos en `types/manager/employeeAnalytics.ts`.

