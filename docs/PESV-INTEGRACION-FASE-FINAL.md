# PESV: integración de la fase final

Verificación: Swagger local y código backend disponible el 18 de noviembre de 2026. No se escribieron datos reales durante las pruebas.

## Recursos conectados

| Código | Recursos bajo /api/pesv |
|---|---|
| PESV_JOURNEYS | journeys/journey-procedures, journeys/journeys |
| PESV_VEHICLE_INSPECTIONS | vehicle-inspections/inspection-procedures, vehicle-profiles, vehicle-inspections, vehicle-maintenance |
| PESV_CHANGE_CONTRACTORS | change-contractors/change-procedures, changes, contractors, contractor-checks |
| PESV_DOCUMENT_RETENTION | document-retention/archive-procedures, archive-records, archive-reviews |
| PESV_STATISTICS | statistics/statistical-events, statistical-analyses, loss-matrices |
| PESV_AUDITS | audits/audit-procedures, audits, audit-findings |
| PESV_INDICATORS | indicators/protocol, sheets, measurements, csv-reviews, annual-reports |

Las pantallas y acciones existentes se conservan. No usan registros de demostración ni persistencia local. Cada hijo exige su código habilitado; no se habilitan los hijos por tener el padre PESV.

- CRUD con control de concurrencia: `recordVersion` en los módulos generales; `version` en las entidades de Indicadores. La versión documental visible sigue siendo independiente.
- Carga multipart posterior al alta, tipología específica de cada módulo, evidencia de registros hijos por `targetId`, preview y descarga autenticados.
- Se traducen las claves de las listas de chequeo sin cambiar los campos visibles. Por ejemplo, `check_registration` se envía como `check_transitLicense`.
- Los cálculos y snapshots de Estadísticas llegan del servidor; los campos calculados no se envían como datos editables.
- El inventario de Archivo consulta las fuentes remotas habilitadas. No incorpora archivos de mocks antiguos.

## Pendientes bloqueantes en Indicadores

Reverificado contra el código backend disponible el 25 de noviembre de 2026: 3 definiciones compatibles y 11 pendientes de alineación. La integración no debe considerarse completa hasta resolver los puntos siguientes.

**No se deben guardar mediciones con definiciones distintas a las que ve el usuario.** El frontend verifica el catálogo remoto antes de escribir y no sustituye fórmulas, frecuencias ni significados silenciosamente. Los códigos mantienen la correspondencia con el contrato entregado, no con una definición de otra métrica que casualmente tenga igual fórmula.

| Código | Pantalla/contrato actual | Diferencia encontrada en backend |
|---|---|---|
| TSV | Tasa por pérdida, trimestral, RATE, todos los niveles | Mensual, sin separación por pérdida |
| SSV | Costos por pérdida, trimestral, COST, estándar/avanzado | Severidad, mensual, RATE, todos los niveles |
| RSVI | Identificación de riesgos, anual, diferencia cierre menos inicio | Intervención, trimestral, porcentaje |
| GRV | Variación de riesgos altos, anual, diferencia | Cumplimiento de controles, trimestral, porcentaje |
| CM | Cumplimiento de metas, trimestral, porcentaje | Costos de movilidad, mensual, COST |
| CPlan | Ejecución del plan, trimestral, porcentaje | Compatible en los metadatos verificados |
| EJLC | Exceso de jornada, mensual, porcentaje | Jornadas controladas, trimestral |
| GVE | Cobertura del programa de velocidad, mensual, estándar/avanzado | Gestión general de vehículos, todos los niveles |
| ELVL | Excesos de velocidad, mensual, avanzado | Evaluación legal, anual, todos los niveles |
| IDP | Inspección diaria, mensual, porcentaje | Compatible en los metadatos verificados |
| CPMVh | Mantenimiento preventivo, trimestral | Mensual |
| CPFSV | Cumplimiento de formación, trimestral, porcentaje | Compatible en los metadatos verificados |
| Cobertura | Cobertura de formación, trimestral acumulada | Anual |
| NCAC | Cierre de no conformidades, anual, porcentaje, todos los niveles | Diferencia, estándar/avanzado |

Solicitar al backend alinear `GET /api/pesv/indicators/definitions`, el cálculo y los cortes con **contractPESV/Indicadores y autogestión.md**. Revisar también que completitud trimestral incluya todos los niveles de pérdida, no solo una medición por período.

