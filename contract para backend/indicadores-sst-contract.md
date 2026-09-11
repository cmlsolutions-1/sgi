# Contrato frontend/backend - Indicadores SST

Este documento describe el contrato requerido para conectar el modulo hijo **Indicadores SST** con backend. Actualmente el modulo esta implementado con datos mockeados/calculados en frontend y conserva el historial de informes solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Gestion del SG-SST`
- Modulo hijo: `Indicadores SST`
- Codigo de modulo: `SST_INDICATORS`
- Ruta frontend: `/dashboard/sst-indicators`
- Archivo principal: `app/dashboard/sst-indicators/page.tsx`

## Objetivo funcional

Permitir generar, consultar y exportar indicadores SST por vigencia y periodo, consolidando informacion de accidentalidad, severidad, mortalidad, prevalencia, incidencia y ausentismo.

El modulo contempla:

- filtros por ano/vigencia;
- generacion por periodo anual, semestral, trimestral, bimestral, mensual o rango personalizado;
- calculo automatico de indicadores SST;
- clasificacion visual del estado del indicador;
- busqueda por nombre, descripcion o estado;
- graficas de resultado por indicador;
- grafica de distribucion por estado;
- tabla consolidada de indicadores;
- historial de informes generados;
- descarga del informe en PDF.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- generacion local de indicadores;
- calculo local de estado `OK`, `WATCH` y `CRITICAL`;
- filtros por periodo;
- historial local de ultimos informes;
- PDF generado en frontend con `jsPDF` y `jspdf-autotable`;
- graficas con componentes locales de analytics.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### SstIndicatorReport

Entidad principal del informe generado.

```ts
type SstIndicatorReport = {
  id: string
  companyId: string
  year: number
  period: SstIndicatorPeriod
  periodValue: string
  periodLabel: string
  startDate: string
  endDate: string
  generatedAt: string
  indicators: SstIndicatorResult[]
  summary: {
    totalIndicators: number
    okCount: number
    watchCount: number
    criticalCount: number
  }
  createdAt: string
  createdBy: string | null
}
```

### SstIndicatorResult

Resultado calculado de cada indicador dentro de un informe.

```ts
type SstIndicatorResult = {
  id: string
  reportId: string
  key: SstIndicatorKey
  name: string
  result: string
  numericValue: number
  unit: string | null
  state: SstIndicatorState
  description: string
  formula: string | null
  source: string | null
}
```

### SstIndicatorChartPoint

Dato opcional para graficas cuando backend quiera entregar series ya preparadas.

```ts
type SstIndicatorChartPoint = {
  name: string
  total: number
}
```

## Enums requeridos

### SstIndicatorPeriod

```ts
enum SstIndicatorPeriod {
  ANNUAL = 'ANNUAL',
  SEMESTER = 'SEMESTER',
  QUARTER = 'QUARTER',
  BIMONTHLY = 'BIMONTHLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM',
}
```

Labels frontend:

- `ANNUAL`: Anual
- `SEMESTER`: Semestral
- `QUARTER`: Trimestral
- `BIMONTHLY`: Bimestral
- `MONTHLY`: Mensual
- `CUSTOM`: Rango de fechas

### SstIndicatorState

```ts
enum SstIndicatorState {
  OK = 'OK',
  WATCH = 'WATCH',
  CRITICAL = 'CRITICAL',
}
```

Labels frontend:

- `OK`: Cumple
- `WATCH`: Seguimiento
- `CRITICAL`: Critico

### SstIndicatorKey

```ts
enum SstIndicatorKey {
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

## Campos del formulario de generacion

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `year` | number | si | Ano/vigencia del informe. |
| `period` | enum | si | `ANNUAL`, `SEMESTER`, `QUARTER`, `BIMONTHLY`, `MONTHLY`, `CUSTOM`. |
| `periodValue` | string | condicional | Requerido cuando `period` no es `CUSTOM`. |
| `startDate` | date | condicional | Requerido cuando `period` es `CUSTOM`. |
| `endDate` | date | condicional | Requerido cuando `period` es `CUSTOM`. |
| `search` | string | no | Solo filtro frontend para la tabla. No es necesario para generar el informe. |

## Valores validos por periodo

| Periodo | Valores de `periodValue` |
| --- | --- |
| `ANNUAL` | `YEAR` |
| `SEMESTER` | `S1`, `S2` |
| `QUARTER` | `Q1`, `Q2`, `Q3`, `Q4` |
| `BIMONTHLY` | `B1`, `B2`, `B3`, `B4`, `B5`, `B6` |
| `MONTHLY` | `01` a `12` |
| `CUSTOM` | No aplica. Se usan `startDate` y `endDate`. |

## Reglas de negocio

1. El informe pertenece siempre a la empresa del usuario autenticado.
2. Backend debe resolver `companyId` desde el JWT; frontend no envia `companyId`.
3. Para periodos predefinidos, backend debe calcular `startDate` y `endDate` de acuerdo con `year`, `period` y `periodValue`.
4. Para `CUSTOM`, `startDate` y `endDate` son obligatorios.
5. `startDate` no puede ser mayor que `endDate`.
6. `year` debe estar entre `2000` y `2100`, salvo que backend defina otra regla global.
7. El informe debe retornar los indicadores ya calculados para que frontend no dependa de datos mockeados.
8. El historial debe listar los informes generados por la empresa, ordenados del mas reciente al mas antiguo.
9. La busqueda de indicadores puede mantenerse en frontend, pero backend puede soportar `search` si se desea filtrar desde servidor.
10. Si no hay datos fuente para el periodo, los indicadores deben retornar valor `0`, no `null`.

## Calculo esperado de indicadores

Backend debe calcular los indicadores usando datos reales de la empresa dentro del rango de fechas generado.

Fuentes sugeridas:

- novedades laborales/incidentes;
- incapacidades medicas;
- enfermedades laborales;
- accidentes;
- funcionarios activos;
- dias perdidos o dias de incapacidad registrados.

| Indicador | Key | Unidad sugerida | Fuente sugerida | Descripcion |
| --- | --- | --- | --- | --- |
| Frecuencia de accidentalidad | `FREQUENCY` | tasa/casos | Novedades laborales tipo accidente/incidente | Relacion de accidentes frente al periodo seleccionado. |
| Severidad | `SEVERITY` | dias/tasa | Dias de incapacidad o dias perdidos | Impacto de los eventos segun dias perdidos o afectacion. |
| Mortalidad | `MORTALITY` | casos | Eventos fatales | Eventos mortales reportados en la vigencia filtrada. |
| Prevalencia | `PREVALENCE` | tasa/% | Enfermedad laboral | Casos existentes de enfermedad laboral frente a poblacion expuesta. |
| Incidencia | `INCIDENCE` | tasa/% | Nuevos casos | Nuevos casos registrados durante el periodo. |
| Ausentismo | `ABSENTEEISM` | % | Incapacidades/novedades | Porcentaje estimado de ausentismo por novedades laborales. |

### Clasificacion sugerida

El frontend actual usa esta regla visual:

```ts
type SstIndicatorState = "OK" | "WATCH" | "CRITICAL"

// Para indicadores donde menor es mejor:
// 0 a 2: OK
// mayor a 2 y menor o igual a 4: WATCH
// mayor a 4: CRITICAL

// Para indicadores positivos donde mayor es mejor:
// >= 90: OK
// >= 70 y < 90: WATCH
// < 70: CRITICAL
```

Backend puede ajustar estos umbrales, pero debe retornar siempre `state` para que la interfaz pinte correctamente el resultado.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Generar informe de indicadores

`POST /api/sst-indicators/generate`

Request body:

```json
{
  "year": 2026,
  "period": "ANNUAL",
  "periodValue": "YEAR",
  "startDate": null,
  "endDate": null
}
```

Request body para rango personalizado:

```json
{
  "year": 2026,
  "period": "CUSTOM",
  "periodValue": "CUSTOM",
  "startDate": "2026-01-01",
  "endDate": "2026-03-31"
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
    "year": 2026,
    "period": "ANNUAL",
    "periodValue": "YEAR",
    "periodLabel": "Todo el año",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "generatedAt": "2026-09-10T12:00:00.000Z",
    "summary": {
      "totalIndicators": 6,
      "okCount": 4,
      "watchCount": 1,
      "criticalCount": 1
    },
    "indicators": [
      {
        "id": "frequency",
        "reportId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "key": "FREQUENCY",
        "name": "Frecuencia de accidentalidad",
        "result": "1.8",
        "numericValue": 1.8,
        "unit": "tasa",
        "state": "OK",
        "description": "Relacion de accidentes frente al periodo seleccionado.",
        "formula": "Numero de accidentes / trabajadores expuestos * factor",
        "source": "Novedades laborales"
      },
      {
        "id": "severity",
        "reportId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "key": "SEVERITY",
        "name": "Severidad",
        "result": "3.2",
        "numericValue": 3.2,
        "unit": "tasa",
        "state": "WATCH",
        "description": "Impacto de los eventos segun dias perdidos o afectacion.",
        "formula": "Dias perdidos / trabajadores expuestos * factor",
        "source": "Novedades laborales"
      }
    ],
    "createdAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-indicators/generate",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar informes generados

`GET /api/sst-indicators`

Query params:

| Parametro | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `page` | number | no | Numero de pagina. |
| `limit` | number | no | Registros por pagina. |
| `year` | number | no | Filtro por vigencia. |
| `period` | enum | no | Filtro por periodicidad. |
| `startDate` | date | no | Filtro por fecha inicial del informe. |
| `endDate` | date | no | Filtro por fecha final del informe. |
| `state` | enum | no | Permite buscar informes con algun indicador en estado especifico. |
| `search` | string | no | Busca por nombre/descripcion de indicador. |

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
        "year": 2026,
        "period": "ANNUAL",
        "periodValue": "YEAR",
        "periodLabel": "Todo el año",
        "startDate": "2026-01-01",
        "endDate": "2026-12-31",
        "generatedAt": "2026-09-10T12:00:00.000Z",
        "summary": {
          "totalIndicators": 6,
          "okCount": 4,
          "watchCount": 1,
          "criticalCount": 1
        },
        "indicators": []
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-indicators",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Consultar informe por id

`GET /api/sst-indicators/{id}`

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "companyId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "year": 2026,
    "period": "ANNUAL",
    "periodValue": "YEAR",
    "periodLabel": "Todo el año",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "generatedAt": "2026-09-10T12:00:00.000Z",
    "summary": {
      "totalIndicators": 6,
      "okCount": 4,
      "watchCount": 1,
      "criticalCount": 1
    },
    "indicators": [
      {
        "id": "frequency",
        "reportId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "key": "FREQUENCY",
        "name": "Frecuencia de accidentalidad",
        "result": "1.8",
        "numericValue": 1.8,
        "unit": "tasa",
        "state": "OK",
        "description": "Relacion de accidentes frente al periodo seleccionado.",
        "formula": "Numero de accidentes / trabajadores expuestos * factor",
        "source": "Novedades laborales"
      }
    ],
    "createdAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/sst-indicators/3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Descargar informe PDF

`GET /api/sst-indicators/{id}/export`

Response:

- Media type: `application/pdf`
- Archivo: informe de indicadores SST.

Si backend no genera el PDF, el frontend puede seguir generandolo con `jsPDF` usando la respuesta de `GET /api/sst-indicators/{id}`.

## Validaciones esperadas

1. `year` es obligatorio y debe ser numerico.
2. `period` debe pertenecer al enum `SstIndicatorPeriod`.
3. `periodValue` debe corresponder al periodo seleccionado.
4. En `CUSTOM`, `startDate` y `endDate` son obligatorios.
5. En `CUSTOM`, `startDate <= endDate`.
6. El informe consultado o exportado debe pertenecer a la empresa autenticada.
7. Si el modulo hijo `SST_INDICATORS` no esta habilitado para la empresa, backend debe responder `403`.

## Integracion con modulo de permisos

El backend debe exponer este modulo en `GET /api/modules/me` cuando la empresa tenga habilitado el modulo hijo.

Estructura esperada:

```json
{
  "id": "uuid-del-modulo-hijo",
  "code": "SST_INDICATORS",
  "name": "Indicadores SST",
  "route": "/sst-indicators",
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
      "message": "startDate no puede ser mayor que endDate"
    }
  ],
  "meta": {
    "path": "/api/sst-indicators/generate",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 400
  }
}
```

## Notas para integracion frontend

Cuando backend este listo, se deben reemplazar los mocks por:

- `services/sstIndicatorsService.ts`;
- `types/manager/sstIndicators.ts`;
- carga inicial desde `GET /api/sst-indicators`;
- generacion desde `POST /api/sst-indicators/generate`;
- detalle desde `GET /api/sst-indicators/{id}`;
- descarga desde `GET /api/sst-indicators/{id}/export` o PDF frontend con datos reales.

La interfaz actual ya tiene:

- filtros de generacion;
- tarjetas de resumen;
- graficas;
- tabla de indicadores;
- historial de informes;
- boton de exportacion PDF.

Por eso, la integracion puede hacerse conservando el diseno actual y cambiando solamente la fuente de datos.
