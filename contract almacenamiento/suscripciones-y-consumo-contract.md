# SafeCloud: suscripciones, empleados y almacenamiento compartido

Contrato funcional y técnico para backend. Versión 1.0, 25 de noviembre de 2026.

## 1. Objetivo y estado

Implementar información comercial y consumo real para el panel de Super Usuario Empresarial y para Ajustes de cada empresa.

Actualmente existe un prototipo frontend con datos simulados y persistencia local. **Todas las rutas y propiedades nuevas de este documento son propuestas para implementar**, no endpoints ya confirmados. Backend debe publicar su contrato definitivo antes de conectar el frontend.

### Reglas acordadas con producto

- Un cliente, identificado por un usuario existente, tiene una suscripción compartida entre sus empresas.
- El usuario puede seguir teniendo cualquier cantidad de empresas, como funciona actualmente.
- Puede contratar cantidades combinadas de los tres planes.
- Cada unidad de plan contratada representa una empresa contratada.
- El almacenamiento de todos los planes se suma en una sola bolsa del cliente; no se distribuye en cuotas por empresa.
- El límite de empleados se compara individualmente en cada empresa y cuenta únicamente empleados activos.
- Los empleados inactivos conservan el histórico y sus archivos continúan ocupando espacio.
- Los administradores de cada empresa ven sus empleados y el consumo global de almacenamiento de la suscripción, no los empleados de las demás empresas.
- Las alertas se dirigen a los administradores de cada empresa vinculada.
- **Todos los límites son informativos en esta fase.** Un exceso no bloquea creación de empresas, empleados, importaciones, reactivaciones, cargas, descargas ni acceso al sistema.
- No modificar la activación de módulos, los roles ni la lógica actual de acceso a empresas por registrar o cambiar esta información comercial.

No se implementan pagos, facturación, renovación automática, bloqueo por cuota, activación de empresas por compra ni un sistema nuevo de permisos de módulos.

## 2. Planes y fórmulas

| Código | Nombre | Estándares informados | Empleados activos por empresa | GB aportados a la bolsa |
|---|---|---:|---:|---:|
| PLAN_1 | Plan 1 | 7 | 50 | 3 |
| PLAN_2 | Plan 2 | 21 | 100 | 6 |
| PLAN_3 | Plan 3 | 60 | 250 | 15 |

Los estándares son información del plan; no habilitan ni deshabilitan módulos automáticamente.

Convención: **1 GB = 1.000.000.000 bytes**. No mezclar GB decimales con GiB. Persistir bytes como enteros; no calcular capacidad con números de coma flotante sin normalización.

```text
contractedCompanies = quantity(PLAN_1) + quantity(PLAN_2) + quantity(PLAN_3)
includedBytes = (quantity(PLAN_1)*3 + quantity(PLAN_2)*6 + quantity(PLAN_3)*15) * 1.000.000.000
capacityBytes = includedBytes + extraStorageBytes
usedBytes = suma de bytes contabilizados de todas las empresas de la suscripción
availableBytes = max(capacityBytes - usedBytes, 0)
excessBytes = max(usedBytes - capacityBytes, 0)
employeeExcess = max(activeEmployees - employeeLimit, 0)
```

Ejemplo acordado: **2 planes 1 + 4 planes 3 = 6 empresas contratadas y 66 GB compartidos**. Añadir 10 GB deja 76 GB sin cambiar las seis empresas contratadas ni los límites individuales de empleados.

Una empresa con Plan 1 puede usar 8 GB si la bolsa global lo permite: **no existe un tope individual de 3 GB**.

Si `capacityBytes > 0`, `percentage = usedBytes / capacityBytes * 100`, sin truncar el valor real a 100. La barra visual sí puede saturarse al 100%.

Si no existe capacidad contratada, devolver `percentage: null` y `storageStatus: UNCONFIGURED`. Si existen archivos, conservar `usedBytes` y señalar la falta de configuración. No afirmar que hay espacio ilimitado ni calcular infinito. Esto formaliza el caso de capacidad cero que el prototipo simplifica.

## 3. Modelo persistido

### Subscription

| Campo | Tipo | Regla |
|---|---|---|
| id | UUID | Generado por backend |
| ownerUserId | UUID | Usuario titular existente; relación estable, no identificada exclusivamente por correo |
| quantities | objeto PLAN_1/PLAN_2/PLAN_3 | Enteros >= 0; las claves omitidas no se interpretan ambiguamente |
| extraStorageBytes | entero >= 0 | Capacidad adicional contratada; no modifica planes |
| version | integer | Control de concurrencia |
| createdAt / updatedAt | timestamptz | UTC |
| createdBy / updatedBy | UUID | Actores reales |

