# Indicadores y autogestión PESV: contrato complementario de ajustes backend

Fecha: 25 de noviembre de 2026.
Módulo: `PESV_INDICATORS`, perteneciente a `PESV`.
Contrato base: [Indicadores y autogestión](./Indicadores%20y%20autogesti%C3%B3n.md).

## 1. Objetivo y alcance

Completar la API de este módulo para conservar los formularios, botones, acciones, fórmulas y documentos actualmente implementados en SafeCloud. No se solicita rediseñar el frontend ni cambiar el significado de los indicadores para adaptarlos a otras métricas.

Este documento complementa el contrato base y precisa las diferencias encontradas al revisar el código backend disponible. Las rutas nuevas se identifican como propuestas: no deben darse por implementadas hasta que backend publique su Swagger y ejemplos.

El frontend ya consulta y guarda mediante API. Se retiraron sus mediciones de demostración y las alternativas de lectura local. No se debe solucionar una operación pendiente guardándola en el navegador o devolviendo información ficticia.

### Aclaraciones sobre el contrato original

- Sus referencias a `localStorage` y mocks describen la etapa anterior, no el estado actual.
- Existen **14 definiciones técnicas**, aunque la numeración funcional llega a 13: los indicadores 3.1 y 3.2 son independientes.
- El ejemplo original de POST de ficha contiene campos de una medición. Debe usarse el ejemplo corregido de la sección 4 de este documento.
- La propiedad `workActivityIds` debe existir como arreglo, pero su contenido puede ser vacío. No todos los indicadores se restringen a actividades específicas.
- Este es un acuerdo técnico de integración basado en el comportamiento del aplicativo. No constituye una certificación de cumplimiento normativo; cualquier cambio metodológico requiere aprobación explícita y no una sustitución silenciosa en backend.

## 2. Entregables prioritarios

1. Alinear catálogo, validaciones, cálculos y agregados de los indicadores.
2. Completar los documentos del protocolo.
3. Permitir borradores y múltiples versiones históricas del reporte anual.
4. Entregar snapshots completos e inmutables.
5. Generar el PDF anual sin imprimir estructuras JSON internas.
6. Migrar datos existentes sin reinterpretar mediciones de otro significado.

## 3. Catálogo de indicadores y cálculo

### 3.1 Respuesta esperada

Mantener `GET /api/pesv/indicators/definitions`. Cada definición debe incluir como mínimo:

```json
{
  "id": "TSV",
  "name": "Reducir la tasa de siniestros por nivel de pérdida",
  "description": "Siniestros del período frente a kilómetros recorridos por toda la flota, separados por gravedad.",
  "frequency": "Trimestral",
  "formula": "RATE",
  "levels": ["Básico", "Estándar", "Avanzado"],
  "requiresLoss": true
}
```

El adaptador también admite `MONTHLY`, `QUARTERLY` y `ANNUAL` como frecuencias. Los niveles actualmente intercambiados son `Básico`, `Estándar` y `Avanzado`; no cambiar sus valores sin coordinar el mapeo.

### 3.2 Definiciones que deben quedar implementadas

Abreviaturas: **Todos** = Básico, Estándar y Avanzado; **E/A** = Estándar y Avanzado. N y D son los dos operandos almacenados como `numerator` y `denominator`; en COST y DIFFERENCE, D no es un divisor.

| Código API | Qué mide | N | D | Fórmula | Frecuencia | Niveles | Por pérdida |
|---|---|---|---|---|---|---|---|
| TSV | Tasa de siniestros | Siniestros del nivel de pérdida | Kilómetros de toda la flota | RATE | Trimestral | Todos | Sí |
| SSV | Costos de siniestros | Costos directos COP | Costos indirectos COP | COST | Trimestral | E/A | Sí |
| RSVI | Variación de riesgos identificados | Cantidad al cierre | Cantidad al inicio | DIFFERENCE | Anual | Todos | No |
| GRV | Variación de riesgos altos | Cantidad al cierre | Cantidad al inicio | DIFFERENCE | Anual | Todos | No |
| CM | Cumplimiento de metas PESV | Metas alcanzadas | Metas definidas | PERCENTAGE | Trimestral | Todos | No |
| CPlan | Cumplimiento del plan anual | Actividades ejecutadas | Actividades programadas | PERCENTAGE | Trimestral | Todos | No |
| EJLC | Exceso de jornada de conductores | Eventos de exceso | Suma de días trabajados | PERCENTAGE | Mensual | Todos | No |
| GVE | Cobertura del programa de velocidad | Vehículos incluidos | Vehículos usados en desplazamientos laborales | PERCENTAGE | Mensual | E/A | No |
| ELVL | Desplazamientos con exceso de velocidad | Desplazamientos con exceso | Total de desplazamientos laborales | PERCENTAGE | Mensual | Avanzado | No |
| IDP | Inspecciones preoperacionales diarias | Vehículos-día inspeccionados | Vehículos-día en operación | PERCENTAGE | Mensual | Todos | No |
| CPMVh | Cumplimiento de mantenimiento preventivo | Mantenimientos ejecutados | Mantenimientos programados | PERCENTAGE | Trimestral | Todos | No |
| CPFSV | Cumplimiento del plan de formación | Capacitaciones ejecutadas | Capacitaciones programadas | PERCENTAGE | Trimestral | Todos | No |
| Cobertura | Cobertura acumulada de formación | Colaboradores únicos capacitados al corte | Total de colaboradores al corte | PERCENTAGE | Trimestral acumulada | Todos | No |
| NCAC | Cierre de no conformidades de auditoría | No conformidades gestionadas y cerradas | No conformidades identificadas y analizadas | PERCENTAGE | Anual | Todos | No |

