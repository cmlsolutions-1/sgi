import ExcelJS from "exceljs"
import type { EmployeeImportCatalogs, EmployeeImportRow, EmployeeImportRowResult } from "@/types/manager/employee-import"

export const employeeImportLimit = 200
export const employeeImportHeaders = ["Nombres", "Apellidos", "Tipo de documento", "Número de documento", "Género", "Teléfono", "Correo", "Dirección", "Fecha de nacimiento", "Área de trabajo", "Cargo"]
const keys = ["name", "lastName", "documentType", "documentNumber", "gender", "phone", "email", "address", "birthDate", "workAreaId", "jobId"] as const
const documentTypes = ["CC", "TI", "RC", "CE", "PP"]
const genders = ["MASCULINO", "FEMENINO"]
const normalize = (value: string) => value.trim().toLocaleLowerCase("es-CO")

function catalogLabels<T extends { id: string; name: string }>(items: T[]) {
  return items.map(item => ({ ...item, label: items.filter(other => normalize(other.name) === normalize(item.name)).length > 1 ? `${item.name} [${item.id}]` : item.name }))
}

export async function buildEmployeeImportTemplate(catalogs: EmployeeImportCatalogs) {
  if (!catalogs.areas.length || !catalogs.jobs.length) throw new Error("Faltan áreas o cargos activos")
  const workbook = new ExcelJS.Workbook()
  workbook.creator = "SafeCloud"
  workbook.calcProperties.fullCalcOnLoad = true
  const sheet = workbook.addWorksheet("Funcionarios", { views: [{ state: "frozen", ySplit: 1 }] })
  const hidden = workbook.addWorksheet("Catalogos", { state: "veryHidden" })
  const jobOptions = workbook.addWorksheet("OpcionesCargos", { state: "veryHidden" })
  sheet.columns = employeeImportHeaders.map((header, index) => ({ header, width: [25, 25, 21, 24, 18, 20, 32, 35, 24, 35, 42][index] }))
  sheet.getRow(1).height = 32
  sheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0369A1" } }
    cell.alignment = { vertical: "middle", wrapText: true }
  })
  hidden.addRow(["Área", "ID área", "", "Cargo", "ID cargo", "Área del cargo", "Nombre del área del cargo"])
  const areas = catalogLabels(catalogs.areas)
  const jobs = catalogLabels(areas.flatMap(area => catalogs.jobs.filter(job => job.workAreaId === area.id).map(job => ({ ...job, name: `${job.name} · ${area.label}` }))))
  areas.forEach((area, index) => {
    hidden.getCell(index + 2, 1).value = area.label
    hidden.getCell(index + 2, 2).value = area.id
  })
  jobs.forEach((job, index) => {
    hidden.getCell(index + 2, 4).value = job.label
    hidden.getCell(index + 2, 5).value = job.id
    hidden.getCell(index + 2, 6).value = job.workAreaId
    hidden.getCell(index + 2, 7).value = areas.find(area => area.id === job.workAreaId)?.label ?? ""
  })
  workbook.definedNames.add(`Catalogos!$A$2:$A$${areas.length + 1}`, "Areas")
  workbook.definedNames.add(`Catalogos!$D$2:$D$${jobs.length + 1}`, "ListaCargos")
  workbook.definedNames.add(`Catalogos!$G$2:$G$${jobs.length + 1}`, "AreasCargos")
  const maxJobsPerArea = Math.max(1, ...areas.map(area => jobs.filter(job => job.workAreaId === area.id).length))
  const validation = (formula: string, optional = false): ExcelJS.DataValidation => ({ type: "list", allowBlank: optional, formulae: [formula], showErrorMessage: true, errorStyle: "stop", errorTitle: "Selección inválida", error: "Selecciona una opción de la lista.", showInputMessage: true, promptTitle: "Catálogo de la empresa", prompt: "Selecciona una opción disponible." })
  for (let row = 2; row <= employeeImportLimit + 1; row++) {
    sheet.getRow(row).height = 23
    for (let column = 1; column <= keys.length; column++) {
      const cell = sheet.getCell(row, column)
      cell.protection = { locked: false }
      cell.numFmt = "@"
      cell.alignment = { vertical: "middle" }
      if (row % 2 === 0) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F9FF" } }
    }
    sheet.getCell(row, 3).dataValidation = validation(`"${documentTypes.join(",")}"`)
    sheet.getCell(row, 5).dataValidation = validation(`"${genders.join(",")}"`, true)
    sheet.getCell(row, 9).numFmt = "yyyy-mm-dd"
    sheet.getCell(row, 9).dataValidation = { type: "date", operator: "between", allowBlank: false, formulae: [new Date("1900-01-01T00:00:00Z"), new Date()], showErrorMessage: true, errorStyle: "stop", error: "Ingresa una fecha válida en formato AAAA-MM-DD, por ejemplo 1990-05-20.", showInputMessage: true, promptTitle: "Fecha de nacimiento", prompt: "Formato: AAAA-MM-DD. Ejemplo: 1990-05-20." }
    sheet.getCell(row, 10).dataValidation = validation("Areas")
    // Keep the validation source a direct named range; calculate its options separately.
    jobOptions.getCell(row, 1).value = { formula: `IFERROR(MATCH(Funcionarios!$J${row},AreasCargos,0),0)` }
    for (let option = 1; option <= maxJobsPerArea; option++) {
      jobOptions.getCell(row, option + 1).value = { formula: `IF(OR($A${row}=0,${option}>COUNTIF(AreasCargos,Funcionarios!$J${row})),"",INDEX(ListaCargos,$A${row}+${option - 1}))` }
    }
    workbook.definedNames.add(`OpcionesCargos!$B$${row}:$${jobOptions.getColumn(maxJobsPerArea + 1).letter}$${row}`, `CargosFila_${row}`)
    sheet.getCell(row, 11).dataValidation = validation(`CargosFila_${row}`)
    sheet.getCell(row, 11).dataValidation.prompt = "Elige primero el área. Si no tiene cargos activos, créalos y descarga una plantilla nueva."
  }
  const example = workbook.addWorksheet("Ejemplo de llenado", { views: [{ state: "frozen", ySplit: 3 }] })
  example.columns = sheet.columns.map(column => ({ width: column.width }))
  example.mergeCells("A1:K1")
  example.getCell("A1").value = "EJEMPLO ILUSTRATIVO · Esta hoja no se importa. Registra los datos reales en Funcionarios."
  example.getCell("A1").font = { bold: true, color: { argb: "FF0369A1" } }
  example.getCell("A1").alignment = { wrapText: true, vertical: "middle" }
  example.getRow(1).height = 36
  example.mergeCells("A2:K2")
  example.getCell("A2").value = "Fecha: AAAA-MM-DD (1990-05-20). Documento y teléfono: texto, conservando ceros iniciales. Elige primero el área y después un cargo de su lista."
  example.getCell("A2").alignment = { wrapText: true, vertical: "middle" }
  example.getRow(2).height = 36
  example.getRow(3).values = employeeImportHeaders
  example.getRow(3).eachCell((cell, index) => { cell.style = sheet.getCell(1, index).style })
  const exampleJob = jobs[0]
  const exampleArea = areas.find(area => area.id === exampleJob.workAreaId)!
  example.getRow(4).values = ["Ana María", "Pérez Gómez", "CC", "001234567", "FEMENINO", "3001234567", "ana.ejemplo@example.com", "Calle 10 # 12-34", "1990-05-20", exampleArea.label, exampleJob.label]
  example.getRow(4).eachCell(cell => { cell.numFmt = "@"; cell.alignment = { wrapText: true, vertical: "middle" } })
  example.getRow(4).height = 36
  const password = "SafeCloudPlantilla"
  await sheet.protect(password, { selectLockedCells: false, selectUnlockedCells: true, spinCount: 1000 })
  await hidden.protect(password, { spinCount: 1000 })
  await jobOptions.protect(password, { spinCount: 1000 })
  await example.protect(password, { spinCount: 1000 })
  return workbook.xlsx.writeBuffer()
}

