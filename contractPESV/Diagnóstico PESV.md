# Diagnóstico PESV

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Diagnóstico PESV
- **Descripción/objetivo:** Caracterizar empresa, colaboradores, vehículos, rutas, contratistas y capacidad de emergencia como línea base PESV.
- **Ruta:** `/dashboard/pesv-diagnosis`
- **Código de navegación:** `PESV_DIAGNOSIS`
- **Archivos fuente:** `app/dashboard/pesv-diagnosis/page.tsx`.
- **Dependencias:** empleados, vehículos/rutas PESV, jsPDF.
- **Persistencia actual:** localStorage `safecloud:pesv-diagnosis`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Diagnóstico 1:N perfiles de colaboradores; Diagnóstico 1:N vehículos; Diagnóstico 1:N rutas; Riesgos N:1 diagnóstico y fuente.

## B. Estructura interna

- Datos generales de vigencia.
- Perfiles viales de colaboradores.
- Parque automotor.
- Rutas frecuentes.
- Emergencias, hallazgos y evidencia.

## C. Flujo completo

1. Crea diagnóstico por año y fecha de actualización.
2. Captura conteos y descripciones generales.
3. Congela perfiles de colaboradores, vehículos y rutas disponibles.
4. Adjunta soporte, consulta detalle y exporta diagnóstico.

## D. Modelo de datos completo

