"use client"

import { use, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Edit, FileText, Loader2, Plus, Trash2, Upload, Users } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { listEmployees } from "@/services/employeeService"
import {
  createTrainingAttendance,
  deleteTraining,
  deleteTrainingAttendance,
  deleteTrainingDocument,
  downloadTrainingDocumentFile,
  getTrainingById,
  listTrainingAttendances,
  listTrainingDocuments,
  updateTrainingAttendance,
  uploadTrainingDocument,
} from "@/services/trainingService"
import type { Employee } from "@/types/manager/employee"
import type {
  CreateTrainingAttendanceDto,
  Training,
  TrainingAttendance,
  TrainingAttendanceStatus,
  TrainingDocument,
  UpdateTrainingAttendanceDto,
} from "@/types/manager/training"

const attendanceStatusOptions: { value: TrainingAttendanceStatus; label: string }[] = [
  { value: "ASSIGNED", label: "Asignado" },
  { value: "ATTENDED", label: "Asistio" },
  { value: "ABSENT", label: "Ausente" },
]

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function getAttendanceStatusLabel(value?: string | null) {
  return attendanceStatusOptions.find((option) => option.value === value)?.label ?? value ?? "No registrado"
}

function getTrainingStatusLabel(status?: string | null) {
  if (status === "ACTIVE") return "Activa"
  if (status === "INACTIVE") return "Inactiva"
  if (status === "FINALIZADA" || status === "FINISHED") return "Finalizada"
  if (status === "CANCELADA" || status === "CANCELLED") return "Cancelada"
  return status ?? "No registrada"
}

function getTrainingStatusBadgeClassName(status?: string | null) {
  if (status === "FINALIZADA" || status === "FINISHED") return "bg-blue-600 text-white border-transparent"
  if (status === "CANCELADA" || status === "CANCELLED") return "bg-destructive text-white border-transparent"
  return undefined
}

