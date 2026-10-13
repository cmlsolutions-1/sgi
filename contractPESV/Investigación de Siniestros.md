# Investigación de Siniestros

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Investigación de Siniestros
- **Descripción/objetivo:** Gestionar el procedimiento y el ciclo completo de investigación de siniestros, causas, acciones, eficacia y lecciones.
- **Ruta:** `/dashboard/pesv-investigations`
- **Código de navegación:** `PESV_INVESTIGATIONS`
- **Archivos fuente:** `app/dashboard/pesv-investigations/page.tsx`, `lib/pesv/road-investigations.ts`.
- **Dependencias:** empleados, diagnóstico, riesgos, emergencias, plan de trabajo.
- **Persistencia actual:** localStorage `safecloud:pesv-road-investigations`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Procedimiento 1:N casos con snapshot; Caso N:M empleados/rutas/vehículos/riesgos; Caso N:1 plan de emergencia; Acción N:1 actividad del plan.

## B. Estructura interna

- Pestaña de siniestros/investigaciones.
- Pestaña de procedimientos.
- Nueve etapas secuenciales.
- Acciones ACPM, seguimientos y eficacia.
- Difusión de lecciones, evidencias y cierre.

## C. Flujo completo

1. Crea procedimiento vigente.
2. Reporta siniestro con involucrados, fuentes y equipo investigador.
3. Completa etapas en orden desde riesgo hasta lecciones.
4. Define acciones correctivas/preventivas/mejora y las vincula al plan.
5. Registra seguimiento al 100% con evidencia y evalúa eficacia.
6. Documenta difusión con evidencia; cierra solo cuando todas las acciones son eficaces.

## D. Modelo de datos completo

### Procedure



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Nombre | `name` | string | Sí | — | Sin condición adicional. |
| Versión | `version` | string | Sí | — | Sin condición adicional. |
| Metodología | `methodology` | enum | Sí | Árbol de causas, Cinco porqués, Ishikawa, Otra |  |
| Otra metodología | `otherMethodology` | string | Condicional | — | Sin condición adicional. |
| Responsable | `responsibleId` | UUID | Sí | employees |  |
| Alcance | `scope` | string | Sí | — | Sin condición adicional. |
| Reporte | `reportProtocol` | string | Sí | — | Sin condición adicional. |
| Recolección | `collectionProtocol` | string | Sí | — | Sin condición adicional. |
| Análisis | `analysisProtocol` | string | Sí | — | Sin condición adicional. |
| Control | `controlProtocol` | string | Sí | — | Sin condición adicional. |
| Lecciones | `lessonsProtocol` | string | Sí | — | Sin condición adicional. |
| Autoridades | `authorityCoordination` | string | Sí | — | Sin condición adicional. |
| Confidencialidad | `confidentiality` | string | Sí | — | Sin condición adicional. |

### RoadCase



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Consecutivo | `consecutive` | string | Servidor | — | Sin condición adicional. |
| Nombre | `name` | string | Sí | — | Sin condición adicional. |
| Fecha | `occurrenceDate` | date | Sí | — | Sin condición adicional. |
| Hora | `occurrenceTime` | HH:mm | Sí | — | Sin condición adicional. |
| Lugar | `place` | string | Sí | — | Sin condición adicional. |
| Contexto | `journey` | enum | Sí | Desplazamiento laboral, Entorno próximo, In itinere |  |
| Involucrados | `peopleIds` | UUID[] | Sí | employees |  |
| Rutas | `routeIds` | UUID[] | No | — | Sin condición adicional. |
| Vehículos | `vehicleIds` | UUID[] | No | — | Sin condición adicional. |
| Riesgos | `riskIds` | UUID[] | No | — | Sin condición adicional. |
| Plan emergencia | `emergencyPlanId` | UUID | No | — | Sin condición adicional. |
| Referencia laboral | `laborReference` | string | No | — | Sin condición adicional. |
| Reporta | `reporterId` | UUID | Sí | — | Sin condición adicional. |
| Primer respondiente | `firstResponderId` | UUID | Sí | — | Sin condición adicional. |
| Acciones inmediatas | `immediateActions` | string | Sí | — | Sin condición adicional. |
| Investigadores internos | `investigatorIds` | UUID[] | Condicional | — | Sin condición adicional. |
| Investigadores externos | `externalInvestigators` | object[] | Condicional | — | Sin condición adicional. |
| Responsable | `responsibleId` | UUID | Sí | — | Sin condición adicional. |
| Cierre previsto | `dueDate` | date | Sí | — | Sin condición adicional. |
| Cerrado | `closedAt` | timestamptz | Servidor | — | Sin condición adicional. |