### Diagnosis



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Identificador | `id` | UUID | Servidor | — | Inmutable; único. |
| Empresa | `companyId` | UUID | Servidor | — | Derivada de JWT; no editable. |
| Creado | `createdAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Actualizado | `updatedAt` | timestamptz | Servidor | — | UTC; solo lectura. |
| Año | `year` | integer | Sí | — | Sin condición adicional. |
| Sedes | `sitesCount` | integer | Sí | — | >=0 |
| Servicios | `servicesDescription` | string | Sí | — | Sin condición adicional. |
| Contratistas | `contractorsDescription` | string | Sí | — | Sin condición adicional. |
| Contratistas permanentes | `permanentContractors` | integer | Sí | — | Sin condición adicional. |
| Contratistas ocasionales | `occasionalContractors` | integer | Sí | — | Sin condición adicional. |
| Flotas habituales | `loyalFleets` | integer | Sí | — | Sin condición adicional. |
| Flotas ocasionales | `occasionalFleets` | integer | Sí | — | Sin condición adicional. |
| Afiliados | `affiliates` | integer | Sí | — | Sin condición adicional. |
| Capacitados en emergencias | `emergencyPlanTrained` | integer | Sí | — | Sin condición adicional. |
| Primeros auxilios | `firstAidEquipmentDescription` | string | Sí | — | Sin condición adicional. |
| Simulacros | `emergencyDrillsDescription` | string | Sí | — | Sin condición adicional. |
| Hallazgos | `findings` | string | Sí | — | Sin condición adicional. |
| Actualización | `updateDate` | date | Sí | — | Sin condición adicional. |
| Estado | `status` | enum | Calculado | DRAFT, DOCUMENTED, UPDATED |  |

### CollaboratorRoadProfile



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID | `id` | UUID | Sí | — | Sin condición adicional. |
| Nombre | `name` | string | Sí | — | Sin condición adicional. |
| Nacimiento | `birthDate` | date | Sí | — | Sin condición adicional. |
| Género | `gender` | enum | Sí | MASCULINO, FEMENINO |  |
| Cargo | `role` | string | Sí | — | Sin condición adicional. |
| Educación | `educationLevel` | string | Sí | — | Sin condición adicional. |
| Estado civil | `maritalStatus` | string | Sí | — | Sin condición adicional. |
| Licencia válida hasta | `licenseValidUntil` | date | Sí | — | Sin condición adicional. |
| Capacitaciones | `trainings` | integer | Sí | — | Sin condición adicional. |
| Evaluación competencia | `competencyEvaluation` | string | Sí | — | Sin condición adicional. |
| Siniestros | `roadAccidents` | integer | Sí | — | Sin condición adicional. |
| Comparendos | `trafficFines` | integer | Sí | — | Sin condición adicional. |
| Pago multas | `finesPaymentStatus` | string | Sí | — | Sin condición adicional. |
| Transporte | `commuteTransport` | string | Sí | — | Sin condición adicional. |
| Conductor laboral | `isWorkDriver` | boolean | Sí | — | Sin condición adicional. |
| Vehículo conducido | `vehicleTypeDriven` | string | Sí | — | Sin condición adicional. |
| Vinculación | `linkedAt` | date | Sí | — | Sin condición adicional. |

### VehicleRoadProfile



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID | `id` | UUID | Sí | — | Sin condición adicional. |
| Placa | `plate` | string | Sí | — | Sin condición adicional. |
| VIN | `vin` | string | Sí | — | Sin condición adicional. |
| Motor | `engineNumber` | string | Sí | — | Sin condición adicional. |
| Kilometraje | `mileage` | number | Sí | — | Sin condición adicional. |
| Fabricación | `manufactureDate` | date | Sí | — | Sin condición adicional. |
| Especificaciones | `technicalSpecs` | string | Sí | — | Sin condición adicional. |
| SOAT | `soatValidUntil` | date | Sí | — | Sin condición adicional. |
| RTM | `inspectionValidUntil` | date | Sí | — | Sin condición adicional. |
| Siniestros | `roadAccidents` | integer | Sí | — | Sin condición adicional. |
| Plan mantenimiento | `preventiveMaintenancePlan` | string | Sí | — | Sin condición adicional. |
| Acciones mantenimiento | `maintenanceActions` | string | Sí | — | Sin condición adicional. |
| Tipo | `vehicleType` | string | Sí | — | Sin condición adicional. |
| Km mensuales | `estimatedMonthlyKm` | number | Sí | — | Sin condición adicional. |
| Propiedad | `ownershipType` | enum | Sí | PROPIO, AFILIADO, ASOCIADO, SERVICIO |  |

### FrequentRoute



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID | `id` | UUID | Sí | — | Sin condición adicional. |
| Origen | `origin` | string | Sí | — | Sin condición adicional. |
| Destino | `destination` | string | Sí | — | Sin condición adicional. |
| Kilómetros | `kilometers` | number | Sí | — | Sin condición adicional. |
| Frecuencia semanal | `weeklyFrequency` | integer | Sí | — | Sin condición adicional. |
| Frecuencia mensual | `monthlyFrequency` | integer | Sí | — | Sin condición adicional. |
| Frecuencia anual | `yearlyFrequency` | integer | Sí | — | Sin condición adicional. |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/diagnoses` | Listar |
| POST | `/api/pesv/diagnoses` | Crear |
| GET | `/api/pesv/diagnoses/{id}` | Consultar detalle |
| PUT | `/api/pesv/diagnoses/{id}` | Actualizar |
| DELETE | `/api/pesv/diagnoses/{id}` | Eliminar/archivar |
| GET | `/api/pesv/diagnoses/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/diagnoses/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/diagnoses/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/diagnoses/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/diagnoses/{id}/export` | Exportar diagnóstico |
| GET | `/api/pesv/diagnoses/catalogs` | Cargar población, flota y rutas |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_DIAGNOSIS_VIEW`, `PESV_DIAGNOSIS_CREATE`, `PESV_DIAGNOSIS_EDIT`, `PESV_DIAGNOSIS_DELETE`, `PESV_DIAGNOSIS_UPLOAD`, `PESV_DIAGNOSIS_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/diagnoses`:

```json
{
  "year": 2026,
  "sitesCount": 1,
  "servicesDescription": "Servicios",
  "contractorsDescription": "Contratistas",
  "permanentContractors": 5,
  "occasionalContractors": 2,
  "loyalFleets": 4,
  "occasionalFleets": 1,
  "affiliates": 0,
  "emergencyPlanTrained": 8,
  "firstAidEquipmentDescription": "Botiquines",
  "emergencyDrillsDescription": "Simulacro anual",
  "findings": "Hallazgos",
  "updateDate": "2026-10-13"
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

- status: `DRAFT`, `DOCUMENTED`, `UPDATED`.
- gender: `MASCULINO`, `FEMENINO`.
- ownershipType: `PROPIO`, `AFILIADO`, `ASOCIADO`, `SERVICIO`.

## H. Reglas de negocio

- Una línea base por vigencia o versionado explícito.
- Conteos no negativos.
- Actualizar conserva snapshot previo.
- Rutas/vehículos/colaboradores quedan disponibles como fuentes de riesgos.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Diagnóstico 1:N perfiles de colaboradores. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Diagnóstico 1:N vehículos. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Diagnóstico 1:N rutas. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Riesgos N:1 diagnóstico y fuente. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- Catálogos vacíos: permitir borrador pero no documentar como completo.
- Cambios posteriores del empleado no alteran snapshot histórico.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Persistir todos los perfiles.
- [ ] Exponer fuentes a Riesgos Viales.
- [ ] Exportar detalle y conteos.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-diagnosis/page.tsx`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir fuente maestra de vehículos y rutas fuera de PESV.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
