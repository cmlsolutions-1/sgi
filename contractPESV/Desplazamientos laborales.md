# Desplazamientos laborales

> **Estado del contrato:** el comportamiento descrito como **IMPLEMENTADO** fue verificado en el frontend actual. La API, persistencia multiempresa y permisos marcados **PROPUESTO** deben ser construidos en backend. Los datos actuales usan localStorage y registros demostrativos.

## A. Identificación del módulo

- **Nombre visible:** Desplazamientos laborales
- **Código de navegación:** `PESV_JOURNEYS`
- **Ruta frontend:** `/dashboard/pesv-journeys`
- **Objetivo:** Procedimientos, rutas, requisitos de salida y controles del recorrido. Centraliza el ciclo de registro, consulta, seguimiento, evidencia, trazabilidad y exportación de esta materia PESV.
- **Archivos fuente:** `app/dashboard/pesv-journeys/page.tsx`; compartidos: `components/pesv/planning-module.tsx, lib/pesv/planning.ts, lib/pesv/operations.ts, lib/pesv/assurance.ts`.
- **Dependencias:** Next.js/React, componentes SafeCloud, Sonner, Lucide, jsPDF, catálogos PESV y localStorage.
- **Persistencia actual:** **IMPLEMENTADO** en `safecloud:pesv-journeys`; debe reemplazarse por la API propuesta sin cambiar el flujo visual.

## B. Estructura interna

- **Procedimientos:** formulario, listado, detalle, edición, eliminación condicionada, revisión anual, difusión, evidencias, PDF.
- **Desplazamientos:** formulario, listado, detalle, edición, eliminación condicionada, seguimiento, evidencias, PDF.
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

### Procedimientos

Tipo técnico: `journey-procedure`. Capacidades: revisión anual, difusión, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Próxima revisión | `nextReviewDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Alcance: desplazamientos y salidas extramurales | `scope` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Antelación de planificación (horas) | `noticeHours` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Identificación dinámica de puntos críticos y riesgos de ruta, origen y destino | `dynamicRisks` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Ingreso y salida ordenados de las instalaciones | `siteAccess` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos para iniciar el viaje | `departureRequirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos de seguridad para conductores y vehículos | `driverVehicleRequirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Documentos que se portan y registros que se diligencian | `documents` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Horarios, tiempos de conducción y descanso | `drivingHours` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Velocidades seguras | `safeSpeeds` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Factores de desempeño y prevención de fatiga, velocidad y distracción | `performanceFactors` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Condiciones de alojamiento, restaurantes, descanso y parqueaderos | `safeStops` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Controles durante el recorrido | `routeControls` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos de finalización del viaje | `arrivalRequirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Formación en identificación y análisis dinámico de riesgos externos | `training` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Formación PESV vinculada | `trainingIds` | UUID[] | No | Catálogo `trainingActivities`; selección múltiple | Sin condición adicional. | Editable; persistente |

### Desplazamientos

