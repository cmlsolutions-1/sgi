# Auditoría anual

> **Estado del contrato:** el comportamiento descrito como **IMPLEMENTADO** fue verificado en el frontend actual. La API, persistencia multiempresa y permisos marcados **PROPUESTO** deben ser construidos en backend. Los datos actuales usan localStorage y registros demostrativos.

## A. Identificación del módulo

- **Nombre visible:** Auditoría anual
- **Código de navegación:** `PESV_AUDITS`
- **Ruta frontend:** `/dashboard/pesv-audits`
- **Objetivo:** Procedimiento, evaluación de los 24 pasos y planes de acción. Centraliza el ciclo de registro, consulta, seguimiento, evidencia, trazabilidad y exportación de esta materia PESV.
- **Archivos fuente:** `app/dashboard/pesv-audits/page.tsx`; compartidos: `components/pesv/planning-module.tsx, lib/pesv/planning.ts, lib/pesv/operations.ts, lib/pesv/assurance.ts`.
- **Dependencias:** Next.js/React, componentes SafeCloud, Sonner, Lucide, jsPDF, catálogos PESV y localStorage.
- **Persistencia actual:** **IMPLEMENTADO** en `safecloud:pesv-audits`; debe reemplazarse por la API propuesta sin cambiar el flujo visual.

## B. Estructura interna

- **Procedimiento:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Auditorías:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Hallazgos y planes de acción:** formulario, listado, detalle, edición, eliminación condicionada, seguimiento, evidencias, PDF.
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

### Procedimiento

Tipo técnico: `audit-procedure`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Planificación, frecuencia anual y participación del CSV | `planning` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Pautas, criterios, muestreo y realización | `guidelines` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Competencias e independencia de los auditores | `competency` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Perfiles de competencia relacionados | `competencyIds` | UUID[] | No | Catálogo `competencies`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Contenidos mínimos del informe | `reportContents` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Gestión de no conformidades y planes de acción | `followUp` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Auditorías