// Reject large expanded ZIPs before handing the workbook to the spreadsheet parser.
export function validateEmployeeWorkbookSize(buffer: ArrayBuffer) {
  if (buffer.byteLength > 2 * 1024 * 1024) throw new Error("El Excel no puede superar 2 MB")
  const data = new DataView(buffer)
  let end = -1
  for (let offset = buffer.byteLength - 22; offset >= Math.max(0, buffer.byteLength - 65557); offset--) {
    if (data.getUint32(offset, true) === 0x06054b50) { end = offset; break }
  }
  if (end < 0) throw new Error("Selecciona un archivo Excel .xlsx válido")
  const count = data.getUint16(end + 10, true)
  let offset = data.getUint32(end + 16, true), expanded = 0
  if (count > 500 || !count) throw new Error("El archivo contiene demasiados componentes")
  for (let index = 0; index < count; index++) {
    if (offset + 46 > data.byteLength || data.getUint32(offset, true) !== 0x02014b50) throw new Error("El archivo Excel está dañado")
    expanded += data.getUint32(offset + 24, true)
    if (expanded > 20 * 1024 * 1024) throw new Error("El contenido expandido del Excel supera el límite permitido")
    offset += 46 + data.getUint16(offset + 28, true) + data.getUint16(offset + 30, true) + data.getUint16(offset + 32, true)
  }
}

function plainCell(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return ""
  if (typeof cell.value === "string" || typeof cell.value === "number") return String(cell.value).trim()
  if (cell.value instanceof Date) return cell.value.toISOString().slice(0, 10)
  throw new Error("Usa valores simples, sin fórmulas, vínculos ni objetos")
}