function formatFileSize(value?: number | null) {
  if (!value) return "0 KB"
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

type AttendanceFormState = CreateTrainingAttendanceDto

const emptyAttendanceForm: AttendanceFormState = {
  employeeId: "",
  status: "ASSIGNED",
}

function AttendanceDialog({
  attendance,
  employees,
  onSave,
}: {
  attendance?: TrainingAttendance
  employees: Employee[]
  onSave: (
    payload: CreateTrainingAttendanceDto | UpdateTrainingAttendanceDto,
    attendanceId?: string,
  ) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AttendanceFormState>(emptyAttendanceForm)

  useEffect(() => {
    if (!open) return
    setForm(attendance ? { employeeId: attendance.employeeId, status: attendance.status } : emptyAttendanceForm)
  }, [attendance, open])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.employeeId || !form.status) {
      toast.error("Selecciona funcionario y estado")
      return
    }

    setSaving(true)
    try {
      await onSave(form, attendance?.id)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={attendance ? "action" : "default"} size="sm" className="gap-2">
          {attendance ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {attendance ? "Editar" : "Asignar asistente"}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{attendance ? "Editar asistente" : "Asignar asistente"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Funcionario</Label>
              <Select
                value={form.employeeId}
                onValueChange={(value) => setForm((current) => ({ ...current, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un funcionario" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {`${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, status: value as TrainingAttendanceStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {attendanceStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TrainingDocuments({ trainingId }: { trainingId: string }) {
  const [documents, setDocuments] = useState<TrainingDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [type, setType] = useState("TRAINING_CERTIFICATE")
  const [isConfirmed, setIsConfirmed] = useState(true)

  async function loadDocuments() {
    setLoading(true)
    try {
      const data = await listTrainingDocuments(trainingId)
      setDocuments(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar los documentos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingId])

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecciona un archivo para subir")
      return
    }

    if (!type.trim()) {
      toast.error("Ingresa el tipo de documento")
      return
    }

    setUploading(true)
    try {
      await uploadTrainingDocument(trainingId, {
        file,
        type: type.trim(),
        isConfirmed,
      })
      setFile(null)
      await loadDocuments()
      toast.success("Documento subido correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el documento")
    } finally {
      setUploading(false)
    }
  }

  async function handleView(document: TrainingDocument) {
    if (!document.downloadUrl) return

    try {
      const blob = await downloadTrainingDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    }
  }

  async function handleDelete(documentId: string) {
    try {
      await deleteTrainingDocument(trainingId, documentId)
      setDocuments((current) => current.filter((document) => document.id !== documentId))
      toast.success("Documento eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-5 w-5" />
          Documentos de la capacitacion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto] lg:items-end">
          <div className="grid gap-2">
            <Label>Archivo</Label>
            <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={uploading} />
          </div>
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Input value={type} onChange={(event) => setType(event.target.value)} disabled={uploading} />
          </div>
          <label className="flex h-10 items-center gap-2 text-sm">
            <Checkbox
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              disabled={uploading}
            />
            Confirmado
          </label>
          <Button type="submit" size="sm" className="gap-2" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">Sin documentos cargados.</p>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-3 rounded-md border px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{document.originalName || document.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {document.type} · {formatFileSize(document.size)} · {document.isConfirmed ? "Confirmado" : "Pendiente"}
                  </p>
                </div>
                <div className="flex gap-2">
                  {document.downloadUrl && (
                    <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleView(document)}>
                      <Download className="h-4 w-4" />
                      Ver
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDelete(document.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [training, setTraining] = useState<Training | null>(null)
  const [attendances, setAttendances] = useState<TrainingAttendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assigningAll, setAssigningAll] = useState(false)

  async function loadData() {
    setLoading(true)
    try {
      const [trainingData, attendanceData, employeesData] = await Promise.all([
        getTrainingById(id),
        listTrainingAttendances(id),
        listEmployees(),
      ])
      setTraining(trainingData)
      setAttendances(attendanceData)
      setEmployees(employeesData)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la capacitacion")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const assignedEmployeeIds = useMemo(() => new Set(attendances.map((item) => item.employeeId)), [attendances])

  const availableEmployees = useMemo(
    () => employees.filter((employee) => !assignedEmployeeIds.has(employee.id)),
    [assignedEmployeeIds, employees],
  )

  async function handleSaveAttendance(
    payload: CreateTrainingAttendanceDto | UpdateTrainingAttendanceDto,
    attendanceId?: string,
  ) {
    if (!training) return

    try {
      if (attendanceId) {
        await updateTrainingAttendance(training.id, attendanceId, payload)
        toast.success("Asistente actualizado")
      } else {
        await createTrainingAttendance(training.id, payload as CreateTrainingAttendanceDto)
        toast.success("Asistente asignado")
      }
      const updated = await listTrainingAttendances(training.id)
      setAttendances(updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el asistente")
    }
  }

  async function handleAssignAllAvailable() {
    if (!training) return

    if (availableEmployees.length === 0) {
      toast.info("Todos los funcionarios ya estan asignados")
      return
    }

    setAssigningAll(true)
    try {
      await Promise.all(
        availableEmployees.map((employee) =>
          createTrainingAttendance(training.id, {
            employeeId: employee.id,
            status: "ASSIGNED",
          }),
        ),
      )
      const updated = await listTrainingAttendances(training.id)
      setAttendances(updated)
      toast.success("Todos los funcionarios disponibles fueron asignados")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo asignar todos los funcionarios")
    } finally {
      setAssigningAll(false)
    }
  }

  async function handleDeleteAttendance(attendanceId: string) {
    if (!training) return

    try {
      await deleteTrainingAttendance(training.id, attendanceId)
      setAttendances((current) => current.filter((item) => item.id !== attendanceId))
      toast.success("Asistente eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el asistente")
    }
  }

  async function handleDeleteTraining() {
    if (!training) return

    try {
      await deleteTraining(training.id)
      toast.success("Capacitacion eliminada")
      router.push("/dashboard/trainingPlan")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la capacitacion")
    }
  }

  function handleDownloadActa() {
    if (!training) return

    const doc = new jsPDF("p", "mm", "a4")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("ACTA DE CAPACITACION SG-SST", 105, 15, { align: "center" })

    doc.setFontSize(10)
    doc.text(`Tema: ${training.topic?.name ?? training.topicId}`, 14, 30)
    doc.text(`Fecha: ${formatDate(training.date)}`, 14, 37)
    doc.text(`Duracion: ${training.durationHours} horas`, 14, 44)
    doc.text(`Estado: ${getTrainingStatusLabel(training.status)}`, 14, 51)

    autoTable(doc, {
      startY: 62,
      theme: "grid",
      head: [["No.", "Nombre", "Correo", "Estado", "Firma"]],
      body: attendances.map((attendance, index) => [
        index + 1,
        `${attendance.employee?.name ?? ""} ${attendance.employee?.lastName ?? ""}`.trim(),
        attendance.employee?.email ?? "",
        getAttendanceStatusLabel(attendance.status),
        "",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    })

    doc.save(`Acta_Capacitacion_${formatDate(training.date)}.pdf`)
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!training) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" className="gap-2" onClick={() => router.push("/dashboard/trainingPlan")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">Capacitacion no encontrada.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => router.push("/dashboard/trainingPlan")}>
        <ArrowLeft className="h-4 w-4" />
        Volver al plan
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>{training.topic?.name ?? "Capacitacion"}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatDate(training.date)} · {training.durationHours} horas
            </p>
          </div>
          <Badge
            variant={
              training.status === "ACTIVE"
                ? "accentActivd"
                : training.status === "INACTIVE"
                  ? "destructive"
                  : "secondary"
            }
            className={getTrainingStatusBadgeClassName(training.status)}
          >
            {getTrainingStatusLabel(training.status)}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={handleDownloadActa}>
            <Download className="h-4 w-4" />
            Descargar acta
          </Button>
          <Button
            variant="destructive"
            className="gap-2"
            onClick={handleDeleteTraining}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar capacitacion
          </Button>
        </CardContent>
      </Card>

      <TrainingDocuments trainingId={training.id} />

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Asistentes</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={assigningAll || availableEmployees.length === 0}
              onClick={handleAssignAllAvailable}
            >
              {assigningAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Seleccionar todos
            </Button>
            <AttendanceDialog employees={availableEmployees} onSave={handleSaveAttendance} />
          </div>
        </CardHeader>
        <CardContent>
          {attendances.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay asistentes asignados.
            </div>
          ) : (
            <div className="space-y-3">
              {attendances.map((attendance) => {
                const employeeOptions = employees.some((employee) => employee.id === attendance.employeeId)
                  ? employees
                  : [
                      {
                        id: attendance.employeeId,
                        name: attendance.employee?.name ?? "",
                        lastName: attendance.employee?.lastName ?? "",
                        email: attendance.employee?.email ?? "",
                      } as Employee,
                      ...employees,
                    ]

                return (
                  <div
                    key={attendance.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">
                          {`${attendance.employee?.name ?? ""} ${attendance.employee?.lastName ?? ""}`.trim() ||
                            attendance.employeeId}
                        </h3>
                        <Badge variant={attendance.status === "ATTENDED" ? "default" : "secondary"}>
                          {getAttendanceStatusLabel(attendance.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{attendance.employee?.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AttendanceDialog attendance={attendance} employees={employeeOptions} onSave={handleSaveAttendance} />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleDeleteAttendance(attendance.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
