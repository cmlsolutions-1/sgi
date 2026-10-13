# Indicadores y autogestión

> **IMPLEMENTADO:** flujo, validaciones, cálculos y persistencia temporal comprobados en el frontend. **PROPUESTO:** API y modelo backend descritos aquí. **PENDIENTE DE DEFINICIÓN:** decisiones que el código no permite cerrar. **DISCREPANCIA:** diferencias entre el estado temporal y una implementación SaaS.

## A. Identificación

- **Nombre:** Indicadores y autogestión
- **Descripción/objetivo:** Medir los 13 indicadores PESV, revisar resultados trimestrales y producir autogestión anual con trazabilidad.
- **Ruta:** `/dashboard/pesv-indicators`
- **Código de navegación:** `PESV_INDICATORS`
- **Archivos fuente:** `app/dashboard/pesv-indicators/page.tsx`, `lib/pesv/indicators.ts`, `lib/pesv/indicators-pdf.ts`, `lib/pesv/standards.ts`.
- **Dependencias:** investigaciones, riesgos, objetivos, plan, jornadas, programas, inspecciones, formación, auditoría, Comité.
- **Persistencia actual:** localStorage `safecloud:pesv-indicators`; debe sustituirse por API conservando la interfaz.
- **Relaciones principales:** Ficha N:1 responsable y N:M actividades plan; Medición N:1 definición/ficha; Revisión N:M miembros CSV y mediciones; Reporte anual agrega todos los módulos fuente.

## B. Estructura interna

- Indicadores y fichas.
- Mediciones por corte.
- Revisión CSV trimestral.
- Autogestión anual y presentación.
- Protocolo, evidencia, historial y PDF.

## C. Flujo completo

1. Configura nivel PESV, constante de tasa, método de costos y protocolo.
2. Completa ficha por indicador/año.
3. Registra mediciones cerradas; rectifica creando nueva versión.
4. Agrega resultados trimestrales cuando todos los cortes existen.
5. Comité revisa y adjunta evidencia.
6. Genera reporte anual, auditoría de pasos, soportes y presentación a autoridad.

## D. Modelo de datos completo

### IndicatorSheet



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID indicador | `id` | string | Sí | — | Sin condición adicional. |
| Año | `year` | integer | Sí | — | Sin condición adicional. |
| Nombre | `name` | string | Sí | — | Sin condición adicional. |
| Descripción | `description` | string | Sí | — | Sin condición adicional. |
| Fuentes | `sources` | string | Sí | — | Sin condición adicional. |
| Confiabilidad | `sourceReliability` | string | Sí | — | Sin condición adicional. |
| Línea base | `baseline` | string | Sí | — | Sin condición adicional. |
| Meta | `target` | string | Sí | — | Sin condición adicional. |
| Responsable | `responsibleId` | UUID | Sí | — | Sin condición adicional. |
| Actividades plan | `workActivityIds` | UUID[] | Sí | — | Sin condición adicional. |

### Measurement



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| ID | `id` | UUID | Sí | — | Sin condición adicional. |
| Indicador | `indicatorId` | enum | Sí | — | Sin condición adicional. |
| Año | `year` | integer | Sí | — | Sin condición adicional. |
| Período | `period` | 1..12/4/1 | Sí | — | Sin condición adicional. |
| Nivel pérdida | `loss` | enum | Condicional | — | Sin condición adicional. |
| Numerador | `numerator` | number | Sí | — | Sin condición adicional. |
| Denominador | `denominator` | number | Sí | — | Sin condición adicional. |
| Resultado | `result` | number|null | Calculado | — | Sin condición adicional. |
| Análisis | `analysis` | string | Sí | — | Sin condición adicional. |
| Fuente | `source` | string | Sí | — | Sin condición adicional. |
| Detalle fuente | `sourceDetails` | string | Sí | — | Sin condición adicional. |
| Registrado | `registeredAt` | timestamptz | Sí | — | Sin condición adicional. |
| Constante | `rateConstant` | number | Sí | — | Sin condición adicional. |
| Método costo | `costMethod` | enum |  | SUM, PRODUCT |  |
| Rectifica | `supersedesId` | UUID | No | — | Sin condición adicional. |
| Motivo | `correctionReason` | string | Condicional | — | Sin condición adicional. |

### CsvReview / AnnualReport



