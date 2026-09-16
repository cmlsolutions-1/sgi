"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import { Calendar, Download, FileCheck2, Loader2, Search, ShieldCheck, Upload, UserCheck, Users } from "lucide-react"
import jsPDF from "jspdf"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { listEmployees } from "@/services/employeeService"
import type { Employee } from "@/types/manager/employee"

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

const STORAGE_KEY = "safecloud:pesv-responsible"

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

const PESV_MOCK_EMPLOYEES: Employee[] = [
  {
    id: "pesv-mock-employee-1",
    name: "Diana",
    lastName: "Mendoza",
    phone: "3000000001",
    email: "diana.mendoza@safecloud.local",
    address: "No registrada",
    birthDate: "1990-01-15",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-1",
    status: true,
  },
  {
    id: "pesv-mock-employee-2",
    name: "Carlos",
    lastName: "Ramírez",
    phone: "3000000002",
    email: "carlos.ramirez@safecloud.local",
    address: "No registrada",
    birthDate: "1988-05-20",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-2",
    status: true,
  },
  {
    id: "pesv-mock-employee-3",
    name: "Valentina",
    lastName: "Suárez",
    phone: "3000000003",
    email: "valentina.suarez@safecloud.local",
    address: "No registrada",
    birthDate: "1992-11-08",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-3",
    status: true,
  },
  {
    id: "pesv-mock-employee-4",
    name: "Andrés",
    lastName: "Torres",
    phone: "3000000004",
    email: "andres.torres@safecloud.local",
    address: "No registrada",
    birthDate: "1985-09-12",
    companyId: "pesv-mock-company",
    workAreaId: "pesv-mock-area",
    jobId: "pesv-mock-job-4",
    status: true,
  },
]

