# Cambios y contratistas

> **Estado del contrato:** el comportamiento descrito como **IMPLEMENTADO** fue verificado en el frontend actual. La API, persistencia multiempresa y permisos marcados **PROPUESTO** deben ser construidos en backend. Los datos actuales usan localStorage y registros demostrativos.

## A. Identificación del módulo

- **Nombre visible:** Cambios y contratistas
- **Código de navegación:** `PESV_CHANGE_CONTRACTORS`
- **Ruta frontend:** `/dashboard/pesv-change-contractors`
- **Objetivo:** Impactos de cambios, requisitos de terceros y verificación de obligaciones. Centraliza el ciclo de registro, consulta, seguimiento, evidencia, trazabilidad y exportación de esta materia PESV.
- **Archivos fuente:** `app/dashboard/pesv-change-contractors/page.tsx`; compartidos: `components/pesv/planning-module.tsx, lib/pesv/planning.ts, lib/pesv/operations.ts, lib/pesv/assurance.ts`.
- **Dependencias:** Next.js/React, componentes SafeCloud, Sonner, Lucide, jsPDF, catálogos PESV y localStorage.
- **Persistencia actual:** **IMPLEMENTADO** en `safecloud:pesv-change-contractors`; debe reemplazarse por la API propuesta sin cambiar el flujo visual.

## B. Estructura interna

- **Procedimientos:** formulario, listado, detalle, edición, eliminación condicionada, revisión anual, difusión, evidencias, PDF.
- **Cambios:** formulario, listado, detalle, edición, eliminación condicionada, seguimiento, evidencias, PDF.
- **Contratistas:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Verificaciones:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
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

Tipo técnico: `change-procedure`. Capacidades: revisión anual, difusión, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Próxima revisión | `nextReviewDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Evaluación previa de cambios internos, externos, planeados y no planeados | `changeAssessment` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Criterios de aprobación, responsables y controles antes de implementar | `approval` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos de vehículos: antigüedad y seguridad activa / pasiva | `vehicleRequirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos de conductores: edad, competencia y aptitud | `driverRequirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos legales y verificación del PESV del contratista | `legalRequirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Historiales de conductor y vehículo que se deben presentar | `histories` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Documentos vigentes: control anual permanente / previo a recorrido ocasional | `documents` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Formación, inspección diaria, controles, reporte de siniestros y salud | `obligations` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos para proveedores de servicios con impacto en seguridad vial | `otherServices` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Mecanismo de evaluación y tratamiento de incumplimientos | `verification` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Supervisores del cumplimiento | `supervisorIds` | UUID[] | Sí | Catálogo `people`; selección múltiple | Sin condición adicional. | Editable; persistente |

### Cambios

Tipo técnico: `change`. Capacidades: seguimientos, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento aplicable | `procedureId` | UUID | Sí | Catálogo `changeProcedures` | Sin condición adicional. | Editable; persistente |
| Origen del cambio | `type` | enum/string | Sí | `Interno`, `Externo` | Sin condición adicional. | Editable; persistente |
| Planificación | `planned` | enum/string | Sí | `Planeado`, `No planeado` | Sin condición adicional. | Editable; persistente |
| Categoría | `category` | enum/string | Sí | `Ruta`, `Tecnología / equipo`, `Legislación`, `Cliente`, `Producto / servicio`, `Otro` | Sin condición adicional. | Editable; persistente |
| Fecha de evaluación del impacto | `assessmentDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Descripción y motivo | `description` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Impactos, riesgos y consecuencias viales | `impacts` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Riesgos vinculados | `riskIds` | UUID[] | No | Catálogo `risks`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Rutas vinculadas | `routeIds` | UUID[] | No | Catálogo `routes`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Controles previos a la implementación | `controls` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable de implementación | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Responsable de aprobación | `approverId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Decisión | `decision` | enum/string | Sí | `Pendiente`, `Aprobado`, `Rechazado` | Sin condición adicional. | Editable; persistente |
| Fecha de aprobación | `approvalDate` | date (YYYY-MM-DD) | Sí | — | Visible si `decision = Aprobado`. | Editable; persistente |
| Fecha de inicio | `startDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha final | `endDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Criterios de verificación de los controles | `verification` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Contratistas

