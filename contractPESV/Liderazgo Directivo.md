# Liderazgo Directivo

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Liderazgo Directivo
- **Descripción/objetivo:** Registrar la revisión y compromisos anuales de alta dirección frente al PESV.
- **Ruta:** `/dashboard/pesv-leadership`
- **Código de navegación:** `PESV_LEADERSHIP`
- **Archivos fuente:** `app/dashboard/pesv-leadership/page.tsx`.
- **Dependencias:** Comité, Política, jsPDF.
- **Persistencia actual:** localStorage `safecloud:pesv-leadership`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Empresa 1:N revisiones; Comité relacionado por fecha/participación.

## B. Estructura interna

- Registro anual de dirección.
- Ocho compromisos verificables.
- Cálculo de avance/estado.
- Evidencia y exportación.

## C. Flujo completo

1. Crea revisión por vigencia.
2. Registra director, alineación, recursos, terceros, plan, verificaciones y comité.
3. Marca compromisos y calcula porcentaje.
4. Adjunta evidencia; con 100% y soporte cambia a cumplido.

## D. Modelo de datos completo

### LeadershipRecord



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Vigencia | `year` | integer | Sí | — | Sin condición adicional. |
| Director | `directorName` | string | Sí | — | Sin condición adicional. |
| Cargo | `directorRole` | string | Sí | — | Sin condición adicional. |
| Fecha revisión | `reviewDate` | date | Sí | — | Sin condición adicional. |
| Alineación estratégica | `strategicAlignment` | string | Sí | — | Sin condición adicional. |
| Recursos asignados | `resourcesAssigned` | string | Sí | — | Sin condición adicional. |
| Seguimiento contratistas | `contractorFollowUp` | string | Sí | — | Sin condición adicional. |
| Seguimiento plan | `annualPlanFollowUp` | string | Sí | — | Sin condición adicional. |
| Gestión verificaciones | `verificationManagement` | string | Sí | — | Sin condición adicional. |
| Fecha comité | `committeeMeetingDate` | date | No | — | Sin condición adicional. |
| Observaciones | `observations` | string | No | — | Sin condición adicional. |
| Compromisos | `commitments` | object | Sí | — | 8 booleanos. |
| Estado | `status` | enum | Calculado | PENDING, IN_PROGRESS, COMPLETED |  |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/leadership` | Listar |
| POST | `/api/pesv/leadership` | Crear |
| GET | `/api/pesv/leadership/{id}` | Consultar detalle |
| PUT | `/api/pesv/leadership/{id}` | Actualizar |
| DELETE | `/api/pesv/leadership/{id}` | Eliminar/archivar |
| GET | `/api/pesv/leadership/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/leadership/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/leadership/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/leadership/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/leadership/{id}/export` | Exportar revisión |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_LEADERSHIP_VIEW`, `PESV_LEADERSHIP_CREATE`, `PESV_LEADERSHIP_EDIT`, `PESV_LEADERSHIP_DELETE`, `PESV_LEADERSHIP_UPLOAD`, `PESV_LEADERSHIP_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/leadership`:

```json
{
  "year": 2026,
  "directorName": "Gerencia",
  "directorRole": "Representante legal",
  "reviewDate": "2026-10-13",
  "strategicAlignment": "Alineación",
  "resourcesAssigned": "Recursos",
  "contractorFollowUp": "Seguimiento",
  "annualPlanFollowUp": "Avance",
  "verificationManagement": "Gestión",
  "commitments": {
    "policyAndObjectives": true,
    "safeBehaviors": true,
    "resources": true,
    "safeProcurement": false,
    "thirdParties": true,
    "annualPlan": true,
    "verificationEntities": false,
    "committeeParticipation": true
  }
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

- status: `PENDING` 0%, `IN_PROGRESS` >0%, `COMPLETED` 100% + evidencia.
- CommitmentKey: policyAndObjectives, safeBehaviors, resources, safeProcurement, thirdParties, annualPlan, verificationEntities, committeeParticipation.

## H. Reglas de negocio

- Porcentaje = compromisos verdaderos / 8 × 100, redondeado.
- Cumplido requiere 100% y evidencia.
- Una revisión anual por vigencia.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Empresa 1:N revisiones. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Comité relacionado por fecha/participación. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- 100% sin evidencia permanece en ejecución.
- Cambio de compromisos recalcula estado.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Calcular porcentaje exacto.
- [ ] No marcar cumplido sin archivo.
- [ ] Conservar historial de revisión.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-leadership/page.tsx`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir si los compromisos requieren evidencia individual.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
