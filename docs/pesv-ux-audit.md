# Auditoría UX/UI del módulo PESV

Fecha: 2026-10-12

## Alcance inspeccionado

- Rutas `app/dashboard/pesv-*/page.tsx`.
- Navegación en `components/dashboard/navigation.tsx`.
- Plantilla compartida `components/pesv/planning-module.tsx`.
- Configuración y reglas en `lib/pesv/planning.ts`, `lib/pesv/operations.ts`, `lib/pesv/assurance.ts`, `lib/pesv/indicators.ts` y `lib/pesv/road-investigations.ts`.
- Componentes globales de SafeCloud disponibles para reutilización.

No se modificó lógica ni interfaz durante esta auditoría.

## Resultado general

El repositorio contiene **23 rutas PESV**. La estructura normativa representa 24 pasos, pero los pasos 16 y 17 comparten la ruta de inspección y mantenimiento de vehículos.

- 15 rutas utilizan `PesvPlanningModule`, una plantilla genérica basada en configuración.
- 8 rutas tienen implementaciones especializadas.
- No existe una ruta padre `/dashboard/pesv`.
- El bloque PESV del sidebar está actualmente comentado.
- Los registros PESV se conservan principalmente en `localStorage`; funcionarios se consultan mediante el servicio existente y algunos módulos agregan datos mock como contingencia.
- Varios módulos crean automáticamente registros de demostración cuando no existe almacenamiento previo.

## Inventario completo