function withPesvMockEmployees(employees: Employee[]) {
  if (employees.length >= 3) return employees
  const existingIds = new Set(employees.map((employee) => employee.id))
  return [...employees, ...PESV_MOCK_EMPLOYEES.filter((employee) => !existingIds.has(employee.id))]
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`
  return `${prefix}-${Date.now()}`
}

function employeeFullName(employee: Employee) {
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "Funcionario sin nombre"
}

function readStoredResponsible() {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PesvResponsibleRecord) : null
  } catch {
    return null
  }
}

function writeStoredResponsible(record: PesvResponsibleRecord) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

function downloadDesignationPdf(record: PesvResponsibleRecord) {
  const doc = new jsPDF("p", "mm", "a4")
  const margin = 16
  const pageWidth = doc.internal.pageSize.getWidth()
  const contentWidth = pageWidth - margin * 2

  doc.setFillColor(31, 92, 77)
  doc.roundedRect(margin, 12, contentWidth, 24, 3, 3, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.text("ACTA DE DESIGNACIÓN RESPONSABLE PESV", margin + 5, 23)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(8)
  doc.text("Plan Estratégico de Seguridad Vial", margin + 5, 30)

  doc.setTextColor(30, 41, 59)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  const intro = [
    "Por medio del presente documento se deja constancia de la designación del líder responsable del diseño e implementación del PESV.",
    "La persona designada coordinará las acciones necesarias para la planeación, ejecución, seguimiento y conservación de evidencias del plan.",
  ].join(" ")
  doc.text(doc.splitTextToSize(intro, contentWidth), margin, 50)

  let y = 72
  const rows = [
    ["Responsable", record.employeeName],
    ["Correo", record.employeeEmail || "No registrado"],
    ["Teléfono", record.employeePhone || "No registrado"],
    ["Rol", record.roleDescription],
    ["Fecha de designación", formatDate(record.signatureDate)],
  ]

  rows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold")
    doc.text(`${label}:`, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(value, contentWidth - 48), margin + 48, y)
    y += 10
  })

  y += 6
  doc.setFont("helvetica", "bold")
  doc.text("Responsabilidades principales", margin, y)
  y += 8
  doc.setFont("helvetica", "normal")
  pesvLeaderResponsibilities.forEach((responsibility, index) => {
    doc.text(doc.splitTextToSize(`${index + 1}. ${responsibility}`, contentWidth), margin, y)
    y += 10
  })

  y = Math.max(y + 14, 210)
  doc.setDrawColor(120, 130, 140)
  doc.line(margin, y, margin + 78, y)
  doc.line(pageWidth - margin - 78, y, pageWidth - margin, y)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)
  doc.text("Firma responsable PESV", margin, y + 6)
  doc.text("Representante legal", pageWidth - margin - 78, y + 6)

  doc.setDrawColor(220, 226, 224)
  doc.line(margin, 280, pageWidth - margin, 280)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text("Documento generado desde SafeCloud", margin, 286)

  doc.save(`responsable-pesv-${record.employeeName.replace(/[^a-zA-Z0-9]+/g, "_")}.pdf`)
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
  onSave: (form: PesvResponsibleForm) => void
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.employeeId) return toast.error("Selecciona el líder responsable del PESV")
    if (!form.signatureDate) return toast.error("Selecciona la fecha de designación")
    if (!form.roleDescription.trim()) return toast.error("Describe el rol del responsable PESV")

    onSave({
      ...form,
      roleDescription: form.roleDescription.trim(),
      supportFileName: form.supportFileName.trim(),
      supportDescription: form.supportDescription.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-3xl overflow-y-auto bg-card">
        <DialogHeader>
          <DialogTitle>{record ? "Actualizar responsable PESV" : "Asignar responsable PESV"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="grid gap-4 md:grid-cols-2">
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
          </section>

          <Label className="grid gap-2">
            Rol dentro del PESV
            <Textarea
              value={form.roleDescription}
              onChange={(event) => setForm((current) => ({ ...current, roleDescription: event.target.value }))}
              rows={3}
              placeholder="Describe el rol del líder PESV"
            />
          </Label>

          <section className="rounded-md border border-border p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Soporte de designación</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Label className="grid gap-2">
                Archivo soporte
                <Input
                  type="file"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, supportFileName: event.target.files?.[0]?.name ?? current.supportFileName }))
                  }
                />
              </Label>
              <Label className="grid gap-2">
                Nombre del archivo
                <Input
                  value={form.supportFileName}
                  onChange={(event) => setForm((current) => ({ ...current, supportFileName: event.target.value }))}
                  placeholder="acta-designacion-responsable-pesv.pdf"
                />
              </Label>
              <Label className="grid gap-2 md:col-span-2">
                Descripción del soporte
                <Textarea
                  value={form.supportDescription}
                  onChange={(event) => setForm((current) => ({ ...current, supportDescription: event.target.value }))}
                  rows={3}
                  placeholder="Acta firmada, comunicación interna o soporte de designación."
                />
              </Label>
            </div>
          </section>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{record ? "Guardar cambios" : "Asignar responsable"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      try {
        const employeeList = await listEmployees()
        if (!mounted) return
        setEmployees(withPesvMockEmployees(employeeList))
        setRecord(readStoredResponsible())
      } catch {
        if (mounted) {
          setEmployees(PESV_MOCK_EMPLOYEES)
          setRecord(readStoredResponsible())
          toast.info("Usando funcionarios mock para PESV mientras se conecta el backend.")
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  function handleSave(form: PesvResponsibleForm) {
    const employee = employees.find((item) => item.id === form.employeeId)

    if (!employee) {
      toast.error("No se encontró el funcionario seleccionado")
      return
    }

    const nextRecord: PesvResponsibleRecord = {
      id: record?.id ?? createId("pesv-responsible"),
      employeeId: employee.id,
      employeeName: employeeFullName(employee),
      employeeEmail: employee.email ?? "",
      employeePhone: employee.phone ?? "",
      signatureDate: form.signatureDate,
      roleDescription: form.roleDescription,
      supportFileName: form.supportFileName,
      supportDescription: form.supportDescription,
      updatedAt: new Date().toISOString(),
    }

    writeStoredResponsible(nextRecord)
    setRecord(nextRecord)
    toast.success(record ? "Responsable PESV actualizado" : "Responsable PESV asignado")
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Responsable PESV</h1>
          <p className="text-muted-foreground">
            Designa el líder del diseño e implementación del Plan Estratégico de Seguridad Vial.
          </p>
        </div>
        <Button className="gap-2" disabled={loading || employees.length === 0} onClick={() => setDialogOpen(true)}>
          <UserCheck className="h-4 w-4" />
          {record ? "Gestionar Responsable PESV" : "Asignar Responsable PESV"}
        </Button>
      </div>

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
                  onClick={() => record && downloadDesignationPdf(record)}
                >
                  <Download className="h-4 w-4" />
                  Descargar acta
                </Button>
                <Button type="button" variant="outline" className="w-full gap-2" disabled={!record} onClick={() => setDialogOpen(true)}>
                  <Upload className="h-4 w-4" />
                  Cargar soporte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

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
