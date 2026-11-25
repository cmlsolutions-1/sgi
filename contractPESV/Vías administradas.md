# Vías administradas

> **Estado del contrato:** el comportamiento descrito como **IMPLEMENTADO** fue verificado en el frontend actual. La API, persistencia multiempresa y permisos marcados **PROPUESTO** deben ser construidos en backend. Los datos actuales usan localStorage y registros demostrativos.

## A. Identificación del módulo

- **Nombre visible:** Vías administradas
- **Código de navegación:** `PESV_MANAGED_ROADS`
- **Ruta frontend:** `/dashboard/pesv-managed-roads`
- **Objetivo:** Vías, zonas de conflicto, inspecciones y mantenimiento de infraestructura. Centraliza el ciclo de registro, consulta, seguimiento, evidencia, trazabilidad y exportación de esta materia PESV.
- **Archivos fuente:** `app/dashboard/pesv-managed-roads/page.tsx`; compartidos: `components/pesv/planning-module.tsx, lib/pesv/planning.ts, lib/pesv/operations.ts, lib/pesv/assurance.ts`.
- **Dependencias:** Next.js/React, componentes SafeCloud, Sonner, Lucide, jsPDF, catálogos PESV y localStorage.
- **Persistencia actual:** **IMPLEMENTADO** en `safecloud:pesv-managed-roads`; debe reemplazarse por la API propuesta sin cambiar el flujo visual.

## B. Estructura interna

- **Protocolos:** formulario, listado, detalle, edición, eliminación condicionada, revisión anual, difusión, evidencias, PDF.
- **Vías administradas:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Acciones de control:** formulario, listado, detalle, edición, eliminación condicionada, seguimiento, evidencias, PDF.
- **Inspecciones de vías:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Mantenimiento de vías:** formulario, listado, detalle, edición, eliminación condicionada, seguimiento, evidencias, PDF.
- **Siniestros en vías:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- Filtros por texto, estado/tipo y vigencia cuando el dato existe; alternancia de vistas cuando la configuración lo ofrece.
- Inventario documental con previsualización, descarga, asociación a registro/entrada y control de retención.

## C. Flujo completo

1. El usuario abre la ruta desde PESV; la interfaz carga catálogo, registros del módulo y referencias relacionadas.
2. Consulta KPI, filtros, lista y detalle. Los datos demostrativos solo sirven como estado inicial actual.
3. Crea un registro seleccionando su tipo; el formulario muestra campos condicionales y valida requeridos, fechas, números y referencias.
4. El backend guarda primero el registro y devuelve su `id`. Solo entonces se habilita la evidencia.
5. El usuario puede editar mientras el estado y la retención lo permitan; cada cambio conserva historial.
6. Según el tipo registra cronograma, seguimiento, revisión anual o difusión. Las entradas pueden tener evidencia propia mediante `targetId`.
7. Los archivos se consultan, previsualizan, descargan o eliminan con autorización.
8. La eliminación se bloquea cuando existen referencias desde otros módulos o reglas de conservación.
9. La vista filtrada y el detalle se pueden exportar a PDF.

## D. Modelo de datos completo

Además de los campos funcionales, cada registro requiere: `id: UUID`, `companyId: UUID`, `kind: string`, `createdAt: timestamptz`, `updatedAt: timestamptz`, `createdBy: UUID`, `updatedBy: UUID`, `version: integer` para control optimista, relaciones congeladas en `links`, historial de cambios y colecciones de actividades, entradas y evidencias. En el frontend actual estos datos se guardan como `RecordItem` en localStorage.

### Protocolos

Tipo técnico: `road-protocol`. Capacidades: revisión anual, difusión, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Próxima revisión | `nextReviewDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Vías públicas o privadas a cargo y alcance | `scope` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Operación, accesos, circulación y señalización | `operation` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Identificación y control de zonas de conflicto | `conflicts` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento y responsables de inspección anual | `annualInspections` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Mantenimiento preventivo de infraestructura y señalización | `preventiveMaintenance` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Reporte de siniestros propios y de terceros con afectación a colaboradores | `accidentReporting` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Vías administradas

Tipo técnico: `managed-road`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Protocolo de operación | `protocolId` | UUID | Sí | Catálogo `roadProtocols` | Sin condición adicional. | Editable; persistente |
| Tipo de vía | `type` | enum/string | Sí | `Privada`, `Pública administrada`, `Zona de acceso / circulación interna` | Sin condición adicional. | Editable; persistente |
| Ubicación y tramos | `location` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Título / condición de administración o control | `administration` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable de la vía | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Rutas relacionadas | `routeIds` | UUID[] | No | Catálogo `routes`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Riesgos viales relacionados | `riskIds` | UUID[] | No | Catálogo `risks`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Infraestructura y señalización existentes | `infrastructure` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Zonas de conflicto y actores expuestos | `conflictZones` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Próxima inspección anual | `nextInspectionDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Plan preventivo y frecuencia de mantenimiento | `maintenancePlan` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Acciones de control

