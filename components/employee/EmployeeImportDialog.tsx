"use client"

import { useState } from "react"
import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { SafeCloudFormDrawer } from "@/components/ui/safecloud-form-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { importEmployees, loadEmployeeImportCatalogs } from "@/services/employeeImportService"
import type { EmployeeImportCatalogs, EmployeeImportResult, EmployeeImportRow, EmployeeImportRowResult } from "@/types/manager/employee-import"

const fieldLabels: Record<string, string> = { name: "Nombres", lastName: "Apellidos", documentType: "Tipo de documento", documentNumber: "Número de documento", gender: "Género", phone: "Teléfono", email: "Correo", address: "Dirección", birthDate: "Fecha de nacimiento", workAreaId: "Área de trabajo", jobId: "Cargo" }

async function readWorkbook(file: File, catalogs: EmployeeImportCatalogs): Promise<{ rows: EmployeeImportRow[]; errors: EmployeeImportRowResult[] }> {
  const buffer = await file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("../../lib/employee-import.worker.ts", import.meta.url), { type: "module" })
    const timeout = setTimeout(() => { worker.terminate(); reject(new Error("El Excel no pudo procesarse a tiempo. Usa una plantilla nueva con máximo 200 filas.")) }, 20000)
    const stop = () => { clearTimeout(timeout); worker.terminate() }
    worker.onmessage = event => { stop(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.data) }
    worker.onerror = () => { stop(); reject(new Error("No se pudo procesar el Excel. Verifica el archivo e inténtalo nuevamente.")) }
    worker.postMessage({ buffer, catalogs }, [buffer])
  })
}

