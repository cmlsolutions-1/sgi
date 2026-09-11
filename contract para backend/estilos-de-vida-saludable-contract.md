# Contrato frontend/backend - Estilos de Vida Saludable

Este documento describe el contrato requerido para conectar el modulo hijo **Estilos de Vida Saludable** con backend. Actualmente el modulo esta implementado con datos mockeados en frontend y conserva actividades/evidencias solo en memoria.

## Ubicacion en frontend

- Modulo padre: `Planificacion`
- Modulo hijo: `Estilos de Vida Saludable`
- Codigo de modulo: `HEALTHY_LIFESTYLES`
- Ruta frontend: `/dashboard/healthy-lifestyles`
- Archivo principal: `app/dashboard/healthy-lifestyles/page.tsx`

## Objetivo funcional

Permitir programar, consultar y evidenciar actividades orientadas a promover habitos saludables y prevenir farmacodependencia, alcoholismo y tabaquismo dentro del entorno laboral.

El modulo contempla:

- creacion y edicion de actividades saludables;
- tipo de actividad: campana, charla, jornada o actividad;
- fecha de inicio y fecha fin;
- responsable desde la lista de funcionarios;
- objetivo;
- alcance;
- estado automatico segun fechas;
- carga de evidencia;
- visualizacion en tarjetas y lista;
- filtros por busqueda y tipo;
- barra compacta de indicadores;
- detalle de actividad;
- descarga PDF del programa.

## Estado actual de implementacion

Todo el modulo esta mockeado en frontend:

- registros iniciales;
- creacion y edicion en memoria;
- consulta real de funcionarios desde `GET /api/employees`;
- calculo local de estado segun fechas;
- carga simulada de evidencia por nombre de archivo;
- filtros locales;
- vista en tarjetas/lista;
- detalle en modal;
- PDF generado en frontend con `jsPDF` y `jspdf-autotable`.

No existe servicio dedicado en `services/` ni tipos compartidos en `types/manager/` para este modulo.

## Entidades sugeridas

### HealthyLifestyleActivity

Entidad principal de la actividad.

```ts
type HealthyLifestyleActivity = {
  id: string
  companyId: string
  name: string
  type: HealthyLifestyleActivityType
  startDate: string
  endDate: string
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
  objective: string
  scope: string
  status: HealthyLifestyleActivityStatus
  evidenceId: string | null
  evidence: HealthyLifestyleDocument | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}
```

### HealthyLifestyleDocument

Se recomienda reutilizar la entidad global de documentos usada por SafeCloud.

