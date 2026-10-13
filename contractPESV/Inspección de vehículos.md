# Inspección de vehículos

> **Estado del contrato:** el comportamiento descrito como **IMPLEMENTADO** fue verificado en el frontend actual. La API, persistencia multiempresa y permisos marcados **PROPUESTO** deben ser construidos en backend. Los datos actuales usan localStorage y registros demostrativos.

## A. Identificación del módulo

- **Nombre visible:** Inspección de vehículos
- **Código de navegación:** `PESV_VEHICLE_INSPECTIONS`
- **Ruta frontend:** `/dashboard/pesv-vehicle-inspections`
- **Objetivo:** Hojas de vida, registros preoperacionales y trazabilidad de mantenimiento. Centraliza el ciclo de registro, consulta, seguimiento, evidencia, trazabilidad y exportación de esta materia PESV.
- **Archivos fuente:** `app/dashboard/pesv-vehicle-inspections/page.tsx`; compartidos: `components/pesv/planning-module.tsx, lib/pesv/planning.ts, lib/pesv/operations.ts, lib/pesv/assurance.ts`.
- **Dependencias:** Next.js/React, componentes SafeCloud, Sonner, Lucide, jsPDF, catálogos PESV y localStorage.
- **Persistencia actual:** **IMPLEMENTADO** en `safecloud:pesv-vehicle-inspections`; debe reemplazarse por la API propuesta sin cambiar el flujo visual.

## B. Estructura interna

- **Procedimientos:** formulario, listado, detalle, edición, eliminación condicionada, revisión anual, evidencias, PDF.
- **Hojas de vida:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Inspecciones preoperacionales:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Mantenimiento y reparaciones:** formulario, listado, detalle, edición, eliminación condicionada, seguimiento, evidencias, PDF.
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

Tipo técnico: `inspection-procedure`. Capacidades: revisión anual, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Próxima revisión | `nextReviewDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Vehículos automotores, no automotores y equipos cubiertos | `scope` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsables de inspección preoperacional | `inspectorIds` | UUID[] | Sí | Catálogo `people`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Responsable del control | `controllerId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Inspección diaria, posterior al recorrido y cambio de conductor | `frequency` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Disponibilidad, funcionamiento y niveles aceptables por elemento | `criteria` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Inmovilización, reporte y corrección de fallas | `nonCompliance` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Conservación mínima de un año, acceso y protección de registros | `retention` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Control de vencimientos y mantenimiento predictivo | `expiryControl` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Hojas de vida

Tipo técnico: `vehicle-profile`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Vehículo del diagnóstico PESV | `diagnosisVehicleId` | UUID | No | Catálogo `vehicles` | Sin condición adicional. | Editable; persistente |
| Tipo de vehículo | `vehicleType` | enum/string | Sí | `Automotor`, `Motocicleta`, `No automotor`, `Equipo` | Sin condición adicional. | Editable; persistente |
| Placa / identificación interna | `plate` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| VIN / serial | `vin` | string | No | — | Sin condición adicional. | Editable; persistente |
| Número de motor | `engineNumber` | string | No | — | Sin condición adicional. | Editable; persistente |
| Fecha de fabricación | `manufactureDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Kilometraje actual | `mileage` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Especificaciones técnicas | `technicalSpecs` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable del vehículo | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Vinculación | `ownership` | enum/string | Sí | `Propio`, `Afiliado`, `Asociado`, `Contratado`, `Otro` | Sin condición adicional. | Editable; persistente |
| Fecha de adquisición / vinculación | `acquisitionDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Historial de adquisición / propietarios | `acquisitionHistory` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Kilómetros estimados por mes | `monthlyKm` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Vencimiento SOAT | `soatExpiry` | date (YYYY-MM-DD) | Sí | — | Visible si `vehicleType = Automotor`. | Editable; persistente |
| Vencimiento técnico-mecánica | `technicalExpiry` | date (YYYY-MM-DD) | Sí | — | Visible si `vehicleType = Automotor`. | Editable; persistente |
| Vencimiento SOAT motocicleta | `motorcycleSoatExpiry` | date (YYYY-MM-DD) | Sí | — | Visible si `vehicleType = Motocicleta`. | Editable; persistente |
| Vencimiento técnico-mecánica motocicleta | `motorcycleTechnicalExpiry` | date (YYYY-MM-DD) | Sí | — | Visible si `vehicleType = Motocicleta`. | Editable; persistente |
| Historial de siniestros viales | `accidentHistory` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Investigaciones de siniestros vinculadas | `investigationIds` | UUID[] | No | Catálogo `roadInvestigations`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Plan de mantenimiento preventivo | `maintenancePlan` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Inspecciones preoperacionales