| Paso | Ruta | Propósito, registros y formularios | Acciones actuales | Datos y contenedor |
|---|---|---|---|---|
| 1 | `/dashboard/pesv-responsible` | Asignación del responsable PESV, rol, responsabilidades y soporte de designación. | Asignar, actualizar y gestionar soporte. | Especializado. Funcionarios por servicio con fallback mock; registro en `localStorage`. Drawer global. |
| 2 | `/dashboard/pesv-committee` | Conformación del CSV, objetivo, visión, alcance, integrantes y revisiones trimestrales. | Crear/editar comité, registrar revisión, cargar evidencia y descargar PDF. | Especializado. Servicio de funcionarios más fallback mock; `localStorage`. Dos Drawers y diálogo de evidencia. |
| 3 | `/dashboard/pesv-policy` | Versiones de política, alcance, compromisos, socialización, accesibilidad y documento firmado. | Crear/editar, ver detalle, cargar/previsualizar evidencia y descargar. | Especializado en `localStorage`. Drawer global y diálogos de evidencia/detalle. |
| 4 | `/dashboard/pesv-leadership` | Compromiso directivo, recursos, gestión y verificación de literales con evidencia. | Crear/editar, consultar, cargar/previsualizar evidencia y descargar. | Especializado en `localStorage`. Drawer global y diálogos. |
| 5 | `/dashboard/pesv-diagnosis` | Diagnóstico organizacional, contratistas, terceros, flota, colaboradores, vehículos, rutas y emergencias. | Crear/editar, consultar, cargar evidencia y revisar perfiles relacionados. | Especializado; inicia con colaboradores, vehículos y rutas mock en `localStorage`. Drawer y vistas de detalle. |
| 6 | `/dashboard/pesv-risks` | Identificación, análisis, valoración, controles, tratamiento y seguimiento de riesgos viales. | Crear/editar, filtrar, ver detalle, seguimiento, evidencia, exportar matriz y eliminar. | Especializado; registro demo inicial en `localStorage`. Drawer principal y de seguimiento; tabla en página. |
| 7 | `/dashboard/pesv-objectives` | Objetivos, alineación con política, indicador, línea base, meta, responsable y plazos. | Crear/editar, seguimiento, revisión anual, divulgación, evidencia, PDF y eliminación. | Plantilla genérica; demo automático y `localStorage`. Drawer global. |
| 8 | `/dashboard/pesv-programs` | Programas de riesgos críticos, objetivos, recursos, actividades y procedimientos condicionales. | Crear/editar, seguimiento, revisión, divulgación, evidencia, PDF y eliminación. | Plantilla genérica; demo automático y `localStorage`. Formulario extenso actualmente en Drawer. |
| 9 | `/dashboard/pesv-work-plan` | Actividades anuales, objetivos/programas relacionados, cronograma, presupuesto, recursos y entregables. | Crear/editar, registrar avance, evidencia, descargar plan y eliminar. | Plantilla genérica; demo automático y `localStorage`. Drawer global. |
| 10 | `/dashboard/pesv-training` | Perfiles de competencia y plan anual de formación, participantes, evaluación y brechas. | Crear/editar, seguimiento, revisión, evidencia, descarga y eliminación. | Plantilla genérica; demos automáticos y `localStorage`. Drawer global. |
| 11 | `/dashboard/pesv-behavior` | Procedimientos de responsabilidad y evaluaciones anuales de comportamiento seguro. | Crear/editar, revisión, divulgación, evidencia, descarga y eliminación. | Plantilla genérica; demos automáticos y `localStorage`. Drawer global. |
| 12 | `/dashboard/pesv-emergencies` | PPRAEV, rutas/riesgos, cadena de llamado, PAS, recursos, formación y simulacros. | Crear/editar planes y simulacros, seguimiento, revisión, divulgación, evidencia y PDF. | Plantilla genérica; demos automáticos y `localStorage`. El plan es demasiado extenso para el Drawer estándar. |
| 13 | `/dashboard/pesv-investigations` | Procedimientos y casos de siniestros; etapas, causas, acciones, seguimiento, eficacia y lecciones. | Reportar/editar, avanzar etapas, cargar evidencia, verificar eficacia, divulgar, cerrar y generar PDF. | Especializado; datos demo automáticos en `localStorage`. Drawers para formularios y modales amplios para detalle. |
| 14 | `/dashboard/pesv-managed-roads` | Protocolos, vías administradas, controles, inspecciones, mantenimiento y siniestros en vías. | CRUD, seguimiento, revisión, divulgación, evidencia, descarga e inventario. | Plantilla genérica; demos automáticos y `localStorage`. Drawer global. |
| 15 | `/dashboard/pesv-journeys` | Procedimientos y planificación de desplazamientos, conductor, ruta, vehículo y controles. | CRUD, seguimiento, revisión, divulgación, evidencia y descarga. | Plantilla genérica; demos automáticos y `localStorage`. Drawer global. |
| 16-17 | `/dashboard/pesv-vehicle-inspections` | Procedimientos, hojas de vida, inspecciones preoperacionales, mantenimiento y reparaciones. | CRUD, seguimiento, revisión, evidencia, descarga e inventario. | Plantilla genérica; demos automáticos y `localStorage`. Drawer global; las listas operativas permanecen en página. |
| 18 | `/dashboard/pesv-change-contractors` | Procedimientos, gestión de cambios, contratistas y verificaciones de requisitos. | CRUD, seguimiento, revisión, divulgación, evidencia y descarga. | Plantilla genérica; demos automáticos y `localStorage`. La verificación extensa requiere más espacio. |
| 19 | `/dashboard/pesv-document-retention` | Procedimientos, registros documentales, conservación y revisiones trimestrales. | CRUD, revisión, evidencia, inventario, previsualización, descarga y eliminación controlada. | Plantilla genérica; demos automáticos y `localStorage`. Drawer más modal amplio de inventario. |
| 20 | `/dashboard/pesv-indicators` | Protocolo, fichas, mediciones, revisiones CSV, autogestión anual y presentación. | Configurar, medir/rectificar, consultar fuentes, evidencias, PDF y reportes. | Especializado; medición demostrativa explícita en `localStorage`. Varios Drawers y modales. |
| 21 | `/dashboard/pesv-statistics` | Registro de siniestros, análisis/conclusiones y matriz de nivel de pérdida. | CRUD, análisis consolidado, evidencia, PDF y relación con investigaciones. | Plantilla genérica; demos automáticos y `localStorage`. Formularios de análisis extensos. |
| 22 | `/dashboard/pesv-audits` | Procedimiento, auditoría anual de 24 pasos y hallazgos con planes de acción. | Planificar/realizar, evaluar pasos, seguimiento, eficacia, evidencia, informe y PDF. | Plantilla genérica; demos automáticos y `localStorage`. La auditoría de 24 pasos no es apta para Drawer estrecho. |
| 23 | `/dashboard/pesv-improvement` | Formato ACPM PESV con origen, causas, acción, recursos y verificación. | Crear/editar, seguimiento, evidencia, descarga; eliminación restringida. | Plantilla genérica; demo automático y `localStorage`. Drawer global. |
| 24 | `/dashboard/pesv-communications` | Mecanismos, comunicaciones trimestrales, participación y respuestas. | CRUD, respuesta, evidencia, seguimiento, descarga y eliminación. | Plantilla genérica; demos automáticos y `localStorage`. Drawer global. |

