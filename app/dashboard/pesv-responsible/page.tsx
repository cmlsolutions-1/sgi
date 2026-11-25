"use client"

import { loadPesv, savePesv, pesvVersion, downloadPesv, pesvResources } from "@/services/pesvService"
import { PesvApiDocuments } from "@/components/pesv/api-documents"
import { Modal } from "@/components/pesv/planning-module"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Calendar, Download, FileCheck2, Loader2, Search, ShieldCheck, Upload, UserCheck, Users } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FormDialogIcon, FormSectionTitle } from "@/components/ui/form-dialog-visuals"
import { SafeCloudFormDrawerFrame } from "@/components/ui/safecloud-form-drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"
import { PesvModuleHeader } from "@/components/pesv/module-experience"

type PesvResponsibleRecord = {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  employeePhone: string
  signatureDate: string
  roleDescription: string
  supportFileName: string
  supportDescription: string
  updatedAt: string
}

type PesvResponsibleForm = {
  employeeId: string
  signatureDate: string
  roleDescription: string
  supportFileName: string
  supportDescription: string
}


const defaultForm: PesvResponsibleForm = {
  employeeId: "",
  signatureDate: new Date().toISOString().slice(0, 10),
  roleDescription: "Líder del diseño e implementación del PESV",
  supportFileName: "",
  supportDescription: "",
}

const pesvLeaderResponsibilities = [
  "Liderar el diseño e implementación del Plan Estratégico de Seguridad Vial.",
  "Coordinar la ejecución de acciones, responsables y soportes del PESV.",
  "Conservar evidencias de designación, seguimiento y mejora del plan.",
  "Articular el PESV con la gestión de seguridad, talento humano y operación.",
]

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function PesvResponsibleDialog({
  open,
  employees,
  record,
  onOpenChange,
  onSave,
}: {
  open: boolean
  employees: Employee[]
  record: PesvResponsibleRecord | null
  onOpenChange: (open: boolean) => void
  onSave: (form: PesvResponsibleForm) => Promise<boolean>
}) {
  const [form, setForm] = useState<PesvResponsibleForm>(defaultForm)
  const [employeeQuery, setEmployeeQuery] = useState("")

  useEffect(() => {
    if (!open) return
    setForm(
      record
        ? {
            employeeId: record.employeeId,
            signatureDate: record.signatureDate,
            roleDescription: record.roleDescription,
            supportFileName: record.supportFileName,
            supportDescription: record.supportDescription,
          }
        : defaultForm,
    )
    setEmployeeQuery("")
  }, [open, record])

  const filteredEmployees = useMemo(() => {
    const term = employeeQuery.trim().toLowerCase()
    if (!term) return employees

    return employees.filter((employee) =>
      `${employeeFullName(employee)} ${employee.email ?? ""} ${employee.phone ?? ""}`.toLowerCase().includes(term),
    )
  }, [employeeQuery, employees])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.employeeId) return toast.error("Selecciona el líder responsable del PESV")
    if (!form.signatureDate) return toast.error("Selecciona la fecha de designación")
    if (!form.roleDescription.trim()) return toast.error("Describe el rol del responsable PESV")

    const saved = await onSave({
      ...form,
      roleDescription: form.roleDescription.trim(),
      supportFileName: form.supportFileName.trim(),
      supportDescription: form.supportDescription.trim(),
    })
    if (saved) onOpenChange(false)
  }

  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={onOpenChange}>
        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50/75 px-6 py-4 pr-12">
          <div className="flex min-w-0 items-start gap-3">
            <FormDialogIcon icon="job" tone="blue" />
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-slate-950">
                {record ? "Actualizar responsable PESV" : "Asignar responsable PESV"}
              </DialogTitle>
              <p className="mt-1 text-sm text-slate-600">Selecciona el líder y conserva el soporte de su designación.</p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto bg-slate-50/40 px-6 py-5">
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="employee" title="Responsable designado" description="Consulta y selecciona el funcionario que liderará el PESV." />
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="grid gap-2 md:col-span-2">
              <span className="text-sm font-medium text-foreground">Funcionario líder</span>
              <div className="overflow-hidden rounded-md border border-input bg-background">
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={employeeQuery}
                      onChange={(event) => setEmployeeQuery(event.target.value)}
                      className="h-9 pl-9"
                      placeholder="Buscar funcionario por nombre, correo o teléfono"
                    />
                  </div>
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto p-2">
                  {filteredEmployees.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
                      No hay funcionarios que coincidan con la búsqueda.
                    </p>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const selected = form.employeeId === employee.id
                      return (
                        <button
                          key={employee.id}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, employeeId: employee.id }))}
                          className={`w-full rounded-md border p-3 text-left text-sm transition ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50 hover:bg-secondary"
                          }`}
                        >
                          <span className="block font-medium">{employeeFullName(employee)}</span>
                          <span className="block text-xs text-muted-foreground">{employee.email || "Sin correo registrado"}</span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <Label className="grid gap-2">
              Fecha de designación
              <Input
                type="date"
                value={form.signatureDate}
                onChange={(event) => setForm((current) => ({ ...current, signatureDate: event.target.value }))}
              />
            </Label>
            </div>
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <FormSectionTitle icon="accountability" title="Responsabilidad dentro del PESV" />
            <Label className="grid gap-2">
              Rol dentro del PESV
              <Textarea
                value={form.roleDescription}
                onChange={(event) => setForm((current) => ({ ...current, roleDescription: event.target.value }))}
                rows={3}
                placeholder="Describe el rol del líder PESV"
              />
            </Label>
          </section>

          <p className="text-sm text-muted-foreground">El soporte de designación se carga después de guardar el responsable.</p>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{record ? "Guardar cambios" : "Asignar responsable"}</Button>
          </DialogFooter>
        </form>
    </SafeCloudFormDrawerFrame>
  )
}

