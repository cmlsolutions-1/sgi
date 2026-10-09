const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript')
const root = path.resolve(__dirname, '..'), cache = new Map(), store = new Map()
function load(file) {
 const full = path.resolve(root, file)
 if (cache.has(full)) return cache.get(full)
 const module = { exports: {} }; cache.set(full, module.exports)
 const code = ts.transpileModule(fs.readFileSync(full, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
 new Function('module', 'exports', 'require', code)(module, module.exports, name => name.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(full), `${name}.ts`))) : require(name))
 return module.exports
}
global.window = {}; global.localStorage = { getItem: key => store.get(key) ?? null }
const planning = load('lib/pesv/planning.ts'), api = load('lib/pesv/assurance.ts'), standards = load('lib/pesv/standards.ts')
const today = planning.dateToday(), catalogs = planning.loadCatalogs(), records = []
let checks = 0
const equal = (a, b) => { assert.deepEqual(a, b); checks++ }
for (const [module, config] of Object.entries(api.assuranceConfigs)) {
 const kinds = module === 'statistics' ? [...config.kinds].sort((a, b) => Number(b.id === 'loss-matrix') - Number(a.id === 'loss-matrix')) : config.kinds
 for (const kind of kinds) {
  const values = api.deriveAssurance(kind.id, api.assuranceDemo(kind, catalogs, today), records)
  equal(planning.validateRecord(kind, values, [], catalogs), null)
  const item = { id: kind.id, kind: kind.id, values, entries: [], activities: [], evidence: [], history: [], links: {}, createdAt: `${today}T12:00:00-05:00` }
  records.push(item)
  const reference = api.assuranceCatalogKinds[kind.id]
  if (reference) catalogs[reference].push({ value: item.id, label: values.name, year: values.year })
  store.set(planning.storageKey(module), JSON.stringify(records.filter(i => config.kinds.some(k => k.id === i.kind))))
 }
}
const item = kind => structuredClone(records.find(i => i.kind === kind))
const matrix = item('loss-matrix').values, event = item('statistical-event')
equal(api.lossClassification(event.values, matrix), 'Bajo')
equal(api.lossClassification({ ...event.values, personLoss: 'Fatalidades' }, matrix), 'Crítico')
equal(api.lossClassification({ ...event.values, directCosts: '10000001' }, matrix), 'Grave')
equal(api.lossClassification({ ...event.values, environmentImpact: 'Crítico' }, matrix), 'Crítico')
equal(api.lossClassification({ ...event.values, directCosts: '1000000' }, matrix), 'Bajo')
const other = { ...event, id: 'daily', values: { ...event.values, journey: 'Cotidiano / no laboral' } }
const summary = api.statisticalSummary([event, other], `${today.slice(0, 4)}-01-01`, today)
equal(summary.filter(r => r.journey === 'Laboral').reduce((n, r) => n + r.events, 0), 1)
equal(summary.filter(r => r.journey !== 'Laboral').reduce((n, r) => n + r.events, 0), 1)
equal(Boolean(api.validateAssurance({ id: 'statistical-event' }, { ...event.values, fatalities: '1' }, undefined, today)), true)
const audit = item('pesv-audit')
equal(api.documentedAudit(audit), false)
audit.values.phase = 'Realizada'; audit.values.auditDate = today; audit.values.conclusions = 'Conclusiones verificadas'
standards.pesvSteps.forEach((_, index) => { audit.values[`step_${index + 1}`] = standards.stepApplies(index + 1, audit.values.level) ? 'Cumple' : 'No aplica'; audit.values[`stepNotes_${index + 1}`] = 'Soporte / fundamento verificado' })
equal(api.auditComplete(audit.values), true)
equal(api.documentedAudit(audit), false)
audit.evidence.push({ mime: 'application/pdf' })
equal(api.documentedAudit(audit), true)
audit.values.step_3 = 'No aplica'
equal(Boolean(api.validateAssurance({ id: 'pesv-audit' }, audit.values, audit, today)), true)
const finding = item('audit-finding')
finding.entries.push({ id: 'follow', kind: 'FOLLOW_UP', progress: 100, date: today })
finding.evidence.push({ targetId: 'follow' })
equal(api.completedFinding(finding), false)
finding.values.efficacy = 'Eficaz'; finding.values.verificationDate = today; finding.values.verificationToken = 'current'
finding.evidence.push({ targetId: 'VERIFICATION:old' })
equal(api.completedFinding(finding), false)
finding.evidence.push({ targetId: 'VERIFICATION:current' })
equal(api.completedFinding(finding), true)
const q = Math.ceil(Number(today.slice(5, 7)) / 3), communication = item('pesv-communication')
equal(api.communicationCoverage([communication], today.slice(0, 4), today)[q - 1].status, 'Pendiente de evidencia')
communication.evidence.push({ id: 'proof' })
equal(api.communicationCoverage([communication], today.slice(0, 4), today)[q - 1].status, 'Documentada')
equal(Boolean(api.validateAssurance({ id: 'pesv-communication' }, { ...communication.values, quarter: String(q === 4 ? 1 : 4) }, undefined, today)), true)
const format = item('pesv-acpm-format')
equal(Boolean(api.validateAssurance({ id: format.kind }, { ...format.values, endDate: '2030-01-01' }, format, today)), true)
equal(api.deriveAssurance(format.kind, { ...format.values, consecutive: '' }, [format]).consecutive.endsWith('-002'), true)
equal(api.deriveAssurance('statistical-analysis', { periodStart: today, periodEnd: today }, [event]).statisticsSnapshot.includes(event.id), true)
console.log(`${checks} PESV assurance checks passed`)