## Dependencias funcionales observadas

- Responsable alimenta Comité, Auditorías e Indicadores.
- Comité alimenta Investigaciones e Indicadores.
- Política alimenta Objetivos, Plan de trabajo y otros formularios configurables.
- Diagnóstico alimenta Riesgos, Rutas, Vehículos y Desplazamientos.
- Riesgos alimenta Programas, Emergencias y Comunicaciones.
- Objetivos y Programas alimentan el Plan anual.
- Competencias y Formación alimentan Auditorías, Emergencias e Indicadores.
- Investigaciones alimentan Estadísticas, ACPM y Comunicaciones.
- Plan anual recibe acciones desde Investigaciones, Estadísticas, Auditorías y otros módulos.
- Auditorías alimentan Hallazgos y ACPM.
- Archivo documental consolida evidencias de las demás rutas PESV.

## Diagnóstico UX/UI

### Problemas críticos

1. **No existe puerta de entrada:** no hay módulo padre y la configuración del sidebar PESV está comentada.
2. **Navegación plana:** 23 rutas carecen de agrupación, breadcrumbs y regreso consistente a PESV.
3. **Demostración poco distinguible:** varios módulos crean registros demo automáticamente; fuera de Indicadores, no siempre se identifican claramente como demostración.
4. **Formularios complejos forzados al Drawer:** Auditoría de 24 pasos, PPRAEV, Programas y Autogestión anual necesitan un espacio de trabajo amplio.
5. **Plantilla genérica densa:** tabs, métricas en texto, filtros y tabla compiten visualmente sin una jerarquía clara.

### Problemas relevantes

- Estados vacíos genéricos como "Sin registros para mostrar" no explican propósito ni siguiente acción.
- Los módulos especializados y los genéricos no comparten encabezado, breadcrumbs ni estructura de resumen.
- Dependencias entre módulos aparecen únicamente cuando falta una referencia y como enlaces de texto aislados.
- Tablas anchas dependen del scroll horizontal y no ofrecen una lectura alternativa en móvil.
- `FormDrawer` sí reutiliza `SafeCloudFormDrawerFrame`, pero su encabezado no incluye la misma orientación contextual de otros formularios de SafeCloud.
- Los detalles, cargas de evidencia y confirmaciones comparten un `Modal` genérico; deben conservar su semántica, pero mejorar jerarquía según el tipo de acción.
- La mezcla de API de funcionarios, `localStorage`, blobs y fallback mock no es visible para el usuario final.

## Propuesta para el módulo padre

Crear `/dashboard/pesv` como una capa de orientación, sin mover ni renombrar las rutas existentes.

### Estructura propuesta

1. Encabezado PESV con descripción breve y acceso a ayuda contextual.
2. Aviso persistente cuando existan datos de demostración, sin mezclarlos con registros reales.
3. Inicio guiado basado únicamente en existencia real de registros: Responsable, Comité, Política y Diagnóstico.
4. Navegación agrupada por la estructura existente:
   - **Gobierno y dirección:** pasos 1 a 4.
   - **Planificación:** pasos 5 a 10.
   - **Gestión operacional:** pasos 11 a 19.
   - **Verificación y mejora:** pasos 20 a 24.
5. Tarjetas de acceso con número de paso, propósito, ruta y estado verificable: sin registros, con registros o demostración.
6. Actividades pendientes solo cuando las reglas existentes puedan determinarlas: fechas vencidas, evidencia faltante o seguimiento pendiente.
7. Búsqueda de submódulos por nombre y propósito.
8. Breadcrumbs en cada ruta: `PESV / Grupo / Submódulo`.

No se proponen porcentajes globales ni cumplimiento normativo calculado por supuestos.

## Componentes globales reutilizables