Tipo técnico: `road-action`. Capacidades: seguimientos, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Vía administrada | `roadId` | UUID | Sí | Catálogo `managedRoads` | Sin condición adicional. | Editable; persistente |
| Zona de conflicto | `zone` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Riesgo / hallazgo que se controla | `risk` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Plan de acción y control propuesto | `control` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Fecha de inicio | `startDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha final | `endDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Presupuesto (COP) | `budget` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Actividad del plan de trabajo | `workActivityId` | UUID | No | Catálogo `workActivities` | Sin condición adicional. | Editable; persistente |

### Inspecciones de vías

Tipo técnico: `road-inspection`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Vía administrada | `roadId` | UUID | Sí | Catálogo `managedRoads` | Sin condición adicional. | Editable; persistente |
| Fecha de inspección | `inspectionDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Inspector | `inspectorId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Pavimento, drenaje e infraestructura | `surface` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Señalización, iluminación y visibilidad | `signage` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Zonas de conflicto y hallazgos | `conflicts` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Resultado | `result` | enum/string | Sí | `Sin hallazgos`, `Requiere intervención`, `Restricción de uso` | Sin condición adicional. | Editable; persistente |
| Acciones requeridas / recomendaciones | `recommendations` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Próxima inspección | `nextInspectionDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |

### Mantenimiento de vías

Tipo técnico: `road-maintenance`. Capacidades: seguimientos, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Vía administrada | `roadId` | UUID | Sí | Catálogo `managedRoads` | Sin condición adicional. | Editable; persistente |
| Tipo de mantenimiento | `type` | enum/string | Sí | `Preventivo`, `Correctivo`, `Señalización` | Sin condición adicional. | Editable; persistente |
| Intervención y señalización a ejecutar | `description` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable de ejecución | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Fecha de inicio | `startDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha final | `endDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Presupuesto (COP) | `budget` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Recursos, equipos y materiales | `resources` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Siniestros en vías

Tipo técnico: `road-incident`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Vía administrada | `roadId` | UUID | Sí | Catálogo `managedRoads` | Sin condición adicional. | Editable; persistente |
| Fecha del siniestro | `eventDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Quién ocasionó el evento | `involvedParty` | enum/string | Sí | `Colaborador`, `Tercero`, `Por determinar` | Sin condición adicional. | Editable; persistente |
| Colaboradores afectados | `affectedIds` | UUID[] | Sí | Catálogo `people`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Hechos y afectaciones | `description` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Acciones inmediatas y reporte | `immediateActions` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Investigación interna vinculada | `investigationId` | UUID | No | Catálogo `roadInvestigations` | Sin condición adicional. | Editable; persistente |

### Subentidades compartidas

- **Activity:** `id`, `name`, `responsibleId`, `startDate`, `endDate`, `status`, `observations`.
- **Entry:** `id`, `kind`, `date`, `observations`, `progress?`, `measuredValue?`, `medium?`, `audience?`, `conclusion?`, `nextReviewDate?`, `attendeeIds?`, `learningResult?`, `responseMinutes?`.
- **Evidence:** `id`, `recordId`, `targetId?`, `originalName`, `mimeType`, `size`, `storageKey`, `description`, `isConfirmed`, `uploadedAt`, `uploadedBy`.
- **History:** `id`, `recordId`, `event`, `snapshot`, `createdAt`, `actorId`.

## E-F. Endpoints necesarios y especificación