Una suscripción vigente por titular en esta fase. El correo y nombre del titular se obtienen de su usuario; no duplicarlos como credenciales editables. Cambiar el correo del usuario no crea otra bolsa ni pierde el historial.

Las cantidades son una fotografía de lo contratado, no un evento de compra. PUT de `extraStorageBytes` sustituye el total adicional, **no lo incrementa cada vez que se reintenta**. Registrar el valor anterior y nuevo en auditoría.

### Asociación informativa de plan por empresa

`CompanyPlanAssignment`: `id`, `subscriptionId`, `companyId`, `planCode: PLAN_1 | PLAN_2 | PLAN_3 | null`, `version`, fechas y actores.

- La pertenencia a la suscripción procede de la relación real existente entre titular y empresas; no inferirla por igualdad de correos, por usuarios invitados o por tener algún rol en una empresa.
- Backend debe identificar y documentar qué relación actual es la titularidad comercial. Tener acceso a una empresa no basta para apropiarse de su almacenamiento.
- Una empresa participa en una sola bolsa a la vez, aunque varios usuarios puedan administrarla.
- Asociar el plan es únicamente asignar el límite de referencia de empleados. No crea la empresa ni modifica su propietario, administradores, estado o módulos.
- Una empresa sin plan se cuenta como registrada y aporta su consumo a la bolsa, pero su `employeeLimit` es null. Mostrar advertencia, no asumir Plan 1 o capacidad ilimitada.
- Diferencias entre cantidades contratadas y empresas registradas/asignadas producen advertencias, no un rechazo de la operación por cuota.
- Una nueva empresa del titular debe incorporarse automáticamente al agregado existente con plan pendiente, sin un paso de activación de suscripción.
- Empresas inactivas siguen contándose como registradas mientras existan y sus archivos sigan conservados. Separar `activeCompanies` si se necesita mostrar ese dato.
- No trasladar empresas entre titulares como efecto de editar un plan. Cualquier traslado real requiere un flujo explícito fuera de esta entrega, con auditoría y traslado atómico del consumo.

### Contadores y auditoría

Los empleados activos/inactivos y bytes consumidos **no son campos comerciales editables**. El backend los calcula a partir de las entidades reales.

Mantener un registro de contabilización de archivos con referencia estable al documento/objeto, empresa, suscripción, tamaño, estado contabilizado, eventos y clave idempotente. La implementación interna puede usar contadores materializados, pero debe poder reconciliarlos con los objetos persistidos.

Historial comercial: entidad afectada, evento, valores anterior/nuevo, actor y UTC. Debe permitir conocer quién cambió cantidades, capacidad adicional o asignación de plan.

## 4. Datos reales de empleados

- Utilizar el estado activo real del modelo Employee, no el número de usuarios de acceso ni los roles.
- Crear/importar un activo aumenta el contador; inactivarlo lo reduce; reactivarlo lo aumenta. Actualizar solo el nombre no altera el contador.
- Una importación parcial cuenta únicamente filas persistidas correctamente. Rollbacks no cuentan.
- Inactivos se informan por separado y conservan su historial.
- No sumar empleados de todas las empresas en Ajustes. Un empleado cuenta en la empresa a la que pertenece su registro; no deduplicar personas entre empresas para aplicar el límite.
- No bloquear operaciones aunque una empresa tenga 52 activos frente a un límite de 50.

## 5. Datos reales de almacenamiento

### Alcance

Contabilizar archivos persistidos de **todos los módulos y flujos de la empresa**, no solo Gestión documental: hojas de vida, historias/soportes autorizados, capacitaciones, incidentes, ACPM, evidencias SST/PESV, importaciones conservadas y cualquier otra carga almacenada.