- `SafeCloudFormDrawerFrame` y `SafeCloudFormDrawer` para formularios breves.
- `KpiStrip` y `KpiCard` únicamente para datos reales y verificables.
- `FormDialogIcon`, `FormSectionTitle`, `DetailDialogHeading` y secciones de detalle.
- `Breadcrumb` para navegación contextual.
- `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle` y `EmptyDescription` para estados vacíos.
- `Card`, `Badge`, `Tabs`, `DropdownMenu`, `AlertDialog`, `Button`, `Input`, `Select` y `toast`.
- Estilos existentes `record-detail-dialog`, `record-detail-body` y tokens de `globals.css`.

Se recomienda crear un catálogo central de metadatos PESV con ruta, paso, grupo, descripción e icono. No debe contener reglas de negocio ni duplicar configuraciones de formularios.

## Elegibilidad de formularios

### Mantener en Drawer global

- Responsable PESV.
- Comité y revisión trimestral.
- Política y liderazgo.
- Datos generales del diagnóstico.
- Riesgo vial y seguimiento.
- Objetivos, actividades del plan, competencias y formación.
- Procedimientos, evaluaciones, simulacros y registros operativos breves.
- Hallazgos, ACPM, mecanismos, comunicaciones y respuestas.
- Fichas, mediciones, revisiones y presentación de indicadores.

### Usar espacio de trabajo amplio

- Auditoría anual con evaluación de 24 pasos.
- Reporte anual de autogestión con filas y resumen de 24 pasos.
- Plan completo de emergencias PPRAEV.
- Programa de riesgo crítico cuando despliegue todas sus secciones condicionales y actividades.
- Investigación de siniestros durante diligenciamiento por etapas, acciones y eficacia.
- Análisis estadístico consolidado cuando incluya el corte guardado y relaciones.
- Verificación extensa de contratistas cuando se muestren todos los requisitos.

### Mantener como Modal/Dialog

- Confirmaciones de eliminación.
- Carga puntual y previsualización de evidencias.
- Advertencias y acciones críticas.
- Detalles breves sin edición.

## Submódulo piloto recomendado

**Riesgos Viales** (`/dashboard/pesv-risks`).

Razones:

- Es una implementación especializada y permite cambios aislados sin alterar las otras 15 rutas que usan `PesvPlanningModule`.
- Contiene encabezado, filtros, tabla, estados, Drawer de creación/edición, seguimiento, evidencia, detalle y estado vacío.
- Tiene una dependencia real con Diagnóstico y alimenta Programas y Emergencias.
- Permite validar escritorio y móvil con un flujo representativo antes de intervenir la plantilla compartida.

El piloto debe conservar la matriz, puntuaciones, estados, validaciones y almacenamiento existentes.

## Plan de implementación propuesto

1. **Fase 2 - Módulo padre:** crear catálogo de navegación, ruta `/dashboard/pesv`, grupos, búsqueda, estados verificables, aviso demo y entrada en sidebar.
2. **Fase 3 - Piloto Riesgos:** agregar breadcrumb y encabezado común, ordenar filtros, tabla y estado vacío, y armonizar Drawers/detalles sin tocar lógica.
3. **Fase 4 - Validación:** build, revisión responsive, navegación, persistencia local, creación/edición, seguimientos, evidencia y dependencias con Diagnóstico.
4. **Aprobación:** revisar módulo padre y piloto con el usuario.
5. **Fase 5 - Extensión:** primero las 7 rutas especializadas restantes; después la plantilla genérica por grupos, con pruebas de regresión por cada conjunto.

## Riesgos técnicos a controlar

- Activar el sidebar sin respetar permisos o códigos de módulos existentes.
- Confundir registros autogenerados con datos empresariales.
- Alterar todas las rutas genéricas al modificar `PesvPlanningModule` durante el piloto.
- Perder blobs de evidencia almacenados en memoria al recargar.
- Introducir indicadores globales sin una fuente verificable.
- Forzar formularios normativos extensos dentro del Drawer estándar.
- Romper relaciones almacenadas por identificador entre módulos.

## Criterio de avance

La siguiente implementación debe limitarse al módulo padre y al piloto de Riesgos Viales. Los demás submódulos permanecerán sin cambios hasta recibir aprobación.