**Diferencias detectadas:** TSV, SSV, RSVI, GRV, CM, EJLC, GVE, ELVL, CPMVh, Cobertura y NCAC. CPlan, IDP y CPFSV coinciden en los metadatos revisados; sus cálculos también deben probarse.

No basta con cambiar las etiquetas del catálogo. Por ejemplo, `SSV` no debe seguir calculando severidad ni `CM` costos de movilidad después de cambiarles el nombre.

### 3.3 Reglas de cálculo y cortes

- `RATE`: `N * rateConstant / D`; constante inicial 5.000.000, configurable y mayor que cero.
- `PERCENTAGE`: `N / D * 100`.
- `DIFFERENCE`: `N - D`. El resultado puede ser negativo aunque los operandos sean no negativos.
- `COST`: `SUM` calcula `N + D`; `PRODUCT` calcula `N * D`. Conservar el método configurado y su snapshot. La opción PRODUCT existe como transcripción pendiente de validación metodológica: no activarla automáticamente ni presentarla como una decisión normativa resuelta.
- En RATE y PERCENTAGE, D = 0 devuelve `result: null`, no cero, infinito ni error de división.
- Operandos finitos y no negativos. Cantidades enteras; kilómetros y costos admiten decimales. En porcentajes, N no supera D, conforme a la validación actual.
- `period`: mensual 1..12, trimestral 1..4, anual 1.
- Cortes trimestrales: 31 de marzo, 30 de junio, 30 de septiembre y 31 de diciembre. Validar fecha calendario en `America/Bogota`, sin desplazarla por conversión UTC.
- Una medición solo se registra cuando terminó su período. No exigir que un corte anual exista antes del cierre del año.
- Pérdidas intercambiadas: `Fatalidades`, `Heridos graves (más de 30 días)`, `Heridos leves (hasta 30 días)`, `Choques simples`.
- La unicidad activa considera empresa, indicador, año, período y pérdida. Para indicadores sin pérdida, usar una representación canónica vacía o nula.
- Los acumulados de tasas y porcentajes ordinarios se recalculan con sumas de N y D: no promediar porcentajes ni sumar tasas.
- Para Cobertura, cada trimestre ya es acumulado desde enero: usar el último corte, no sumar colaboradores repetidos de varios trimestres.
- No mezclar constantes o métodos incompatibles en un agregado. Una ausencia de datos se informa como faltante, no como cero.
- Para TSV y SSV, la completitud exige cada combinación período/pérdida aplicable, aun cuando una categoría registre cero eventos.

El backend es responsable del resultado definitivo; debe devolverlo y no confiar en un `result` enviado por el cliente.

## 4. Fichas y mediciones

### 4.1 Ficha: ejemplo corregido

`POST /api/pesv/indicators/sheets`:

```json
{
  "indicatorId": "CPlan",
  "year": 2026,
  "name": "Aumentar el cumplimiento del plan anual de trabajo",
  "description": "Actividades ejecutadas frente a las programadas.",
  "sources": "Plan anual de trabajo PESV y soportes de ejecución",
  "sourceReliability": "Actas verificadas por el responsable",
  "baseline": "50",
  "target": "100",
  "responsibleId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "workActivityIds": []
}
```

Admitir `[]`; si contiene IDs, validar su existencia y pertenencia a la misma empresa. Devolver `id`, los campos persistidos y `version` para concurrencia. No confundir el UUID de la ficha con el código `indicatorId`.

### 4.2 Medición y rectificación

