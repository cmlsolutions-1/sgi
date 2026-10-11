# Auditoría de formularios para SafeCloud Form Drawer

Fecha: 2026-10-11

## Arquitectura encontrada

- Frontend: Next.js 16 con React 19 y TypeScript.
- Estilos: Tailwind CSS 4, variables corporativas en `app/globals.css` y utilidades `module-dialog-polish` / `record-dialog-polish`.
- Componentes: patrón shadcn/ui sobre primitivas Radix UI. Ya existen `Dialog`, `AlertDialog`, `Sheet`, `Select`, `Popover` y `Calendar`.
- Formularios: combinan componentes reutilizables y formularios locales dentro de páginas. El estado, la validación, la carga y las llamadas a servicios permanecen en cada módulo.
- Portales: `Select`, `Popover` y `Dialog` renderizan contenido en portal. Deben comprobarse z-index, foco y cierre antes de migrar formularios con controles anidados.

## Criterio de clasificación

- **Elegible**: formulario de creación/edición cuyo contenedor puede cambiar sin mover su lógica.
- **Validación dirigida**: elegible, pero contiene adjuntos, calendarios, multiselección, pestañas, tablas internas o diálogos secundarios que requieren pruebas específicas.
- **Excluido**: confirmación, alerta, detalle, vista previa, gestión documental secundaria o acción crítica. Debe conservar `Dialog`/`AlertDialog`.

## Inventario inicial

