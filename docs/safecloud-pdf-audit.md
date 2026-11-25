# Auditoría del sistema documental PDF de SafeCloud

Fecha de revisión: 14 de octubre de 2026.

## Alcance

La auditoría cubre los documentos PDF generados por SafeCloud en el frontend y en el backend. Los archivos cargados por el usuario, las evidencias importadas y sus mecanismos de descarga o previsualización quedan fuera de la transformación corporativa y conservan sus bytes originales.

## Tecnologías identificadas

- Frontend: `jspdf`, `jspdf-autotable` y `pdf-lib`.
- Backend: generadores PDF propios basados en streams PDF y utilidades compartidas del módulo `common/pdf`.
- Plantilla visual de referencia: `public/safecloud-corporate-template.pdf`.
- Activos corporativos: logo SafeCloud en `public/logoCompletoSinfondo.png`.

## Arquitectura final

- `lib/pdf/safecloud-pdf-style.ts`: tokens, tipografía, márgenes, tablas, secciones, notas, metadatos, firmas y evidencias fotográficas para documentos creados con jsPDF.
- `lib/pdf/safecloud-corporate-pdf.ts`: envoltura final obligatoria de las exportaciones generadas por el sistema. Resuelve empresa y NIT, normaliza carta vertical u horizontal, incorpora encabezado, control documental, pie y paginación total.
- `src/modules/common/pdf/safecloud-content-pdf.ts` en el backend: composición común de contenido textual con jerarquía tipográfica, saltos de página y caracteres latinos.

El encabezado y el pie se dibujan de forma determinista en cada página siguiendo la plantilla suministrada. Esto evita colisiones de recursos al incrustar repetidamente una página PDF como fondo y conserva el diseño en documentos multipágina.

## Generadores frontend cubiertos

- Reportes compartidos y procesamiento de datos.
- Ausentismo y evaluaciones médico-ocupacionales.
- Designación del responsable SGI.
- Documentos de asignación y procedimientos preventivos.
- Plan de trabajo, ACPM y actas de capacitación.
- PESV: responsable, comité, política, liderazgo, diagnóstico, riesgos, investigaciones, indicadores y módulos de planificación.
- Rendición de cuentas, custodia, estadísticas de empleados, evaluación inicial, auditorías, comunicaciones, indicadores SST, sustancias peligrosas, mediciones ambientales, inspecciones, servicios de higiene, estilos de vida saludable y manejo de residuos.

Todas las descargas anteriores pasan por `saveCorporatePdf` o `downloadCorporatePdfBlob`. No se localizaron llamadas productivas directas a `jsPDF.save()` fuera de la envoltura global.

## Generadores backend estandarizados

- Rendición de cuentas.
- Custodia.
- Estadísticas y análisis de empleados.
- Mediciones ambientales.
- Sustancias peligrosas.
- Estilos de vida saludable.
- Servicios de higiene.
- Evaluación inicial.
- Inspecciones.
- Auditorías SST.
- Indicadores SST.
- Manejo de residuos.
- Plan de trabajo.

Estos servicios reutilizan `buildSafeCloudContentPdf`. Se conservaron sus contratos HTTP, datos, cálculos y nombres de archivo.

## Formatos especiales conservados

- Comunicación SST: mantiene su generador especializado porque incrusta fotografías JPEG/PNG y controla su distribución. La descarga final recibe igualmente la envoltura corporativa global.
- Certificado de consentimiento de tratamiento de datos: mantiene su composición especializada por su carácter criptográfico y de integridad documental.
- Documentos horizontales y matrices extensas: conservan orientación horizontal y reciben una variante del mismo encabezado y pie, sin reducir arbitrariamente columnas ni contenido.
- Fotografías, firmas y clasificaciones cromáticas: mantienen su significado funcional. Las imágenes conservan proporción y las firmas no se inventan.

## Control documental

- Empresa y NIT se resuelven desde la sesión, empresa actual, `companyId` del token o consulta por empresa disponible.
- Código, versión y fecha usan únicamente valores existentes. En ausencia de código o versión se presenta `-`.
- La fecha de generación se diferencia de una fecha documental suministrada.
- La paginación usa el total real de páginas.
- Los metadatos del archivo incluyen título, autor, asunto, creador, productor y fechas de creación/modificación.

## Validación visual ejecutada

Se generaron y renderizaron documentos controlados para comprobar:

1. Documento vertical corto y multipágina.
2. Tabla extensa con encabezado repetido y texto largo en celdas.
3. Evidencia fotográfica sin deformación y con descripción.
4. Bloques de firma sin aprobaciones inventadas.
5. Matriz horizontal de ocho columnas.
6. Nombre empresarial y nombre documental extensos.
7. Tildes, eñes y caracteres especiales.
8. Estados con color semántico.
9. Encabezado, pie y paginación en primera, intermedia y última página.

Los PDF de control fueron carta vertical de 9 páginas y carta horizontal de 3 páginas. La revisión visual confirmó márgenes, continuidad de tablas, legibilidad, ausencia de superposiciones y consistencia del encabezado y pie.

## Límites deliberados

- La estandarización visual no implica certificación ISO 9001 ni validación automática de cumplimiento normativo.
- No se inventan códigos documentales, versiones, responsables, aprobaciones o firmas.
- No se transforman documentos subidos por usuarios.
- No se alteran APIs, reglas de negocio, modelos, cálculos, permisos ni relaciones de datos.