Tipo técnico: `pesv-audit`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento de auditoría | `procedureId` | UUID | Sí | Catálogo `auditProcedures` | Sin condición adicional. | Editable; persistente |
| Nivel del PESV | `level` | enum/string | Sí | `Básico`, `Estándar`, `Avanzado` | Sin condición adicional. | Editable; persistente |
| Fecha programada | `plannedDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fase de auditoría | `phase` | enum/string | Sí | `Planificada`, `Realizada` | Sin condición adicional. | Editable; persistente |
| Fecha de realización | `auditDate` | date (YYYY-MM-DD) | Sí | — | Visible si `phase = Realizada`. | Editable; persistente |
| Auditores internos / externos | `auditorIds` | UUID[] | Sí | Catálogo `people`; selección múltiple | Sin condición adicional. | Editable; persistente |
| Competencia e independencia del equipo auditor | `auditorCompetence` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Participación del CSV en la planificación | `csvParticipation` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Alcance, criterios, procesos y requisitos aplicables | `scope` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Agenda, metodología y muestra | `schedule` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| 1. Líder PESV | `step_1` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 1 | `stepNotes_1` | string | No | — | Sin condición adicional. | Editable; persistente |
| 2. Comité de Seguridad Vial | `step_2` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 2 | `stepNotes_2` | string | No | — | Sin condición adicional. | Editable; persistente |
| 3. Política de Seguridad Vial | `step_3` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 3 | `stepNotes_3` | string | No | — | Sin condición adicional. | Editable; persistente |
| 4. Liderazgo y compromiso directivo | `step_4` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 4 | `stepNotes_4` | string | No | — | Sin condición adicional. | Editable; persistente |
| 5. Diagnóstico | `step_5` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 5 | `stepNotes_5` | string | No | — | Sin condición adicional. | Editable; persistente |
| 6. Caracterización y control de riesgos | `step_6` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 6 | `stepNotes_6` | string | No | — | Sin condición adicional. | Editable; persistente |
| 7. Objetivos y metas | `step_7` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 7 | `stepNotes_7` | string | No | — | Sin condición adicional. | Editable; persistente |
| 8. Programas de riesgos críticos | `step_8` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 8 | `stepNotes_8` | string | No | — | Sin condición adicional. | Editable; persistente |
| 9. Plan anual de trabajo | `step_9` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 9 | `stepNotes_9` | string | No | — | Sin condición adicional. | Editable; persistente |
| 10. Competencia y formación | `step_10` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 10 | `stepNotes_10` | string | No | — | Sin condición adicional. | Editable; persistente |
| 11. Responsabilidad y comportamiento seguro | `step_11` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 11 | `stepNotes_11` | string | No | — | Sin condición adicional. | Editable; persistente |
| 12. Emergencias viales | `step_12` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 12 | `stepNotes_12` | string | No | — | Sin condición adicional. | Editable; persistente |
| 13. Investigación de siniestros | `step_13` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 13 | `stepNotes_13` | string | No | — | Sin condición adicional. | Editable; persistente |
| 14. Vías administradas | `step_14` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 14 | `stepNotes_14` | string | No | — | Sin condición adicional. | Editable; persistente |
| 15. Desplazamientos laborales | `step_15` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 15 | `stepNotes_15` | string | No | — | Sin condición adicional. | Editable; persistente |
| 16. Inspecciones de vehículos | `step_16` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 16 | `stepNotes_16` | string | No | — | Sin condición adicional. | Editable; persistente |
| 17. Mantenimiento de vehículos | `step_17` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 17 | `stepNotes_17` | string | No | — | Sin condición adicional. | Editable; persistente |
| 18. Cambios y contratistas | `step_18` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 18 | `stepNotes_18` | string | No | — | Sin condición adicional. | Editable; persistente |
| 19. Archivo documental | `step_19` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 19 | `stepNotes_19` | string | No | — | Sin condición adicional. | Editable; persistente |
| 20. Indicadores y autogestión | `step_20` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 20 | `stepNotes_20` | string | No | — | Sin condición adicional. | Editable; persistente |
| 21. Análisis estadístico de siniestros | `step_21` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 21 | `stepNotes_21` | string | No | — | Sin condición adicional. | Editable; persistente |
| 22. Auditoría anual | `step_22` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 22 | `stepNotes_22` | string | No | — | Sin condición adicional. | Editable; persistente |
| 23. Mejora continua | `step_23` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 23 | `stepNotes_23` | string | No | — | Sin condición adicional. | Editable; persistente |
| 24. Mecanismos de comunicación | `step_24` | enum/string | Sí | `Sin evaluar`, `Cumple`, `No cumple`, `No aplica` | Sin condición adicional. | Editable; persistente |
| Soporte / hallazgo / justificación del paso 24 | `stepNotes_24` | string | No | — | Sin condición adicional. | Editable; persistente |
| Conclusiones, fortalezas y oportunidades de mejora | `conclusions` | string | No | — | Sin condición adicional. | Editable; persistente |
| Referencia del informe de auditoría | `reportReference` | string | No | — | Sin condición adicional. | Editable; persistente |

### Hallazgos y planes de acción

Tipo técnico: `audit-finding`. Capacidades: seguimientos, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Auditoría relacionada | `auditId` | UUID | Sí | Catálogo `pesvAudits` | Sin condición adicional. | Editable; persistente |
| Paso PESV evaluado | `step` | enum/string | Sí | — | Sin condición adicional. | Editable; persistente |
| Tipo de hallazgo | `findingType` | enum/string | Sí | `No conformidad`, `Oportunidad de mejora`, `Observación` | Sin condición adicional. | Editable; persistente |
| Requisito y evidencia del hallazgo | `description` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Análisis de causas | `causes` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Acción correctiva / preventiva / mejora | `action` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Inicio del plan de acción | `startDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Fecha límite del plan de acción | `endDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Actividad del plan anual | `workActivityId` | UUID | No | Catálogo `workActivities` | Sin condición adicional. | Editable; persistente |
| Resultado de verificación de eficacia | `efficacy` | enum/string | Sí | `Pendiente`, `Eficaz`, `No eficaz` | Sin condición adicional. | Editable; persistente |
| Evaluador de eficacia | `evaluatorId` | UUID | No | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Fecha de verificación | `verificationDate` | date (YYYY-MM-DD) | No | — | Sin condición adicional. | Editable; persistente |
| Conclusión de la verificación | `verificationNotes` | string | No | — | Sin condición adicional. | Editable; persistente |

### Subentidades compartidas

- **Activity:** `id`, `name`, `responsibleId`, `startDate`, `endDate`, `status`, `observations`.
- **Entry:** `id`, `kind`, `date`, `observations`, `progress?`, `measuredValue?`, `medium?`, `audience?`, `conclusion?`, `nextReviewDate?`, `attendeeIds?`, `learningResult?`, `responseMinutes?`.
- **Evidence:** `id`, `recordId`, `targetId?`, `originalName`, `mimeType`, `size`, `storageKey`, `description`, `isConfirmed`, `uploadedAt`, `uploadedBy`.
- **History:** `id`, `recordId`, `event`, `snapshot`, `createdAt`, `actorId`.

## E-F. Endpoints necesarios y especificación

Todos requieren JWT, resuelven `companyId` desde la sesión y devuelven envoltorio `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/audits/audit-procedures` | Listar procedimiento con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/audits/audit-procedures` | Crear procedimiento de auditoría. |
| GET | `/api/pesv/audits/audit-procedures/{id}` | Consultar detalle completo de procedimiento de auditoría. |
| PUT | `/api/pesv/audits/audit-procedures/{id}` | Actualizar procedimiento de auditoría conservando historial. |
| DELETE | `/api/pesv/audits/audit-procedures/{id}` | Eliminar o archivar procedimiento de auditoría si no tiene dependencias. |
| GET | `/api/pesv/audits/audit-procedures/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/audits/audit-procedures/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/audits/audit-procedures/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/audits/audit-procedures/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/audits/audit-procedures/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/audits/audits` | Listar auditorías con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/audits/audits` | Crear auditoría anual. |
| GET | `/api/pesv/audits/audits/{id}` | Consultar detalle completo de auditoría anual. |
| PUT | `/api/pesv/audits/audits/{id}` | Actualizar auditoría anual conservando historial. |
| DELETE | `/api/pesv/audits/audits/{id}` | Eliminar o archivar auditoría anual si no tiene dependencias. |
| GET | `/api/pesv/audits/audits/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/audits/audits/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/audits/audits/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/audits/audits/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/audits/audits/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/audits/audit-findings` | Listar hallazgos y planes de acción con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/audits/audit-findings` | Crear hallazgo de auditoría. |
| GET | `/api/pesv/audits/audit-findings/{id}` | Consultar detalle completo de hallazgo de auditoría. |
| PUT | `/api/pesv/audits/audit-findings/{id}` | Actualizar hallazgo de auditoría conservando historial. |
| DELETE | `/api/pesv/audits/audit-findings/{id}` | Eliminar o archivar hallazgo de auditoría si no tiene dependencias. |
| GET | `/api/pesv/audits/audit-findings/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/audits/audit-findings/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/audits/audit-findings/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/audits/audit-findings/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/audits/audit-findings/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/audits/audit-findings/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/audits/audit-findings/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/audits/audit-findings/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/audits/audit-findings/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/audits/catalogs` | Obtener empleados y entidades relacionadas disponibles para la empresa. |

