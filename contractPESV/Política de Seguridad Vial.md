# Política de Seguridad Vial

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Política de Seguridad Vial
- **Descripción/objetivo:** Versionar, revisar, firmar, socializar y publicar la política de seguridad vial.
- **Ruta:** `/dashboard/pesv-policy`
- **Código de navegación:** `PESV_POLICY`
- **Archivos fuente:** `app/dashboard/pesv-policy/page.tsx`.
- **Dependencias:** jsPDF, evidencias PDF/imagen, localStorage.
- **Persistencia actual:** localStorage `safecloud:pesv-policy`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Empresa 1:N versiones y 1:1 política activa; Objetivos N:1 política.

## B. Estructura interna

- Listado/versiones de política.
- Formulario de contenido y vigencia.
- Carga de política firmada.
- Previsualización, descarga y PDF.

## C. Flujo completo

1. Consulta versiones y estado.
2. Crea borrador con contenido completo.
3. Adjunta documento firmado y activa la política.
4. Marca revisión según próxima fecha, edita nueva versión y exporta.

## D. Modelo de datos completo

### PesvPolicy



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Nombre | `name` | string | Sí | — | Sin condición adicional. |
| Versión | `version` | string | Sí | — | Única por empresa. |
| Emisión | `issueDate` | date | Sí | — | Sin condición adicional. |
| Próxima revisión | `nextReviewDate` | date | Sí | — | Inicialmente tres años después. |
| Representante legal | `legalRepresentative` | string | Sí | — | Sin condición adicional. |
| Alcance | `scope` | string | Sí | — | Sin condición adicional. |
| Compromisos | `commitments` | string | Sí | — | Sin condición adicional. |
| Adecuación al riesgo | `riskFit` | string | Sí | — | Sin condición adicional. |
| Marco de objetivos | `objectiveFramework` | string | Sí | — | Sin condición adicional. |
| Cumplimiento legal | `legalCompliance` | string | Sí | — | Sin condición adicional. |
| Mejora continua | `continuousImprovement` | string | Sí | — | Sin condición adicional. |
| Medios de socialización | `socializationMeans` | string | Sí | — | Sin condición adicional. |
| Ubicación accesible | `accessibilityLocation` | string | Sí | — | Sin condición adicional. |
| Estado | `status` | enum | Servidor | DRAFT, ACTIVE, UNDER_REVIEW | Transiciones controladas. |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/policies` | Listar |
| POST | `/api/pesv/policies` | Crear |
| GET | `/api/pesv/policies/{id}` | Consultar detalle |
| PUT | `/api/pesv/policies/{id}` | Actualizar |
| DELETE | `/api/pesv/policies/{id}` | Eliminar/archivar |
| PUT | `/api/pesv/policies/{id}/status` | Cambiar estado |
| GET | `/api/pesv/policies/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/policies/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/policies/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/policies/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/policies/{id}/export` | Exportar política |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_POLICY_VIEW`, `PESV_POLICY_CREATE`, `PESV_POLICY_EDIT`, `PESV_POLICY_DELETE`, `PESV_POLICY_UPLOAD`, `PESV_POLICY_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/policies`:

```json
{
  "name": "Política de Seguridad Vial",
  "version": "1.0",
  "issueDate": "2026-10-13",
  "nextReviewDate": "2029-10-13",
  "legalRepresentative": "Nombre",
  "scope": "Toda la organización",
  "commitments": "Compromisos",
  "riskFit": "Adecuada",
  "objectiveFramework": "Marco",
  "legalCompliance": "Cumplimiento",
  "continuousImprovement": "Mejora",
  "socializationMeans": "Inducción",
  "accessibilityLocation": "SafeCloud"
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

- status: `DRAFT` inicial, `ACTIVE` con soporte firmado, `UNDER_REVIEW` al vencer/reabrir.

## H. Reglas de negocio

- Versión única.
- Próxima revisión posterior a emisión.
- Solo una política activa por empresa.
- Activación requiere representante, contenidos y evidencia firmada.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Empresa 1:N versiones y 1:1 política activa. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Objetivos N:1 política. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- No reemplazar retrospectivamente una versión usada por objetivos.
- Revisión vencida debe destacarse sin borrar vigencia histórica.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Crear borrador completo.
- [ ] Bloquear versión duplicada.
- [ ] Activar solo con evidencia.
- [ ] Previsualizar y exportar texto exacto.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-policy/page.tsx`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir periodicidad legal configurable.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
