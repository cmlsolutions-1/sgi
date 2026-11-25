const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
let roleResponse, roleCalls = []
function load(file) {
  const module = { exports: {} }
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
  new Function('require', 'module', 'exports', source)(name => {
    if (name === '@/lib/apiClient') return { apiFetch: async (url, options) => { roleCalls.push({ url, options }); return roleResponse } }
    return name.endsWith('.json') ? require(path.resolve(root, path.dirname(file), name)) : require(name)
  }, module, module.exports)
  return module.exports
}
const { activeParentModuleIds } = load('lib/company-modules.ts')
const { groupCompanyPermissions, selectedInactiveParentPermissions } = load('lib/manager/permission-groups.ts')
const catalog = [
  { id: 'planning', code: 'PLANNING', name: 'Planificación', parentId: null, index: 2, children: [{ id: 'training', code: 'TRAINING', name: 'Capacitaciones', parentId: 'planning', index: 1 }] },
  { id: 'employees', code: 'EMPLOYEE', name: 'Empleados', parentId: null, index: 1, children: [{ id: 'management', code: 'EMPLOYEE_MANAGEMENT', name: 'Gestión de empleados', parentId: 'employees', index: 1 }] },
]
assert.deepEqual(activeParentModuleIds([{ id: 'employees' }, { id: 'employees' }, { id: 'management', parentId: 'employees' }, { id: 'unknown' }], catalog), ['employees'])
assert.deepEqual(activeParentModuleIds([], catalog), [])
const result = groupCompanyPermissions([
  { id: 'employee-view', name: 'Ver empleados' },
  { id: 'training-view', name: 'Ver capacitaciones' },
  { id: 'custom', name: 'Un nombre nuevo', moduleId: 'training' },
  { id: 'unknown', name: 'Sin metadata' },
  { id: 'bad-metadata', name: 'Ver empleados', moduleId: 'not-present' },
], catalog)
assert.deepEqual(result.groups.map(group => group.parent.id), ['employees', 'planning'])
assert.deepEqual(result.groups[0].children[0].permissions.map(permission => permission.id), ['employee-view'])
assert.equal(result.groups[1].children[0].permissions.length, 2)
assert.equal(result.unknown.length, 2)
assert.deepEqual(selectedInactiveParentPermissions([{ id: 'employee-view', name: 'Ver empleados' }, { id: 'training-view', name: 'Ver capacitaciones' }], catalog, ['employees'], ['employee-view', 'training-view']).map(permission => permission.id), ['training-view'])
assert.deepEqual(selectedInactiveParentPermissions([{ id: 'training-view', name: 'Ver capacitaciones' }], catalog, ['employees', 'planning'], ['training-view']), [])
const legacy = require('../lib/manager/legacy-permission-modules.json')
for (const [name, code] of Object.entries(legacy)) {
  const grouped = groupCompanyPermissions([{ id: 'live-backend-id', name }], [{ id: 'parent', parentId: null, index: 1, children: [{ id: 'child', code, index: 1, parentId: 'parent' }] }])
  assert.equal(grouped.groups[0].children[0].permissions[0].id, 'live-backend-id')
  assert.equal(grouped.unknown.length, 0)
}
for (const file of ['components/manager/super-admin/SuperAdminDashboard.tsx', 'components/manager/super-admin/dialogs/ManageModulesDialog.tsx']) {
  const text = fs.readFileSync(path.join(root, file), 'utf8')
  assert.ok(!text.includes('localStorage'), 'No local module grants: ' + file)
  assert.ok(!text.includes('syncAdminCompanyPermissions'), 'No automatic bulk permission grants: ' + file)
}
console.log('Company module checks passed: explicit parent activation, ordered parent/child permissions, live metadata, legacy labels, unknown isolation and no local grants')
async function testScopeErrors() {
  const roles = load('services/roleService.ts')
  const rejected = '6fa25df8-c0d4-4b48-b854-d4d4d1db4176'
  roleResponse = Response.json({ ok: false, message: `Algunos IDs de permisos no están permitidos para esta empresa: ${rejected}, ${rejected}` }, { status: 400 })
  await assert.rejects(() => roles.updateRoleBySystemAdmin('role-id', 'company-id', { name: 'ADMIN_COMPANY', permissionIds: [rejected] }), error => {
    assert.ok(error instanceof roles.RolePermissionScopeError)
    assert.deepEqual(error.rejectedPermissionIds, [rejected])
    return true
  })
  assert.equal(roleCalls.length, 1, 'Scope rejection must not trigger automatic retries or grants')
  roleResponse = Response.json({ ok: true, data: {} })
  await roles.updateRoleBySystemAdmin('role-id', 'company-id', { name: 'ADMIN_COMPANY', permissionIds: [] })
  assert.deepEqual(JSON.parse(roleCalls[1].options.body).permissionIds, [])
  console.log('Role permission scope checks passed: rejected IDs are identified without retrying or granting additional permissions')
}
testScopeErrors().catch(error => { console.error(error); process.exitCode = 1 })
