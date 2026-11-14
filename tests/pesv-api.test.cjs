const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
let respond, calls = []
function load(file, cache = new Map()) {
  const absolute = path.resolve(root, file)
  if (cache.has(absolute)) return cache.get(absolute).exports
  const module = { exports: {} }; cache.set(absolute, module)
  const source = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  const requireLocal = name => {
    if (name === '@/lib/apiClient') return { apiFetch: async (url, options = {}) => { calls.push({ url, ...options }); return respond(url, options) } }
    if (!name.startsWith('.') && !name.startsWith('@/')) return require(name)
    const resolved = name.startsWith('@/') ? path.resolve(root, name.slice(2)) : path.resolve(path.dirname(absolute), name)
    const target = ['', '.ts', '.tsx'].map(extension => resolved + extension).find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
    return load(path.relative(root, target), cache)
  }
  new Function('require', 'module', 'exports', source)(requireLocal, module, module.exports)
  return module.exports
}
const response = data => Response.json({ ok: true, data })
async function main() {
  const profiles = load('lib/pesv/diagnosis-profiles.ts')
  const profile = { id: 'read-only', sourceEmployeeId: 'employee-id', name: ' Ana ', birthDate: '1990-02-28', gender: 'FEMENINO', role: 'Operadora', educationLevel: 'Técnica', maritalStatus: 'Soltera', licenseValidUntil: '2027-01-01', trainings: 0, competencyEvaluation: 'Realizada', roadAccidents: 0, trafficFines: 0, finesPaymentStatus: 'Sin infracciones', commuteTransport: 'Bus', isWorkDriver: false, vehicleTypeDriven: 'No aplica', linkedAt: '2026-01-01' }
  assert.deepEqual(profiles.missingCollaboratorFields(profile), [])
  assert.deepEqual(profiles.missingCollaboratorFields({ ...profile, educationLevel: null, licenseValidUntil: '2027-02-30', linkedAt: null }), ['Escolaridad', 'Vencimiento de la licencia', 'Fecha de vinculación'])
  assert.equal(profiles.collaboratorPayload(profile).name, 'Ana')
  assert.equal(profiles.collaboratorPayload(profile).id, undefined)
  const api = load('services/pesvService.ts')
  assert.equal(api.pesvResources.objectives, '/api/pesv/objectives/objectives')
  for (const [resource, url] of Object.entries(api.pesvResources)) {
    calls = []; respond = () => response({ id: 'server-id' })
    await api.savePesv(resource, { name: 'Nombre' })
    await api.savePesv(resource, { name: 'Actualizado' }, 'server-id')
    assert.equal(calls[0].url, url); assert.equal(calls[0].method, 'POST'); assert.equal(calls[1].method, 'PUT'); assert.equal(calls[1].url, url + '/server-id')
    respond = () => new Response(null, { status: 204 }); await api.deletePesv(resource, 'server-id')
    assert.equal(calls.at(-1).method, 'DELETE')
  }
  calls = []; respond = url => response({ items: [{ id: url.includes('page=1') ? 'one' : 'two' }], total: 2 })
  assert.equal((await api.listPesv('/api/pesv/policies')).length, 2); assert.equal(calls.length, 2)
  respond = () => Response.json({ ok: false, message: 'Sin permisos' }, { status: 403 })
  await assert.rejects(() => api.listPesv('/api/pesv/policies'), /Sin permisos/)
  respond = () => response({ items: [] }); await assert.rejects(() => api.listPesv('/api/pesv/policies'), /inválida/)
  respond = () => response({ items: [], total: 1 }); await assert.rejects(() => api.listPesv('/api/pesv/policies'), /paginación/)
  calls = []; respond = () => response({ id: 'proof-id' })
  const file = new File(['test'], 'proof.pdf', { type: 'application/pdf' })
  await api.uploadPesvDocument('committee', 'committee-id', file, 'Acta', 'review-id')
  assert.ok(calls[0].body instanceof FormData); assert.equal(calls[0].body.get('targetId'), 'review-id'); assert.equal(calls[0].body.get('isConfirmed'), 'true'); assert.equal(calls[0].headers, undefined)
  assert.equal(calls[0].body.get('type'), 'PESV_COMMITTEE_EVIDENCE')
  assert.deepEqual(api.pesvVersion({ version: '1.0', lockVersion: 3 }), { lockVersion: 3 })
  assert.deepEqual(api.pesvVersion({ version: 2 }), { version: 2 })
  calls = []; respond = (url, options) => response(options.method === 'PUT' ? { status: 'ACTIVE' } : { status: 'DRAFT', lockVersion: 4 })
  await api.changePesvPolicyStatus('policy-id', 'ACTIVE')
  assert.equal(calls[0].method, 'GET')
  assert.equal(calls[1].url, '/api/pesv/policies/policy-id/status')
  assert.equal(calls[1].method, 'PUT')
  assert.deepEqual(JSON.parse(calls[1].body), { status: 'ACTIVE', lockVersion: 4 })
  calls = []; respond = () => response({ status: 'ACTIVE', lockVersion: 5 })
  await api.changePesvPolicyStatus('policy-id', 'ACTIVE'); assert.equal(calls.length, 1)
  calls = []; respond = () => response({ status: 'DRAFT' })
  await assert.rejects(() => api.changePesvPolicyStatus('policy-id', 'ACTIVE'), /versión/)
  assert.equal(calls.length, 1)
  respond = (url, options) => options.method === 'PUT' ? Response.json({ ok: false, message: 'Falta soporte firmado' }, { status: 400 }) : response({ status: 'DRAFT', lockVersion: 6 })
  await assert.rejects(() => api.changePesvPolicyStatus('policy-id', 'ACTIVE'), /Falta soporte firmado/)
  respond = () => response([{ id: 'entry-proof', originalName: 'acta.pdf', referenceType: 'PESV_COMMITTEE_REVIEW', referenceId: 'review-id' }, { id: 'parent-proof', originalName: 'comite.pdf', referenceType: 'PESV_COMMITTEE', referenceId: 'committee-id' }])
  const mapped = await api.listPesvDocuments('committee', 'committee-id')
  assert.equal(mapped[0].targetId, 'review-id'); assert.equal(mapped[1].targetId, undefined)
  respond = () => new Response('image-bytes', { headers: { 'Content-Type': 'application/octet-stream' } })
  assert.equal((await api.pesvBlob('/api/pesv/committee/id/documents/doc', 'image/png')).type, 'image/png')
  respond = () => response({ id: 'road-proof' })
  await api.uploadPesvDocument('roadRisks', 'risk-id', new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'evidencia.png', { type: 'image/png' }))
  await assert.rejects(() => api.uploadPesvDocument('policies', 'id', new File(['x'], 'script.html', { type: 'text/html' })), /PDF/)
  respond = url => response(url.endsWith('documents?page=1&limit=100') ? [{ id: 'doc', originalName: 'firma.pdf', createdAt: '2026-10-28', mimeType: 'application/pdf' }] : url.includes('?') ? [{ id: 'record' }] : { id: 'record', name: 'Servidor' })
  const records = await api.loadPesv('policies'); assert.equal(records[0].evidence.fileName, 'firma.pdf'); assert.equal(records[0].name, 'Servidor')
  const nav = load('components/dashboard/navigation.tsx')
  const parent = children => [{ id: 'parent', code: 'PESV', name: 'PESV', route: '/pesv', index: 1, parentId: null, children }]
  const child = code => ({ id: code, code, name: code, route: '', index: 1, parentId: 'parent' })
  assert.ok(!nav.filterNavigationByModules(nav.navigation, []).some(i => i.code === 'PESV'))
  assert.ok(!nav.filterNavigationByModules(nav.navigation, parent([])).some(i => i.code === 'PESV'))
  const enabled = parent([child('PESV_RESPONSIBLE'), child('PESV_AUDITS')])
  const pesv = nav.filterNavigationByModules(nav.navigation, enabled).find(i => i.code === 'PESV')
  assert.deepEqual(pesv.subItems.map(i => i.code), ['PESV', 'PESV_RESPONSIBLE'])
  assert.equal(nav.isDashboardPathAllowed('/dashboard/pesv-policy', enabled), false)
  assert.equal(nav.isDashboardPathAllowed('/dashboard/pesv-risks', enabled), false)
  assert.equal(nav.isDashboardPathAllowed('/dashboard/pesv-responsible', enabled), true)
  for (const name of ['responsible', 'committee', 'policy', 'leadership', 'diagnosis']) {
    const source = fs.readFileSync(path.join(root, `app/dashboard/pesv-${name}/page.tsx`), 'utf8')
    assert.ok(!/localStorage|MOCK_EMPLOYEES|mockCollaborators|initialPolicies|initialRecords|initialDiagnoses/.test(source), name)
  }
  const objective = load('lib/pesv/objectives-api.ts')
  assert.deepEqual(objective.objectivePayload({ year: '2026', baseline: '0', target: '100', name: 'Prueba' }, 2), { year: 2026, baseline: 0, target: 100, name: 'Prueba', version: 2 })
  const planning = load('lib/pesv/planning-api.ts'), domain = load('lib/pesv/planning.ts')
  const investigation = load('lib/pesv/road-investigations-api.ts')
  const operationalKinds = {
    'emergency-plan': 'emergencyPlans', 'road-drill': 'roadDrills',
    'road-protocol': 'roadProtocols', 'managed-road': 'managedRoads',
    'road-action': 'roadActions', 'road-inspection': 'roadInspections',
    'road-maintenance': 'roadMaintenance', 'road-incident': 'roadIncidents',
  }
  for (const module of ['emergencies', 'managed-roads']) {
    assert.equal(planning.isPlanningApiModule(module), true)
    for (const kind of domain.configs[module].kinds) {
      assert.equal(planning.planningResource(kind.id), operationalKinds[kind.id])
      const payload = planning.planningPayload(kind, { ...domain.initialValues(kind), version: '1.0' }, [], {}, 7)
      assert.equal(payload.recordVersion, 7)
      assert.equal(payload.version, kind.fields.some(f => f.key === 'version') ? '1.0' : undefined)
    }
  }
  calls = []
  respond = url => response(url.includes('/road-inspections?page=') ? [{ id: 'inspection', status: 'COMPLETED' }] : url.includes('/documents?') ? [] : url.endsWith('/inspection') ? { id: 'inspection', name: 'Inspección', recordVersion: 2 } : [])
  const emptyCatalogs = new Proxy({}, { get: () => [] })
  assert.equal((await planning.planningRecords('managed-roads', emptyCatalogs))[0].remoteVersion, 2)
  assert.ok(!calls.some(call => call.url.includes('/inspection/entries')))
  calls = []
  respond = url => response(url.includes('/road-inspections?') ? [] : { recordVersion: 3, nextInspectionDate: '2026-11-13' })
  await planning.syncManagedRoadInspection({ id: 'inspection', values: { roadId: 'road', inspectionDate: '2026-11-13', nextInspectionDate: '2027-11-13' } })
  assert.deepEqual(JSON.parse(calls.at(-1).body), { nextInspectionDate: '2027-11-13', recordVersion: 3 })
  const stage = { id: 'stage', key: 'CAUSES', date: '2026-11-13', authorId: 'author', notes: 'Análisis', details: { human: 'Hallazgo' }, version: 3 }
  calls = []
  respond = url => response(url.includes('/documents?') ? [{ id: 'doc', referenceId: 'stage', referenceType: 'PESV_INVESTIGATION_STAGE', originalName: 'soporte.pdf' }] : {
    record: { id: 'case', name: 'Siniestro', procedureId: 'procedure', consecutive: 'INV-2026-0001', version: 4 },
    stages: [{ ...investigation.stagePayload(stage), id: 'stage' }], actions: [], followUps: [], evaluations: [], diffusions: [], history: [],
  })
  const remoteCase = await investigation.investigationCase('case', emptyCatalogs, [])
  assert.equal(remoteCase.stages[0].notes, stage.notes)
  assert.deepEqual(remoteCase.stages[0].details, stage.details)
  assert.equal(remoteCase.evidence[0].targetId, 'stage')
  assert.equal(remoteCase.consecutive, 'INV-2026-0001')
  calls = []; respond = () => response({ id: 'doc' })
  await api.uploadPesvDocument('roadDrills', 'drill', file, '', 'entry')
  await api.uploadPesvDocument('roadMaintenance', 'maintenance', file, '', 'entry')
  await api.uploadPesvDocument('roadInvestigations', 'case', file, '', 'stage')
  assert.deepEqual(calls.map(c => c.body.get('type')), ['PESV_EMERGENCY_EVIDENCE', 'PESV_MANAGED_ROAD_EVIDENCE', 'PESV_INVESTIGATION_EVIDENCE'])
  assert.deepEqual(calls.map(c => c.body.get('targetId')), ['entry', 'entry', 'stage'])
  await assert.rejects(() => api.uploadPesvDocument('investigationProcedures', 'procedure', file), /no admite/)
  calls = []
  const stages = load('lib/pesv/road-investigations.ts').stageDefinitions.map(({ key }) => ({ id: key, key }))
  const readyCase = { ...remoteCase, stages, actions: [{ id: 'action', followUps: [{ id: 'follow-up', progress: 100 }], evaluations: [{ followUpId: 'follow-up', result: 'EFICAZ' }] }], diffusions: [{ id: 'diffusion' }], evidence: [{ targetId: 'EVIDENCE' }, { targetId: 'diffusion' }] }
  await investigation.closeInvestigationIfReady({ ...readyCase, evidence: [] })
  assert.equal(calls.length, 0)
  await investigation.closeInvestigationIfReady(readyCase)
  assert.deepEqual(calls.map(c => [c.method, c.url]), [['PUT', '/api/pesv/road-investigations/case/close']])
  assert.deepEqual(investigation.investigationPayload({ name: 'Siniestro' }, 'procedure', [{ id: 'local', name: 'Ana', organization: 'Empresa' }], 4).externalInvestigators, [{ name: 'Ana', organization: 'Empresa' }])
  assert.ok(!/localStorage|readStore|FileReader|demoInvestigations/.test(fs.readFileSync(path.join(root, 'app/dashboard/pesv-investigations/page.tsx'), 'utf8')))
  assert.equal(planning.planningResource('program'), 'programs')
  assert.equal(planning.planningResource('work-activity'), 'workActivities')
  assert.equal(planning.planningResource('competency'), 'competencies')
  assert.equal(planning.planningResource('training-activity'), 'trainingActivities')
  assert.equal(planning.planningResource('procedure'), 'behaviorProcedures')
  assert.equal(planning.planningResource('behavior-evaluation'), 'behaviorEvaluations')
  const procedure = domain.configs.behavior.kinds[0]
  const procedurePayload = planning.planningPayload(procedure, { ...domain.initialValues(procedure), name: 'Procedimiento', version: '2.0' }, [], {}, 7)
  assert.equal(procedurePayload.version, '2.0'); assert.equal(procedurePayload.recordVersion, 7)
  assert.equal(planning.planningEntryPayload('work-activity', { id: 'do-not-send', kind: 'FOLLOW_UP', progress: 75, date: '2026-10-29', observations: 'Avance' }).measuredValue, 75)
  const program = domain.configs.programs.kinds[0]
  const activity = { id: 'client-only', name: 'Actividad', responsibleId: 'person-id', responsible: 'Ana', startDate: '2026-01-01', endDate: '2026-12-31', budget: '0' }
  const catalogs = { people: [{ value: 'person-id', label: 'Ana' }] }
  const programPayload = planning.planningPayload(program, domain.initialValues(program), [activity], catalogs)
  assert.equal(programPayload.activities[0].responsibleId, 'person-id'); assert.equal(programPayload.activities[0].id, undefined)
  assert.throws(() => planning.planningPayload(program, domain.initialValues(program), [{ ...activity, budget: '100' }], catalogs), /presupuesto/)
  const risk = load('lib/pesv/road-risks-api.ts')
  const riskPayload = risk.roadRiskPayload({ name: 'Riesgo', diagnosisId: '', sourceId: '', sourceLabel: 'server-only', exposure: 3, probability: 2, history: ['do-not-send'] }, 2)
  assert.equal(riskPayload.version, 2); assert.equal(riskPayload.sourceLabel, undefined); assert.equal(riskPayload.history, undefined); assert.equal(riskPayload.diagnosisId, undefined)
  const integrated = ['PESV_PROGRAMS', 'PESV_WORK_PLAN', 'PESV_RISKS', 'PESV_TRAINING', 'PESV_BEHAVIOR', 'PESV_EMERGENCIES', 'PESV_INVESTIGATIONS', 'PESV_MANAGED_ROADS']
  for (const code of integrated) assert.ok(nav.filterNavigationByModules(nav.navigation, parent([child(code)])).find(i => i.code === 'PESV').subItems.some(i => i.code === code))
  assert.ok(!/localStorage|FileReader/.test(fs.readFileSync(path.join(root, 'app/dashboard/pesv-risks/page.tsx'), 'utf8')))
  console.log('PESV API tests passed: CRUD routes, pagination, permissions, concurrency, evidence and DTO payloads')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