| Campo visible | Campo técnico | Tipo | Obligatorio | Opciones / relación | Validaciones, edición y persistencia |
|---|---|---:|:---:|---|---|
| Año | `year` | integer | Sí | — | Sin condición adicional. |
| Trimestre | `quarter` | 1..4 | Sí | — | Sin condición adicional. |
| Fecha | `date` | date | Sí | — | Sin condición adicional. |
| Revisores | `reviewerIds` | UUID[] | Sí | — | Sin condición adicional. |
| Conclusión | `conclusion` | string | Sí | — | Sin condición adicional. |
| Decisiones | `decisions` | string | Sí | — | Sin condición adicional. |
| Nivel | `level` | enum |  | Básico, Estándar, Avanzado |  |
| Filas flota/actores/contratistas/multas | `rows` | ReportRow[] | Sí | — | Sin condición adicional. |
| Evaluación pasos | `steps` | StepResult[] | Sí | — | Sin condición adicional. |
| Presentaciones | `presentations` | object[] | Sí | — | Sin condición adicional. |

## E-F. Endpoints REST necesarios y especificación

Todos los endpoints son **PROPUESTOS**, requieren JWT salvo que se indique, resuelven `companyId` desde la sesión y responden `{ ok, message, data, errors, meta }`.

| Método | Ruta | Objetivo |
|---|---|---|
| GET | `/api/pesv/indicators/definitions` | Definiciones |
| GET | `/api/pesv/indicators/sheets` | Listar |
| POST | `/api/pesv/indicators/sheets` | Crear |
| GET | `/api/pesv/indicators/sheets/{id}` | Consultar detalle |
| PUT | `/api/pesv/indicators/sheets/{id}` | Actualizar |
| DELETE | `/api/pesv/indicators/sheets/{id}` | Eliminar/archivar |
| GET | `/api/pesv/indicators/measurements` | Listar |
| POST | `/api/pesv/indicators/measurements` | Crear |
| GET | `/api/pesv/indicators/measurements/{id}` | Consultar detalle |
| PUT | `/api/pesv/indicators/measurements/{id}` | Actualizar |
| DELETE | `/api/pesv/indicators/measurements/{id}` | Eliminar/archivar |
| POST | `/api/pesv/indicators/measurements/{id}/rectifications` | Rectificar medición |
| GET | `/api/pesv/indicators/measurements/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/indicators/measurements/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/indicators/measurements/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/indicators/measurements/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/indicators/csv-reviews` | Listar |
| POST | `/api/pesv/indicators/csv-reviews` | Crear |
| GET | `/api/pesv/indicators/csv-reviews/{id}` | Consultar detalle |
| PUT | `/api/pesv/indicators/csv-reviews/{id}` | Actualizar |
| DELETE | `/api/pesv/indicators/csv-reviews/{id}` | Eliminar/archivar |
| GET | `/api/pesv/indicators/csv-reviews/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/indicators/csv-reviews/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/indicators/csv-reviews/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/indicators/csv-reviews/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/indicators/annual-reports` | Listar |
| POST | `/api/pesv/indicators/annual-reports` | Crear |
| GET | `/api/pesv/indicators/annual-reports/{id}` | Consultar detalle |
| PUT | `/api/pesv/indicators/annual-reports/{id}` | Actualizar |
| DELETE | `/api/pesv/indicators/annual-reports/{id}` | Eliminar/archivar |
| POST | `/api/pesv/indicators/annual-reports/{id}/presentations` | Registrar presentación |
| GET | `/api/pesv/indicators/annual-reports/{id}/documents` | Listar evidencias |
| POST | `/api/pesv/indicators/annual-reports/{id}/documents` | Cargar evidencia tras crear |
| GET | `/api/pesv/indicators/annual-reports/{id}/documents/{documentId}` | Previsualizar/descargar |
| DELETE | `/api/pesv/indicators/annual-reports/{id}/documents/{documentId}` | Eliminar evidencia |
| GET | `/api/pesv/indicators/annual-reports/{id}/export` | PDF |
| GET | `/api/pesv/indicators/protocol` | Consultar protocolo |
| PUT | `/api/pesv/indicators/protocol` | Actualizar protocolo |

### Convención de listado y detalle

- Los GET de colección aceptan `page` (>=1), `limit` (1..100), `search`, `status`, `year` y filtros propios; responden `{ items, total, page, limit }`.
- Los GET por `id` incluyen relaciones, historial y metadatos de evidencias; 404 si no existe o pertenece a otra empresa.
- Permisos: `PESV_INDICATORS_VIEW`, `PESV_INDICATORS_CREATE`, `PESV_INDICATORS_EDIT`, `PESV_INDICATORS_DELETE`, `PESV_INDICATORS_UPLOAD`, `PESV_INDICATORS_EXPORT` según operación.