Todos requieren JWT, resuelven `companyId` desde la sesión y devuelven envoltorio `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/managed-roads/road-protocols` | Listar protocolos con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/managed-roads/road-protocols` | Crear protocolo de vías. |
| GET | `/api/pesv/managed-roads/road-protocols/{id}` | Consultar detalle completo de protocolo de vías. |
| PUT | `/api/pesv/managed-roads/road-protocols/{id}` | Actualizar protocolo de vías conservando historial. |
| DELETE | `/api/pesv/managed-roads/road-protocols/{id}` | Eliminar o archivar protocolo de vías si no tiene dependencias. |
| GET | `/api/pesv/managed-roads/road-protocols/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/managed-roads/road-protocols/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/managed-roads/road-protocols/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/managed-roads/road-protocols/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/managed-roads/road-protocols/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/managed-roads/road-protocols/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/managed-roads/road-protocols/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/managed-roads/road-protocols/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/managed-roads/road-protocols/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/managed-roads/managed-roads` | Listar vías administradas con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/managed-roads/managed-roads` | Crear vía administrada. |
| GET | `/api/pesv/managed-roads/managed-roads/{id}` | Consultar detalle completo de vía administrada. |
| PUT | `/api/pesv/managed-roads/managed-roads/{id}` | Actualizar vía administrada conservando historial. |
| DELETE | `/api/pesv/managed-roads/managed-roads/{id}` | Eliminar o archivar vía administrada si no tiene dependencias. |
| GET | `/api/pesv/managed-roads/managed-roads/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/managed-roads/managed-roads/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/managed-roads/managed-roads/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/managed-roads/managed-roads/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/managed-roads/managed-roads/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/managed-roads/road-actions` | Listar acciones de control con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/managed-roads/road-actions` | Crear acción de control vial. |
| GET | `/api/pesv/managed-roads/road-actions/{id}` | Consultar detalle completo de acción de control vial. |
| PUT | `/api/pesv/managed-roads/road-actions/{id}` | Actualizar acción de control vial conservando historial. |
| DELETE | `/api/pesv/managed-roads/road-actions/{id}` | Eliminar o archivar acción de control vial si no tiene dependencias. |
| GET | `/api/pesv/managed-roads/road-actions/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/managed-roads/road-actions/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/managed-roads/road-actions/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/managed-roads/road-actions/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/managed-roads/road-actions/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/managed-roads/road-actions/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/managed-roads/road-actions/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/managed-roads/road-actions/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/managed-roads/road-actions/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/managed-roads/road-inspections` | Listar inspecciones de vías con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/managed-roads/road-inspections` | Crear inspección de vía. |
| GET | `/api/pesv/managed-roads/road-inspections/{id}` | Consultar detalle completo de inspección de vía. |
| PUT | `/api/pesv/managed-roads/road-inspections/{id}` | Actualizar inspección de vía conservando historial. |
| DELETE | `/api/pesv/managed-roads/road-inspections/{id}` | Eliminar o archivar inspección de vía si no tiene dependencias. |
| GET | `/api/pesv/managed-roads/road-inspections/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/managed-roads/road-inspections/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/managed-roads/road-inspections/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/managed-roads/road-inspections/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/managed-roads/road-inspections/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/managed-roads/road-maintenance` | Listar mantenimiento de vías con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/managed-roads/road-maintenance` | Crear mantenimiento vial. |
| GET | `/api/pesv/managed-roads/road-maintenance/{id}` | Consultar detalle completo de mantenimiento vial. |
| PUT | `/api/pesv/managed-roads/road-maintenance/{id}` | Actualizar mantenimiento vial conservando historial. |
| DELETE | `/api/pesv/managed-roads/road-maintenance/{id}` | Eliminar o archivar mantenimiento vial si no tiene dependencias. |
| GET | `/api/pesv/managed-roads/road-maintenance/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/managed-roads/road-maintenance/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/managed-roads/road-maintenance/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/managed-roads/road-maintenance/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/managed-roads/road-maintenance/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/managed-roads/road-maintenance/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/managed-roads/road-maintenance/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/managed-roads/road-maintenance/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/managed-roads/road-maintenance/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/managed-roads/road-incidents` | Listar siniestros en vías con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/managed-roads/road-incidents` | Crear siniestro en vía. |
| GET | `/api/pesv/managed-roads/road-incidents/{id}` | Consultar detalle completo de siniestro en vía. |
| PUT | `/api/pesv/managed-roads/road-incidents/{id}` | Actualizar siniestro en vía conservando historial. |
| DELETE | `/api/pesv/managed-roads/road-incidents/{id}` | Eliminar o archivar siniestro en vía si no tiene dependencias. |
| GET | `/api/pesv/managed-roads/road-incidents/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/managed-roads/road-incidents/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/managed-roads/road-incidents/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/managed-roads/road-incidents/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/managed-roads/road-incidents/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/managed-roads/catalogs` | Obtener empleados y entidades relacionadas disponibles para la empresa. |