```ts
type HealthyLifestyleDocument = {
  id: string
  companyId: string
  ownerType: "COMPANY" | "EMPLOYEE"
  ownerId: string
  referenceType: "HEALTHY_LIFESTYLE"
  referenceId: string
  type: "HEALTHY_LIFESTYLE_EVIDENCE"
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

### HealthyLifestyleActivityType

```ts
enum HealthyLifestyleActivityType {
  CAMPAIGN = 'CAMPAIGN',
  TALK = 'TALK',
  DAY = 'DAY',
  ACTIVITY = 'ACTIVITY',
}
```

Labels frontend:

- `CAMPAIGN`: Campaña
- `TALK`: Charla
- `DAY`: Jornada
- `ACTIVITY`: Actividad

### HealthyLifestyleActivityStatus

```ts
enum HealthyLifestyleActivityStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}
```

Labels frontend:

- `PLANNED`: Planeada
- `IN_PROGRESS`: En ejecución
- `COMPLETED`: Ejecutada

## Campos del formulario de actividad

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `name` | string | si | Nombre de la actividad. |
| `type` | enum | si | `CAMPAIGN`, `TALK`, `DAY`, `ACTIVITY`. |
| `startDate` | date | si | Fecha de inicio. |
| `endDate` | date | si | Fecha fin. |
| `responsibleEmployeeId` | uuid | si | Funcionario responsable. |
| `objective` | string | si | Objetivo de la actividad. |
| `scope` | string | si | Alcance, poblacion objetivo, areas o cobertura. |

## Campos de evidencia

| Campo frontend | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `file` | binary | si | Archivo de soporte. En el mock actual se guarda solo el nombre. |
| `description` | string | si | Descripcion breve de la evidencia. |
| `isConfirmed` | boolean | no | Por defecto `true`. |

Archivos permitidos sugeridos:

- PDF;
- imagenes;
- Word;
- Excel;
- archivos comprimidos si la politica documental lo permite.

## Reglas de negocio

1. La actividad pertenece siempre a la empresa del usuario autenticado.
2. Backend debe resolver `companyId` desde el JWT; frontend no envia `companyId`.
3. `name`, `type`, `startDate`, `endDate`, `responsibleEmployeeId`, `objective` y `scope` son obligatorios.
4. `endDate` no puede ser anterior a `startDate`.
5. `responsibleEmployeeId` debe pertenecer a un funcionario activo de la misma empresa.
6. El estado debe calcularse automaticamente:
   - si `endDate` es menor que la fecha actual: `COMPLETED`;
   - si `startDate` es menor o igual a la fecha actual y `endDate` es mayor o igual a la fecha actual: `IN_PROGRESS`;
   - si `startDate` es mayor que la fecha actual: `PLANNED`.
7. El backend puede recalcular estado al listar/consultar para evitar estados desactualizados.
8. La evidencia es opcional al crear la actividad y se carga posteriormente desde acciones.
9. Solo debe existir una evidencia principal en la version actual del frontend. Si backend permite multiples evidencias, frontend puede usar la mas reciente como principal.
10. La actividad debe poder exportarse a PDF con los datos del programa y referencia de evidencia.

## Endpoints requeridos

Todos los endpoints requieren JWT Bearer y deben resolver `companyId` desde el usuario autenticado.

### Crear actividad saludable

`POST /api/healthy-lifestyles`

Request body:

```json
{
  "name": "Campaña de prevención de alcoholismo y tabaquismo",
  "type": "CAMPAIGN",
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "objective": "Promover hábitos saludables y prevenir el consumo de alcohol, tabaco y sustancias psicoactivas en el entorno laboral.",
  "scope": "Todos los trabajadores directos, contratistas y personal operativo."
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
    "name": "Campaña de prevención de alcoholismo y tabaquismo",
    "type": "CAMPAIGN",
    "startDate": "2026-09-01",
    "endDate": "2026-09-30",
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
    "objective": "Promover hábitos saludables y prevenir el consumo de alcohol, tabaco y sustancias psicoactivas en el entorno laboral.",
    "scope": "Todos los trabajadores directos, contratistas y personal operativo.",
    "status": "IN_PROGRESS",
    "evidence": null,
    "createdAt": "2026-09-10T12:00:00.000Z",
    "updatedAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/healthy-lifestyles",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Listar actividades saludables

`GET /api/healthy-lifestyles`

Query params:

| Parametro | Tipo | Requerido | Observacion |
| --- | --- | --- | --- |
| `page` | number | no | Numero de pagina. |
| `limit` | number | no | Registros por pagina. |
| `type` | enum | no | Tipo de actividad. |
| `status` | enum | no | Estado calculado. |
| `responsibleEmployeeId` | uuid | no | Filtro por responsable. |
| `startDate` | date | no | Fecha inicial del rango. |
| `endDate` | date | no | Fecha final del rango. |
| `hasEvidence` | boolean | no | Filtro por actividades con evidencia. |
| `search` | string | no | Busca por actividad, responsable, objetivo o alcance. |

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
        "name": "Campaña de prevención de alcoholismo y tabaquismo",
        "type": "CAMPAIGN",
        "startDate": "2026-09-01",
        "endDate": "2026-09-30",
        "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "responsibleEmployee": {
          "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
          "name": "Diana",
          "lastName": "Mendoza",
          "email": "diana@example.com"
        },
        "objective": "Promover hábitos saludables y prevenir el consumo de alcohol, tabaco y sustancias psicoactivas en el entorno laboral.",
        "scope": "Todos los trabajadores directos, contratistas y personal operativo.",
        "status": "IN_PROGRESS",
        "evidence": {
          "id": "document-id",
          "type": "HEALTHY_LIFESTYLE_EVIDENCE",
          "originalName": "programa-estilos-vida-saludable-2026.pdf",
          "mimeType": "application/pdf",
          "downloadUrl": "/api/healthy-lifestyles/activity-id/evidence/document-id"
        },
        "createdAt": "2026-09-10T12:00:00.000Z",
        "updatedAt": "2026-09-10T12:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "summary": {
      "total": 1,
      "planned": 0,
      "inProgress": 1,
      "completed": 0,
      "withEvidence": 1
    }
  },
  "errors": null,
  "meta": {
    "path": "/api/healthy-lifestyles",
    "method": "GET",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 200
  }
}
```

### Consultar actividad por id

`GET /api/healthy-lifestyles/{id}`

Debe retornar la actividad con la evidencia principal.

### Actualizar actividad saludable

`PUT /api/healthy-lifestyles/{id}`

Request body:

```json
{
  "name": "Campaña de prevención de alcoholismo y tabaquismo",
  "type": "CAMPAIGN",
  "startDate": "2026-09-01",
  "endDate": "2026-09-30",
  "responsibleEmployeeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "objective": "Promover hábitos saludables y prevenir el consumo de alcohol, tabaco y sustancias psicoactivas en el entorno laboral.",
  "scope": "Todos los trabajadores directos, contratistas y personal operativo."
}
```

### Eliminar actividad saludable

`DELETE /api/healthy-lifestyles/{id}`

### Cargar evidencia

`POST /api/healthy-lifestyles/{id}/evidence`

Content-Type: `multipart/form-data`

Form data:

| Campo | Tipo | Requerido |
| --- | --- | --- |
| `file` | binary | si |
| `description` | string | si |
| `isConfirmed` | boolean | no |

Response esperado:

```json
{
  "ok": true,
  "message": "OK",
  "data": {
    "id": "document-id",
    "companyId": "company-id",
    "referenceType": "HEALTHY_LIFESTYLE",
    "referenceId": "activity-id",
    "type": "HEALTHY_LIFESTYLE_EVIDENCE",
    "originalName": "programa-estilos-vida-saludable-2026.pdf",
    "mimeType": "application/pdf",
    "size": 204800,
    "storageProvider": "LOCAL",
    "isConfirmed": true,
    "downloadUrl": "/api/healthy-lifestyles/activity-id/evidence/document-id",
    "description": "Programa anual y cronograma de campañas.",
    "createdAt": "2026-09-10T12:00:00.000Z",
    "createdBy": "user-id"
  },
  "errors": null,
  "meta": {
    "path": "/api/healthy-lifestyles/activity-id/evidence",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 201
  }
}
```

### Ver/descargar evidencia

`GET /api/healthy-lifestyles/{id}/evidence/{documentId}`

Debe permitir visualizar en navegador cuando sea PDF o imagen y descargar cuando aplique.

### Eliminar evidencia

`DELETE /api/healthy-lifestyles/{id}/evidence/{documentId}`

### Descargar programa PDF

`GET /api/healthy-lifestyles/{id}/export`

Response:

- Media type: `application/pdf`
- Archivo: programa de estilos de vida saludable.

Si backend no genera el PDF, el frontend puede seguir generandolo con `jsPDF` usando la respuesta de `GET /api/healthy-lifestyles/{id}`.

El PDF debe incluir:

- nombre de la actividad;
- tipo;
- responsable;
- estado;
- fecha inicio;
- fecha fin;
- objetivo;
- alcance;
- referencia de evidencia cargada;
- espacio para firma del responsable.

## Validaciones esperadas

1. `name` es obligatorio.
2. `type` debe pertenecer al enum `HealthyLifestyleActivityType`.
3. `startDate` es obligatoria.
4. `endDate` es obligatoria.
5. `endDate` no puede ser anterior a `startDate`.
6. `responsibleEmployeeId` es obligatorio y debe pertenecer a un funcionario activo de la empresa.
7. `objective` es obligatorio.
8. `scope` es obligatorio.
9. La actividad consultada, editada o eliminada debe pertenecer a la empresa autenticada.
10. La evidencia cargada debe pertenecer a la actividad indicada.
11. Si el modulo hijo `HEALTHY_LIFESTYLES` no esta habilitado para la empresa, backend debe responder `403`.

## Integracion con empleados

Para seleccionar responsable, el frontend usa la lista de funcionarios.

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
  "code": "HEALTHY_LIFESTYLES",
  "name": "Estilos de Vida Saludable",
  "route": "/healthy-lifestyles",
  "index": 0,
  "parentId": "uuid-del-modulo-padre-planning"
}
```