Tipo técnico: `contractor`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento aplicable | `procedureId` | UUID | Sí | Catálogo `changeProcedures` | Sin condición adicional. | Editable; persistente |
| NIT / documento | `identification` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vinculación | `relationship` | enum/string | Sí | `Permanente`, `Ocasional` | Sin condición adicional. | Editable; persistente |
| Producto / servicio y su impacto vial | `service` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Propietario / contacto y teléfono | `contact` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Supervisor de cumplimiento | `supervisorId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Conductores relacionados | `driverIds` | UUID[] | No | Catálogo `people`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Vehículos relacionados | `vehicleIds` | UUID[] | No | Catálogo `vehicles`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Obligación PESV verificada | `pesvRequired` | enum/string | Sí | `Por verificar`, `Sí`, `No` | Sin condición adicional. | Editable; persistente |
| Soporte / fundamento de la obligación o no aplicabilidad | `pesvAssessment` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Requisitos y obligaciones exigidos | `requirements` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Próxima verificación documental | `nextVerificationDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |

### Verificaciones

Tipo técnico: `contractor-check`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Contratista | `contractorId` | UUID | Sí | Catálogo `contractors` | Sin condición adicional. | Editable; persistente |
| Fecha de verificación | `verificationDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Supervisor | `supervisorId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Motivo | `reason` | enum/string | Sí | `Vinculación`, `Anual permanente`, `Previo a recorrido ocasional`, `Seguimiento de incumplimientos` | Sin condición adicional. | Editable; persistente |
| Recorrido ocasional relacionado | `journeyId` | UUID | No | Catálogo `journeys` | Sin condición adicional. | Editable; persistente |
| PESV del contratista / justificación de no aplicabilidad | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Requisitos legales y técnicos de vehículos | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Edad, competencia y requisitos del conductor | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Historial del conductor e infracciones | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Historial de mantenimiento y siniestros del vehículo | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Documentación vigente de conductor y vehículo | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Seguridad social y nivel de riesgo | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Participación en formación PESV | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Inspección preoperacional diaria | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Controles administrativos y operativos | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Reporte de siniestros | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Reporte de condiciones de salud | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Justificación de no aplicabilidad | `exceptions` | string | No | — | Sin condición adicional. | Editable; persistente |
| Incumplimientos y acciones exigidas | `findings` | string | No | — | Sin condición adicional. | Editable; persistente |
| Próxima verificación | `nextVerificationDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |

### Subentidades compartidas

- **Activity:** `id`, `name`, `responsibleId`, `startDate`, `endDate`, `status`, `observations`.
- **Entry:** `id`, `kind`, `date`, `observations`, `progress?`, `measuredValue?`, `medium?`, `audience?`, `conclusion?`, `nextReviewDate?`, `attendeeIds?`, `learningResult?`, `responseMinutes?`.
- **Evidence:** `id`, `recordId`, `targetId?`, `originalName`, `mimeType`, `size`, `storageKey`, `description`, `isConfirmed`, `uploadedAt`, `uploadedBy`.
- **History:** `id`, `recordId`, `event`, `snapshot`, `createdAt`, `actorId`.

## E-F. Endpoints necesarios y especificación

Todos requieren JWT, resuelven `companyId` desde la sesión y devuelven envoltorio `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/change-contractors/change-procedures` | Listar procedimientos con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/change-contractors/change-procedures` | Crear procedimiento de cambios y contratistas. |
| GET | `/api/pesv/change-contractors/change-procedures/{id}` | Consultar detalle completo de procedimiento de cambios y contratistas. |
| PUT | `/api/pesv/change-contractors/change-procedures/{id}` | Actualizar procedimiento de cambios y contratistas conservando historial. |
| DELETE | `/api/pesv/change-contractors/change-procedures/{id}` | Eliminar o archivar procedimiento de cambios y contratistas si no tiene dependencias. |
| GET | `/api/pesv/change-contractors/change-procedures/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/change-contractors/change-procedures/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/change-contractors/change-procedures/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/change-contractors/change-procedures/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/change-contractors/change-procedures/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/change-contractors/change-procedures/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/change-contractors/change-procedures/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/change-contractors/change-procedures/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/change-contractors/change-procedures/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/change-contractors/changes` | Listar cambios con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/change-contractors/changes` | Crear cambio. |
| GET | `/api/pesv/change-contractors/changes/{id}` | Consultar detalle completo de cambio. |
| PUT | `/api/pesv/change-contractors/changes/{id}` | Actualizar cambio conservando historial. |
| DELETE | `/api/pesv/change-contractors/changes/{id}` | Eliminar o archivar cambio si no tiene dependencias. |
| GET | `/api/pesv/change-contractors/changes/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/change-contractors/changes/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/change-contractors/changes/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/change-contractors/changes/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/change-contractors/changes/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/change-contractors/changes/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/change-contractors/changes/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/change-contractors/changes/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/change-contractors/changes/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/change-contractors/contractors` | Listar contratistas con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/change-contractors/contractors` | Crear contratista. |
| GET | `/api/pesv/change-contractors/contractors/{id}` | Consultar detalle completo de contratista. |
| PUT | `/api/pesv/change-contractors/contractors/{id}` | Actualizar contratista conservando historial. |
| DELETE | `/api/pesv/change-contractors/contractors/{id}` | Eliminar o archivar contratista si no tiene dependencias. |
| GET | `/api/pesv/change-contractors/contractors/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/change-contractors/contractors/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/change-contractors/contractors/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/change-contractors/contractors/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/change-contractors/contractors/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/change-contractors/contractor-checks` | Listar verificaciones con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/change-contractors/contractor-checks` | Crear verificación de contratista. |
| GET | `/api/pesv/change-contractors/contractor-checks/{id}` | Consultar detalle completo de verificación de contratista. |
| PUT | `/api/pesv/change-contractors/contractor-checks/{id}` | Actualizar verificación de contratista conservando historial. |
| DELETE | `/api/pesv/change-contractors/contractor-checks/{id}` | Eliminar o archivar verificación de contratista si no tiene dependencias. |
| GET | `/api/pesv/change-contractors/contractor-checks/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/change-contractors/contractor-checks/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/change-contractors/contractor-checks/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/change-contractors/contractor-checks/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/change-contractors/contractor-checks/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/change-contractors/catalogs` | Obtener empleados y entidades relacionadas disponibles para la empresa. |

### Especificación REST aplicable a cada recurso

Los endpoints anteriores son **PROPUESTOS**. El patrón siguiente se aplica a cada tipo de registro del módulo sustituyendo `change-procedures` por el recurso correspondiente.

#### `GET /api/pesv/change-contractors/change-procedures`

- **Objetivo:** listar registros del tenant.
- **Query:** `page` (>=1), `limit` (1..100), `search`, `year`, `status`, `kind`, `sort`.
- **Respuesta 200:** `{ "ok": true, "data": { "items": [...], "total": 1, "page": 1, "limit": 20 } }`.
- **Errores:** 400 filtros inválidos, 401 sin sesión, 403 sin permiso.
- **Permiso:** `PESV_CHANGE_CONTRACTORS_VIEW`.

#### `POST /api/pesv/change-contractors/change-procedures`

- **Objetivo:** crear el registro base. No recibe archivos.
- **Body de ejemplo:**

```json
{
  "name": "string",
  "year": 2026,
  "version": "string",
  "responsibleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nextReviewDate": "2026-10-13",
  "changeAssessment": "string",
  "approval": "string",
  "vehicleRequirements": "string"
}
```

- **Respuesta 201:** `{ "ok": true, "data": { "id": "uuid", "companyId": "uuid", ...body, "createdAt": "2026-10-13T15:00:00Z" } }`.
- **Errores:** 400 validación, 404 relación no encontrada, 409 duplicado o versión vigente incompatible.
- **Efectos:** crea historial `CREATED`; habilita carga documental.

#### `GET /api/pesv/change-contractors/change-procedures/{id}`, `PUT /api/pesv/change-contractors/change-procedures/{id}`, `DELETE /api/pesv/change-contractors/change-procedures/{id}`

- **Detalle:** devuelve campos, relaciones, entradas, evidencias e historial.
- **Actualización:** recibe los mismos campos editables y `version`; 409 si la versión cambió. Fechas o campos bloqueados por estado deben rechazarse.
- **Eliminación:** preferir borrado lógico. Responder 409 si existen relaciones, retención vigente o evidencias/entradas que deban conservarse.
- **Respuestas:** 200 para consulta/actualización; 204 o envoltorio 200 para eliminación; 404 si no pertenece a la empresa.
- **Permisos:** `VIEW`, `EDIT`, `DELETE` del módulo.

#### Entradas de proceso

Cuando el tipo permite seguimiento, revisión anual o difusión, `POST /api/pesv/change-contractors/change-procedures/{id}/entries` recibe:

```json
{"kind":"FOLLOW_UP","date":"2026-10-13","observations":"Avance verificado","progress":75,"measuredValue":20,"medium":"Reunión","audience":"Comité","attendeeIds":["uuid"]}
```

`kind` admite solo las capacidades habilitadas por el tipo: `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION`. El backend valida secuencia temporal, progreso 0..100, pertenencia de asistentes y bloqueo por cierre.

#### Evidencias

- `POST /api/pesv/change-contractors/change-procedures/{id}/documents`: `multipart/form-data` con `file`, `description`, `isConfirmed` y opcional `targetId` para asociarla a una entrada.
- `GET /api/pesv/change-contractors/change-procedures/{id}/documents`: lista metadatos; nunca Base64 en la respuesta de lista.
- `GET /api/pesv/change-contractors/change-procedures/{id}/documents/{documentId}`: stream o URL firmada temporal con control de tenant.
- `DELETE /api/pesv/change-contractors/change-procedures/{id}/documents/{documentId}`: elimina lógicamente y registra auditoría; 409 si la evidencia sustenta un cierre inmutable.
- **Validación actual:** la interfaz acepta PDF e imágenes y, en los flujos compartidos, limita normalmente a 3 MB.

#### Exportación

`GET /api/pesv/change-contractors/change-procedures/export?format=pdf&year=2026&status=...` devuelve `application/pdf`. Debe reproducir filtros, fechas, relaciones y trazabilidad visibles; 422 si no hay datos exportables.

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
- Catálogo `changeProcedures`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `risks`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `routes`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `vehicles`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `contractors`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `journeys`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Cardinalidad: empresa 1:N registros; registro 1:N entradas; registro/entrada 1:N evidencias; registro 1:N historial.

## K. Seguridad y permisos

- JWT obligatorio; `companyId` nunca se recibe confiablemente del cliente.
- Permisos propuestos: `PESV_CHANGE_CONTRACTORS_VIEW`, `PESV_CHANGE_CONTRACTORS_CREATE`, `PESV_CHANGE_CONTRACTORS_EDIT`, `PESV_CHANGE_CONTRACTORS_DELETE`, `PESV_CHANGE_CONTRACTORS_UPLOAD`, `PESV_CHANGE_CONTRACTORS_EXPORT`.
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

- Página: `app/dashboard/pesv-change-contractors/page.tsx`.
- Motor: `components/pesv/planning-module.tsx`.
- Tipos, validación, persistencia y catálogos: `lib/pesv/planning.ts`.
- Configuraciones: `lib/pesv/operations.ts` y `lib/pesv/assurance.ts`.
- Encabezado/selectores/resumen: `components/pesv/module-experience.tsx`, `components/pesv/pesv-select.tsx`, `components/pesv/assurance-overview.tsx`.

## Discrepancias y pendientes

- **DISCREPANCIA:** hoy la persistencia es localStorage y las evidencias usan URL temporal/Base64; no existe aislamiento real multiempresa.
- **PENDIENTE DE DEFINICIÓN:** política final de retención, límites de archivo y catálogo formal de permisos.
- **PROPUESTO:** backend REST descrito en este contrato, almacenamiento de objetos y control optimista.
