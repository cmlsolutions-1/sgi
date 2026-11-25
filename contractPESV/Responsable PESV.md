# Responsable PESV

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Responsable PESV
- **Descripción/objetivo:** Designar al líder responsable del diseño e implementación del PESV y conservar el soporte de designación.
- **Ruta:** `/dashboard/pesv-responsible`
- **Código de navegación:** `PESV_RESPONSIBLE`
- **Archivos fuente:** `app/dashboard/pesv-responsible/page.tsx`, `services/employeeService.ts`, `types/manager/employee.ts`.
- **Dependencias:** catálogo de empleados, jsPDF, Sonner, componentes SafeCloud.
- **Persistencia actual:** localStorage `safecloud:pesv-responsible`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Empresa 1:N designaciones históricas y 1:1 vigente; Empleado 1:N designaciones.

## B. Estructura interna

- Selector buscable de empleado activo.
- Formulario de designación.
- Resumen del responsable actual.
- Generación/descarga del documento de designación y soporte.

## C. Flujo completo

1. Carga empleados; si la API no aporta suficientes, hoy agrega empleados demo.
2. Selecciona empleado, fecha, descripción del rol y soporte.
3. Guarda una única designación vigente y muestra datos de contacto congelados.
4. Genera PDF de designación y permite reemplazar el responsable.

## D. Modelo de datos completo

### PesvResponsible



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Empleado | `employeeId` | UUID | Sí | employees | Empleado activo de la empresa. |
| Nombre | `employeeName` | string | Servidor | — | Instantánea; solo lectura. |
| Correo | `employeeEmail` | string | Servidor | — | Instantánea. |
| Teléfono | `employeePhone` | string | Servidor | — | Instantánea. |
| Fecha de firma | `signatureDate` | date | Sí | — | Valor inicial: hoy. |
| Descripción del rol | `roleDescription` | string | Sí | — | Predeterminado: líder de diseño e implementación. |
| Nombre del soporte | `supportFileName` | string | No | — | Metadato temporal. |
| Descripción soporte | `supportDescription` | string | No | — | Texto libre. |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/responsible` | Listar |
| POST | `/api/pesv/responsible` | Crear |
| GET | `/api/pesv/responsible/{id}` | Consultar detalle |
| PUT | `/api/pesv/responsible/{id}` | Actualizar |
| DELETE | `/api/pesv/responsible/{id}` | Eliminar/archivar |
| GET | `/api/pesv/responsible/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/responsible/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/responsible/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/responsible/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/responsible/designation.pdf` | Descargar designación PDF |
| GET | `/api/employees?status=ACTIVE` | Catálogo de empleados |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_RESPONSIBLE_VIEW`, `PESV_RESPONSIBLE_CREATE`, `PESV_RESPONSIBLE_EDIT`, `PESV_RESPONSIBLE_DELETE`, `PESV_RESPONSIBLE_UPLOAD`, `PESV_RESPONSIBLE_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/responsible`:

```json
{
  "employeeId": "uuid",
  "signatureDate": "2026-10-13",
  "roleDescription": "Líder del diseño e implementación del PESV"
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

- No usa enum de estado visible; solo debe existir una designación vigente por empresa.

## H. Reglas de negocio

- Empleado obligatorio y activo.
- Fecha y descripción del rol obligatorias.
- Al reemplazar, cerrar la designación anterior sin borrar su auditoría.
- Las cuatro responsabilidades mostradas deben figurar en el PDF.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Empresa 1:N designaciones históricas y 1:1 vigente. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Empleado 1:N designaciones. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- Empleado inactivo o eliminado: conservar instantánea, impedir nueva selección.
- Datos demo son demostrativos y no deben persistirse en producción.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Crear designación válida y recuperar la vigente.
- [ ] Rechazar empleado de otra empresa.
- [ ] PDF contiene empresa, responsable, fecha, rol y responsabilidades.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-responsible/page.tsx`.
- `services/employeeService.ts`.
- `types/manager/employee.ts`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir si la firma es archivo cargado o firma electrónica.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