El modulo padre esperado es:

```json
{
  "code": "PLANNING",
  "name": "Planificacion",
  "route": "/planning"
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
      "message": "La fecha fin no puede ser anterior a la fecha de inicio"
    }
  ],
  "meta": {
    "path": "/api/healthy-lifestyles",
    "method": "POST",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "statusCode": 400
  }
}
```

## Notas para integracion frontend

Cuando backend este listo, se deben reemplazar los mocks por:

- `services/healthyLifestylesService.ts`;
- `types/manager/healthyLifestyles.ts`;
- carga inicial desde `GET /api/healthy-lifestyles`;
- creacion desde `POST /api/healthy-lifestyles`;
- edicion desde `PUT /api/healthy-lifestyles/{id}`;
- eliminacion desde `DELETE /api/healthy-lifestyles/{id}`;
- carga de evidencia desde `POST /api/healthy-lifestyles/{id}/evidence`;
- visualizacion/descarga desde `GET /api/healthy-lifestyles/{id}/evidence/{documentId}`;
- descarga de programa desde `GET /api/healthy-lifestyles/{id}/export` o PDF frontend con datos reales.

La interfaz actual ya tiene:

- filtro por busqueda y tipo;
- indicadores compactos;
- vista lista/tarjetas;
- modal de crear/editar;
- modal de detalle;
- modal de evidencia;
- acciones en tres puntos;
- descarga PDF del programa.

Por eso, la integracion puede hacerse conservando el diseno actual y cambiando solamente la fuente de datos.