- Tamaño obtenido por el servidor del archivo realmente almacenado, no de un `size` declarado por el cliente.
- La unidad contabilizada es el objeto persistido: varias referencias al mismo objeto dentro de la suscripción no multiplican sus bytes. Dos copias físicas independientes sí cuentan por separado.
- Si hay deduplicación física compartida entre clientes, mantener atribución lógica independiente por suscripción; nunca restar espacio a otro cliente al borrar una referencia.
- Archivos de empleados/empresas inactivos y versiones antiguas conservadas siguen contando.
- Borrado lógico o traslado a papelera no libera bytes mientras el archivo siga retenido. Solo liberar tras purga física confirmada y sin referencias retenidas.
- Una descarga no aumenta el consumo. Un PDF generado al vuelo tampoco; si se guarda como nuevo archivo persistido, sí cuenta.
- Incluir miniaturas/derivados persistidos atribuibles al cliente y documentar su clasificación. No sumar respaldos de infraestructura, logs ni sobrecarga del proveedor como archivos del cliente.
- Cargas temporales fallidas no se incorporan al contador definitivo; deben limpiarse. Un archivo persistido bajo retención/cuarentena continúa contabilizado mientras se conserve.
- Reemplazar un archivo ajusta el consumo según lo que realmente se conserve: si se retiene el anterior, ambos cuentan.

### Consistencia

- Registrar el consumo al confirmar almacenamiento y metadatos; usar idempotencia para no contar dos veces reintentos o callbacks.
- Coordinar base de datos y storage con compensación/outbox u otro mecanismo fiable. Un fallo no deja consumo fantasma ni archivos permanentes invisibles al contador.
- Manejar cargas y eliminaciones simultáneas sin incrementos perdidos ni contadores negativos.
- Agregar automáticamente el consumo histórico existente, también el de empresas aún sin plan.
- Incorporar reconciliación periódica para detectar y corregir diferencias. No sumar el inventario completo sobre un contador ya poblado.
- Publicar `calculatedAt` y `calculationStatus: READY | RECONCILING | ERROR`. Objetivo propuesto: contador actualizado tras operación confirmada y alertas dentro de cinco minutos; backend debe confirmar su garantía operativa.
- Durante un error no sustituir el consumo por cero. Entregar la última lectura válida con fecha/estado, o un error explícito si no hay lectura válida.

## 6. Endpoints propuestos de superadministrador

Base `/api/admin/subscriptions`. JWT y rol de superadministrador existente. Respetar los permisos reales del proyecto; no crear una alternativa de autorización basada en los límites del plan.

| Método | Ruta | Finalidad |
|---|---|---|
| GET | `/api/admin/subscriptions/plans` | Catálogo fijo con estándares, empleados y bytes por unidad |
| GET | `/api/admin/subscriptions` | Clientes con información comercial y consumo agregado |
| POST | `/api/admin/subscriptions` | Registrar información comercial de un titular existente |
| GET | `/api/admin/subscriptions/{id}` | Detalle comercial y resumen calculado |
| PUT | `/api/admin/subscriptions/{id}` | Sustituir cantidades/capacidad adicional con versión |
| GET | `/api/admin/subscriptions/{id}/companies` | Empresas reales del titular, plan, empleados y consumo |
| PUT | `/api/admin/subscriptions/{id}/companies/{companyId}/plan` | Asociar/cambiar/retirar solo el plan informativo |
| GET | `/api/admin/subscriptions/{id}/history` | Historial paginado de cambios comerciales |

Listados: `page >= 1`, `limit` 1..100, `search` por titular/correo; empresas admite búsqueda y filtro de plan. Responder `{ items, total, page, limit }`. No limitar silenciosamente el conteo a una página.

No se necesita un endpoint público de eliminación de suscripción en esta fase. Las correcciones comerciales se registran con historial; no borrar asociaciones y archivos para poner a cero un consumo.

### Alta comercial

```json
{
  "ownerUserId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "quantities": { "PLAN_1": 2, "PLAN_2": 0, "PLAN_3": 4 },
  "extraStorageBytes": 0
}
```

Devuelve 201 con ID, versión y resumen. Segundo POST para el mismo titular devuelve 409, sin duplicar la bolsa. No crea usuario, empresa, permisos ni credenciales.

### Edición comercial

```json
{
  "quantities": { "PLAN_1": 2, "PLAN_2": 0, "PLAN_3": 4 },
  "extraStorageBytes": 10000000000,
  "version": 1
}
```

Devuelve 200 con `version: 2` y resumen actualizado. Repetir la petición obsoleta devuelve 409, no añade otros 10 GB. Reducir capacidad por debajo del consumo es válido y produce advertencia; no elimina archivos ni bloquea accesos.

### Plan informativo por empresa

```json
{
  "planCode": "PLAN_1",
  "version": 1
}
```

`planCode: null` retira el plan informativo, no retira la empresa de la bolsa ni del usuario. El listado de empresas debe devolver la versión de la asignación; puede ser 0 si todavía no existe, para permitir su primer PUT de manera atómica. Conflicto concurrente: 409.

