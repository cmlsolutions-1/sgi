# Archivo documental

> **Estado del contrato:** el comportamiento descrito como **IMPLEMENTADO** fue verificado en el frontend actual. La API, persistencia multiempresa y permisos marcados **PROPUESTO** deben ser construidos en backend. Los datos actuales usan localStorage y registros demostrativos.

## A. Identificación del módulo

- **Nombre visible:** Archivo documental
- **Código de navegación:** `PESV_DOCUMENT_RETENTION`
- **Ruta frontend:** `/dashboard/pesv-document-retention`
- **Objetivo:** Control documental, conservación de evidencias y revisión trimestral. Centraliza el ciclo de registro, consulta, seguimiento, evidencia, trazabilidad y exportación de esta materia PESV.
- **Archivos fuente:** `app/dashboard/pesv-document-retention/page.tsx`; compartidos: `components/pesv/planning-module.tsx, lib/pesv/planning.ts, lib/pesv/operations.ts, lib/pesv/assurance.ts`.
- **Dependencias:** Next.js/React, componentes SafeCloud, Sonner, Lucide, jsPDF, catálogos PESV y localStorage.
- **Persistencia actual:** **IMPLEMENTADO** en `safecloud:pesv-document-retention`; debe reemplazarse por la API propuesta sin cambiar el flujo visual.

## B. Estructura interna

- **Procedimientos:** formulario, listado, detalle, edición, eliminación condicionada, revisión anual, evidencias, PDF.
- **Registros documentales:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
- **Revisiones trimestrales:** formulario, listado, detalle, edición, eliminación condicionada, evidencias, PDF.
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