Tipo técnico: `vehicle-inspection`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento de inspección | `procedureId` | UUID | Sí | Catálogo `inspectionProcedures` | Sin condición adicional. | Editable; persistente |
| Hoja de vida del vehículo | `vehicleProfileId` | UUID | Sí | Catálogo `vehicleProfiles` | Sin condición adicional. | Editable; persistente |
| Fecha de inspección | `inspectionDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Hora de inspección (HH:mm) | `inspectionTime` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Momento | `moment` | enum/string | Sí | `Preoperacional diaria`, `Después del recorrido`, `Fin de jornada`, `Cambio de conductor` | Sin condición adicional. | Editable; persistente |
| Inspector / conductor | `inspectorId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Responsable del control | `controllerId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Tipo de vehículo inspeccionado | `vehicleType` | enum/string | Sí | `Automotor`, `Motocicleta`, `No automotor`, `Equipo` | Sin condición adicional. | Editable; persistente |
| Desplazamiento relacionado | `journeyId` | UUID | No | Catálogo `journeys` | Sin condición adicional. | Editable; persistente |
| Kilometraje | `mileage` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Licencia de tránsito | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| SOAT | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Revisión técnico-mecánica | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Licencia de conducción | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Documento de identidad | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Luces y direccionales | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Llantas y repuesto | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Fluidos y niveles | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Cinturones de seguridad | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Limpiabrisas | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Espejos | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Equipo de prevención y seguridad | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Casco | ``check_${key}`` | enum/string | Sí | `Sin verificar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Justificación de elementos no aplicables | `exceptions` | string | No | — | Sin condición adicional. | Editable; persistente |
| Hallazgos, niveles medidos y fallas | `findings` | string | No | — | Sin condición adicional. | Editable; persistente |
| Controles, correcciones y restricciones de uso | `corrections` | string | No | — | Sin condición adicional. | Editable; persistente |
| Vencimiento SOAT verificado | `soatExpiry` | date (YYYY-MM-DD) | No | — | Sin condición adicional. | Editable; persistente |
| Vencimiento técnico-mecánica verificado | `technicalExpiry` | date (YYYY-MM-DD) | No | — | Sin condición adicional. | Editable; persistente |
| Vencimiento licencia de conducción verificado | `licenseExpiry` | date (YYYY-MM-DD) | No | — | Sin condición adicional. | Editable; persistente |

### Mantenimiento y reparaciones

Tipo técnico: `vehicle-maintenance`. Capacidades: seguimientos, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Hoja de vida del vehículo | `vehicleProfileId` | UUID | Sí | Catálogo `vehicleProfiles` | Sin condición adicional. | Editable; persistente |
| Tipo de intervención | `type` | enum/string | Sí | `Preventivo`, `Correctivo`, `Predictivo`, `Reparación` | Sin condición adicional. | Editable; persistente |
| Trabajo y fallas atendidas | `description` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable de ejecución | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Taller / proveedor | `workshop` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha de inicio | `startDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha final | `endDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Kilometraje de intervención | `mileage` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Repuestos, cantidades y referencias | `parts` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Equipos utilizados | `equipment` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Costo (COP) | `cost` | number | Sí | — | Mín. 0. Sin condición adicional. | Editable; persistente |
| Pruebas y criterios de entrega | `acceptance` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Subentidades compartidas

- **Activity:** `id`, `name`, `responsibleId`, `startDate`, `endDate`, `status`, `observations`.
- **Entry:** `id`, `kind`, `date`, `observations`, `progress?`, `measuredValue?`, `medium?`, `audience?`, `conclusion?`, `nextReviewDate?`, `attendeeIds?`, `learningResult?`, `responseMinutes?`.
- **Evidence:** `id`, `recordId`, `targetId?`, `originalName`, `mimeType`, `size`, `storageKey`, `description`, `isConfirmed`, `uploadedAt`, `uploadedBy`.
- **History:** `id`, `recordId`, `event`, `snapshot`, `createdAt`, `actorId`.