Tipo técnico: `journey`. Capacidades: seguimientos, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento aplicable | `procedureId` | UUID | Sí | Catálogo `journeyProcedures` | Sin condición adicional. | Editable; persistente |
| Tipo de desplazamiento | `type` | enum/string | Sí | `Laboral`, `Integración`, `Pedagógico`, `Otro extramural` | Sin condición adicional. | Editable; persistente |
| Fecha de planificación | `planningDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha de inicio | `startDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha final | `endDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Hora de salida (HH:mm) | `departureTime` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Hora de llegada prevista (HH:mm) | `arrivalTime` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Origen | `origin` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Destino | `destination` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Rutas del diagnóstico | `routeIds` | UUID[] | No | Catálogo `routes`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Riesgos relacionados | `riskIds` | UUID[] | No | Catálogo `risks`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Puntos críticos y controles en ruta | `criticalPoints` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Riesgos del origen y destino, incluidos sitios de terceros | `siteRisks` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Plan de ingreso y salida | `siteAccess` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Conductor / responsable del desplazamiento | `driverId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Supervisor del recorrido | `supervisorId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Colaboradores participantes | `participantIds` | UUID[] | Sí | Catálogo `people`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Vehículo del diagnóstico | `vehicleId` | UUID | No | Catálogo `vehicles` | Sin condición adicional. | Editable; persistente |
| Identificación del vehículo / medio de transporte | `vehicleIdentification` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Documentación verificada y registros del viaje | `documents` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos de inicio y verificación preoperacional | `departureCheck` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Tiempos de conducción, descansos y velocidades seguras | `drivingRest` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Paradas seguras y condiciones | `stops` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Controles de fatiga, velocidad, distracción y reporte | `controls` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos de cierre del viaje | `arrivalCheck` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Plan de emergencias vinculado | `emergencyPlanId` | UUID | No | Catálogo `emergencyPlans` | Sin condición adicional. | Editable; persistente |

### Subentidades compartidas

- **Activity:** `id`, `name`, `responsibleId`, `startDate`, `endDate`, `status`, `observations`.
- **Entry:** `id`, `kind`, `date`, `observations`, `progress?`, `measuredValue?`, `medium?`, `audience?`, `conclusion?`, `nextReviewDate?`, `attendeeIds?`, `learningResult?`, `responseMinutes?`.
- **Evidence:** `id`, `recordId`, `targetId?`, `originalName`, `mimeType`, `size`, `storageKey`, `description`, `isConfirmed`, `uploadedAt`, `uploadedBy`.
- **History:** `id`, `recordId`, `event`, `snapshot`, `createdAt`, `actorId`.

## E-F. Endpoints necesarios y especificación

Todos requieren JWT, resuelven `companyId` desde la sesión y devuelven envoltorio `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/journeys/journey-procedures` | Listar procedimientos con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/journeys/journey-procedures` | Crear procedimiento de desplazamiento. |
| GET | `/api/pesv/journeys/journey-procedures/{id}` | Consultar detalle completo de procedimiento de desplazamiento. |
| PUT | `/api/pesv/journeys/journey-procedures/{id}` | Actualizar procedimiento de desplazamiento conservando historial. |
| DELETE | `/api/pesv/journeys/journey-procedures/{id}` | Eliminar o archivar procedimiento de desplazamiento si no tiene dependencias. |
| GET | `/api/pesv/journeys/journey-procedures/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/journeys/journey-procedures/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/journeys/journey-procedures/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/journeys/journey-procedures/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/journeys/journey-procedures/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/journeys/journey-procedures/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/journeys/journey-procedures/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/journeys/journey-procedures/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/journeys/journey-procedures/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/journeys/journeys` | Listar desplazamientos con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/journeys/journeys` | Crear desplazamiento. |
| GET | `/api/pesv/journeys/journeys/{id}` | Consultar detalle completo de desplazamiento. |
| PUT | `/api/pesv/journeys/journeys/{id}` | Actualizar desplazamiento conservando historial. |
| DELETE | `/api/pesv/journeys/journeys/{id}` | Eliminar o archivar desplazamiento si no tiene dependencias. |
| GET | `/api/pesv/journeys/journeys/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/journeys/journeys/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/journeys/journeys/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/journeys/journeys/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/journeys/journeys/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/journeys/journeys/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/journeys/journeys/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/journeys/journeys/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/journeys/journeys/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/journeys/catalogs` | Obtener empleados y entidades relacionadas disponibles para la empresa. |

### Especificación REST aplicable a cada recurso

Los endpoints anteriores son **PROPUESTOS**. El patrón siguiente se aplica a cada tipo de registro del módulo sustituyendo `journey-procedures` por el recurso correspondiente.

#### `GET /api/pesv/journeys/journey-procedures`

- **Objetivo:** listar registros del tenant.
- **Query:** `page` (>=1), `limit` (1..100), `search`, `year`, `status`, `kind`, `sort`.
- **Respuesta 200:** `{ "ok": true, "data": { "items": [...], "total": 1, "page": 1, "limit": 20 } }`.
- **Errores:** 400 filtros inválidos, 401 sin sesión, 403 sin permiso.
- **Permiso:** `PESV_JOURNEYS_VIEW`.

#### `POST /api/pesv/journeys/journey-procedures`

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
  "noticeHours": 0,
  "dynamicRisks": "string"
}
```

- **Respuesta 201:** `{ "ok": true, "data": { "id": "uuid", "companyId": "uuid", ...body, "createdAt": "2026-10-13T15:00:00Z" } }`.
- **Errores:** 400 validación, 404 relación no encontrada, 409 duplicado o versión vigente incompatible.
- **Efectos:** crea historial `CREATED`; habilita carga documental.

