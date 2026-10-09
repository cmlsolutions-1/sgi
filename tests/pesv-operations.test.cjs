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
  const resolve = name => name.startsWith(".") ? load(path.relative(root, path.resolve(path.dirname(full), `${name}.ts`))) : require(name)
  new Function("module", "exports", "require", code)(module, module.exports, resolve)
  return module.exports
}
const store = new Map()
global.window = {}
global.localStorage = { getItem: key => store.get(key) ?? null }
const planning = load("lib/pesv/planning.ts")
const ops = load("lib/pesv/operations.ts")
const today = planning.dateToday()
const catalogs = planning.loadCatalogs()
const items = []
let checks = 0
const check = (condition, message) => { assert.ok(condition, message); checks++ }

for (const [module, config] of Object.entries(ops.operationalConfigs)) {
  const records = []
  for (const kind of config.kinds) {
    const values = ops.operationalDemo(kind, catalogs, today)
    assert.equal(planning.validateRecord(kind, values, [], catalogs), null, `Valid demo: ${kind.id}`)
    checks++
    const record = { id: kind.id, kind: kind.id, values, activities: [], entries: [], evidence: [], links: {}, createdAt: `${today}T10:00:00-05:00`, history: [] }
    records.push(record); items.push(record)
    const reference = ops.operationalCatalogKinds[kind.id]
    if (reference) catalogs[reference].push({ value: kind.id, label: values.name })
    store.set(planning.storageKey(module), JSON.stringify(records))
  }
}
const item = id => structuredClone(items.find(i => i.kind === id))
const inspection = item("vehicle-inspection")
check(planning.itemStatus(inspection) === "Pendiente de verificación", "Draft inspection is not apt")
for (const [key] of ops.inspectionChecks) inspection.values[`check_${key}`] = "Cumple"
inspection.values.licenseExpiry = ops.retentionUntil(today, 1)
check(planning.itemStatus(inspection) === "Pendiente de evidencia", "Checklist requires evidence")
inspection.evidence.push({ id: "file", uploadedAt: `${today}T12:00:00-05:00`, name: "soporte.pdf", mime: "application/pdf", url: "data:application/pdf;base64,eA==" })
check(planning.itemStatus(inspection) === "Apto", "Complete supported inspection is apt")
inspection.values.check_lights = "No cumple"
check(planning.itemStatus(inspection) === "No apto", "Failure blocks apt status")
check(Boolean(ops.validateOperationalRecord({ id: "vehicle-inspection" }, inspection.values, undefined, today)), "Failure requires findings")
inspection.values.findings = "Luces inoperantes; restringir circulación"
inspection.values.check_lights = "Cumple"
inspection.values.soatExpiry = "2020-01-01"
check(planning.itemStatus(inspection) === "No apto", "Expired document prevents apt status")
check(Boolean(ops.validateOperationalRecord({ id: "vehicle-inspection" }, inspection.values, undefined, today)), "Expired document cannot be marked complies")
inspection.values.soatExpiry = ops.retentionUntil(today, 1)
inspection.values.check_helmet = "No aplica"
inspection.values.exceptions = "Automóvil, no motocicleta"
check(!ops.validateOperationalRecord({ id: "vehicle-inspection" }, inspection.values, undefined, today), "Justified non-applicable helmet is permitted for car")
inspection.values.vehicleType = "Motocicleta"
check(Boolean(ops.validateOperationalRecord({ id: "vehicle-inspection" }, inspection.values, undefined, today)), "Motorcycle cannot skip helmet")

for (const kind of ["journey", "road-action", "road-maintenance", "vehicle-maintenance", "change"]) {
  const record = item(kind)
  if (kind === "change") record.values.decision = "Aprobado"
  record.entries.push({ id: "follow-up", kind: "FOLLOW_UP", progress: 100 })
  check(planning.itemStatus(record) === "Pendiente de evidencia", `${kind}: progress needs proof`)
  record.evidence.push({ targetId: "follow-up" })
  check(planning.itemStatus(record) === "Cumplido", `${kind}: proven execution`)
}
const change = item("change")
check(planning.itemStatus(change) === "Pendiente de aprobación", "Change starts unapproved")
change.values.assessmentDate = ops.retentionUntil(today, 1)
check(Boolean(ops.validateOperationalRecord({ id: "change" }, change.values, undefined, today)), "Cannot evaluate in future")
const journey = item("journey")
journey.values.arrivalTime = "06:00"
check(Boolean(ops.validateOperationalRecord({ id: "journey" }, journey.values, undefined, today)), "Arrival cannot precede same-day departure")
journey.values.arrivalTime = "25:00"
check(Boolean(ops.validateOperationalRecord({ id: "journey" }, journey.values, undefined, today)), "Validate times")
const contractor = item("contractor-check")
check(planning.itemStatus(contractor) === "Pendiente de verificación", "Contractor starts unverified")
contractor.values.check_pesv = "No cumple"
check(planning.itemStatus(contractor) === "Incumplimientos", "Contractor failures visible")
check(ops.retentionUntil("2024-02-29", 1) === "2025-02-28", "Retention leap-year boundary")
check(ops.archiveYears({ category: "Inspección preoperacional" }) === 1, "Preoperational retention one year")
check(ops.archiveYears({ category: "PESV general" }) === 5, "General retention five years")
check(ops.archiveYears({ category: "Norma especial", specialYears: "10" }) === 10, "Special longer retention")
const archive = item("archive-record")
archive.values.legible = "Sí"; archive.values.updated = "Sí"
check(planning.itemStatus(archive) === "Pendiente de evidencia", "Archive needs file")
archive.evidence = inspection.evidence
check(planning.itemStatus(archive) === "Controlado", "Supported archive is controlled")
const changed = { ...archive.values, recordDate: "2020-01-01" }
check(Boolean(ops.validateOperationalRecord({ id: "archive-record" }, changed, archive, today)), "Retention dates locked once supported")
const inventory = ops.archiveInventory([{ module: "vehicle-inspections", title: "Inspecciones", records: [inspection] }, { module: "document-retention", title: "Archivo", records: [archive] }])
check(inventory[0].years === 1 && inventory[1].years === 5, "Inventory preserves category retention")
check(inventory.every(e => e.until && e.url), "Inventory previews original evidence")
const review = item("archive-review")
review.values.quarter = String(Number(review.values.quarter) % 4 + 1)
check(Boolean(ops.validateOperationalRecord({ id: "archive-review" }, review.values, undefined, today)), "Quarter must match review date")
console.log(`${checks} PESV operational checks passed`)
