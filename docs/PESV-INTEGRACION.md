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