### Especificación REST aplicable a cada recurso

Los endpoints anteriores son **PROPUESTOS**. El patrón siguiente se aplica a cada tipo de registro del módulo sustituyendo `audit-procedures` por el recurso correspondiente.

#### `GET /api/pesv/audits/audit-procedures`

- **Objetivo:** listar registros del tenant.
- **Query:** `page` (>=1), `limit` (1..100), `search`, `year`, `status`, `kind`, `sort`.
- **Respuesta 200:** `{ "ok": true, "data": { "items": [...], "total": 1, "page": 1, "limit": 20 } }`.
- **Errores:** 400 filtros inválidos, 401 sin sesión, 403 sin permiso.
- **Permiso:** `PESV_AUDITS_VIEW`.

#### `POST /api/pesv/audits/audit-procedures`

- **Objetivo:** crear el registro base. No recibe archivos.
- **Body de ejemplo:**

```json
{
  "name": "string",
  "year": 2026,
  "version": "string",
  "responsibleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "planning": "string",
  "guidelines": "string",
  "competency": "string",
  "competencyIds": []
}
```

- **Respuesta 201:** `{ "ok": true, "data": { "id": "uuid", "companyId": "uuid", ...body, "createdAt": "2026-10-13T15:00:00Z" } }`.
- **Errores:** 400 validación, 404 relación no encontrada, 409 duplicado o versión vigente incompatible.
- **Efectos:** crea historial `CREATED`; habilita carga documental.