### Especificación REST aplicable a cada recurso

Los endpoints anteriores son **PROPUESTOS**. El patrón siguiente se aplica a cada tipo de registro del módulo sustituyendo `road-protocols` por el recurso correspondiente.

#### `GET /api/pesv/managed-roads/road-protocols`

- **Objetivo:** listar registros del tenant.
- **Query:** `page` (>=1), `limit` (1..100), `search`, `year`, `status`, `kind`, `sort`.
- **Respuesta 200:** `{ "ok": true, "data": { "items": [...], "total": 1, "page": 1, "limit": 20 } }`.
- **Errores:** 400 filtros inválidos, 401 sin sesión, 403 sin permiso.
- **Permiso:** `PESV_MANAGED_ROADS_VIEW`.

#### `POST /api/pesv/managed-roads/road-protocols`

- **Objetivo:** crear el registro base. No recibe archivos.
- **Body de ejemplo:**

```json
{
  "name": "string",
  "year": 2026,
  "version": "string",
  "responsibleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nextReviewDate": "2026-10-13",
  "scope": "string",
  "operation": "string",
  "conflicts": "string"
}
```

- **Respuesta 201:** `{ "ok": true, "data": { "id": "uuid", "companyId": "uuid", ...body, "createdAt": "2026-10-13T15:00:00Z" } }`.
- **Errores:** 400 validación, 404 relación no encontrada, 409 duplicado o versión vigente incompatible.
- **Efectos:** crea historial `CREATED`; habilita carga documental.

#### `GET /api/pesv/managed-roads/road-protocols/{id}`, `PUT /api/pesv/managed-roads/road-protocols/{id}`, `DELETE /api/pesv/managed-roads/road-protocols/{id}`

- **Detalle:** devuelve campos, relaciones, entradas, evidencias e historial.
- **Actualización:** recibe los mismos campos editables y `version`; 409 si la versión cambió. Fechas o campos bloqueados por estado deben rechazarse.
- **Eliminación:** preferir borrado lógico. Responder 409 si existen relaciones, retención vigente o evidencias/entradas que deban conservarse.
- **Respuestas:** 200 para consulta/actualización; 204 o envoltorio 200 para eliminación; 404 si no pertenece a la empresa.
- **Permisos:** `VIEW`, `EDIT`, `DELETE` del módulo.

#### Entradas de proceso

Cuando el tipo permite seguimiento, revisión anual o difusión, `POST /api/pesv/managed-roads/road-protocols/{id}/entries` recibe:

```json
{"kind":"FOLLOW_UP","date":"2026-10-13","observations":"Avance verificado","progress":75,"measuredValue":20,"medium":"Reunión","audience":"Comité","attendeeIds":["uuid"]}
```

`kind` admite solo las capacidades habilitadas por el tipo: `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION`. El backend valida secuencia temporal, progreso 0..100, pertenencia de asistentes y bloqueo por cierre.

#### Evidencias

- `POST /api/pesv/managed-roads/road-protocols/{id}/documents`: `multipart/form-data` con `file`, `description`, `isConfirmed` y opcional `targetId` para asociarla a una entrada.
- `GET /api/pesv/managed-roads/road-protocols/{id}/documents`: lista metadatos; nunca Base64 en la respuesta de lista.
- `GET /api/pesv/managed-roads/road-protocols/{id}/documents/{documentId}`: stream o URL firmada temporal con control de tenant.
- `DELETE /api/pesv/managed-roads/road-protocols/{id}/documents/{documentId}`: elimina lógicamente y registra auditoría; 409 si la evidencia sustenta un cierre inmutable.
- **Validación actual:** la interfaz acepta PDF e imágenes y, en los flujos compartidos, limita normalmente a 3 MB.

#### Exportación

`GET /api/pesv/managed-roads/road-protocols/export?format=pdf&year=2026&status=...` devuelve `application/pdf`. Debe reproducir filtros, fechas, relaciones y trazabilidad visibles; 422 si no hay datos exportables.

## G. Estados y enumeraciones

