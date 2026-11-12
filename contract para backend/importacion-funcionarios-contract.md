# Contrato propuesto: importación masiva de funcionarios

**Módulo:** Empleados → Gestión de empleados. La importación crea funcionarios con información personal, área y cargo. Seguridad social, contratos y demás secciones se completan después. No cambia el flujo de creación individual.

## Plantilla Excel y flujo de usuario

1. Antes de descargar, mostrar: «Crea primero todas las áreas y cargos que vas a asignar a los funcionarios. Si agregas o cambias alguno, descarga una plantilla nueva».
2. El frontend genera un `.xlsx` con los catálogos activos de la empresa, consultados en los servicios existentes. Si falta un catálogo o no se pudo cargar, no descargar una plantilla incompleta.
3. La hoja **Funcionarios** incluye nombres, apellidos, tipo y número de documento, género, teléfono, correo, dirección, fecha de nacimiento, área y cargo. Documento y teléfono son texto; la fecha se normaliza a `YYYY-MM-DD`.
4. Área y cargo son listas desplegables obligatorias con nombres legibles y etiquetas únicas cuando haya nombres repetidos. Una hoja de catálogos oculta y protegida relaciona cada opción con su ID real. No se escriben IDs a mano. Las celdas de datos son editables; encabezados, catálogos y estructura están protegidos contra cambios accidentales. Si existe una relación área-cargo en el modelo, la selección debe respetarla.
5. Al subir, el frontend lee las selecciones, resuelve sus IDs, rechaza opciones desconocidas y envía las filas al backend para validación. Luego muestra los errores por fila y permite confirmar solo cuando el lote esté listo.

La protección de Excel no es un control de seguridad: se puede alterar el archivo o pegar un valor inválido. El backend nunca debe confiar en las etiquetas ni en los IDs incluidos en la plantilla.

## API propuesta

**`POST /api/employee/import`**, JWT y permiso de creación de funcionarios. La empresa se obtiene de la sesión, no del archivo. El frontend envía JSON; el backend no necesita procesar Excel ni generar la plantilla.

```json
{
  "dryRun": true,
  "rows": [
    {
      "row": 2,
      "name": "Ana",
      "lastName": "Pérez",
      "documentType": "CC",
      "documentNumber": "001234567",
      "gender": "FEMENINO",
      "phone": "3001234567",
      "email": "ana@example.com",
      "address": "Calle 10 # 12-34",
      "birthDate": "1990-05-20",
      "workAreaId": "8e0c78f0-27a5-4766-a455-39ca818ab906",
      "jobId": "d88ef1ba-e9d9-4f83-9164-86ea2b5e327d"
    }
  ]
}
```

- `row`: número real de fila de Excel. Validar los datos personales con las reglas de creación individual y exigir tipo y número de documento en la importación para detectar duplicados. Aplicar el estado activo por defecto en servidor.
- `dryRun: true`: valida sin persistir. `dryRun: false`: vuelve a validar y crea el lote en una transacción; si una fila falla, no se crea ninguna. Así se puede corregir y reenviar el mismo archivo sin altas parciales.
- Validar que área y cargo existan, estén activos y pertenezcan a la empresa. Validar que sean compatibles si el modelo define esa relación. No crear catálogos desde la importación ni resolverlos por nombre en servidor.
- Detectar duplicados por tipo y número de documento dentro del lote y en la empresa, incluyendo reintentos o solicitudes concurrentes. No modificar funcionarios existentes. Aplicar también las reglas de unicidad del alta individual que correspondan.
- Acordar un máximo de filas por lote; propuesta inicial: 200. Auditar el usuario, la empresa y el resultado del lote sin volcar datos personales en logs.

## Respuesta esperada

Usar el formato habitual de la API. En el resultado de validación, devolver `total`, `valid`, `invalid`, `created` y `rows`. Cada fila inválida debe incluir errores con `field`, `code` y `message`; cada fila creada debe incluir su `employeeId`. Si falla la confirmación, devolver los errores por fila y cero registros creados.

**Pruebas de aceptación:** validar sin escribir; crear un lote válido; rechazar duplicados y IDs ajenos, inactivos o incompatibles; rechazar en confirmación un área desactivada después de la validación; comprobar que un lote inválido no crea registros parciales.