La empresa debe pertenecer realmente al titular indicado. Rechazar relaciones ajenas aunque la cantidad de planes contratados tenga cupos disponibles.

### Resumen administrativo

El detalle devuelve `id`, `owner: { id, name, email }`, `quantities`, `extraStorageBytes`, `version`, `createdAt`, `updatedAt` y:

```json
{
  "summary": {
    "contractedCompanies": 6,
    "registeredCompanies": 6,
    "activeCompanies": 6,
    "includedBytes": 66000000000,
    "extraStorageBytes": 0,
    "capacityBytes": 66000000000,
    "usedBytes": 54120000000,
    "availableBytes": 11880000000,
    "excessBytes": 0,
    "percentage": 82,
    "threshold": 80,
    "storageStatus": "WARNING",
    "calculatedAt": "2026-11-25T15:00:00.000Z",
    "calculationStatus": "READY"
  },
  "warnings": []
}
```

Cada empresa del listado incluye `companyId`, `name`, estado real, `planCode`, `assignmentVersion`, `standards`, `employeeLimit`, `activeEmployees`, `inactiveEmployees`, `employeeExcess`, `usedBytes` y fecha/estado de cálculo. `employeeLimit` y `standards` son null si no hay plan.

Advertencias comerciales estructuradas, por ejemplo `COMPANY_COUNT_MISMATCH`, `PLAN_ASSIGNMENT_MISMATCH`, `COMPANY_PLAN_MISSING`, `EMPLOYEE_LIMIT_EXCEEDED`, `STORAGE_CAPACITY_MISSING`, con mensaje y referencias necesarias. No son errores HTTP ni impiden guardar por exceso.

## 7. Endpoint de Ajustes del administrador de empresa

**GET `/api/subscriptions/me/consumption`**, JWT y administrador de la empresa activa. Derivar empresa desde la sesión/contexto autenticado existente; no aceptar un `companyId` arbitrario para consultar otra empresa.

Ejemplo de `data` dentro del envoltorio estándar:

```json
{
  "configurationStatus": "CONFIGURED",
  "company": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Empresa actual",
    "planCode": "PLAN_1",
    "planName": "Plan 1",
    "standards": 7,
    "activeEmployees": 38,
    "inactiveEmployees": 8,
    "employeeLimit": 50,
    "employeeExcess": 0
  },
  "storage": {
    "scope": "SUBSCRIPTION",
    "unit": "BYTE",
    "bytesPerGB": 1000000000,
    "includedBytes": 66000000000,
    "extraStorageBytes": 0,
    "capacityBytes": 66000000000,
    "usedBytes": 54120000000,
    "availableBytes": 11880000000,
    "excessBytes": 0,
    "percentage": 82,
    "threshold": 80,
    "storageStatus": "WARNING",
    "calculatedAt": "2026-11-25T15:00:00.000Z",
    "calculationStatus": "READY"
  },
  "currentAlert": {
    "notificationId": "7ccd0007-8b20-4f93-a24e-c8d4174cb2d3",
    "threshold": 80,
    "message": "El almacenamiento compartido alcanzó el 80% de su capacidad.",
    "isRead": false
  },
  "enforcement": "INFORMATIONAL"
}
```

- No devolver otras empresas, empleados, archivos, correos de otros administradores ni detalle comercial del titular en este endpoint.
- El mismo grupo obtiene idéntico agregado de almacenamiento, pero el bloque `company` cambia con la empresa de sesión.
- Dos clientes distintos nunca comparten bolsa ni alertas por usar un correo parecido o tener administradores invitados en común.
- `configurationStatus`: `CONFIGURED`, `COMPANY_PLAN_MISSING` o `SUBSCRIPTION_MISSING`. En falta de suscripción devolver empleados reales de la empresa si están disponibles, `storage: null`, `currentAlert: null` y límites null; no inventar un plan de ejemplo.
- En falta de plan individual sí puede existir `storage` compartido real.
- `currentAlert` es null si no hay alerta vigente o todavía no ha sido generada; el estado de consumo debe seguir siendo visible independientemente de la notificación.
- Respuesta privada sin caché compartida. Al cambiar empresa o sesión, frontend debe descartar la lectura anterior y consultar de nuevo.

## 8. Alertas y notificaciones

### Umbrales