### Stage / Action / Diffusion



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Etapa | `key` | enum | Sí | RISK, EVIDENCE, FACTS, RECONSTRUCTION, CAUSES, ROOT, FAILURES, ACTIONS, LESSONS |  |
| Fecha etapa | `date` | date | Sí | — | Sin condición adicional. |
| Análisis | `notes` | string | Sí | — | Sin condición adicional. |
| Autor | `authorId` | UUID | Sí | — | Sin condición adicional. |
| Tipo acción | `type` | enum | Condicional | Correctiva, Preventiva, Mejora |  |
| Descripción acción | `description` | string | Condicional | — | Sin condición adicional. |
| Responsable acción | `responsibleId` | UUID | Condicional | — | Sin condición adicional. |
| Plazo acción | `dueDate` | date | Condicional | — | Sin condición adicional. |
| Progreso | `progress` | integer 0..100 | Condicional | — | Sin condición adicional. |
| Eficacia | `result` | enum | Condicional | EFICAZ, NO_EFICAZ |  |
| Medio difusión | `medium` | string | Condicional | — | Sin condición adicional. |
| Audiencia | `audience` | string | Condicional | — | Sin condición adicional. |
| Responsable CSV | `csvResponsibleId` | UUID | Condicional | — | Sin condición adicional. |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/investigation-procedures` | Listar |
| POST | `/api/pesv/investigation-procedures` | Crear |
| GET | `/api/pesv/investigation-procedures/{id}` | Consultar detalle |
| PUT | `/api/pesv/investigation-procedures/{id}` | Actualizar |
| DELETE | `/api/pesv/investigation-procedures/{id}` | Eliminar/archivar |
| GET | `/api/pesv/road-investigations` | Listar |
| POST | `/api/pesv/road-investigations` | Crear |
| GET | `/api/pesv/road-investigations/{id}` | Consultar detalle |
| PUT | `/api/pesv/road-investigations/{id}` | Actualizar |
| DELETE | `/api/pesv/road-investigations/{id}` | Eliminar/archivar |
| POST | `/api/pesv/road-investigations/{id}/stages` | Registrar etapa |
| PUT | `/api/pesv/road-investigations/{id}/stages/{stageId}` | Actualizar etapa |
| POST | `/api/pesv/road-investigations/{id}/actions` | Crear acción |
| POST | `/api/pesv/road-investigations/{id}/actions/{actionId}/follow-ups` | Seguimiento |
| POST | `/api/pesv/road-investigations/{id}/actions/{actionId}/evaluations` | Evaluar eficacia |
| POST | `/api/pesv/road-investigations/{id}/diffusions` | Difundir lecciones |
| PUT | `/api/pesv/road-investigations/{id}/close` | Cerrar investigación |
| GET | `/api/pesv/road-investigations/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/road-investigations/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/road-investigations/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/road-investigations/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/road-investigations/{id}/export` | Exportar informe |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_INVESTIGATIONS_VIEW`, `PESV_INVESTIGATIONS_CREATE`, `PESV_INVESTIGATIONS_EDIT`, `PESV_INVESTIGATIONS_DELETE`, `PESV_INVESTIGATIONS_UPLOAD`, `PESV_INVESTIGATIONS_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/investigation-procedures`:

```json
{
  "name": "Colisión leve",
  "occurrenceDate": "2026-10-13",
  "occurrenceTime": "09:00",
  "place": "Ruta urbana",
  "journey": "Desplazamiento laboral",
  "peopleIds": [
    "uuid"
  ],
  "reporterId": "uuid",
  "firstResponderId": "uuid",
  "immediateActions": "Reporte y control",
  "investigatorIds": [
    "uuid"
  ],
  "responsibleId": "uuid",
  "dueDate": "2026-11-13",
  "procedureId": "uuid"
}
```

- Creación: 201 y objeto persistido; 400/422 por validación, 404 por relación, 409 por duplicado.
- Actualización: PUT/PATCH con campos editables y `version`; 409 por concurrencia o estado inmutable.
- Eliminación: borrado lógico y auditoría; 409 si hay dependencias, cierre o retención.
- Efectos secundarios: recalcular estados/indicadores descritos, conservar instantáneas relacionales y registrar evento de auditoría.

### Evidencias

- Flujo obligatorio: crear el registro → recibir `id` → `POST .../{id}/documents` con `multipart/form-data` (`file`, `description`, `isConfirmed`, opcional `targetId`).
- Listado devuelve metadatos, no Base64. Detalle entrega stream o URL firmada temporal. Eliminación es lógica y auditada.
- Respuestas: 201 carga, 200 lista/detalle, 204 eliminación; 413 tamaño, 415 MIME, 422 archivo inválido, 503 almacenamiento.

### Exportación

Los endpoints `export` devuelven `application/pdf` y respetan filtros, zona `America/Bogota`, información relacionada y trazabilidad visible.

## G. Estados y enumeraciones

- Metodologías: Árbol de causas, Cinco porqués, Ishikawa, Otra.
- Etapas: RISK, EVIDENCE, FACTS, RECONSTRUCTION, CAUSES, ROOT, FAILURES, ACTIONS, LESSONS.
- Acción: Correctiva, Preventiva, Mejora.
- Eficacia: EFICAZ, NO_EFICAZ.
- Estado derivado: Reportado, En investigación, Pendiente de divulgación, Acciones por ajustar, Pendiente de verificación, Cerrada.

## H. Reglas de negocio

- Fecha del siniestro no futura; hora HH:mm; cierre previsto >= siniestro.
- Equipo: al menos un investigador interno o externo completo.
- Etapas estrictamente secuenciales; EVIDENCE requiere archivo objetivo.
- Acción al 100% requiere evidencia para evaluar.
- Evaluar eficacia exige lecciones divulgadas.
- Cierre: nueve etapas, difusión con evidencia, acciones existentes y todas eficaces.
- Caso cerrado inmutable.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Procedimiento 1:N casos con snapshot. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Caso N:M empleados/rutas/vehículos/riesgos. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Caso N:1 plan de emergencia. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Acción N:1 actividad del plan. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- Investigación interna no sustituye autoridad.
- No borrar caso cerrado ni procedimiento usado.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Bloquear etapas fuera de orden.
- [ ] Bloquear eficacia sin avance 100%, evidencia y difusión.
- [ ] Cerrar automáticamente/expresamente solo al cumplir reglas.
- [ ] Conservar consecutivo e historial.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-investigations/page.tsx`.
- `lib/pesv/road-investigations.ts`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir formato oficial del consecutivo por empresa/año.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