| Módulo | Archivo principal | Operación | Ventana actual | Componentes especiales / riesgo | Estado |
| --- | --- | --- | --- | --- | --- |
| Medidas de Prevención | `app/dashboard/preventiveMeasures/page.tsx` | Crear y editar | Dialog local | Select con portal, fechas y campos condicionales | **Piloto migrado** |
| Usuarios | `components/dashboard/user-form-dialog.tsx` | Crear y editar | Componente Dialog | Roles, contraseña y validaciones | Elegible |
| Roles | `app/dashboard/roles/page.tsx` | Crear y editar | Dialog local | Matriz de permisos y checkboxes | Validación dirigida |
| Áreas de trabajo | `app/dashboard/work-areas/page.tsx` | Crear y editar | Dialog local | Selectores | Elegible |
| Cargos / puestos | `app/dashboard/jobs/page.tsx` | Crear y editar | Dialog local | Campos extensos; carga y vista previa separadas | Elegible; excluir evidencia/preview |
| Gestión de empleados | `components/dashboard/employee-form-dialog.tsx` | Crear y editar | Componente Dialog | Selectores relacionados | Elegible |
| Hoja de vida | `app/dashboard/employees/[id]/page.tsx` | Crear y editar subregistros | Múltiples Dialog | Fechas, archivos y subformularios | Validación dirigida |
| Novedades laborales | `components/employee/EmployeesManagementPage.tsx` | Crear y editar | Dialog local | Selectores; documentos en diálogo separado | Elegible; excluir documentos |
| Plan de capacitaciones | `app/dashboard/trainingPlan/page.tsx` | Crear y editar | Dialog local | Participantes y selectores | Validación dirigida |
| Formación y certificaciones | `app/dashboard/sst-training-certifications/page.tsx` | Crear y editar | Dialog local | Evidencias y vista previa separadas | Elegible; excluir evidencia/preview |
| ACPM | `app/dashboard/acpm/page.tsx` | Crear y editar | Dialog local | Seguimientos y evidencias secundarias | Elegible; excluir acciones secundarias |
| Objetivos SST | `app/dashboard/sst-objectives/page.tsx` | Crear y editar | Múltiples Dialog | Política, seguimiento y difusión | Validación dirigida |
| Evaluación inicial | `app/dashboard/initial-evaluation/page.tsx` | Crear y editar | Dialog local | Evaluación estructurada | Validación dirigida |
| Rendición de cuentas | `app/dashboard/accountability/page.tsx` | Crear | Dialog local | Documento firmado y preview separados | Elegible; excluir documentos/preview |
| Investigaciones | `app/dashboard/investigations/page.tsx` | Crear y editar | Dialog local | Secciones extensas, fechas, relaciones | Validación dirigida |
| Riesgo especial | `app/dashboard/special-risk/page.tsx` | Crear y editar | Dialog local | Combobox y evidencias separadas | Validación dirigida |
| Custodia | `app/dashboard/custody/page.tsx` | Crear y editar | Dialog local | Evidencias y previews separados | Elegible; excluir evidencia/preview |
| Indicadores SST | `app/dashboard/occupational/page.tsx` | Crear y editar | Dialog local | Evidencias separadas | Validación dirigida |
| Auditorías SST | `app/dashboard/audits/page.tsx` | Crear y editar | Dialog local | Fechas, auditor, archivos y acciones ACPM | Validación dirigida |
| Comunicaciones SST | `app/dashboard/sst-communications/page.tsx` | Crear y editar | Dialog local | Archivos y firma separados | Elegible; excluir evidencia/preview |
| Estilos de vida saludable | `app/dashboard/healthy-lifestyles/page.tsx` | Crear y editar | Dialog local | Evidencias y vista previa | Elegible; excluir evidencia/preview |
| Matriz legal | `app/dashboard/legal-matrix/page.tsx` | Crear y editar | Dialog local | Evidencia y preview separados | Elegible; excluir evidencia/preview |
| Sustancias peligrosas | `app/dashboard/hazardous-substances/page.tsx` | Crear/editar sustancia y programa | Múltiples Dialog | Relaciones, evidencias y preview | Validación dirigida |
| Mediciones ambientales | `app/dashboard/environmental-measurements/page.tsx` | Crear/editar medición y procedimiento | Múltiples Dialog | Evidencia y preview | Validación dirigida |
| Inspecciones | `app/dashboard/inspections/page.tsx` | Crear y editar | Dialog local | Ítems, evidencia y preview | Validación dirigida |
| Mantenimiento preventivo | `app/dashboard/preventive-maintenance/page.tsx` | Crear y editar | Dialog local | Documentos en panel separado | Elegible; excluir documentos |
| Gestión documental | `app/dashboard/documents/_components/CreateDialog.tsx` | Crear | Componente Dialog | Archivos, tipo documental y metadatos | Validación dirigida |
| Gestión documental | `app/dashboard/documents/_components/RenewDialog.tsx` | Renovar | Componente Dialog | Renovación y archivo | Validación dirigida |
| Gestión de comités | `app/dashboard/committee-management/page.tsx` | Crear y editar | Formulario local + documentos | Miembros principales/suplentes | Validación dirigida |
| Reuniones | `app/dashboard/meetings/page.tsx` | Crear y editar | Formulario local + documentos | Asistentes y actas | Validación dirigida |
| Gestión de emergencias | `app/dashboard/emergency-management/page.tsx` | Crear y editar | Dialog local | Documentos separados | Elegible; excluir documentos |
| Brigada de emergencias | `app/dashboard/emergency-brigades/page.tsx` | Crear y editar | Dialog local | Miembros y documentos separados | Validación dirigida |
| Insumos de higiene | `app/dashboard/hygiene-supplies/page.tsx` | Crear y editar | Dialog local | Documentos separados | Elegible; excluir documentos |
| Servicios de higiene | `app/dashboard/hygiene-services/page.tsx` | Crear/editar evidencia y programa | Múltiples Dialog | Archivos y preview | Validación dirigida |
| Saneamiento | `app/dashboard/sanitation/page.tsx` | Crear y editar | Dialog local | Documentos separados | Elegible; excluir documentos |
| Control de plagas | `app/dashboard/pest-control/page.tsx` | Crear y editar | Dialog local | Fechas, proveedor y documentos | Elegible; excluir documentos |
| Manejo de residuos | `app/dashboard/waste-management/page.tsx` | Crear/editar evidencia y programa | Múltiples Dialog | Archivos y preview | Validación dirigida |
| Plan de trabajo | `app/dashboard/work-plan/page.tsx` | Crear actividad | Dialog local | Archivo firmado, detalle y preview separados | Elegible; excluir detalle/archivos |
| Seguridad social | `components/dashboard/SocialSecurityFormDialog.tsx` | Crear y editar | Componente Dialog | Entidades, fechas y adjuntos | Validación dirigida |
| Ausentismo / evaluaciones médicas | `components/employee/AbsenteeismTab.tsx`, `components/employee/MedicalEvaluationTab.tsx` | Crear y editar | Dialog local | Fechas y datos médicos | Validación dirigida |
| PESV | `app/dashboard/pesv-*.tsx`, `components/pesv/planning-module.tsx` | Crear, editar y seguimiento | Múltiples Dialog | Evidencias, revisiones y confirmaciones | Validación dirigida |
| Superadministración | `components/manager/super-admin/dialogs/*.tsx` | Crear y editar | Componentes Dialog | Permisos y credenciales | Fuera del piloto; revisión de alcance |

