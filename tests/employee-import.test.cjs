const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const ExcelJS = require('exceljs')
const root = path.resolve(__dirname, '..')
let calls = [], respond
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  const mod = { exports: {} }
  new Function('require', 'module', 'exports', source)(name => {
    if (name === '@/lib/apiClient') return { apiFetch: async (url, options = {}) => { calls.push({ url, ...options }); return respond(url, options) } }
    if (name === '@/services/workAreaService') return { listWorkAreas: async () => [{ id: 'area-a', name: 'Operaciones', status: 'ACTIVE' }, { id: 'inactive', name: 'Inactiva', status: 'INACTIVE' }] }
    return require(name)
  }, mod, mod.exports)
  return mod.exports
}
const catalogs = {
  areas: [{ id: 'area-a', name: 'Operaciones' }, { id: 'area-b', name: 'Administración' }],
  jobs: [{ id: 'job-a', name: 'Auxiliar', workAreaId: 'area-a' }, { id: 'job-b', name: 'Auxiliar', workAreaId: 'area-b' }],
}
const asArrayBuffer = bytes => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
async function main() {
  const api = load('services/employeeImportService.ts'), excel = load('lib/employee-import.ts')
  const bytes = await excel.buildEmployeeImportTemplate(catalogs)
  const unordered = new ExcelJS.Workbook()
  await unordered.xlsx.load(await excel.buildEmployeeImportTemplate({ ...catalogs, jobs: [...catalogs.jobs].reverse() }))
  assert.equal(unordered.getWorksheet('Catalogos').getCell('E2').text, 'job-a')
  assert.equal(unordered.getWorksheet('Catalogos').getCell('E3').text, 'job-b')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(bytes)
  const sheet = workbook.getWorksheet('Funcionarios'), hidden = workbook.getWorksheet('Catalogos')
  assert.equal(hidden.state, 'veryHidden')
  assert.equal(sheet.getCell('D2').numFmt, '@')
  assert.equal(sheet.getCell('F2').numFmt, '@')
  assert.equal(sheet.getCell('A2').protection.locked, false)
  assert.equal(sheet.getCell('J2').dataValidation.type, 'list')
  assert.equal(sheet.getCell('K2').dataValidation.formulae[0], 'CargosFila_2')
  assert.equal(sheet.getCell('K3').dataValidation.formulae[0], 'CargosFila_3')
  assert.ok(workbook.definedNames.getRanges('CargosFila_2').ranges.includes('OpcionesCargos!$B$2'))
  assert.ok(workbook.definedNames.getRanges('ListaCargos').ranges.includes('Catalogos!$D$2:$D$3'))
  assert.equal(workbook.getWorksheet('OpcionesCargos').state, 'veryHidden')
  assert.ok(workbook.getWorksheet('OpcionesCargos').getCell('B2').formula.includes('Funcionarios!$J2'))
  assert.ok(workbook.definedNames.getRanges('AreasCargos').ranges.includes('Catalogos!$G$2:$G$3'))
  assert.equal(workbook.getWorksheet('Ejemplo de llenado').getCell('I4').value, '1990-05-20')
  assert.ok(sheet.getCell('I2').dataValidation.prompt.includes('AAAA-MM-DD'))
  await assert.rejects(() => excel.parseEmployeeImportWorkbook(asArrayBuffer(bytes), catalogs), /no contiene funcionarios/)
  assert.equal(sheet.getCell('K201').dataValidation.type, 'list')
  const area = hidden.getCell('A2').text, job = hidden.getCell('D2').text
  sheet.getRow(2).values = ['Ana', 'Pérez', 'CC', '001234567', 'FEMENINO', '03001234567', 'ana@example.com', 'Calle 1', '1990-05-20', area, job]
  const parse = async (catalog = catalogs) => excel.parseEmployeeImportWorkbook(asArrayBuffer(await workbook.xlsx.writeBuffer()), catalog)
  let parsed = await parse()
  assert.deepEqual(parsed.errors, [])
  assert.equal(parsed.rows.length, 1)
  assert.equal(parsed.rows[0].documentNumber, '001234567')
  assert.equal(parsed.rows[0].phone, '03001234567')
  assert.equal(parsed.rows[0].workAreaId, 'area-a')
  assert.equal(parsed.rows[0].jobId, 'job-a')
  sheet.getCell('D2').value = 1234567890123456
  assert.ok((await parse()).errors[0].errors.some(error => error.field === 'documentNumber' && error.message.includes('texto')))
  sheet.getCell('D2').value = '001234567'
  sheet.getCell('I2').value = new Date('1990-05-20T00:00:00Z')
  assert.equal((await parse()).rows[0].birthDate, '1990-05-20')
  sheet.getCell('I2').value = '20/05/1990'
  assert.equal((await parse()).rows[0].birthDate, '1990-05-20')
  sheet.getCell('K2').value = hidden.getCell('D3').text
  assert.ok((await parse()).errors[0].errors.some(error => error.field === 'jobId'))
  sheet.getCell('K2').value = job
  assert.ok((await parse({ ...catalogs, jobs: [] })).errors[0].errors.some(error => error.field === 'jobId'))
  sheet.getCell('A2').value = { formula: '1+1', result: 2 }
  assert.ok((await parse()).errors[0].errors.some(error => error.message.includes('fórmulas')))
  sheet.getCell('A2').value = 'Ana'
  sheet.getRow(4).values = ['Luisa', 'Pérez', 'CC', '567', '', '12345', 'l@example.com', 'Calle 2', '1991-05-20', area, job]
  assert.deepEqual((await parse()).rows.map(row => row.row), [2, 4])
  sheet.getCell('A1000').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
  sheet.getCell('Z2').numFmt = '@'
  assert.deepEqual((await parse()).rows.map(row => row.row), [2, 4], 'Two employees are accepted despite extra formatted rows and columns')
  sheet.getRow(202).values = ['María', 'Pérez', 'CC', '891', '', '54321', 'm@example.com', 'Calle 3', '1992-05-20', area, job]
  assert.deepEqual((await parse()).rows.map(row => row.row), [2, 4, 202], 'Actual Excel row numbers are preserved across blank rows')
  sheet.getCell('Z2').value = 'Dato fuera de plantilla'
  await assert.rejects(parse, /fuera de las columnas/)
  sheet.getCell('Z2').value = null
  for (let row = 2; row <= 202; row++) sheet.getRow(row).values = ['Ana', 'Pérez', 'CC', String(row), '', '12345', 'a@example.com', 'Calle 1', '1990-05-20', area, job]
  sheet.getRow(202).values = []
  assert.equal((await parse()).rows.length, 200)
  sheet.getRow(202).values = ['Ana', 'Pérez', 'CC', '202', '', '12345', 'a@example.com', 'Calle 1', '1990-05-20', area, job]
  await assert.rejects(parse, /más de 200 funcionarios diligenciados/)
  assert.throws(() => excel.validateEmployeeWorkbookSize(new ArrayBuffer(10)), /válido/)
  assert.throws(() => excel.validateEmployeeWorkbookSize(new ArrayBuffer(3 * 1024 * 1024)), /2 MB/)
  respond = url => Response.json({ ok: true, data: { items: [{ id: url.includes('page=1') ? 'job-a' : 'job-b', name: 'Cargo', status: 'ACTIVE', workAreaId: 'area-a' }], total: 2 } })
  assert.equal((await api.loadEmployeeImportCatalogs()).jobs.length, 2)
  assert.equal(calls.length, 2)
  respond = () => Response.json({ ok: false, message: 'Sin permisos' }, { status: 403 })
  await assert.rejects(() => api.loadEmployeeImportCatalogs(), /Sin permisos/)
  calls = []
  respond = () => Response.json({ ok: true, data: { total: 1, valid: 1, invalid: 0, created: 0, rows: [] } })
  await api.importEmployees(parsed.rows, true)
  await api.importEmployees(parsed.rows, false)
  assert.equal(calls[0].url, '/api/employee/import')
  assert.equal(calls[0].method, 'POST')
  assert.equal(JSON.parse(calls[0].body).dryRun, true)
  assert.equal(JSON.parse(calls[1].body).dryRun, false)
  assert.equal(JSON.parse(calls[1].body).rows[0].row, 2)
  assert.equal(JSON.parse(calls[1].body).companyId, undefined)
  console.log('Employee import checks passed: Excel protection, dropdowns, dates, IDs, text, limits, pagination and dry-run/confirmation')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