Tipo técnico: `archive-procedure`. Capacidades: revisión anual, evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Próxima revisión | `nextReviewDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Identificación, codificación y versiones | `identification` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Legibilidad y actualización de documentos | `legibility` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Accesibilidad, permisos y confidencialidad | `access` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Protección contra daño, pérdida y copias de seguridad | `protection` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Conservación: cinco años general y un año preoperacionales; normas especiales | `retention` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Revisión autorizada de disposición final sin eliminación automática | `disposition` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Revisión e indicadores trimestrales | `quarterlyReview` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Registros documentales

Tipo técnico: `archive-record`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Procedimiento de archivo | `procedureId` | UUID | Sí | Catálogo `archiveProcedures` | Sin condición adicional. | Editable; persistente |
| Código / consecutivo | `code` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Versión | `version` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Serie documental | `category` | enum/string | Sí | `PESV general`, `Inspección preoperacional`, `Norma especial` | Sin condición adicional. | Editable; persistente |
| Fecha del documento / registro | `recordDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Módulo o proceso de origen | `sourceModule` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable de custodia | `custodianId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Ubicación de archivo / repositorio | `location` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Acceso | `accessLevel` | enum/string | Sí | `Interno`, `Restringido`, `Público` | Sin condición adicional. | Editable; persistente |
| Verificación de legibilidad | `legible` | enum/string | Sí | `Pendiente`, `Sí`, `No` | Sin condición adicional. | Editable; persistente |
| Documento actualizado | `updated` | enum/string | Sí | `Pendiente`, `Sí`, `No` | Sin condición adicional. | Editable; persistente |
| Conservación por norma especial (años, mínimo 5) | `specialYears` | number | Sí | — | Mín. 5. Máx. 100. Visible si `category = Norma especial`. | Editable; persistente |
| Norma especial / fundamento de conservación | `specialBasis` | string | Sí | — | Visible si `category = Norma especial`. | Editable; persistente |
| Respaldo y medidas de protección | `backup` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Revisiones trimestrales

Tipo técnico: `archive-review`. Capacidades: evidencias, exportación.

| Campo visible | Campo técnico | Tipo | Requerido | Opciones / relación | Validaciones y condición | Persistencia |
|---|---|---:|:---:|---|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. | Editable; persistente |
| Trimestre | `quarter` | enum/string | Sí | `1`, `2`, `3`, `4` | Sin condición adicional. | Editable; persistente |
| Fecha de revisión | `reviewDate` | date (YYYY-MM-DD) | Sí | — | Sin condición adicional. | Editable; persistente |
| Responsable de revisión | `responsibleId` | UUID | Sí | Catálogo `people` | Sin condición adicional. | Editable; persistente |
| Prueba de acceso, legibilidad y recuperación de archivos | `accessTest` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Verificación de protección y respaldos | `backupTest` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Hallazgos y documentos faltantes / desactualizados | `findings` | string | Sí | — | Sin condición adicional. | Editable; persistente |
| Acciones de mejora, responsables y plazos | `actions` | string | Sí | — | Sin condición adicional. | Editable; persistente |

### Subentidades compartidas

- **Activity:** `id`, `name`, `responsibleId`, `startDate`, `endDate`, `status`, `observations`.
- **Entry:** `id`, `kind`, `date`, `observations`, `progress?`, `measuredValue?`, `medium?`, `audience?`, `conclusion?`, `nextReviewDate?`, `attendeeIds?`, `learningResult?`, `responseMinutes?`.
- **Evidence:** `id`, `recordId`, `targetId?`, `originalName`, `mimeType`, `size`, `storageKey`, `description`, `isConfirmed`, `uploadedAt`, `uploadedBy`.
- **History:** `id`, `recordId`, `event`, `snapshot`, `createdAt`, `actorId`.

## E-F. Endpoints necesarios y especificación

Todos requieren JWT, resuelven `companyId` desde la sesión y devuelven envoltorio `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/document-retention/archive-procedures` | Listar procedimientos con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/document-retention/archive-procedures` | Crear procedimiento de archivo. |
| GET | `/api/pesv/document-retention/archive-procedures/{id}` | Consultar detalle completo de procedimiento de archivo. |
| PUT | `/api/pesv/document-retention/archive-procedures/{id}` | Actualizar procedimiento de archivo conservando historial. |
| DELETE | `/api/pesv/document-retention/archive-procedures/{id}` | Eliminar o archivar procedimiento de archivo si no tiene dependencias. |
| GET | `/api/pesv/document-retention/archive-procedures/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/document-retention/archive-procedures/{id}/entries` | Listar seguimientos, revisiones y difusiones. |
| POST | `/api/pesv/document-retention/archive-procedures/{id}/entries` | Registrar una entrada del proceso. |
| PUT | `/api/pesv/document-retention/archive-procedures/{id}/entries/{entryId}` | Actualizar una entrada. |
| DELETE | `/api/pesv/document-retention/archive-procedures/{id}/entries/{entryId}` | Eliminar una entrada sin evidencia dependiente. |
| GET | `/api/pesv/document-retention/archive-procedures/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/document-retention/archive-procedures/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/document-retention/archive-procedures/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/document-retention/archive-procedures/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/document-retention/archive-records` | Listar registros documentales con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/document-retention/archive-records` | Crear registro documental. |
| GET | `/api/pesv/document-retention/archive-records/{id}` | Consultar detalle completo de registro documental. |
| PUT | `/api/pesv/document-retention/archive-records/{id}` | Actualizar registro documental conservando historial. |
| DELETE | `/api/pesv/document-retention/archive-records/{id}` | Eliminar o archivar registro documental si no tiene dependencias. |
| GET | `/api/pesv/document-retention/archive-records/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/document-retention/archive-records/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/document-retention/archive-records/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/document-retention/archive-records/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/document-retention/archive-records/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/document-retention/archive-reviews` | Listar revisiones trimestrales con paginación, búsqueda, estado y vigencia. |
| POST | `/api/pesv/document-retention/archive-reviews` | Crear revisión trimestral. |
| GET | `/api/pesv/document-retention/archive-reviews/{id}` | Consultar detalle completo de revisión trimestral. |
| PUT | `/api/pesv/document-retention/archive-reviews/{id}` | Actualizar revisión trimestral conservando historial. |
| DELETE | `/api/pesv/document-retention/archive-reviews/{id}` | Eliminar o archivar revisión trimestral si no tiene dependencias. |
| GET | `/api/pesv/document-retention/archive-reviews/export` | Exportar la vista filtrada a PDF. |
| GET | `/api/pesv/document-retention/archive-reviews/{id}/documents` | Listar evidencias. |
| POST | `/api/pesv/document-retention/archive-reviews/{id}/documents` | Adjuntar evidencia después de crear el registro. |
| GET | `/api/pesv/document-retention/archive-reviews/{id}/documents/{documentId}` | Previsualizar o descargar evidencia. |
| DELETE | `/api/pesv/document-retention/archive-reviews/{id}/documents/{documentId}` | Eliminar evidencia autorizada. |
| GET | `/api/pesv/document-retention/catalogs` | Obtener empleados y entidades relacionadas disponibles para la empresa. |

### Especificación REST aplicable a cada recurso

Los endpoints anteriores son **PROPUESTOS**. El patrón siguiente se aplica a cada tipo de registro del módulo sustituyendo `archive-procedures` por el recurso correspondiente.

#### `GET /api/pesv/document-retention/archive-procedures`

- **Objetivo:** listar registros del tenant.
- **Query:** `page` (>=1), `limit` (1..100), `search`, `year`, `status`, `kind`, `sort`.
- **Respuesta 200:** `{ "ok": true, "data": { "items": [...], "total": 1, "page": 1, "limit": 20 } }`.
- **Errores:** 400 filtros inválidos, 401 sin sesión, 403 sin permiso.
- **Permiso:** `PESV_DOCUMENT_RETENTION_VIEW`.

#### `POST /api/pesv/document-retention/archive-procedures`

- **Objetivo:** crear el registro base. No recibe archivos.
- **Body de ejemplo:**

```json
{
  "name": "string",
  "year": 2026,
  "version": "string",
  "responsibleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "nextReviewDate": "2026-10-13",
  "identification": "string",
  "legibility": "string",
  "access": "string"
}
```

- **Respuesta 201:** `{ "ok": true, "data": { "id": "uuid", "companyId": "uuid", ...body, "createdAt": "2026-10-13T15:00:00Z" } }`.
- **Errores:** 400 validación, 404 relación no encontrada, 409 duplicado o versión vigente incompatible.
- **Efectos:** crea historial `CREATED`; habilita carga documental.

#### `GET /api/pesv/document-retention/archive-procedures/{id}`, `PUT /api/pesv/document-retention/archive-procedures/{id}`, `DELETE /api/pesv/document-retention/archive-procedures/{id}`

- **Detalle:** devuelve campos, relaciones, entradas, evidencias e historial.
- **Actualización:** recibe los mismos campos editables y `version`; 409 si la versión cambió. Fechas o campos bloqueados por estado deben rechazarse.
- **Eliminación:** preferir borrado lógico. Responder 409 si existen relaciones, retención vigente o evidencias/entradas que deban conservarse.
- **Respuestas:** 200 para consulta/actualización; 204 o envoltorio 200 para eliminación; 404 si no pertenece a la empresa.
- **Permisos:** `VIEW`, `EDIT`, `DELETE` del módulo.

#### Entradas de proceso

Cuando el tipo permite seguimiento, revisión anual o difusión, `POST /api/pesv/document-retention/archive-procedures/{id}/entries` recibe:

```json
{"kind":"FOLLOW_UP","date":"2026-10-13","observations":"Avance verificado","progress":75,"measuredValue":20,"medium":"Reunión","audience":"Comité","attendeeIds":["uuid"]}
```

`kind` admite solo las capacidades habilitadas por el tipo: `FOLLOW_UP`, `ANNUAL_REVIEW`, `DIFFUSION`. El backend valida secuencia temporal, progreso 0..100, pertenencia de asistentes y bloqueo por cierre.

#### Evidencias

- `POST /api/pesv/document-retention/archive-procedures/{id}/documents`: `multipart/form-data` con `file`, `description`, `isConfirmed` y opcional `targetId` para asociarla a una entrada.
- `GET /api/pesv/document-retention/archive-procedures/{id}/documents`: lista metadatos; nunca Base64 en la respuesta de lista.
- `GET /api/pesv/document-retention/archive-procedures/{id}/documents/{documentId}`: stream o URL firmada temporal con control de tenant.
- `DELETE /api/pesv/document-retention/archive-procedures/{id}/documents/{documentId}`: elimina lógicamente y registra auditoría; 409 si la evidencia sustenta un cierre inmutable.
- **Validación actual:** la interfaz acepta PDF e imágenes y, en los flujos compartidos, limita normalmente a 3 MB.

#### Exportación

`GET /api/pesv/document-retention/archive-procedures/export?format=pdf&year=2026&status=...` devuelve `application/pdf`. Debe reproducir filtros, fechas, relaciones y trazabilidad visibles; 422 si no hay datos exportables.

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
- Catálogo `archiveProcedures`: relación por UUID, restringida a la misma empresa; si el origen se inactiva se conserva la instantánea y se impide seleccionarlo de nuevo.
- Cardinalidad: empresa 1:N registros; registro 1:N entradas; registro/entrada 1:N evidencias; registro 1:N historial.

## K. Seguridad y permisos

- JWT obligatorio; `companyId` nunca se recibe confiablemente del cliente.
- Permisos propuestos: `PESV_DOCUMENT_RETENTION_VIEW`, `PESV_DOCUMENT_RETENTION_CREATE`, `PESV_DOCUMENT_RETENTION_EDIT`, `PESV_DOCUMENT_RETENTION_DELETE`, `PESV_DOCUMENT_RETENTION_UPLOAD`, `PESV_DOCUMENT_RETENTION_EXPORT`.
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

- Página: `app/dashboard/pesv-document-retention/page.tsx`.
- Motor: `components/pesv/planning-module.tsx`.
- Tipos, validación, persistencia y catálogos: `lib/pesv/planning.ts`.
- Configuraciones: `lib/pesv/operations.ts` y `lib/pesv/assurance.ts`.
- Encabezado/selectores/resumen: `components/pesv/module-experience.tsx`, `components/pesv/pesv-select.tsx`, `components/pesv/assurance-overview.tsx`.

## Discrepancias y pendientes

- **DISCREPANCIA:** hoy la persistencia es localStorage y las evidencias usan URL temporal/Base64; no existe aislamiento real multiempresa.
- **PENDIENTE DE DEFINICIÓN:** política final de retención, límites de archivo y catálogo formal de permisos.
- **PROPUESTO:** backend REST descrito en este contrato, almacenamiento de objetos y control optimista.