## Diálogos excluidos de la migración automática

- Confirmaciones de eliminación y acciones críticas, incluidos `AlertDialog` y `window.confirm` existentes.
- Vistas de detalle y vistas previas de archivos.
- Carga, descarga y administración de evidencias/documentos cuando son flujos secundarios independientes.
- Perfil de usuario, notificaciones, menús de comando y gestión de módulos.

## Piloto: conservación funcional verificada en código

El formulario de Medidas de Prevención conserva, en el mismo orden, origen, acción, procedimiento condicional, riesgo condicional, título, descripción, jerarquía, tipo, estado, fecha límite condicional y fecha de cumplimiento condicional. También conserva `openCreateModal`, `openEditModal`, `resetModal`, `saveMeasure`, `buildPayload`, los mismos servicios, mensajes, condiciones, acciones y estados de carga.

## Riesgos para la extensión progresiva

- Los formularios anchos con tablas internas pueden necesitar una variante documentada, sin cambiar el ancho estándar por módulo de forma arbitraria.
- Los diálogos secundarios abiertos desde un Drawer requieren pruebas de foco, z-index y cierre independiente.
- Los selectores con portal deben probarse con teclado y en móvil.
- Los flujos con archivo requieren comprobar que el teclado, el selector nativo y el pie fijo no bloqueen acciones.
- La extensión debe hacerse por lotes pequeños con verificación de crear, editar, cancelar, errores y recarga de listas.

## Resultado de la migración global

### Componente compartido

- `components/ui/safecloud-form-drawer.tsx` es la única superficie Drawer para formularios.
- Expone una composición estándar, un frame para formularios existentes y un adaptador para conservar formularios heredados sin reconstruirlos.
- El ancho de escritorio permanece en 540 px, ocupa toda la pantalla en móvil y centraliza encabezado, scroll, pie, cierre, foco y animación.
- `components/ui/sheet.tsx` solo recibió opciones aditivas para la etiqueta y posición accesible del botón de cierre.

### Formularios migrados

- Organización y personas: usuarios, roles, áreas, cargos, funcionarios, hoja de vida, seguridad social, ausentismo, evaluaciones médicas y novedades laborales.
- Planeación y SST: capacitaciones, formación y certificaciones, ACPM y seguimientos, objetivos/política/seguimiento/divulgación, rendición de cuentas, investigaciones, riesgo especial, custodia, auditorías y acciones ACPM, comunicaciones, estilos de vida saludable, matriz legal, sustancias/programas, mediciones/procedimientos, inspecciones, mantenimiento, cuadro de riesgos y plan de trabajo.
- Gestión operativa: documentación y renovación, comités, reuniones, emergencias, brigadas, insumos y servicios de higiene, saneamiento, control de plagas y manejo de residuos.
- PESV: responsable, comité y revisiones trimestrales, diagnóstico, liderazgo, política, riesgos y seguimientos; además, todos los módulos basados en `planning-module` y los formularios especializados de indicadores e investigaciones viales.
- Superadministración: crear/editar empresa, crear/editar usuario, editar administrador y crear rol.

### Formularios conservados como Modal/Dialog

- Confirmaciones de eliminación, advertencias, vistas de detalle y previsualizaciones.
- Carga y gestión puntual de documentos o evidencias cuando constituyen un flujo secundario independiente.
- Cambio de contraseña y gestión de módulos en superadministración por ser acciones sensibles sobre credenciales y permisos.
- Evaluación Inicial: migrada al Drawer estándar. La tabla editable conserva su ancho funcional de `min-w-[1280px]` dentro de una región con desplazamiento horizontal independiente, sin eliminar ni reorganizar columnas.
- Notificaciones, búsqueda/comandos y otros diálogos que no son formularios de creación o edición.

### Verificación técnica

- Compilación de producción ejecutada con `npm run build`: correcta, 78 rutas generadas.
- No se modificaron archivos de servicios, tipos, contratos de API, backend ni base de datos como parte de la migración.
- Los handlers, estados, validaciones, campos, orden, opciones y acciones permanecen en sus componentes propietarios; solo cambió el contenedor de presentación.
- La verificación funcional conectada al backend y la interacción manual con selectores nativos de archivo requieren un entorno autenticado con datos reales.