| Condición | threshold | storageStatus |
|---|---:|---|
| Menor al 80% | 0 | NORMAL |
| Desde 80% y menor a 90% | 80 | WARNING |
| Desde 90% y menor a 100% | 90 | CRITICAL |
| Desde 100%, incluidos excesos | 100 | CAPACITY_REACHED |
| Sin capacidad configurada | null | UNCONFIGURED |

El aviso no bloquea cargas. Se puede ofrecer contacto para ampliar almacenamiento, sin iniciar un cobro o modificar la suscripción automáticamente.

### Entrega y deduplicación

- Generar desde backend, después de actualizar el contador o por un proceso fiable; no depender de que Ajustes esté abierto.
- Destinatarios: administradores vigentes de cada empresa de la suscripción. Usar el rol existente, no únicamente el titular comercial.
- Crear cada notificación con `companyId` de la empresa destinataria, para conservar el aislamiento del centro de notificaciones actual.
- Usar registro único/idempotente por suscripción, episodio de alerta, umbral, empresa y usuario destinatario. Reintentos y cargas simultáneas no producen duplicados.
- Si sube directamente de 70% a 96%, enviar el aviso de 90%, no una ráfaga de avisos de 80% y 90%.
- Si se mantiene al 95%, no enviar otra notificación por cada archivo ni cada consulta.
- Rearmar un umbral cuando el consumo confirmado vuelva por debajo de él; un cruce posterior puede generar un nuevo episodio. Una ampliación debe recalcular estado y cerrar/rearmar alertas según el consumo resultante, no generar avisos por el simple cambio de capacidad.
- No borrar las notificaciones anteriores al recuperarse espacio. Distinguir el historial del aviso vigente mostrado en Ajustes.
- Marcar leído afecta solo al usuario destinatario. No marca leídos los avisos de todos los administradores del grupo.
- No notificar porcentajes con lecturas parciales o inconsistentes durante la carga inicial de contadores.

### Integración con las notificaciones existentes

Ampliaciones propuestas del enum:

- `STORAGE_USAGE_WARNING` para umbrales 80/90.
- `STORAGE_CAPACITY_REACHED` para umbral 100.
- `referenceType: SUBSCRIPTION`; `referenceId` referencia interna de la suscripción, con autorización también en su resolución.

Mantener los endpoints existentes:

- `GET /api/notifications`.
- `GET /api/notifications/unread-count`.
- `PATCH /api/notifications/{id}/read`.
- `PATCH /api/notifications/read-all`.

Incluir umbral, bytes usados/capacidad y destino `/dashboard/settings` en metadata, sin revelar datos de otras empresas. Frontend extenderá sus tipos e iconos al integrar la API. Ajustes puede marcar su `currentAlert.notificationId` mediante el PATCH existente; no hace falta persistir su lectura en localStorage.

## 9. Seguridad, errores y representación

- El superadministrador consulta y edita información comercial según su rol real; un administrador empresarial solo consulta el consumo autorizado y gestiona sus propias notificaciones.
- No confiar en cantidades, tamaños o contadores calculados por el navegador. No aceptar edición de `usedBytes`, empleados, resultados derivados o `ownerUserId` mediante PUT comercial.
- No usar este contrato para retirar o conceder permisos ya existentes.
- Envoltorio `{ ok, message, data, errors, meta }`; éxitos 200/201, validación 400/422, autenticación 401, autorización 403, relación inexistente/no autorizada 404 sin revelar datos, concurrencia/duplicado 409, dependencia temporal 503.
- Validar enteros no negativos y números finitos. Documentar el rango de bytes admitido; con el frontend actual, los números JSON deben ser enteros seguros hasta `Number.MAX_SAFE_INTEGER`. Si se necesita superar ese rango, acordar strings decimales y adaptar el frontend antes.
- Fechas de eventos UTC; presentación de fechas locales en `America/Bogota`. Los contadores de bytes no requieren redondeo por zona horaria.
- Auditar cambios comerciales sin exponer documentos sensibles ni credenciales en los logs.

## 10. Migración e integración del frontend

1. Identificar la titularidad real usuario/empresas y las fuentes de archivos de todos los módulos.
2. Crear tablas, restricciones y contadores idempotentes; inventariar los archivos existentes antes de declarar uso cero.
3. Registrar información comercial real mediante superadministrador. No inferir que una empresa compró un plan por el número de empleados o los módulos activos.
4. Inicializar pertenencia a bolsas según titularidad existente, sin alterar accesos ni pedir activar otra vez las empresas. La falta de registro comercial produce estado pendiente, no bloqueo.
5. Publicar APIs y habilitar alertas después de verificar/reconciliar el inventario inicial.
6. Sustituir el adaptador local del prototipo por estas APIs conservando la disposición visual y el flujo informativo.