Otros ajustes necesarios para mantener las acciones actuales:

1. **Protocolo:** faltan los endpoints documentales del protocolo. El botón existente informa esta limitación; no se carga su archivo en otro recurso.
2. **Versiones del reporte anual:** actualmente existe una restricción única por empresa/año y POST rechaza la segunda versión. Agregar versionado inmutable o una ruta de nueva versión con su contrato. No sustituir un reporte anterior mediante PUT cuando el usuario eligió crear otra versión.
3. **Fichas sin actividades específicas:** el DTO exige al menos un `workActivityId`. La pantalla permite no vincular actividades. Confirmar si debe admitirse `[]`; mientras tanto el frontend muestra la exigencia real del servidor.
4. **Snapshots:** las mediciones backend solo incluyen ID, nombre y versión de la ficha; el reporte anual solo incluye referencias y resultados mínimos. Para una representación estructurada compartida, devolver snapshots completos de ficha, mediciones, revisiones, objetivos y programas.
5. **Borradores de autogestión:** la pantalla existente permite generar un reporte con pendientes y lo identifica como borrador. La API exige año cerrado, mediciones completas y observaciones no vacías de los pasos. Confirmar cómo persistir esos borradores sin relajar la validación de una presentación definitiva.
6. **PDF anual:** existe `GET annual-reports/:id/export`, pero su generador imprime `rows.value` literalmente, incluidos los snapshots JSON. Para conservar el documento legible existente, el frontend sigue generando su PDF con los registros obtenidos de la API. Esto no usa mocks ni persistencia local. Antes de reemplazarlo por la exportación del servidor, esta debe interpretar las secciones y conservar el contenido y presentación del informe.

### Retiro de datos locales en Indicadores

- Se eliminaron el generador de mediciones de demostración, el protocolo precargado y los lectores locales de reportes e inventarios.
- Las sugerencias de variables requieren fuentes remotas explícitas; no existe alternativa que consulte datos guardados en el navegador.
- El reporte anual toma copias independientes de los registros remotos para conservar el corte histórico. El ID y la fecha de creación definitivos los devuelve el backend.
- Se conservaron las pantallas, botones, acciones, fórmulas y PDFs existentes. Las limitaciones documentadas no se suplen con registros ficticios ni archivos locales.

## Adaptaciones reversibles de datos existentes

Estas adaptaciones usan campos admitidos por los DTO; no crean almacenamiento local:

- `measurementProtocol` contiene JSON versionado `{ safecloudProtocol: 1, fields }` con los campos del formulario de protocolo. Un texto plano previo se presenta en Recolección sin perderlo.
- `sourceDetails` conserva su texto y una sección delimitada de snapshot de ficha. Permite reabrir una medición con su ficha original. Si una medición antigua no tiene snapshot y la ficha cambió, se informa el problema en lugar de mostrar otra versión como si fuera la original.
- Las secciones del reporte anual se guardan en `rows`: ORGANIZATION, fleet, actors, contractors, fines, RELATED_RECORDS y SNAPSHOT. `value` contiene texto, números o JSON serializado según la sección; los 24 pasos se envían en `steps`.
- La finalidad de soportes AUDIT/SIGNED/RECEIPT se conserva en `description` con prefijo `SafeCloud:purpose:`. No se envían esas palabras como UUID en `targetId`.
- La evidencia de verificación de Auditoría usa un `targetId` de seguimiento real y `description` con la huella SHA-256 de seguimiento, resultado, evaluador, fecha y observaciones. No se reutiliza para verificar otro seguimiento o una conclusión modificada. Una nueva ejecución reinicia la verificación mediante la API y conserva el historial.
- El corte de inventario de Archivo se conserva como sección delimitada de `findings`, dado que el DTO no tiene `inventorySnapshot`.

Se recomienda formalizar estos snapshots y finalidades como propiedades del contrato backend para que otros clientes y el PDF del servidor los interpreten de igual forma.

## Verificación

- Contratos de los 19 tipos de registros generales: campos requeridos, nombres admitidos y versiones.
- Lectura de checklists anidados, asociaciones documentales y rechazo previo de definiciones de indicador incompatibles.
- Pruebas de navegación por permisos y ausencia de dependencia de mocks en Indicadores.
- Pruebas de escritorio/móvil con respuestas de API aisladas, sin altas en la base real.