export default function PesvResponsiblePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [record, setRecord] = useState<PesvResponsibleRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const selectedEmployee = useMemo(
    () => (record?.employeeId ? employees.find((employee) => employee.id === record.employeeId) : null),
    [employees, record?.employeeId],
  )
  const currentResponsibleName = record?.employeeName ?? (selectedEmployee ? employeeFullName(selectedEmployee) : "No asignado")

  const [supportOpen, setSupportOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  async function reload() {
    const records = await loadPesv<PesvResponsibleRecord>("responsible")
    setRecord(records[0] ?? null)
  }
  useEffect(() => {
    let active = true
    Promise.allSettled([listEmployees(), loadPesv<PesvResponsibleRecord>("responsible")]).then(([employeeResult, recordsResult]) => {
      if (!active) return
      if (employeeResult.status === "fulfilled") setEmployees(employeeResult.value.filter(employee => employee.status !== false))
      else toast.error("No se pudo cargar el catálogo de funcionarios: " + employeeResult.reason.message)
      if (recordsResult.status === "fulfilled") setRecord(recordsResult.value[0] ?? null)
      else setLoadError(recordsResult.reason.message)
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function handleSave(form: PesvResponsibleForm): Promise<boolean> {
    if (saving) return false
    setSaving(true)
    try {
      await savePesv("responsible", { employeeId: form.employeeId, signatureDate: form.signatureDate, roleDescription: form.roleDescription, ...pesvVersion(record) }, record?.id)
      await reload().catch(error => { toast.error("Cambios guardados, pero no se pudo actualizar la vista: " + error.message) })
      toast.success("Responsable PESV guardado")
      return true
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar el responsable"); return false }
    finally { setSaving(false) }
  }

  return (
    <main className="space-y-6">
      {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
      <PesvModuleHeader title="Responsable PESV" description="Designa el líder del diseño e implementación del Plan Estratégico de Seguridad Vial." icon={UserCheck} actions={
        <Button className="w-full gap-2 sm:w-auto" disabled={loading || employees.length === 0} onClick={() => setDialogOpen(true)}>
          <UserCheck className="h-4 w-4" />
          {record ? "Gestionar Responsable PESV" : "Asignar Responsable PESV"}
        </Button>
      } />

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5" />
                Designación actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">Funcionario responsable</p>
                <p className="text-xl font-semibold text-foreground">{currentResponsibleName}</p>
              </div>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Fecha de designación: {formatDate(record?.signatureDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Funcionarios disponibles: {employees.length}</span>
                </div>
              </div>

              <div className="rounded-md border border-border p-4">
                <p className="text-sm font-semibold text-foreground">Rol del líder PESV</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {record?.roleDescription ?? "Aún no se ha asignado el líder del diseño e implementación del PESV."}
                </p>
              </div>

              {record?.supportFileName && (
                <div className="rounded-md bg-secondary p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileCheck2 className="h-4 w-4" />
                    Soporte cargado
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{record.supportFileName}</p>
                  {record.supportDescription && <p className="mt-1 text-sm text-muted-foreground">{record.supportDescription}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Responsabilidades</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {pesvLeaderResponsibilities.map((responsibility) => (
                    <li key={responsibility} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" disabled={employees.length === 0} onClick={() => setDialogOpen(true)}>
                  <UserCheck className="h-4 w-4" />
                  {record ? "Actualizar responsable" : "Asignar responsable"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  disabled={!record}
                  onClick={() => { void downloadPesv(`${pesvResources.responsible}/designation.pdf`, "designacion-responsable-pesv.pdf").catch(error => toast.error(error.message)) }}
                >
                  <Download className="h-4 w-4" />
                  Descargar acta
                </Button>
                <Button type="button" variant="outline" className="w-full gap-2" disabled={!record} onClick={() => setSupportOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Cargar soporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Modal open={supportOpen} onOpenChange={setSupportOpen} title="Soporte de designación">{record && <PesvApiDocuments resource="responsible" id={record.id} onChanged={() => { void reload().catch(error => toast.error(error.message)) }} />}</Modal>
      <PesvResponsibleDialog
        open={dialogOpen}
        employees={employees}
        record={record}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </main>
  )
}