Conservar POST de mediciones y `POST /measurements/{id}/rectifications` bajo la misma base del módulo.

- La medición referencia `sheetId` y debe coincidir con indicador y año de su ficha.
- Las rectificaciones requieren `correctionReason` y `version` vigente; crean otro ID con `supersedesId`, sin borrar ni sobrescribir el original.
- Listado y detalle deben permitir reconstruir la cadena. Los cálculos utilizan la revisión vigente, no ambas mediciones.
- La rectificación conserva la definición, ficha y metodología del registro que corrige, además del actor y motivo.
- Una definición incompatible debe producir un error identificable, no transformarse en otra métrica para aceptar el POST.

## 5. Protocolo y documentos pendientes

Mantener `GET/PUT /api/pesv/indicators/protocol`. Devolver el ID persistido y la `version` de concurrencia. La versión documental visible del formulario es distinta de esa versión numérica.

**Rutas nuevas propuestas**, siguiendo el patrón del módulo y sin cambiar la interfaz:

| Método | Ruta | Operación |
|---|---|---|
| GET | `/api/pesv/indicators/protocol/documents` | Listar soportes del protocolo de la empresa |
| POST | `/api/pesv/indicators/protocol/documents` | Cargar soporte posterior al guardado |
| GET | `/api/pesv/indicators/protocol/documents/{documentId}` | Consultar/visualizar/descargar |
| DELETE | `/api/pesv/indicators/protocol/documents/{documentId}` | Eliminar lógicamente con auditoría |

Backend debe confirmar estas rutas en Swagger. Si adopta otra estructura, debe entregar el contrato exacto para adaptar el servicio frontend; no agregar botones nuevos.

- Primero guardar el protocolo y después cargar el archivo. No crear un protocolo ficticio para aceptar evidencias.
- Multipart: `file`, `description`, `isConfirmed` y el `type` real que admita el recurso. Publicar el enum; no reutilizar `DOCUMENT_MANAGEMENT` sin que esté autorizado.
- PDF o imagen, hasta 3 MB como admite actualmente el cliente. Validar archivo real y límites también en servidor.
- Devolver metadatos, nombre original, MIME, tamaño, fecha, actor y referencia segura de acceso. Confirmar la estructura exacta y alinearla con los documentos ya existentes del módulo.
- Mantener autorización en visualización y descarga; no exponer una URL pública permanente como sustituto de permisos.
- Eliminar un soporte no debe borrar el evento histórico de su carga.

## 6. Reporte anual: borradores y versiones

### 6.1 Conservar el POST y el botón existentes

El frontend utiliza `POST /api/pesv/indicators/annual-reports` tanto para el primer reporte como para crear una versión actualizada, con `year`, `level`, `rows` y `steps`.

**Comportamiento requerido:** cada POST aceptado crea un nuevo reporte con ID propio. Sustituir la restricción única empresa/año por una revisión de reporte única dentro de empresa/año, asignada transaccionalmente por el servidor.