#### `GET /api/pesv/audits/audit-procedures/{id}`, `PUT /api/pesv/audits/audit-procedures/{id}`, `DELETE /api/pesv/audits/audit-procedures/{id}`

- **Detalle:** devuelve campos, relaciones, entradas, evidencias e historial.
- **Actualización:** recibe los mismos campos editables y `version`; 409 si la versión cambió. Fechas o campos bloqueados por estado deben rechazarse.
- **Eliminación:** preferir borrado lógico. Responder 409 si existen relaciones, retención vigente o evidencias/entradas que deban conservarse.
- **Respuestas:** 200 para consulta/actualización; 204 o envoltorio 200 para eliminación; 404 si no pertenece a la empresa.
- **Permisos:** `VIEW`, `EDIT`, `DELETE` del módulo.

#### Entradas de proceso

Cuando el tipo permite seguimiento, revisión anual o difusión, `POST /api/pesv/audits/audit-procedures/{id}/entries` recibe:

```json
{"kind":"FOLLOW_UP","date":"2026-10-13","observations":"Avance verificado","progress":75,"measuredValue":20,"medium":"Reunión","audience":"Comité","attendeeIds":["uuid"]}
```

`kind` admite solo las capacidades habilitadas por el tipo: `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION`. El backend valida secuencia temporal, progreso 0..100, pertenencia de asistentes y bloqueo por cierre.

#### Evidencias

- `POST /api/pesv/audits/audit-procedures/{id}/documents`: `multipart/form-data` con `file`, `description`, `isConfirmed` y opcional `targetId` para asociarla a una entrada.
- `GET /api/pesv/audits/audit-procedures/{id}/documents`: lista metadatos; nunca Base64 en la respuesta de lista.
- `GET /api/pesv/audits/audit-procedures/{id}/documents/{documentId}`: stream o URL firmada temporal con control de tenant.
- `DELETE /api/pesv/audits/audit-procedures/{id}/documents/{documentId}`: elimina lógicamente y registra auditoría; 409 si la evidencia sustenta un cierre inmutable.
- **Validación actual:** la interfaz acepta PDF e imágenes y, en los flujos compartidos, limita normalmente a 3 MB.

#### Exportación

`GET /api/pesv/audits/audit-procedures/export?format=pdf&year=2026&status=...` devuelve `application/pdf`. Debe reproducir filtros, fechas, relaciones y trazabilidad visibles; 422 si no hay datos exportables.

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
- Catálogo `competencies`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `auditProcedures`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `pesvAudits`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Catálogo `workActivities`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Cardinalidad: empresa 1:N registros; registro 1:N entradas; registro/entrada 1:N evidencias; registro 1:N historial.

## K. Seguridad y permisos

- JWT obligatorio; `companyId` nunca se recibe confiablemente del cliente.
- Permisos propuestos: `PESV_AUDITS_VIEW`, `PESV_AUDITS_CREATE`, `PESV_AUDITS_EDIT`, `PESV_AUDITS_DELETE`, `PESV_AUDITS_UPLOAD`, `PESV_AUDITS_EXPORT`.
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

- Página: `app/dashboard/pesv-audits/page.tsx`.
- Motor: `components/pesv/planning-module.tsx`.
- Tipos, validación, persistencia y catálogos: `lib/pesv/planning.ts`.
- Configuraciones: `lib/pesv/operations.ts` y `lib/pesv/assurance.ts`.
- Encabezado/selectores/resumen: `components/pesv/module-experience.tsx`, `components/pesv/pesv-select.tsx`, `components/pesv/assurance-overview.tsx`.

## Discrepancias y pendientes

- **DISCREPANCIA:** hoy la persistencia es localStorage y las evidencias usan URL temporal/Base64; no existe aislamiento real multiempresa.
- **PENDIENTE DE DEFINICIÓN:** política final de retención, límites de archivo y catálogo formal de permisos.
- **PROPUESTO:** backend REST descrito en este contrato, almacenamiento de objetos y control optimista.
