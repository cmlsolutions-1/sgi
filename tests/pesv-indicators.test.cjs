const assert = require("node:assert/strict")
const fs = require("node:fs")
const path = require("node:path")
const ts = require("typescript")
const root = path.resolve(__dirname, "..")
const cache = new Map()
function load(file) {
  const full = path.resolve(root, file)
  if (cache.has(full)) return cache.get(full)
  const module = { exports: {} }
  cache.set(full, module.exports)
  const code = ts.transpileModule(fs.readFileSync(full, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function("module", "exports", "require", code)(module, module.exports, name => name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(full), `${name}.ts`))) : require(name))
  return module.exports
}
global.window = {}
const store = new Map()
global.localStorage = { getItem: key => store.get(key) ?? null }
const api = load("lib/pesv/indicators.ts")
const state = api.initialIndicatorsState()
const def = id => api.definitions.find(d => d.id === id)
const sheet = { ...api.emptySheet(def("work"), "2025"), sourceReliability: "Actas verificadas", responsibleId: "employee", baseline: "50", target: "100" }
function measurement(id, period, n, d, extra = {}) {
  const definition = def(id)
  return { id: `${id}-${period}`, indicatorId: id, year: "2025", period: String(period), loss: "", numerator: n, denominator: d, result: api.compute(definition, n, d, 5000000, "SUM"), definition, sheet, rateConstant: 5000000, costMethod: "SUM", evidence: [], ...extra }
}
let checks = 0
function equal(actual, expected) { assert.deepEqual(actual, expected); checks++ }
equal(api.definitions.length, 14)
equal(api.definitions.filter(d => d.levels.includes("Básico")).length, 11)
equal(api.quarterEnd("2026", "1"), "2026-03-31")
equal(api.quarterEnd("2026", "4"), "2026-12-31")
equal(api.periodRange("2024", "Mensual", "2").end, "2024-02-29")
equal(api.evidenceDate("2026-10-09T03:00:00Z"), "2026-10-08")
equal(api.compute(def("tsv"), 2, 10000, 5000000, "SUM"), 1000)
equal(api.compute(def("work"), 0, 0, 5000000, "SUM"), null)
equal(api.compute(def("cost"), 200, 50, 5000000, "SUM"), 250)
equal(api.compute(def("critical"), 2, 5, 5000000, "SUM"), -3)
const records = [measurement("work", 1, 1, 2), measurement("work", 2, 9, 10)]
equal(api.aggregate(def("work"), records, "2025", 2).value, 10 / 12 * 100)
equal(api.aggregate(def("work"), records, "2025", 3).value, null)
equal(api.aggregate(def("work"), records, "2025", 3).missing, ["3"])
const coverage = [measurement("coverage", 1, 5, 10), measurement("coverage", 2, 8, 10)]
equal(api.aggregate(def("coverage"), coverage, "2025", 2).value, 80)
const rectified = { ...records[0], id: "new", numerator: 2, result: 100, supersedesId: records[0].id }
equal(api.activeMeasurements([...records, rectified]).map(m => m.id), ["work-2", "new"])
equal(records[0].result, 50)
const rates = [measurement("tsv", 1, 1, 10), measurement("tsv", 2, 1, 10, { costMethod: "PRODUCT" })]
equal(api.aggregate(def("tsv"), rates, "2025", 2).value, 500000)
rates[1].rateConstant = 1000000
equal(api.aggregate(def("tsv"), rates, "2025", 2).reason, "Métodos de cálculo diferentes")
const form = { year: "2025", period: "1", loss: "", numerator: "1", denominator: "2", source: "Actas", analysis: "Seguimiento", correctionReason: "" }
equal(api.validateMeasurement(def("work"), sheet, form, state, undefined, "2026-10-08"), null)
equal(Boolean(api.validateMeasurement(def("work"), sheet, { ...form, numerator: "" }, state)), true)
equal(Boolean(api.validateMeasurement(def("work"), sheet, { ...form, numerator: "3" }, state)), true)
equal(Boolean(api.validateMeasurement(def("work"), sheet, { ...form, year: "2027" }, state)), true)
state.measurements = records
equal(Boolean(api.validateMeasurement(def("work"), sheet, form, state)), true)
equal(Boolean(api.validateMeasurement(def("work"), sheet, form, state, records[0])), true)
equal(api.validateMeasurement(def("work"), sheet, { ...form, correctionReason: "Corrección del acta" }, state, records[0]), null)
const report = api.makeAnnualReport({ year: "2025" }, { fleet: [], actors: [], contractors: [], fines: [] }, api.stepNames.map((name, i) => ({ step: i + 1, name, status: "Sin evaluar", observations: "" })), state)
records[0].numerator = 99
equal(report.measurements[0].numerator, 1)
equal(api.reportWarnings(report, "Básico", "2026-10-08").some(w => w.includes("auditoría interna")), true)
equal(api.reportWarnings(report, "Básico", "2026-10-08").some(w => w.includes("CSV")), true)
const activity = { id: "activity", kind: "work-activity", values: { year: "2025", endDate: "2025-03-20", name: "Actividad" }, entries: [{ id: "execution", kind: "FOLLOW_UP", date: "2025-03-20", progress: 100 }], evidence: [] }
store.set("safecloud:pesv-work-plan", JSON.stringify([activity]))
equal(api.sourceSuggestion(def("work"), "2025", "1", sheet).numerator, "0")
activity.evidence.push({ targetId: "execution", uploadedAt: "2025-03-21T12:00:00Z" })
store.set("safecloud:pesv-work-plan", JSON.stringify([activity]))
equal(api.sourceSuggestion(def("work"), "2025", "1", sheet).numerator, "1")
activity.evidence[0].uploadedAt = "2025-04-01T12:00:00Z"
store.set("safecloud:pesv-work-plan", JSON.stringify([activity]))
equal(api.sourceSuggestion(def("work"), "2025", "1", sheet).numerator, "0")
const inspection = { kind: "vehicle-inspection", values: { moment: "Preoperacional diaria", vehicleProfileId: "vehicle", inspectionDate: "2025-01-10" }, evidence: [{ uploadedAt: "2025-01-10T12:00:00Z" }] }
store.set("safecloud:pesv-vehicle-inspections", JSON.stringify([inspection, inspection]))
equal(api.sourceSuggestion(def("inspections"), "2025", "1", sheet).numerator, "1")
equal(api.sourceSuggestion(def("inspections"), "2025", "1", sheet).denominator, "")
const training = { ...activity, kind: "training-activity", entries: [{ id: "training-execution", kind: "FOLLOW_UP", date: "2025-03-10", progress: 100, attendeeIds: ["one", "two"] }], evidence: [{ targetId: "training-execution", uploadedAt: "2025-03-11T12:00:00Z" }] }
store.set("safecloud:pesv-training", JSON.stringify([training, training]))
equal(api.sourceSuggestion(def("coverage"), "2025", "1", sheet).numerator, "2")
equal(api.sourceSuggestion(def("coverage"), "2025", "1", sheet).denominator, "")
console.log(`${checks} PESV indicator checks passed`)