### Creación y actualización

Ejemplo mínimo coherente para `/api/pesv/indicators/sheets`:

```json
{
  "indicatorId": "goals",
  "year": "2026",
  "period": "3",
  "loss": "",
  "numerator": 8,
  "denominator": 10,
  "analysis": "80% de cumplimiento",
  "source": "Objetivos PESV"
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

- Level: `Básico`, `Estándar`, `Avanzado`.
- Frequency: `Mensual`, `Trimestral`, `Anual`.
- Formula: `RATE`, `COST`, `DIFFERENCE`, `PERCENTAGE`.
- costMethod: `SUM`, `PRODUCT`.
- Pérdida: Fatalidades, Heridos graves (>30 días), Heridos leves (<=30 días), Choques simples.
- StepResult.status: Sin evaluar, Cumple, No cumple, No aplica.
- 13 definiciones exactas: TSV, SSV, RSVI, GRV, CM, CPlan, EJLC, GVE, ELVL, IDP, CPMVh, CPFSV, Cobertura y NCAC según nivel aplicable.

## H. Reglas de negocio

- Período debe estar cerrado y no futuro.
- Ficha completa: fuente, confiabilidad, responsable, línea base y meta.
- Variables no negativas; cantidades enteras salvo kilómetros.
- Porcentaje: numerador <= denominador.
- Resultado: diferencia N-D; costo suma/producto; tasa N×K/D; porcentaje N/D×100.
- No sobrescribir medición: rectificación con motivo y supersedesId.
- Agregado exige todos los períodos y método homogéneo.
- Revisión trimestral requiere comité/revisores y mediciones al corte.
- Reporte anual conserva snapshot de fuentes y auditoría.

## I. Evidencias y material fotográfico

La evidencia nunca forma parte del POST inicial. Debe asociarse a un registro ya persistido o a una subentidad mediante `targetId`. Registrar nombre original, MIME verificado, tamaño, hash, clave de almacenamiento, descripción, confirmación, actor y UTC. El frontend previsualiza PDF/imágenes y permite descarga/eliminación según estado y permiso.

## J. Relaciones

- Ficha N:1 responsable y N:M actividades plan. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Medición N:1 definición/ficha. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Revisión N:M miembros CSV y mediciones. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.
- Reporte anual agrega todos los módulos fuente. Toda referencia se valida contra la misma empresa; al inactivar el origen se conserva la instantánea histórica.

## K. Seguridad y permisos

- JWT y autorización granular; `companyId` se deriva del token. Evitar IDOR y no revelar registros de otro tenant.
- Validar pertenencia de empleados, documentos y entidades vinculadas; URLs firmadas de corta duración.
- Auditar creación, edición, transición, exportación, carga/consulta/eliminación de evidencia y operaciones sensibles.
- Validar MIME real, extensión, tamaño, malware y nombre; almacenar UTC y presentar `America/Bogota`.

## L. Casos especiales

- Denominador cero produce resultado null.
- Métodos de cálculo diferentes impiden agregado.
- Datos demo de mediciones deben excluirse en producción.
- Fallo de almacenamiento: no dejar metadatos huérfanos; responder 503. Conflicto de versión: 409 con versión vigente.

## M. Criterios de aceptación

- [ ] Calcular cada fórmula exactamente.
- [ ] Rechazar corte futuro y duplicado activo.
- [ ] Rectificar sin borrar original.
- [ ] Detectar períodos faltantes.
- [ ] Generar PDF anual coherente.
- [ ] Un usuario de otra empresa no puede inferir ni consultar datos, relaciones ni archivos.
- [ ] La evidencia solo se habilita después de crear el registro y puede previsualizarse/descargarse con autorización.

## N. Referencias al código

- `app/dashboard/pesv-indicators/page.tsx`.
- `lib/pesv/indicators.ts`.
- `lib/pesv/indicators-pdf.ts`.
- `lib/pesv/standards.ts`.

## Discrepancias y decisiones pendientes

- **DISCREPANCIA:** la persistencia actual es localStorage/datos demo y no ofrece transacciones, control de concurrencia ni aislamiento real.
- **PENDIENTE DE DEFINICIÓN:** Definir fuente oficial para datos automáticos no disponibles en módulos PESV.
- **PROPUESTO:** usar las entidades/endpoints de este contrato y almacenamiento de objetos para archivos.
