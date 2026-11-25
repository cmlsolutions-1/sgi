# Comité de Seguridad Vial

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Comité de Seguridad Vial
- **Descripción/objetivo:** Conformar el comité, registrar miembros con capacidad decisoria y documentar revisiones trimestrales.
- **Ruta:** `/dashboard/pesv-committee`
- **Código de navegación:** `PESV_COMMITTEE`
- **Archivos fuente:** `app/dashboard/pesv-committee/page.tsx`, `services/employeeService.ts`.
- **Dependencias:** Responsable PESV, empleados, jsPDF, localStorage.
- **Persistencia actual:** localStorage `safecloud:pesv-committee`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Responsable PESV 1:1 líder del comité; Empleado N:M comité; Comité 1:N revisiones.

## B. Estructura interna

- Conformación y propósito del comité.
- Miembros, roles y capacidad de decisión.
- Revisiones Q1-Q4 con análisis y decisiones.
- Soporte y exportación.

## C. Flujo completo

1. Carga responsable PESV y empleados.
2. Crea/edita comité con mínimo tres miembros e incluye al líder.
3. Registra revisión trimestral con análisis de siniestros, indicadores, autogestión, plan, auditorías e implementación.
4. Consulta y exporta acta/revisión.

## D. Modelo de datos completo

### Committee



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Objetivo | `objective` | string | Sí | — | Sin condición adicional. |
| Visión | `vision` | string | Sí | — | Sin condición adicional. |
| Alcance | `scope` | string | Sí | — | Sin condición adicional. |
| Fecha conformación | `formationDate` | date | Sí | — | Sin condición adicional. |
| Miembros | `members` | CommitteeMember[] | Sí | — | Mínimo 3. |

### CommitteeMember



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Empleado | `employeeId` | UUID | Sí | employees | Misma empresa. |
| Nombre | `employeeName` | string | Servidor | — | Sin condición adicional. |
| Rol | `role` | string | Sí | — | Sin condición adicional. |
| Poder de decisión | `hasDecisionPower` | boolean | Sí | — | Sin condición adicional. |
| Líder PESV | `isPesvLeader` | boolean | Servidor | — | Debe existir uno. |

### QuarterlyReview



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID | `id` | UUID | Servidor | — | Sin condición adicional. |
| Trimestre | `quarter` | enum | Sí | Q1, Q2, Q3, Q4 | Único por período. |
| Fecha | `reviewDate` | date | Sí | — | Sin condición adicional. |
| Análisis siniestros | `roadAccidentAnalysis` | string | Sí | — | Sin condición adicional. |
| Análisis indicadores | `indicatorsAnalysis` | string | Sí | — | Sin condición adicional. |
| Autogestión | `selfManagementReport` | string | No | — | Sin condición adicional. |
| Plan anual | `annualWorkPlanReview` | string | No | — | Sin condición adicional. |
| Auditorías | `auditsReview` | string | No | — | Sin condición adicional. |
| Implementación | `implementationReview` | string | No | — | Sin condición adicional. |
| Decisiones | `decisions` | string | Sí | — | Sin condición adicional. |
| Evidencia | `evidenceFileName` | string | No | — | Sin condición adicional. |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/committee` | Listar |
| POST | `/api/pesv/committee` | Crear |
| GET | `/api/pesv/committee/{id}` | Consultar detalle |
| PUT | `/api/pesv/committee/{id}` | Actualizar |
| DELETE | `/api/pesv/committee/{id}` | Eliminar/archivar |
| GET | `/api/pesv/committee/{id}/reviews` | Listar revisiones |
| POST | `/api/pesv/committee/{id}/reviews` | Crear revisión |
| PUT | `/api/pesv/committee/{id}/reviews/{reviewId}` | Editar revisión |
| DELETE | `/api/pesv/committee/{id}/reviews/{reviewId}` | Eliminar revisión |
| GET | `/api/pesv/committee/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/committee/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/committee/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/committee/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/committee/{id}/export` | Exportar acta |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_COMMITTEE_VIEW`, `PESV_COMMITTEE_CREATE`, `PESV_COMMITTEE_EDIT`, `PESV_COMMITTEE_DELETE`, `PESV_COMMITTEE_UPLOAD`, `PESV_COMMITTEE_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/committee`:

```json
{
  "objective": "Definir y seguir el PESV",
  "vision": "Cultura vial segura",
  "scope": "Trabajadores y contratistas",
  "formationDate": "2026-10-13",
  "memberIds": [
    "uuid-1",
    "uuid-2",
    "uuid-3"
  ]
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

- quarter: `Q1`, `Q2`, `Q3`, `Q4`.

## H. Reglas de negocio

- Mínimo tres miembros.
- El responsable PESV debe integrar el comité.
- No duplicar trimestre para la misma vigencia.
- Revisión exige fecha, análisis de accidentalidad, indicadores y decisiones.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Responsable PESV 1:1 líder del comité. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Empleado N:M comité. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Comité 1:N revisiones. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- Sin responsable PESV: bloquear conformación y dirigir a designación.
- Evidencia temporal actual solo conserva nombre; backend debe almacenar archivo real.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Bloquear comité con menos de tres miembros.
- [ ] Registrar y recuperar cada revisión trimestral.
- [ ] Conservar miembros y decisiones en exportación.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-committee/page.tsx`.
- `services/employeeService.ts`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir vigencia/renovación formal del comité.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
