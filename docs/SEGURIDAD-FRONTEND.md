# Hardening del frontend SafeCloud

## Antes de desplegar

Este cambio requiere configurar la verificacion JWT en el servidor Next. Sin
configuracion valida se rechaza el acceso a `/dashboard` y `/manager`. No hay
fallback a la decodificacion sin firma, tampoco en desarrollo.

Coordinar con backend/ciberseguridad el algoritmo y la clave del **access token**
que se guarda en `sgc_session`. No compartir claves por chat ni guardarlas en Git,
`next.config`, argumentos de build o variables `NEXT_PUBLIC_*`.

Opcion preferida, backend con firma asimetrica:

```dotenv
SESSION_JWT_ALGORITHM=RS256
SESSION_JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
```

La clave publica debe estar en formato SPKI. La clave privada permanece solo en
backend. Si actualmente backend usa HS256, configurar **en su lugar**:

```dotenv
SESSION_JWT_ALGORITHM=HS256
SESSION_JWT_SECRET=<secreto-del-backend-de-al-menos-32-bytes>
```

No configurar simultaneamente secreto y clave publica. HS256 comparte capacidad
de firma con frontend: preferir migracion coordinada a RS256. No inventar un
secreto nuevo solo en Next: debe verificar lo que firma el backend. La rotacion
tras el incidente se coordina con backend y puede invalidar sesiones existentes.

Si backend emite `iss`/`aud`, exigir sus valores mediante
`SESSION_JWT_ISSUER` y `SESSION_JWT_AUDIENCE`. No habilitarlos con valores
inventados: rechazarian tokens legitimos. Son obligatorios `exp` numerico y firma
valida; se comprueban tambien `nbf` e `iat` si existen.

Las variables JWT se inyectan **al arrancar** el contenedor. No se necesitan
secretos para compilar. El middleware no concede permisos de API: backend debe
validar firma, expiracion, estado de usuario/empresa, tenant, modulos y permisos
en **cada endpoint**, incluyendo documentos. Un JWT revocado antes de expirar
solo puede ser rechazado inmediatamente por el backend con su control de sesion.

## Instalacion y dependencias

`package.json` contiene versiones exactas y `package-lock.json` es el lockfile
autoritativo. Usar exclusivamente `npm ci` en CI/despliegue; no `npm install`,
`npm update`, `--force` ni un lockfile alternativo durante el despliegue.
`.npmrc` usa `save-exact`; Docker exige el lockfile sin fallback.

Actualizar dependencias en un PR revisado, incluyendo lockfile, pruebas y auditoria.
Fijar versiones no demuestra que un paquete sea seguro ni reemplaza la revision
de avisos, scripts de instalacion y procedencia. Las actualizaciones de Next y
React de este cambio se fijaron explicitamente, no con etiquetas `latest`.

```sh
npm ci
npm run test:security
npm run typecheck
npm run build
npm audit --omit=dev
```

## CSP y documentos

`next.config.mjs` configura CSP, anti-clickjacking, `nosniff`, referrer policy,
permissions policy y HSTS en produccion. El middleware sustituye la CSP de paginas
por una con nonce aleatorio por respuesta y `strict-dynamic`. No se permite
`unsafe-inline` ni `unsafe-eval` para scripts en produccion. Solo estilos inline
se conservan por Radix/Recharts y controles de apariencia. El root layout usa
renderizado por solicitud: no cachear HTML con nonce entre usuarios ni en CDN.

Se conservan vistas PDF/imagenes via `blob:`/`data:`. Si documentos se descargan
desde un origen externo, permitir **solo** sus origenes conocidos:

```dotenv
CSP_DOCUMENT_ORIGINS=https://archivos.example.com,https://api.example.com
```

Sin rutas, comodines ni valores tomados del token/usuario. Esta variable debe
coincidir en build y runtime, porque Next genera cabeceras estaticas durante el
build; el middleware genera la CSP dinamica en runtime. No agrega permisos para
scripts externos. Mantener la API del navegador bajo el proxy `/api` del mismo
origen. HSTS requiere HTTPS en produccion. Revisar que Nginx/CDN no agregue otra
CSP contradictoria ni cachee HTML privado. Recursos descargados desde backend
deben tener sus propias cabeceras y autorizacion.

Docker admite `--build-arg API_URL=...` y `--build-arg CSP_DOCUMENT_ORIGINS=...`
para estos valores no secretos. `API_URL` debe definirse al construir la imagen
para que Next genere los rewrites; cambiarla solo al arrancar no reconstruye
los rewrites. Las variables `SESSION_JWT_*` se configuran solo en runtime.

## Docker

El runner usa Node 24 y `USER node`; solo `.next/cache` se hace escribible.
No contiene archivos `.env` del host. No montar Docker socket, no usar
`--privileged` ni `--user root`. En el VPS, aplicar limites de memoria/CPU/PIDs,
`cap_drop: ALL`, `no-new-privileges`, red/egress restringidos y filesystem
read-only con volumenes/tmpfs especificos si el runtime lo requiere. Estas son
medidas de despliegue: no se modifico el VPS desde esta tarea.

La imagen oficial `node:24-alpine` tambien esta fijada por digest SHA256 en el
Dockerfile. Revisar y actualizar ese digest junto con los parches de Node/Alpine;
no queda actualizado automaticamente al moverse el tag.

Verificar en staging login, refresh, roles ADMIN/ADMIN_COMPANY, descargas,
imagenes/PDF, rechazo de cookies manipuladas y ausencia de violaciones CSP.
Este hardening no certifica que la causa del incidente haya sido identificada.
