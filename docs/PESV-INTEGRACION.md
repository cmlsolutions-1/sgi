# PESV: submodulos integrados

Se sustituyo la persistencia mock de los siguientes modulos por la API del backend.
Las rutas, tipos documentales y versiones de concurrencia se contrastaron con
`http://localhost:3000/docs-json` el 28 de octubre de 2026 (solo lectura).

| Modulo | Codigo | Recurso |
|---|---|---|
| Responsable PESV | PESV_RESPONSIBLE | /api/pesv/responsible |
| Comite de Seguridad Vial | PESV_COMMITTEE | /api/pesv/committee |
| Politica de Seguridad Vial | PESV_POLICY | /api/pesv/policies |
| Liderazgo Directivo | PESV_LEADERSHIP | /api/pesv/leadership |
| Diagnostico PESV | PESV_DIAGNOSIS | /api/pesv/diagnoses |
| Objetivos y metas | PESV_OBJECTIVES | /api/pesv/objectives/objectives |
| Programas de riesgos criticos | PESV_PROGRAMS | /api/pesv/programs/programs |
| Plan anual de trabajo | PESV_WORK_PLAN | /api/pesv/work-plan/work-activities |
| Riesgos viales | PESV_RISKS | /api/pesv/road-risks |
| Competencia y formacion | PESV_TRAINING | /api/pesv/training/competencies y training-activities |
| Comportamiento seguro | PESV_BEHAVIOR | /api/pesv/behavior/procedures y behavior-evaluations |

Las cinco ultimas integraciones se contrastaron con el OpenAPI local el 29 de
octubre de 2026. Conservan sus pestañas y procesos; los catalogos relacionales se
recuperan de los endpoints del propio modulo. Comportamiento seguro mantiene la
version documental `version` separada del control de concurrencia `recordVersion`.
Los seguimientos del plan de trabajo envian el avance porcentual tanto en
`progress` como en `measuredValue`, obligatorios en su DTO.

### Pendiente del backend: presupuesto del cronograma

El frontend conserva el presupuesto por actividad de los programas. El OpenAPI
actual no incluye `budget` en `PesvProgramActivityInputDto` ni en
`PesvProgramActivityResponseDto`. Se necesita agregarlo como numero COP >= 0,
persistirlo y devolverlo en POST/PUT/GET, historial y PDF. No es el presupuesto
total del programa.

Hasta que se publique ese ajuste, el frontend impide guardar cronogramas con
presupuestos individuales distintos de cero para no perder el dato silenciosamente.
El resto de integraciones no depende de ese ajuste. El selector de responsable del
cronograma conserva nombre visible y envia el `responsibleId` del catalogo.

- Servicios autenticados mediante `apiFetch`, sin cambios al JWT ni a la URL base.
- Listados paginados completos y detalle del servidor; sin respaldo local/demo.
- Designaciones y comites vigentes se consultan con `status=CURRENT`.
- PUT envia `version`; politicas envia `lockVersion`, distinto de su version documental.
- Archivos reales multipart, cargados despues del registro; `type` especifico de cada recurso.
- Documentos asociados a revisiones/entradas mediante `targetId` al cargar y
  `referenceType` / `referenceId` al recuperar. Vista y descarga autenticadas.
- Revisiones trimestrales, seguimientos, revisiones anuales y divulgaciones se
  guardan en sus endpoints, no dentro de objetos locales.
- Exportaciones mediante API; el PDF individual detallado de objetivos conserva
  su generador existente y utiliza exclusivamente los datos recuperados de la API.
- El resto de submodulos conserva su implementacion pendiente, pero no se publica
  en navegacion ni se permite abrir directamente mientras no este integrado.
- El padre PESV agrupa; no concede permisos a hijos. La visibilidad usa los codigos
  entregados por `/api/modules/me`; la API conserva la autoridad final de cada accion.

No se migran automaticamente los registros de localStorage: pueden contener
ejemplos, URLs temporales o informacion sin aislamiento por empresa.

## Verificacion

```sh
node tests/pesv-api.test.cjs
npm run typecheck
npm run build
```

Las pruebas de navegador usan respuestas de contrato aisladas y no modifican
registros del backend real. Para la aceptacion en staging, probar con una empresa
y usuario autorizados: crear, editar, adjuntar, consultar/descargar documentos,
registrar revision/seguimiento, exportar y retirar permisos de cada hijo.