#### `GET /api/pesv/journeys/journey-procedures/{id}`, `PUT /api/pesv/journeys/journey-procedures/{id}`, `DELETE /api/pesv/journeys/journey-procedures/{id}`

- **Detalle:** devuelve campos, relaciones, entradas, evidencias e historial.
- **Actualización:** recibe los mismos campos editables y `version`; 409 si la versión cambió. Fechas o campos bloqueados por estado deben rechazarse.
- **Eliminación:** preferir borrado lógico. Responder 409 si existen relaciones, retención vigente o evidencias/entradas que deban conservarse.
- **Respuestas:** 200 para consulta/actualización; 204 o envoltorio 200 para eliminación; 404 si no pertenece a la empresa.
- **Permisos:** `VIEW`, `EDIT`, `DELETE` del módulo.

#### Entradas de proceso

Cuando el tipo permite seguimiento, revisión anual o difusión, `POST /api/pesv/journeys/journey-procedures/{id}/entries` recibe:

```json
{"kind":"FOLLOW_UP","date":"2026-10-13","observations":"Avance verificado","progress":75,"measuredValue":20,"medium":"Reunión","audience":"Comité","attendeeIds":["uuid"]}
```

`kind` admite solo las capacidades habilitadas por el tipo: `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION`. El backend valida secuencia temporal, progreso 0..100, pertenencia de asistentes y bloqueo por cierre.

#### Evidencias

- `POST /api/pesv/journeys/journey-procedures/{id}/documents`: `multipart/form-data` con `file`, `description`, `isConfirmed` y opcional `targetId` para asociarla a una entrada.
- `GET /api/pesv/journeys/journey-procedures/{id}/documents`: lista metadatos; nunca Base64 en la respuesta de lista.
- `GET /api/pesv/journeys/journey-procedures/{id}/documents/{documentId}`: stream o URL firmada temporal con control de tenant.
- `DELETE /api/pesv/journeys/journey-procedures/{id}/documents/{documentId}`: elimina lógicamente y registra auditoría; 409 si la evidencia sustenta un cierre inmutable.
- **Validación actual:** la interfaz acepta PDF e imágenes y, en los flujos compartidos, limita normalmente a 3 MB.

#### Exportación

`GET /api/pesv/journeys/journey-procedures/export?format=pdf&year=2026&status=...` devuelve `application/pdf`. Debe reproducir filtros, fechas, relaciones y trazabilidad visibles; 422 si no hay datos exportables.

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
- Catálogo `trainingActivities`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `journeyProcedures`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `routes`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `risks`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `vehicles`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `emergencyPlans`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Cardinalidad: empresa 1:N registros; registro 1:N entradas; registro/entrada 1:N evidencias; registro 1:N historial.

## K. Seguridad y permisos

- JWT obligatorio; `companyId` nunca se recibe confiablemente del cliente.
- Permisos propuestos: `PESV_JOURNEYS_VIEW`, `PESV_JOURNEYS_CREATE`, `PESV_JOURNEYS_EDIT`, `PESV_JOURNEYS_DELETE`, `PESV_JOURNEYS_UPLOAD`, `PESV_JOURNEYS_EXPORT`.
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

- Página: `app/dashboard/pesv-journeys/page.tsx`.
- Motor: `components/pesv/planning-module.tsx`.
- Tipos, validación, persistencia y catálogos: `lib/pesv/planning.ts`.
- Configuraciones: `lib/pesv/operations.ts` y `lib/pesv/assurance.ts`.
- Encabezado/selectores/resumen: `components/pesv/module-experience.tsx`, `components/pesv/pesv-select.tsx`, `components/pesv/assurance-overview.tsx`.

## Discrepancias y pendientes

- **DISCREPANCIA:** hoy la persistencia es localStorage y las evidencias usan URL temporal/Base64; no existe aislamiento real multiempresa.
- **PENDIENTE DE DEFINICIÓN:** política final de retención, límites de archivo y catálogo formal de permisos.
- **PROPUESTO:** backend REST descrito en este contrato, almacenamiento de objetos y control optimista.