## E-F. Endpoints necesarios y especificación

Todos requieren JWT, resuelven `companyId` desde la sesión y devuelven envoltorio `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/vehicle-inspections/inspection-procedures` | Listar procedimientos con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/vehicle-inspections/inspection-procedures` | Crear procedimiento de inspección. |
| GET | `/api/pesv/vehicle-inspections/inspection-procedures/{id}` | Consultar detalle completo de procedimiento de inspección. |
| PUT | `/api/pesv/vehicle-inspections/inspection-procedures/{id}` | Actualizar procedimiento de inspección conservando historial. |
| DELETE | `/api/pesv/vehicle-inspections/inspection-procedures/{id}` | Eliminar o archivar procedimiento de inspección si no tiene dependencias. |
| GET | `/api/pesv/vehicle-inspections/inspection-procedures/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/vehicle-inspections/inspection-procedures/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/vehicle-inspections/vehicle-profiles` | Listar hojas de vida con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/vehicle-inspections/vehicle-profiles` | Crear hoja de vida de vehículo. |
| GET | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}` | Consultar detalle completo de hoja de vida de vehículo. |
| PUT | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}` | Actualizar hoja de vida de vehículo conservando historial. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}` | Eliminar o archivar hoja de vida de vehículo si no tiene dependencias. |
| GET | `/api/pesv/vehicle-inspections/vehicle-profiles/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-profiles/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/vehicle-inspections/vehicle-inspections` | Listar inspecciones preoperacionales con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/vehicle-inspections/vehicle-inspections` | Crear inspección preoperacional. |
| GET | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}` | Consultar detalle completo de inspección preoperacional. |
| PUT | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}` | Actualizar inspección preoperacional conservando historial. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}` | Eliminar o archivar inspección preoperacional si no tiene dependencias. |
| GET | `/api/pesv/vehicle-inspections/vehicle-inspections/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-inspections/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/vehicle-inspections/vehicle-maintenance` | Listar mantenimiento y reparaciones con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/vehicle-inspections/vehicle-maintenance` | Crear mantenimiento de vehículo. |
| GET | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}` | Consultar detalle completo de mantenimiento de vehículo. |
| PUT | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}` | Actualizar mantenimiento de vehículo conservando historial. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}` | Eliminar o archivar mantenimiento de vehículo si no tiene dependencias. |
| GET | `/api/pesv/vehicle-inspections/vehicle-maintenance/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/vehicle-inspections/vehicle-maintenance/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/vehicle-inspections/catalogs` | Obtener empleados y entidades relacionadas disponibles para la empresa. |

### Especificación REST aplicable a cada recurso

Los endpoints anteriores son **PROPUESTOS**. El patrón siguiente se aplica a cada tipo de registro del módulo sustituyendo `inspection-procedures` por el recurso correspondiente.

#### `GET /api/pesv/vehicle-inspections/inspection-procedures`

- **Objetivo:** listar registros del tenant.
- **Query:** `page` (>=1), `limit` (1..100), `search`, `year`, `status`, `kind`, `sort`.
- **Respuesta 200:** `{ "ok": true, "data": { "items": [...], "total": 1, "page": 1, "limit": 20 } }`.
- **Errores:** 400 filtros inválidos, 401 sin sesión, 403 sin permiso.
- **Permiso:** `PESV_VEHICLE_INSPECTIONS_VIEW`.

#### `POST /api/pesv/vehicle-inspections/inspection-procedures`

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
  "inspectorIds": [],
  "controllerId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

- **Respuesta 201:** `{ "ok": true, "data": { "id": "uuid", "companyId": "uuid", ...body, "createdAt": "2026-10-13T15:00:00Z" } }`.
- **Errores:** 400 validación, 404 relación no encontrada, 409 duplicado o versión vigente incompatible.
- **Efectos:** crea historial `CREATED`; habilita carga documental.

#### `GET /api/pesv/vehicle-inspections/inspection-procedures/{id}`, `PUT /api/pesv/vehicle-inspections/inspection-procedures/{id}`, `DELETE /api/pesv/vehicle-inspections/inspection-procedures/{id}`

- **Detalle:** devuelve campos, relaciones, entradas, evidencias e historial.
- **Actualización:** recibe los mismos campos editables y `version`; 409 si la versión cambió. Fechas o campos bloqueados por estado deben rechazarse.
- **Eliminación:** preferir borrado lógico. Responder 409 si existen relaciones, retención vigente o evidencias/entradas que deban conservarse.
- **Respuestas:** 200 para consulta/actualización; 204 o envoltorio 200 para eliminación; 404 si no pertenece a la empresa.
- **Permisos:** `VIEW`, `EDIT`, `DELETE` del módulo.

#### Entradas de proceso

Cuando el tipo permite seguimiento, revisión anual o difusión, `POST /api/pesv/vehicle-inspections/inspection-procedures/{id}/entries` recibe:

```json
{"kind":"FOLLOW_UP","date":"2026-10-13","observations":"Avance verificado","progress":75,"measuredValue":20,"medium":"Reunión","audience":"Comité","attendeeIds":["uuid"]}
```

`kind` admite solo las capacidades habilitadas por el tipo: `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION`. El backend valida secuencia temporal, progreso 0..100, pertenencia de asistentes y bloqueo por cierre.

#### Evidencias

- `POST /api/pesv/vehicle-inspections/inspection-procedures/{id}/documents`: `multipart/form-data` con `file`, `description`, `isConfirmed` y opcional `targetId` para asociarla a una entrada.
- `GET /api/pesv/vehicle-inspections/inspection-procedures/{id}/documents`: lista metadatos; nunca Base64 en la respuesta de lista.
- `GET /api/pesv/vehicle-inspections/inspection-procedures/{id}/documents/{documentId}`: stream o URL firmada temporal con control de tenant.
- `DELETE /api/pesv/vehicle-inspections/inspection-procedures/{id}/documents/{documentId}`: elimina lógicamente y registra auditoría; 409 si la evidencia sustenta un cierre inmutable.
- **Validación actual:** la interfaz acepta PDF e imágenes y, en los flujos compartidos, limita normalmente a 3 MB.

#### Exportación

`GET /api/pesv/vehicle-inspections/inspection-procedures/export?format=pdf&year=2026&status=...` devuelve `application/pdf`. Debe reproducir filtros, fechas, relaciones y trazabilidad visibles; 422 si no hay datos exportables.

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
- Catálogo `vehicles`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `roadInvestigations`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `inspectionProcedures`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `vehicleProfiles`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `journeys`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Cardinalidad: empresa 1:N registros; registro 1:N entradas; registro/entrada 1:N evidencias; registro 1:N historial.

## K. Seguridad y permisos

- JWT obligatorio; `companyId` nunca se recibe confiablemente del cliente.
- Permisos propuestos: `PESV_VEHICLE_INSPECTIONS_VIEW`, `PESV_VEHICLE_INSPECTIONS_CREATE`, `PESV_VEHICLE_INSPECTIONS_EDIT`, `PESV_VEHICLE_INSPECTIONS_DELETE`, `PESV_VEHICLE_INSPECTIONS_UPLOAD`, `PESV_VEHICLE_INSPECTIONS_EXPORT`.
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

- Página: `app/dashboard/pesv-vehicle-inspections/page.tsx`.
- Motor: `components/pesv/planning-module.tsx`.
- Tipos, validación, persistencia y catálogos: `lib/pesv/planning.ts`.
- Configuraciones: `lib/pesv/operations.ts` y `lib/pesv/assurance.ts`.
- Encabezado/selectores/resumen: `components/pesv/module-experience.tsx`, `components/pesv/pesv-select.tsx`, `components/pesv/assurance-overview.tsx`.

## Discrepancias y pendientes

- **DISCREPANCIA:** hoy la persistencia es localStorage y las evidencias usan URL temporal/Base64; no existe aislamiento real multiempresa.
- **PENDIENTE DE DEFINICIÓN:** política final de retención, límites de archivo y catálogo formal de permisos.
- **PROPUESTO:** backend REST descrito en este contrato, almacenamiento de objetos y control optimista.