- **Estado derivado de registro:** `PENDING`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`, `ARCHIVED` según campos, fechas, progreso y evidencia. La etiqueta concreta visible puede variar por tipo.
- **Entry.kind:** `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION` solo cuando la configuración lo habilita.
- **Evidence:** confirmado/no confirmado; asociado al registro o a una entrada.
- Los valores exactos de cada selector están en la tabla de campos; el backend debe rechazarlos si no pertenecen al enum.
- El estado inicial es pendiente/activo. Cierre o cumplimiento requiere información obligatoria y evidencia cuando la pantalla así lo exige.

## H. Reglas de negocio

- Campos visibles por `showWhen` o por tipo no se exigen cuando están ocultos; los visibles y requeridos sí.
- `startDate <= endDate`; fechas de seguimiento no retroceden frente al registro anterior ni pueden superar hoy cuando representan ejecución ocurrida.
- Referencias se validan por tenant y se conserva una instantánea legible para auditoría.
- Progreso válido: 0..100. El cumplimiento no se infiere solo por texto; usa progreso, estado y soporte.
- Registros referenciados, cerrados o bajo retención no pueden borrarse; se archivan.
- Las exportaciones usan la zona `America/Bogota`; backend almacena UTC.

## I. Evidencias y material fotográfico

**Regla obligatoria:** crear → validar → guardar → obtener `id` → habilitar carga → asociar archivo. Nunca incluir archivo en el POST inicial. Se aceptan PDF e imágenes según el selector actual; tamaño observado usual de 3 MB. Backend debe usar almacenamiento de objetos, URL firmada temporal, hash, MIME real, tamaño, actor y auditoría.

## J. Relaciones

- Catálogo `people`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `roadProtocols`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `routes`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `risks`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `managedRoads`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `workActivities`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `roadInvestigations`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Cardinalidad: empresa 1:N registros; registro 1:N entradas; registro/entrada 1:N evidencias; registro 1:N historial.

## K. Seguridad y permisos

- JWT obligatorio; `companyId` nunca se recibe confiablemente del cliente.
- Permisos propuestos: `PESV_MANAGED_ROADS_VIEW`, `PESV_MANAGED_ROADS_CREATE`, `PESV_MANAGED_ROADS_EDIT`, `PESV_MANAGED_ROADS_DELETE`, `PESV_MANAGED_ROADS_UPLOAD`, `PESV_MANAGED_ROADS_EXPORT`.
- Validar pertenencia de registros, empleados, archivos y relaciones; prevenir IDOR y rutas cruzadas entre empresas.
- Registrar creación, edición, eliminación, cambio de estado, exportación y operaciones documentales.
- URLs de evidencia deben ser firmadas y breves; validar extensión, MIME, tamaño y malware.

## L. Casos especiales

- Duplicados por vigencia/nombre/tipo deben devolver 409 cuando representen la misma obligación.
- Relación inexistente o de otra empresa: 404 genérico. Campo condicional incoherente: 422.
- Conflicto de edición: 409 con versión actual. Fallo de almacenamiento: revertir metadatos y responder 503.
- Los datos demo y localStorage son temporales y no deben migrarse automáticamente sin validación.

## M. Criterios de aceptación

- Listar solo registros de la empresa autenticada y aplicar paginación/filtros.
- Crear cada tipo con todos sus campos; rechazar requeridos, enums, fechas o relaciones inválidas.
- Editar conserva historial; una actualización obsoleta devuelve 409.
- La carga antes de crear no es posible; después de crear permite listar, previsualizar, descargar y eliminar según permisos.
- Seguimientos/revisiones/difusiones solo aparecen en tipos habilitados y respetan secuencia.
- No se elimina un registro con dependencias o retención; se informa el motivo.
- La exportación refleja exactamente los filtros y datos del detalle.
- Un usuario de otra empresa obtiene 404/403 sin revelar existencia.

## N. Referencias al código

- Página: `app/dashboard/pesv-managed-roads/page.tsx`.
- Motor: `components/pesv/planning-module.tsx`.
- Tipos, validación, persistencia y catálogos: `lib/pesv/planning.ts`.
- Configuraciones: `lib/pesv/operations.ts` y `lib/pesv/assurance.ts`.
- Encabezado/selectores/resumen: `components/pesv/module-experience.tsx`, `components/pesv/pesv-select.tsx`, `components/pesv/assurance-overview.tsx`.

## Discrepancias y pendientes

- **DISCREPANCIA:** hoy la persistencia es localStorage y las evidencias usan URL temporal/Base64; no existe aislamiento real multiempresa.
- **PENDIENTE DE DEFINICIÓN:** política final de retención, límites de archivo y catálogo formal de permisos.
- **PROPUESTO:** backend REST descrito en este contrato, almacenamiento de objetos y control optimista.