export function EmployeeImportDialog({ onImported }: { onImported: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [rows, setRows] = useState<EmployeeImportRow[]>([])
  const [result, setResult] = useState<EmployeeImportResult | null>(null)
  const [validated, setValidated] = useState(false)
  const [busy, setBusy] = useState<"template" | "validate" | "confirm" | null>(null)
  const [error, setError] = useState("")

  function reset() { setFile(null); setRows([]); setResult(null); setError(""); setValidated(false) }
  async function downloadTemplate() {
    setBusy("template"); setError("")
    try {
      const catalogs = await loadEmployeeImportCatalogs()
      const { buildEmployeeImportTemplate } = await import("@/lib/employee-import")
      const buffer = await buildEmployeeImportTemplate(catalogs)
      const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }))
      const anchor = document.createElement("a")
      anchor.href = url; anchor.download = "plantilla-funcionarios-safecloud.xlsx"; anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) { setError((error as Error).message) }
    finally { setBusy(null) }
  }
  async function validateFile() {
    if (!file) return
    setBusy("validate"); setError(""); setResult(null); setRows([]); setValidated(false)
    try {
      if (!/\.xlsx$/i.test(file.name) || file.size > 2 * 1024 * 1024) throw new Error("Selecciona un archivo .xlsx de máximo 2 MB")
      const catalogs = await loadEmployeeImportCatalogs()
      const parsed = await readWorkbook(file, catalogs)
      setRows(parsed.rows)
      if (parsed.errors.length) {
        setResult({ total: parsed.rows.length, valid: parsed.rows.length - parsed.errors.length, invalid: parsed.errors.length, created: 0, rows: parsed.errors })
        return
      }
      const response = await importEmployees(parsed.rows, true)
      setResult(response)
      setValidated(response.invalid === 0 && response.created === 0 && response.total === parsed.rows.length && response.valid === parsed.rows.length)
    } catch (error) { setError((error as Error).message) }
    finally { setBusy(null) }
  }
  async function confirmImport() {
    if (busy || !validated || !result || result.invalid || result.created || result.valid !== rows.length || !rows.length) return
    setBusy("confirm"); setError(""); setResult(null); setValidated(false)
    try {
      const response = await importEmployees(rows, false)
      setResult(response)
      if (response.created === rows.length && response.invalid === 0) {
        toast.success(`${response.created} funcionarios importados`)
        await onImported()
      } else if (!response.invalid) {
        setError("La respuesta no confirma la creación del lote completo. Verifica la lista antes de reintentar.")
      }
    } catch (error) { setError(`${(error as Error).message}. Verifica la lista de funcionarios antes de reintentar la importación.`) }
    finally { setBusy(null) }
  }
  const canConfirm = validated && !!result && !result.invalid && !result.created && result.total === rows.length && result.valid === rows.length && rows.length > 0
  return <SafeCloudFormDrawer open={open} onOpenChange={value => { if (busy) return; setOpen(value); if (!value) reset() }}
    trigger={<Button className="bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-300"><Upload className="mr-2 h-4 w-4" />Importar funcionarios</Button>}
    title="Importación masiva de funcionarios" icon={<FileSpreadsheet className="h-6 w-6 text-sky-700" />}
    footer={<><Button variant="outline" disabled={!!busy} onClick={() => { setOpen(false); reset() }}>Cerrar</Button><Button disabled={!!busy || !canConfirm} onClick={confirmImport}>{busy === "confirm" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar importación{canConfirm ? ` (${rows.length})` : ""}</Button></>}>
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="font-semibold">Plantilla de funcionarios</h3>
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-md p-3">Crea primero todas las áreas y cargos que vas a asignar a los funcionarios. Si agregas o cambias alguno, descarga una plantilla nueva.</p>
        <Button className="bg-green-700 text-white hover:bg-green-800 focus-visible:ring-green-300" disabled={!!busy} onClick={downloadTemplate}>{busy === "template" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Descargar plantilla Excel</Button>
      </section>
      <section className="space-y-3 border-t pt-4">
        <Label htmlFor="employee-import-file">Archivo de funcionarios</Label>
        <Input id="employee-import-file" type="file" accept=".xlsx" disabled={!!busy} onChange={event => { setFile(event.target.files?.[0] ?? null); setRows([]); setResult(null); setError(""); setValidated(false) }} />
        <p className="text-xs text-muted-foreground">De 1 a 200 funcionarios por lote. Las filas vacías no cuentan. Excel (.xlsx) · Hasta 2 MB</p>
        <Button disabled={!file || !!busy || !!result?.created} onClick={validateFile}>{busy === "validate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Validar archivo</Button>
      </section>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {result && <section className="space-y-3 border-t pt-4" aria-live="polite">
        <h3 className="font-semibold">{result.created ? "Resultado de la importación" : "Resultado de validación"}</h3>
        <dl className="grid grid-cols-3 gap-3 text-sm"><div><dt>Total</dt><dd className="font-semibold">{result.total}</dd></div><div><dt>Válidos</dt><dd className="font-semibold text-green-700">{result.valid}</dd></div><div><dt>Con errores</dt><dd className="font-semibold text-red-700">{result.invalid}</dd></div></dl>
        {result.created > 0 ? <p className="text-sm text-green-700">{result.created === 1 ? "Se creó 1 funcionario." : `Se crearon ${result.created} funcionarios.`} Las demás secciones de su hoja de vida quedan pendientes de diligenciar.</p> : result.invalid > 0 ? <p className="text-sm text-red-700">No se ha creado ningún funcionario. Corrige las filas indicadas y vuelve a validar el archivo.</p> : <p className="text-sm text-green-700">Lote validado, pendiente de confirmación. El servidor verificará nuevamente los datos antes de crear los funcionarios.</p>}
        {result.rows.filter(row => row.errors.length).map((row, index) => <div key={`${row.row}-${index}`} className="border-l-2 border-red-300 pl-3 text-sm"><p className="font-medium">Fila {row.row ?? "sin identificar"}</p><ul className="list-disc pl-4">{row.errors.map((issue, index) => <li key={index}>{fieldLabels[issue.field] ? `${fieldLabels[issue.field]}: ` : ""}{issue.message}</li>)}</ul></div>)}
      </section>}
    </div>
  </SafeCloudFormDrawer>
}