function birthDate(cell: ExcelJS.Cell) {
  if (typeof cell.value === "number") {
    if (!Number.isFinite(cell.value) || cell.value < 1 || cell.value > 100000) return ""
    return new Date(Date.UTC(1899, 11, 30) + Math.floor(cell.value) * 86400000).toISOString().slice(0, 10)
  }
  const text = plainCell(cell)
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  return parts ? `${parts[3]}-${parts[2]}-${parts[1]}` : text
}

export async function parseEmployeeImportWorkbook(buffer: ArrayBuffer, catalogs: EmployeeImportCatalogs): Promise<{ rows: EmployeeImportRow[]; errors: EmployeeImportRowResult[] }> {
  validateEmployeeWorkbookSize(buffer)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const sheet = workbook.getWorksheet("Funcionarios"), hidden = workbook.getWorksheet("Catalogos")
  if (!sheet || !hidden) throw new Error("No se encontraron las hojas Funcionarios y Catalogos. Usa la plantilla descargada de SafeCloud sin eliminar estas hojas.")
  if (workbook.worksheets.length > 10) throw new Error("El archivo contiene demasiadas hojas. Usa la plantilla descargada de SafeCloud.")
  if (employeeImportHeaders.some((header, index) => plainCell(sheet.getCell(1, index + 1)) !== header)) throw new Error("Los encabezados de la plantilla fueron modificados")
  const areaMap = new Map<string, string>(), jobMap = new Map<string, { id: string; area: string }>()
  hidden.eachRow((row, index) => {
    if (index === 1) return
    const label = plainCell(row.getCell(1)), id = plainCell(row.getCell(2))
    if (label) {
      if (areaMap.has(label)) throw new Error("El catálogo de áreas de la plantilla fue alterado")
      areaMap.set(label, id)
    }
    const jobLabel = plainCell(row.getCell(4))
    if (jobLabel) {
      if (jobMap.has(jobLabel)) throw new Error("El catálogo de cargos de la plantilla fue alterado")
      jobMap.set(jobLabel, { id: plainCell(row.getCell(5)), area: plainCell(row.getCell(6)) })
    }
    if (areaMap.size > 20000 || jobMap.size > 20000) throw new Error("El catálogo de la plantilla supera el tamaño permitido")
  })
  const rows: EmployeeImportRow[] = [], errors: EmployeeImportRowResult[] = []
  sheet.eachRow((excelRow, number) => {
    excelRow.eachCell((cell, column) => {
      if (column > keys.length && cell.value !== null && cell.value !== undefined && !(typeof cell.value === "string" && !cell.value.trim())) throw new Error(`La fila ${number} contiene datos fuera de las columnas de la plantilla. Usa únicamente las columnas de Nombres a Cargo.`)
    })
    if (number === 1) return
    const result: EmployeeImportRowResult = { row: number, valid: false, created: false, employeeId: null, errors: [] }
    const add = (field: string, message: string) => result.errors.push({ field, code: "INVALID_TEMPLATE_VALUE", message })
    const values = keys.map((key, index) => {
      try {
        const cell = excelRow.getCell(index + 1)
        if ((key === "documentNumber" || key === "phone") && typeof cell.value === "number") throw new Error("Ingresa el valor como texto para conservar todos los dígitos y ceros iniciales")
        return key === "birthDate" ? birthDate(cell) : plainCell(cell)
      }
      catch (error) { add(key, (error as Error).message); return "" }
    })
    if (values.every(value => !value) && !result.errors.length) return
    if (rows.length >= employeeImportLimit) throw new Error(`El archivo contiene más de ${employeeImportLimit} funcionarios diligenciados. Divídelo en lotes de hasta ${employeeImportLimit}; las filas vacías no cuentan.`)
    const row = Object.fromEntries(keys.map((key, index) => [key, values[index]])) as Omit<EmployeeImportRow, "row">
    const areaId = areaMap.get(row.workAreaId), job = jobMap.get(row.jobId)
    if (!areaId || !catalogs.areas.some(area => area.id === areaId)) add("workAreaId", "Selecciona un área activa de la lista; si cambió, descarga una plantilla nueva")
    if (!job || !catalogs.jobs.some(option => option.id === job.id && option.workAreaId === areaId) || job.area !== areaId) add("jobId", "Selecciona un cargo activo que pertenezca al área elegida")
    if (!documentTypes.includes(row.documentType)) add("documentType", "Selecciona CC, TI, RC, CE o PP")
    if (row.gender && !genders.includes(row.gender)) add("gender", "Selecciona MASCULINO o FEMENINO")
    for (const key of keys.filter(key => key !== "gender")) if (!row[key]) add(key, "Este campo es obligatorio")
    if (result.errors.length) errors.push(result)
    rows.push({ ...row, row: number, workAreaId: areaId ?? "", jobId: job?.id ?? "" })
  })
  if (!rows.length) throw new Error("La plantilla no contiene funcionarios para importar")
  return { rows, errors }
}