Elementos mock a retirar al integrar:

- Clientes/empresas de demostración, cifras editables de empleados/uso, asociaciones entre empresas reales y ejemplos, botones de restablecer/asociar vista de prueba y fallback automático a datos simulados.
- LocalStorage `safecloud:subscription-demo:v1`, sus bindings y lecturas de alertas locales. No migrarlos como contratos reales.
- El formulario comercial deja de editar correo/nombre del usuario titular o conteos de consumo; esos datos provienen del usuario y contadores reales. Conservar edición de cantidades contratadas, capacidad adicional y plan informativo.

Archivos frontend de referencia:

- `lib/subscriptions/model.ts`.
- `hooks/useSubscriptionDemo.ts`.
- `components/subscriptions/subscription-manager.tsx`.
- `components/subscriptions/consumption.tsx`.
- `components/manager/super-admin/SuperAdminDashboard.tsx`.
- `app/dashboard/settings/page.tsx`.
- `tests/subscriptions.test.cjs` y `tests/subscriptions.browser.cjs`.

## 11. Criterios de aceptación

- [ ] 2 PLAN_1 + 4 PLAN_3 generan 6 empresas contratadas y 66.000.000.000 bytes incluidos.
- [ ] 10.000.000.000 bytes adicionales dejan 76 GB sin cambiar empresas contratadas ni límites individuales.
- [ ] 54.120.000.000 / 66.000.000.000 devuelve 82%, disponible 11.880.000.000 y umbral 80.
- [ ] Una empresa Plan 1 puede consumir 8 GB de la bolsa compartida sin aplicar un bloqueo individual de 3 GB.
- [ ] Empresas del mismo titular ven el mismo almacenamiento, pero 38/50 y 52/50 activos respectivamente; una no recibe el contador de la otra.
- [ ] Inactivar/reactivar/importar empleados actualiza conteos reales; inactivos no cuentan como activos, pero sus archivos sí.
- [ ] Registrar más empresas o más empleados que los contratados muestra diferencias sin bloquear las operaciones existentes.
- [ ] Una empresa nueva se agrega al grupo por su titularidad y aparece con plan pendiente sin intervención para activar la bolsa.
- [ ] Una empresa sin plan continúa aportando archivos al agregado y su límite de empleados es null.
- [ ] Cambiar el correo del titular no crea otra suscripción ni altera consumo.
- [ ] Carga exitosa, fallo, reintento, reemplazo, referencias compartidas, papelera y purga afectan exactamente los bytes realmente conservados.
- [ ] Cargas simultáneas e importaciones parciales no duplican ni pierden incrementos.
- [ ] Inventario inicial incluye archivos anteriores y de todos los módulos; reconciliar dos veces no duplica consumo.
- [ ] Cero capacidad no produce infinito, porcentaje falso o espacio ilimitado.
- [ ] Pasar 80/90/100 genera avisos al administrador de cada empresa sin duplicados; salto a 96% genera un único aviso de 90% por destinatario.
- [ ] Marcar leído no afecta al resto de administradores; una recuperación y nuevo cruce admiten otro episodio.
- [ ] Reducir o ampliar capacidad recalcula el estado sin borrar archivos ni bloquear accesos.
- [ ] Un admin empresarial no edita datos comerciales ni consulta empresas ajenas; todos los endpoints y archivos respetan tenant/permisos.
- [ ] PUT obsoleto devuelve 409 y un reintento no incrementa accidentalmente la capacidad adicional.
- [ ] Ante un fallo de cálculo no se muestra consumo cero como real.
- [ ] Conectar la API elimina demos/fallbacks locales y no modifica activaciones de módulos ni creación de empresas.

## 12. Entrega esperada del backend

1. Swagger y DTO definitivos para cada endpoint, ejemplos anonimizados de respuestas y errores.
2. Descripción de la relación usada para titularidad comercial y agrupación de empresas.
3. Migraciones, backfill, reconciliación y cobertura de todos los repositorios de archivos.
4. Mecanismo de deduplicación de eventos/notificaciones y garantía de actualización del consumo.
5. Pruebas de aislamiento, concurrencia, conteo, retención y funcionamiento informativo sin bloqueos.

Si alguna ruta o representación necesita variar por arquitectura, comunicarla antes de implementar el adaptador frontend. Se mantienen las reglas funcionales acordadas en la sección 1.
