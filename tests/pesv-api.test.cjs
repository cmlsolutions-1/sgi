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
  const enabled = parent([child('PESV_RESPONSIBLE'), child('PESV_IMPROVEMENT')])
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
  const journeyProgressRecord = { kind: 'journey', values: {}, evidence: [], remoteProgress: 20, remoteStatus: 'IN_PROGRESS', entries: [{ id: 'first', kind: 'FOLLOW_UP', date: '2026-11-18', progress: 20 }] }
  assert.equal(domain.completion(journeyProgressRecord), 20)
  assert.equal(domain.followUpProgressError(journeyProgressRecord, 80), null)
  assert.match(domain.followUpProgressError(journeyProgressRecord, 81), /máximo 80/)
  assert.match(domain.followUpProgressError(journeyProgressRecord, 0), /mayor a 0/)
  const completedJourney = { ...journeyProgressRecord, entries: [...journeyProgressRecord.entries, { id: 'second', kind: 'FOLLOW_UP', date: '2026-11-18', progress: 80 }] }
  assert.equal(domain.completion(completedJourney), 100)
  assert.match(domain.followUpProgressError(completedJourney, 1), /ya alcanzó/)
  assert.equal(domain.itemStatus(completedJourney), 'Pendiente de evidencia')
  assert.equal(domain.itemStatus({ ...completedJourney, evidence: [{ targetId: 'second' }] }), 'Cumplido')
  assert.equal(domain.completion({ ...journeyProgressRecord, kind: 'work-activity' }), 20)
  const maintenance = { ...journeyProgressRecord, kind: 'vehicle-maintenance' }
  assert.equal(domain.completion(maintenance), 20)
  assert.equal(domain.followUpProgressError(maintenance, 80), null)
  assert.match(domain.followUpProgressError(maintenance, 81), /máximo 80/)
  const completedMaintenance = { ...completedJourney, kind: 'vehicle-maintenance' }
  assert.equal(domain.completion(completedMaintenance), 100)
  assert.match(domain.followUpProgressError(completedMaintenance, 1), /mantenimiento ya alcanzó/)
  assert.equal(domain.itemStatus(completedMaintenance), 'Pendiente de evidencia')
  assert.equal(domain.itemStatus({ ...completedMaintenance, evidence: [{ targetId: 'second' }] }), 'Cumplido')
  for (const progress of [0, 20, 80, 100]) {
    assert.deepEqual(planning.planningEntryPayload('vehicle-maintenance', { id: 'entry', kind: 'FOLLOW_UP', progress }), { kind: 'FOLLOW_UP', progress, measuredValue: progress })
  }
  const journeyKind = domain.configs.journeys.kinds.find(kind => kind.id === 'journey')
  for (const key of ['departureTime', 'arrivalTime']) {
    assert.equal(journeyKind.fields.find(field => field.key === key).type, 'time')
  }
  const eveningProcedure = { kind: 'journey-procedure', values: {}, createdAt: '2026-11-19T02:16:40.000Z', entries: [] }
  assert.equal(domain.bogotaCalendarDate(eveningProcedure.createdAt), '2026-11-18')
  assert.equal(domain.bogotaCalendarDate('2026-11-18'), '2026-11-18')
  assert.equal(domain.entryDateError(eveningProcedure, 'DIFFUSION', '2026-11-18', '2026-11-18'), null)
  assert.match(domain.entryDateError(eveningProcedure, 'DIFFUSION', '2026-11-19', '2026-11-18'), /futuro/)
  assert.equal(domain.entryDateError(eveningProcedure, 'DIFFUSION', '2026-11-17', '2026-11-18'), null)
  assert.equal(domain.entryDateError({ ...eveningProcedure, createdAt: '2026-11-19T07:00:00Z' }, 'DIFFUSION', '2026-11-18', '2026-11-18'), null)
  assert.equal(domain.entryDateError({ ...eveningProcedure, entries: [{ kind: 'ANNUAL_REVIEW', date: '2026-11-18' }] }, 'DIFFUSION', '2026-11-18', '2026-11-18'), null)
  const changeProcedure = { ...eveningProcedure, kind: 'change-procedure', createdAt: '2026-11-26T07:00:00Z' }
  assert.equal(domain.entryDateError(changeProcedure, 'DIFFUSION', '2026-11-25', '2026-11-25'), null)
  assert.equal(domain.entryDateError(changeProcedure, 'DIFFUSION', '2026-11-24', '2026-11-25'), null)
  assert.match(domain.entryDateError(changeProcedure, 'DIFFUSION', '2026-11-26', '2026-11-25'), /futuro/)
  const reviewedProcedure = { ...changeProcedure, entries: [{ kind: 'ANNUAL_REVIEW', date: '2026-11-25' }] }
  assert.match(domain.entryDateError(reviewedProcedure, 'DIFFUSION', '2026-11-24', '2026-11-25'), /último registro/)
  assert.equal(domain.entryDateError(reviewedProcedure, 'DIFFUSION', '2026-11-25', '2026-11-25'), null)
  const archiveProcedure = { ...changeProcedure, kind: 'archive-procedure' }
  assert.equal(domain.entryDateError(archiveProcedure, 'ANNUAL_REVIEW', '2026-11-25', '2026-11-25'), null)
  assert.equal(domain.entryDateError(archiveProcedure, 'ANNUAL_REVIEW', '2026-11-24', '2026-11-25'), null)
  assert.match(domain.entryDateError(archiveProcedure, 'ANNUAL_REVIEW', '2026-11-26', '2026-11-25'), /futuro/)
  const previouslyReviewedArchive = { ...archiveProcedure, entries: [{ kind: 'ANNUAL_REVIEW', date: '2026-11-25' }] }
  assert.match(domain.entryDateError(previouslyReviewedArchive, 'ANNUAL_REVIEW', '2026-11-24', '2026-11-25'), /último registro/)
  assert.equal(domain.entryDateError(previouslyReviewedArchive, 'ANNUAL_REVIEW', '2026-11-25', '2026-11-25'), null)
  assert.match(domain.entryDateError({ ...eveningProcedure, kind: 'journey', values: { startDate: '2026-11-18' } }, 'DIFFUSION', '2026-11-17', '2026-11-18'), /inicio/)
  assert.match(domain.entryDateError({ ...eveningProcedure, createdAt: '2026-11-17T18:00:00Z', entries: [{ kind: 'ANNUAL_REVIEW', date: '2026-11-18' }] }, 'DIFFUSION', '2026-11-17', '2026-11-18'), /último registro/)
  const contracts = require('./fixtures/pesv-phase4-contracts.json')
  for (const module of ['journeys', 'vehicle-inspections', 'change-contractors', 'document-retention', 'statistics', 'audits']) {
    assert.equal(planning.isPlanningApiModule(module), true)
    for (const kind of domain.configs[module].kinds) {
      const values = domain.initialValues(kind)
      for (const field of kind.fields) {
        if (field.multiple) values[field.key] = ['linked-id']
        else if (field.reference) values[field.key] = 'linked-id'
        else if (field.type === 'year') values[field.key] = '2026'
        else if (['money', 'number'].includes(field.type)) values[field.key] = '1'
        else if (field.type === 'date') values[field.key] = '2026-01-01'
        else if (field.type === 'time') values[field.key] = '08:30'
        else if (field.type === 'select') values[field.key] = field.options[0]
        else values[field.key] = 'Texto'
      }
      const payload = planning.planningPayload(kind, values, [], {}, 8)
      const contract = contracts[kind.id]
      assert.equal(payload.recordVersion, 8, kind.id)
      for (const key of contract.required) assert.ok(key in payload, kind.id + ' required ' + key)
      for (const key of Object.keys(payload)) assert.ok(key === 'recordVersion' || contract.fields.includes(key), kind.id + ' unexpected ' + key)
      assert.ok(api.pesvResources[planning.planningResource(kind.id)], kind.id)
    }
  }
  const inspectionKind = domain.configs['vehicle-inspections'].kinds.find(k => k.id === 'vehicle-inspection')
  assert.equal(inspectionKind.fields.find(field => field.key === 'inspectionTime').type, 'time')
  assert.equal(planning.planningPayload(inspectionKind, { ...domain.initialValues(inspectionKind), inspectionTime: '07:30' }, [], {}).inspectionTime, '07:30')
  const inspectionDto = planning.planningPayload(inspectionKind, { ...domain.initialValues(inspectionKind), check_registration: 'Cumple', check_safetyKit: 'No cumple' }, [], {})
  assert.equal(inspectionDto.check_transitLicense, 'Cumple')
  assert.equal(inspectionDto.check_safetyEquipment, 'No cumple')
  assert.equal(inspectionDto.check_registration, undefined)
  const indicatorApi = load('lib/pesv/indicators-api.ts'), indicators = load('lib/pesv/indicators.ts')
  const workDefinition = indicators.definitions.find(d => d.id === 'work')
  const correctDefinition = { id: 'CPlan', formula: 'PERCENTAGE', frequency: 'QUARTERLY', levels: ['Básico', 'Estándar', 'Avanzado'], requiresLoss: false }
  assert.doesNotThrow(() => indicatorApi.assertIndicatorDefinition(workDefinition, [correctDefinition]))
  assert.throws(() => indicatorApi.assertIndicatorDefinition(workDefinition, [{ ...correctDefinition, formula: 'COST' }]), /no coincide/)
  calls = []
  await assert.rejects(() => indicatorApi.saveApiSheet({ ...indicators.emptySheet(workDefinition, '2026'), workActivityIds: ['activity'] }, [{ ...correctDefinition, frequency: 'MONTHLY' }]), /no coincide/)
  assert.equal(calls.length, 0, 'No writes for incompatible indicator definitions')
  const sheetForApi = { ...indicators.emptySheet(workDefinition, '2026'), remoteId: 'sheet-id', remoteVersion: 4, baseline: '10', target: '100', responsibleId: 'employee-id', workActivityIds: ['activity-id'], workActivityNames: ['Actividad'], sourceReliability: 'Actas' }
  calls = []; respond = () => response({ id: 'sheet-id' })
  await indicatorApi.saveApiSheet(sheetForApi, [correctDefinition])
  assert.equal(calls[0].method, 'PUT')
  assert.equal(JSON.parse(calls[0].body).version, 4)
  assert.equal(JSON.parse(calls[0].body).indicatorId, 'CPlan')
  assert.equal(JSON.parse(calls[0].body).workActivityNames, undefined)
  const measurementForApi = { id: 'measurement-id', remoteVersion: 2, indicatorId: 'work', year: '2026', period: '1', loss: '', numerator: 1, denominator: 2, result: 50, analysis: 'Avance', source: 'Plan', sourceDetails: '', registeredAt: '2026-04-01', definition: workDefinition, sheet: sheetForApi, rateConstant: 5000000, costMethod: 'SUM', evidence: [] }
  await indicatorApi.saveApiMeasurement(measurementForApi, [correctDefinition])
  const sentMeasurement = JSON.parse(calls.at(-1).body)
  assert.equal(sentMeasurement.sheetId, 'sheet-id')
  assert.equal(sentMeasurement.period, 1)
  assert.equal(sentMeasurement.loss, undefined)
  await indicatorApi.saveApiMeasurement({ ...measurementForApi, correctionReason: 'Corregir dato' }, [correctDefinition], measurementForApi)
  assert.ok(calls.at(-1).url.endsWith('/measurement-id/rectifications'))
  assert.equal(JSON.parse(calls.at(-1).body).version, 2)
  await assert.rejects(() => indicatorApi.uploadIndicatorEvidence('protocol', 'id', file), /no dispone/)
  await indicatorApi.uploadIndicatorEvidence('report', 'report-id', file, 'SIGNED')
  assert.equal(calls.at(-1).body.get('targetId'), null)
  assert.equal(calls.at(-1).body.get('description'), 'SafeCloud:purpose:SIGNED')
  const rawSheet = { ...sheetForApi, id: 'sheet-id', indicatorId: 'CPlan', version: 5, baseline: '20', year: 2026, status: 'ACTIVE' }
  const rawMeasurement = { ...sentMeasurement, id: 'measurement-id', result: '50.000000', version: 2, status: 'CLOSED', registeredAt: '2026-04-01', history: [{ event: 'CREATED', createdAt: '2026-04-01' }] }
  respond = url => {
    if (url.endsWith('/definitions')) return response([correctDefinition])
    if (url.endsWith('/protocol')) return response({ id: 'protocol-id', level: 'Básico', version: 3, rateConstant: '5000000', costMethod: 'SUM', measurementProtocol: JSON.stringify({ safecloudProtocol: 1, fields: { name: 'Protocolo real' } }) })
    if (url.includes('/documents?')) return response([{ id: 'proof', originalName: 'acta.pdf' }])
    if (url.endsWith('/sheet-id')) return response(rawSheet)
    if (url.endsWith('/measurement-id')) return response(rawMeasurement)
    return response({ items: url.includes('/sheets?') ? [rawSheet] : url.includes('/measurements?') ? [rawMeasurement] : [], total: url.includes('/sheets?') || url.includes('/measurements?') ? 1 : 0 })
  }
  const actualIndicators = await indicatorApi.loadApiIndicators({ workActivities: [] })
  assert.equal(actualIndicators.state.protocol.name, 'Protocolo real')
  assert.equal(actualIndicators.state.measurements[0].result, 50)
  assert.equal(actualIndicators.state.measurements[0].sheet.baseline, '10', 'Historical snapshot is not overwritten by current sheet')
  assert.equal(actualIndicators.state.sheets[0].baseline, '20')
  assert.equal(actualIndicators.state.measurements[0].evidence[0].name, 'acta.pdf')
  assert.equal(actualIndicators.state.history.length, 1)
  const remoteObjective = { id: 'objective-api', values: { year: '2026', name: 'Objetivo real' } }
  const annualDraft = indicatorApi.buildApiAnnual({ year: '2026', companyName: 'Empresa real' }, { fleet: [], actors: [], contractors: [], fines: [] }, [], actualIndicators.state, { records: { objectives: [remoteObjective] }, diagnoses: [] })
  assert.equal(annualDraft.id, '', 'The server assigns the report ID')
  assert.equal(annualDraft.measurements[0].id, 'measurement-id')
  remoteObjective.values.name = 'Cambio posterior'
  actualIndicators.state.measurements[0].numerator = 99
  assert.equal(annualDraft.objectives[0].values.name, 'Objetivo real')
  assert.equal(annualDraft.measurements[0].numerator, 1, 'Draft snapshots do not change with loaded API state')
  const annualPayload = indicatorApi.annualReportPayload(annualDraft)
  assert.equal(annualPayload.year, 2026)
  assert.equal(JSON.parse(annualPayload.rows.find(row => row.category === 'SNAPSHOT' && row.label === 'measurements').value)[0].sheet.baseline, '10')
  const beforeFailure = respond
  respond = () => { throw new Error('Backend unavailable') }
  await assert.rejects(() => indicatorApi.loadApiIndicators({ workActivities: [] }), /Backend unavailable/)
  respond = beforeFailure
  const findingValues = { efficacy: 'Eficaz', evaluatorId: 'employee', verificationDate: '2026-01-02', verificationNotes: 'Verificado' }
  const verification = await planning.verificationToken(findingValues, 'follow-up-1')
  assert.equal(verification.length, 64)
  assert.notEqual(verification, await planning.verificationToken(findingValues, 'follow-up-2'))
  const verificationTarget = await planning.planningDocumentTarget({ kind: 'audit-finding', values: findingValues, entries: [{ id: 'follow-up-1', kind: 'FOLLOW_UP' }] }, 'VERIFICATION:old-client-token')
  assert.deepEqual(verificationTarget, { targetId: 'follow-up-1', description: 'SafeCloud:verificacion:' + verification })
  const checkValues = Object.fromEntries(load('lib/pesv/operations.ts').contractorChecks.map(([key]) => ['check_' + key, 'Cumple']))
  calls = []; respond = url => response(url.includes('/contractor-checks?') ? [] : { recordVersion: 2, nextVerificationDate: '2026-01-01' })
  await planning.syncContractorVerification({ id: 'check', values: { ...checkValues, contractorId: 'contractor', verificationDate: '2026-01-01', nextVerificationDate: '2027-01-01' } })
  assert.equal(calls.at(-1).url, '/api/pesv/change-contractors/contractors/contractor')
  assert.equal(JSON.parse(calls.at(-1).body).recordVersion, 2)
  calls = []
  await planning.syncContractorVerification({ id: 'check', values: { ...checkValues, check_pesv: 'No cumple', contractorId: 'contractor' } })
  assert.equal(calls.length, 0, 'Failed verification does not advance the contractor deadline')
  assert.ok(!/localStorage|readStore|loadCatalogs|FileReader|demonstrationMeasurements/.test(fs.readFileSync(path.join(root, 'app/dashboard/pesv-indicators/page.tsx'), 'utf8')))
  const historical = new Proxy({}, { get() { throw new Error('Local source must not be read') } })
  global.window = { localStorage: historical }
  assert.equal(indicators.sourceSuggestion(workDefinition, '2026', '1', indicators.emptySheet(workDefinition, '2026'), '', { records: {}, diagnoses: [] }), null)
  delete global.window
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
  for (const progress of [0, 75, 100]) {
    const payload = planning.planningEntryPayload('journey', { id: 'do-not-send', kind: 'FOLLOW_UP', progress, date: '2026-11-18', observations: 'Avance del desplazamiento' })
    assert.equal(payload.progress, progress)
    assert.equal(payload.measuredValue, progress)
    assert.equal(payload.id, undefined)
  }
  assert.equal(planning.planningEntryPayload('journey', { id: 'entry', kind: 'FOLLOW_UP', progress: 75, measuredValue: 0 }).measuredValue, 0)
  assert.deepEqual(planning.planningEntryPayload('journey', { id: 'entry', kind: 'DIFFUSION', date: '2026-11-18', medium: 'Correo' }), { kind: 'DIFFUSION', date: '2026-11-18', medium: 'Correo' })
  const program = domain.configs.programs.kinds[0]
  const newProgramFollowUp = { kind: 'program', values: { baseline: 'Sin controles implementados' }, entries: [] }
  assert.deepEqual(domain.initialFollowUpValues(newProgramFollowUp), { progress: '0', measuredValue: '0' })
  assert.deepEqual(domain.initialFollowUpValues({ ...newProgramFollowUp, remoteProgress: 20, entries: [{ kind: 'FOLLOW_UP', progress: 20, measuredValue: 8.5 }] }), { progress: '20', measuredValue: '8.5' })
  assert.equal(domain.initialFollowUpValues({ ...newProgramFollowUp, kind: 'objective', values: { baseline: '15' } }).measuredValue, '15')
  assert.equal(domain.initialFollowUpValues({ ...newProgramFollowUp, kind: 'journey' }).progress, '')
  assert.deepEqual(planning.planningEntryPayload('program', { id: 'client-only', kind: 'FOLLOW_UP', date: '2026-11-25', progress: 20, measuredValue: 8.5, observations: 'Medición del indicador' }), { kind: 'FOLLOW_UP', date: '2026-11-25', progress: 20, measuredValue: 8.5, observations: 'Medición del indicador' })
  const activity = { id: 'client-only', name: 'Actividad', responsibleId: 'person-id', responsible: 'Ana', startDate: '2026-01-01', endDate: '2026-12-31', budget: '0' }
  const catalogs = { people: [{ value: 'person-id', label: 'Ana' }] }
  const programPayload = planning.planningPayload(program, domain.initialValues(program), [activity], catalogs)
  assert.equal(programPayload.activities[0].responsibleId, 'person-id'); assert.equal(programPayload.activities[0].id, undefined)
  assert.equal(programPayload.activities[0].budget, 0)
  for (const budget of ['100', '250000', '250000.50']) {
    const payload = planning.planningPayload(program, { ...domain.initialValues(program), budget: '1000000' }, [{ ...activity, budget }], catalogs, 4)
    assert.equal(payload.activities[0].budget, Number(budget))
    assert.equal(payload.budget, 1000000, 'The total program budget is independent of activity budgets')
    assert.equal(payload.version, 4)
    calls = []; respond = () => response({ id: 'program-id' })
    await api.savePesv('programs', payload)
    await api.savePesv('programs', payload, 'program-id')
    assert.equal(calls[0].method, 'POST'); assert.equal(calls[1].method, 'PUT')
    for (const call of calls) assert.equal(JSON.parse(call.body).activities[0].budget, Number(budget))
  }
  for (const budget of ['-1', 'Infinity', 'NaN', 'abc', '']) assert.throws(() => planning.planningPayload(program, domain.initialValues(program), [{ ...activity, budget }], catalogs), /presupuesto/)
  const serverActivity = { ...activity, id: 'server-activity', budget: 350000.5 }
  const serverProgram = { id: 'program-id', name: 'Programa', status: 'PENDING', budget: 1000000, version: 4, activities: [serverActivity, { ...serverActivity, id: 'legacy-activity', budget: undefined }], history: [
    { event: 'CREATED', createdAt: '2026-01-01T15:00:00Z', snapshot: { name: 'Programa anterior', budget: 800000, activities: [{ ...serverActivity, budget: 200000 }] } },
    { event: 'UPDATED', createdAt: '2026-02-01T15:00:00Z', snapshot: { previous: { budget: 800000 }, current: { name: 'Programa actualizado', budget: 1000000, activities: [serverActivity] } } },
  ] }
  respond = url => response(url.includes('/documents') || url.includes('/entries') ? [] : url.includes('/program-id') ? serverProgram : { items: [{ id: 'program-id' }], total: 1 })
  const [loadedProgram] = await planning.planningRecords('programs', catalogs)
  assert.equal(loadedProgram.activities[0].budget, '350000.5')
  assert.equal(loadedProgram.activities[1].budget, '0')
  assert.equal(loadedProgram.history[0].activities[0].budget, '200000')
  assert.equal(loadedProgram.history[1].activities[0].budget, '350000.5')
  assert.equal(loadedProgram.history[1].snapshot.name, 'Programa actualizado')
  const reedited = planning.planningPayload(program, loadedProgram.values, loadedProgram.activities, catalogs, loadedProgram.remoteVersion)
  assert.equal(reedited.activities[0].budget, 350000.5)
  assert.equal(reedited.activities[1].budget, 0)
  const risk = load('lib/pesv/road-risks-api.ts')
  const riskPayload = risk.roadRiskPayload({ name: 'Riesgo', diagnosisId: '', sourceId: '', sourceLabel: 'server-only', exposure: 3, probability: 2, history: ['do-not-send'] }, 2)
  assert.equal(riskPayload.version, 2); assert.equal(riskPayload.sourceLabel, undefined); assert.equal(riskPayload.history, undefined); assert.equal(riskPayload.diagnosisId, undefined)
  const integrated = ['PESV_PROGRAMS', 'PESV_WORK_PLAN', 'PESV_RISKS', 'PESV_TRAINING', 'PESV_BEHAVIOR', 'PESV_EMERGENCIES', 'PESV_INVESTIGATIONS', 'PESV_MANAGED_ROADS', 'PESV_JOURNEYS', 'PESV_VEHICLE_INSPECTIONS', 'PESV_CHANGE_CONTRACTORS', 'PESV_DOCUMENT_RETENTION', 'PESV_INDICATORS', 'PESV_STATISTICS', 'PESV_AUDITS']
  for (const code of integrated) assert.ok(nav.filterNavigationByModules(nav.navigation, parent([child(code)])).find(i => i.code === 'PESV').subItems.some(i => i.code === code))
  assert.ok(!/localStorage|FileReader/.test(fs.readFileSync(path.join(root, 'app/dashboard/pesv-risks/page.tsx'), 'utf8')))
  console.log('PESV API tests passed: CRUD routes, pagination, permissions, concurrency, evidence and DTO payloads')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
