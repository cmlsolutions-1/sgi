# Riesgos Viales

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Riesgos Viales
- **Descripción/objetivo:** Identificar, valorar y tratar riesgos viales ligados al diagnóstico, con seguimiento residual y evidencias.
- **Ruta:** `/dashboard/pesv-risks`
- **Código de navegación:** `PESV_RISKS`
- **Archivos fuente:** `app/dashboard/pesv-risks/page.tsx`.
- **Dependencias:** Diagnóstico PESV, jsPDF/autotable.
- **Persistencia actual:** localStorage `safecloud:pesv-risks`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Riesgo N:1 diagnóstico; Riesgo N:1 fuente diagnóstica; Riesgo 1:N revisiones.

## B. Estructura interna

- Matriz de riesgos y filtros.
- Formulario de identificación/valoración/tratamiento.
- Seguimientos y valoración residual.
- Evidencias, historial y exportación.

## C. Flujo completo

1. Carga diagnósticos y fuentes (rutas, vehículos, colaboradores).
2. Crea riesgo y calcula NR exposición × probabilidad.
3. Registra tratamiento, acción, responsable y plazo.
4. Añade revisiones secuenciales con nueva valoración y estado.
5. Adjunta/previsualiza evidencia y exporta matriz.

## D. Modelo de datos completo

### Risk



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Nombre | `name` | string | Sí | — | Sin condición adicional. |
| Actividad | `activity` | string | Sí | — | Sin condición adicional. |
| Usuario vial | `roadUser` | string | Sí | — | Sin condición adicional. |
| Desplazamiento | `journey` | string | Sí | — | Sin condición adicional. |
| Diagnóstico | `diagnosisId` | UUID | No | diagnoses | Si se selecciona exige fuente. |
| Fuente | `sourceId` | UUID | Condicional | diagnosis sources | Ruta, vehículo o colaborador. |
| Etiqueta fuente | `sourceLabel` | string | Servidor | — | Sin condición adicional. |
| Tipo fuente | `sourceType` | enum | Sí | routes, vehicles, collaborators |  |
| Causas | `causes` | string | Sí | — | Sin condición adicional. |
| Consecuencias | `consequences` | string | Sí | — | Sin condición adicional. |
| Controles | `existingControls` | string | Sí | — | Sin condición adicional. |
| Exposición | `exposure` | integer 1..3 | Sí | — | Sin condición adicional. |
| Probabilidad | `probability` | integer 1..3 | Sí | — | Sin condición adicional. |
| Tratamiento | `treatment` | enum | Sí | — | Sin condición adicional. |
| Acción | `action` | string | Sí | — | Sin condición adicional. |
| Responsable | `responsible` | string/UUID | Sí | — | Sin condición adicional. |
| Plazo | `dueDate` | date | Sí | — | Sin condición adicional. |
| Estado | `status` | enum | Sí | PENDIENTE, EN_EJECUCION, CONTROLADO |  |

### Review



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID | `id` | UUID | Sí | — | Sin condición adicional. |
| Fecha | `date` | date | Sí | — | Sin condición adicional. |
| Observaciones | `observations` | string | Sí | — | Sin condición adicional. |
| Exposición residual | `exposure` | integer 1..3 | Sí | — | Sin condición adicional. |
| Probabilidad residual | `probability` | integer 1..3 | Sí | — | Sin condición adicional. |
| Estado | `status` | enum | Sí | PENDIENTE, EN_EJECUCION, CONTROLADO |  |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/road-risks` | Listar |
| POST | `/api/pesv/road-risks` | Crear |
| GET | `/api/pesv/road-risks/{id}` | Consultar detalle |
| PUT | `/api/pesv/road-risks/{id}` | Actualizar |
| DELETE | `/api/pesv/road-risks/{id}` | Eliminar/archivar |
| GET | `/api/pesv/road-risks/{id}/reviews` | Listar seguimientos |
| POST | `/api/pesv/road-risks/{id}/reviews` | Crear seguimiento |
| PUT | `/api/pesv/road-risks/{id}/reviews/{reviewId}` | Editar seguimiento |
| GET | `/api/pesv/road-risks/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/road-risks/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/road-risks/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/road-risks/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/road-risks/export` | Exportar matriz |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_RISKS_VIEW`, `PESV_RISKS_CREATE`, `PESV_RISKS_EDIT`, `PESV_RISKS_DELETE`, `PESV_RISKS_UPLOAD`, `PESV_RISKS_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/road-risks`:

```json
{
  "name": "Riesgo en ruta",
  "activity": "Distribución",
  "roadUser": "Conductor",
  "journey": "Laboral",
  "diagnosisId": "uuid",
  "sourceType": "routes",
  "sourceId": "uuid",
  "causes": "Fatiga",
  "consequences": "Colisión",
  "existingControls": "Pausas",
  "exposure": 2,
  "probability": 2,
  "treatment": "Modificar la probabilidad",
  "action": "Capacitar",
  "responsible": "uuid",
  "dueDate": "2026-12-31"
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

- status: `PENDIENTE`, `EN_EJECUCION`, `CONTROLADO`.
- treatment: Evitar el riesgo, Aceptar el riesgo, Eliminar la fuente, Modificar la exposición, Modificar la probabilidad.
- sourceType: routes, vehicles, collaborators.
- Level 1..3: exposición y probabilidad.

## H. Reglas de negocio

- NR = exposición × probabilidad. 1..2 Bajo, 3..5 Moderado, 6..9 Crítico.
- Si hay diagnóstico debe existir fuente válida.
- Seguimiento no retrocede fecha; valoración actual usa último seguimiento.
- Plazo vencido y no controlado se muestra atrasado.
- Evidencia actual admite hasta 4 MB.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Riesgo N:1 diagnóstico. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Riesgo N:1 fuente diagnóstica. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Riesgo 1:N revisiones. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- Fuente eliminada: conservar etiqueta snapshot.
- CONTROLADO sin seguimiento/evidencia debe ser rechazado o advertido.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Calcular NR y nivel igual al frontend.
- [ ] Filtrar por nivel.
- [ ] Conservar valoración inicial y residual.
- [ ] Exportar matriz completa.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-risks/page.tsx`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir catálogo maestro de usuarios viales y contexto de viaje.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