Devolver como mínimo:

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "year": 2026,
  "reportRevision": 2,
  "version": 1,
  "previousReportId": "7ccd0007-8b20-4f93-a24e-c8d4174cb2d3",
  "workflowStatus": "DRAFT",
  "createdAt": "2026-11-25T15:00:00.000Z",
  "validationIssues": [
    { "code": "YEAR_NOT_CLOSED", "message": "El año reportado no ha terminado." }
  ]
}
```

Las propiedades `reportRevision`, `previousReportId`, `workflowStatus` y `validationIssues` son **ampliaciones propuestas**, no campos que el frontend ya envíe. `version` permanece como contador de concurrencia, no número de revisión anual. La respuesta completa también incluye el contenido guardado, snapshots, soportes y presentaciones.

No sustituir esta operación por PUT sobre el reporte anterior, ni archivarlo automáticamente para liberar una restricción única. Cada versión conserva sus evidencias, presentación y contenido.

### 6.2 Borrador frente a presentación definitiva

- Permitir persistir un borrador con el contenido válido enviado, aunque el año siga abierto, falten mediciones, haya pasos sin evaluar o falten soportes.
- La condición de borrador se calcula en servidor: no exigir al frontend un nuevo campo obligatorio para el POST actual.
- Seguir rechazando tipos inválidos, cantidades negativas, relaciones de otra empresa o contenido malformado. Borrador no significa omitir seguridad ni validación estructural.
- Devolver pendientes específicos, idealmente con código y referencia al indicador, período, pérdida o paso afectado.
- Admitir creación y descarga del borrador, claramente identificado como tal; no mostrarlo como presentado.
- En `POST /annual-reports/{id}/presentations`, validar cierre del año, completitud de mediciones aplicables, 24 pasos con sus observaciones, revisiones trimestrales y soportes requeridos. Validar también los campos de organización y auditoría exigidos por el formulario.
- Requerir informe de auditoría, documento firmado y soporte de radicación de ese reporte para presentar. No permitir que una evidencia de otra versión satisfaga el requisito.
- Conservar las finalidades `AUDIT`, `SIGNED` y `RECEIPT`. El informe de auditoría actualmente se carga en PDF.
- Después de presentar, mantener el contenido inmutable; una corrección genera otra versión. Registrar fecha de presentación y actor real.
- El 31 de enero del año siguiente se muestra actualmente como referencia. Una presentación posterior debe conservar su fecha y advertencia; no rechazarla solo por ser tardía ni modificar la fecha para ocultar el retraso.

## 7. Snapshots históricos completos

Las referencias mínimas por ID/nombre/versión no permiten reconstruir el documento que vio el usuario. Persistir snapshots al crear cada recurso, no reconstruirlos posteriormente con datos actuales.

| Recurso | Datos que debe congelar |
|---|---|
| Medición | Definición y su versión metodológica, ficha completa, responsable identificado, actividades vinculadas y nombres, nivel PESV, constante y método usados |
| Revisión CSV | Mediciones y revisiones exactas evaluadas, resultados y metodología, identidad de revisores, conclusiones, decisiones y referencias de soportes |
| Reporte anual | Organización, líder, auditoría y 24 pasos, inventarios, mediciones, revisiones CSV, objetivos/programas del año y del siguiente, definiciones y protocolo |

- Mantener los IDs originales y versiones junto al snapshot para trazabilidad.
- Devolver datos estructurados completos en detalle, por ejemplo `sheetSnapshot`, `definitionSnapshot`, `protocolSnapshot` y `sourceSnapshot`; backend debe confirmar el esquema final.
- Una rectificación posterior no cambia un reporte o acta que ya usó la revisión anterior.
- Una persona inactiva o una ficha modificada no elimina su identidad histórica.
- Los metadatos históricos no incluyen URLs firmadas caducables como única forma de encontrar el archivo; la descarga se resuelve con autorización actual y una referencia estable.
- No fabricar valores históricos faltantes con información actual. Identificar registros heredados que no puedan reconstruirse.

## 8. Compatibilidad con los datos que ya guarda el frontend

Actualmente se preserva información adicional en campos admitidos por los DTO. Debe seguir siendo legible durante la transición:

| Campo | Representación actual |
|---|---|
| `measurementProtocol` | JSON `{ "safecloudProtocol": 1, "fields": { ... } }` con nombre, versión visible, responsable, recolección, calidad, análisis y comunicación |
| `sourceDetails` | Texto del usuario seguido de `\n\n--- Ficha SafeCloud ---\n` y JSON de la ficha histórica |
| Reporte `rows` | `ORGANIZATION`, `fleet`, `actors`, `contractors`, `fines`, `RELATED_RECORDS`, `SNAPSHOT` |
| Documento `description` | `SafeCloud:purpose:AUDIT`, `SafeCloud:purpose:SIGNED` o `SafeCloud:purpose:RECEIPT` |

`RELATED_RECORDS` contiene objetivos/programas del año y del siguiente; `SNAPSHOT` contiene mediciones y revisiones completas serializadas. `rows.value` puede contener texto, número o JSON según la sección. No truncar, descartar o convertir estos contenidos indiscriminadamente a número.

Formalizar campos estructurados es recomendable, pero debe hacerse con compatibilidad de lectura y una transición coordinada del adaptador. No eliminar estos formatos antes de migrar los registros y actualizar el frontend. Los textos planos antiguos del protocolo también deben seguir siendo legibles.

## 9. PDF anual

Mantener `GET /api/pesv/indicators/annual-reports/{id}/export`, protegido por el permiso de exportación, con `application/pdf` y nombre de archivo que identifique año y revisión.

El generador actual imprime los valores de las filas literalmente, incluidos snapshots JSON. Debe sustituirse por una interpretación de las secciones que conserve el contenido del documento existente:

- Empresa, NIT, dirección, teléfono, representante, misionalidad y clasificación.
- Líder PESV y auditores, con cargos/correos cuando estén registrados.
- Inventarios de flota, actores viales, contratistas e infracciones.
- Objetivos/metas y programas del año reportado y propuestos para el siguiente.
- Indicadores: nombre comprensible, corte, pérdida si aplica, operandos, fórmula, resultado, unidad, fuente y análisis.
- Resumen de revisiones CSV y evaluación de los 24 pasos.
- Análisis anual, acciones/compromisos y espacio para firmas, según el formato frontend existente.
- Identificación de borrador o presentación, número de revisión, fecha y paginación. Fechas de presentación y soportes cuando existan.

Usar snapshots del reporte solicitado, no las fuentes actuales. No mostrar JSON, marcadores internos ni datos de otra versión. Resolver texto largo y saltos de página sin cortar tablas.

Hasta que esta exportación sea equivalente, el frontend conserva su generador PDF utilizando datos recibidos de la API; eso no es persistencia mock.

## 10. Seguridad, errores y migración

- JWT y permisos existentes `pesv-indicators.*`, según la operación y el esquema real publicado por backend. No introducir un segundo esquema incompatible de permisos solo por este documento.
- Empresa derivada de sesión; validar cada responsable, actividad, ficha, revisor, medición, reporte y archivo dentro del tenant.
- Aplicar reglas en servidor aunque el cliente oculte botones. Auditar actor y UTC de altas, cambios, rectificaciones, documentos, exportación y presentación.
- Mantener `{ ok, message, data, errors, meta }`. Errores de validación con campo y motivo; concurrencia 409; no revelar entidades de otros tenants.
- Migrar índice único anual y asignación de revisiones mediante migración de base de datos. Probar concurrencia de dos POST del mismo año.
- **No renombrar y reinterpretar datos anteriores:** si un registro CM contiene costos de movilidad o SSV una tasa de severidad, no convertirlo en cumplimiento de metas o costos cambiando solo el catálogo.
- Identificar versión metodológica y conservar datos heredados con su significado original. Definir migración/corrección explícita y reportar los registros que requieran revisión manual; no inventar operandos.
- No eliminar datos reales ni sembrar ejemplos para suplir información faltante. Adjuntar guía de migración y recuperación ante fallo.

## 11. Pruebas de aceptación requeridas

- [ ] Las 14 definiciones coinciden con la tabla, incluyendo niveles, pérdidas y frecuencia.
- [ ] RATE con N=2, D=10.000, K=5.000.000 devuelve 1.000.
- [ ] COST con 200 y 50 devuelve 250 en SUM y 10.000 en PRODUCT, conservando el método.
- [ ] DIFFERENCE con cierre=2 e inicio=5 devuelve -3.
- [ ] Porcentaje con N=8 y D=10 devuelve 80; D=0 devuelve null.
- [ ] Dos cortes 1/2 y 9/10 se agregan como 10/12*100, no promedio de porcentajes.
- [ ] Cobertura acumulada 5/10 y 8/10 termina en 80%, no 130%.
- [ ] Faltan mediciones si una pérdida aplicable no tiene registro, aunque existan otras del período.
- [ ] Ficha con `workActivityIds: []` se guarda y se recupera sin exigir asociaciones ficticias.
- [ ] Rectificar conserva el original y usa la versión vigente en cálculos nuevos, sin alterar reportes previos.
- [ ] Cambiar ficha, responsable o protocolo no cambia el detalle de una medición histórica.
- [ ] Protocolo guardado admite cargar, listar, visualizar y eliminar evidencia autorizada.
- [ ] Borrador con pendientes se guarda, se recupera y se descarga; no puede presentarse hasta completar requisitos.
- [ ] Dos reportes del mismo año producen IDs/revisiones distintos y siguen siendo consultables.
- [ ] Evidencias y radicación de una revisión no se transfieren automáticamente a otra.
- [ ] PDF presenta secciones y tablas legibles, sin JSON interno y con el corte histórico correcto.
- [ ] Una fecha calendario no cambia de día por UTC; una presentación tardía conserva su advertencia.
- [ ] Concurrencia devuelve 409; acceso cruzado entre empresas y archivos no autorizados se rechaza.
- [ ] Datos heredados con otro significado no se muestran como indicadores corregidos sin migración explícita.

## 12. Información que backend debe entregar al finalizar

1. Swagger actualizado y ejemplos reales anonimizados de catálogo, protocolo, ficha, medición, rectificación, revisión CSV y reporte anual.
2. Rutas, multipart, enum documental, metadatos y forma de descarga del protocolo.
3. Contrato definitivo de revisión anual, borradores, snapshots y errores de completitud/concurrencia.
4. Migraciones y tratamiento de registros creados con las definiciones anteriores.
5. Evidencia de las pruebas anteriores y un PDF de borrador y otro de reporte listo/presentado.

**Cierre de integración:** frontend revisará los DTO y ajustará únicamente sus adaptadores de datos donde sea necesario. La entrega no requiere modificar la distribución visual ni agregar o retirar acciones al usuario.
