//components/employee/AbsenteeismTab.tsx

"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Calendar, Download, FileText, Plus, Trash2, Upload } from "lucide-react"
import jsPDF from "jspdf"
import { cn } from "@/lib/utils"
import { Pencil } from "lucide-react"



import type {
  Employee,
  AbsenteeismRecord,
  AbsenteeismType,
  PermissionKind,
  DisabilityKind,
  LeaveKind,
} from "@/lib/mock-data"

import { deleteAbsenteeism, getAbsenteeismByEmployee, upsertAbsenteeism } from "@/lib/absenteeism-storage"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.click()
}

function daysBetween(startISO: string, endISO: string) {
  const s = new Date(startISO + "T00:00:00").getTime()
  const e = new Date(endISO + "T00:00:00").getTime()
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24))
  return diff + 1 // inclusive
}

const TYPE_OPTIONS: { value: AbsenteeismType; label: string }[] = [
  { value: "permiso", label: "Permiso" },
  { value: "incapacidad", label: "Incapacidad" },
  { value: "licencia", label: "Licencia" },
]

const SUBTYPE_BY_TYPE: Record<AbsenteeismType, { value: string; label: string }[]> = {
  permiso: [
    { value: "remunerado", label: "Remunerado" },
    { value: "no_remunerado", label: "No remunerado" },
  ],
  incapacidad: [
    { value: "general", label: "General" },
    { value: "laboral", label: "Laboral" },
    { value: "maternidad", label: "Maternidad" },
    { value: "paternidad", label: "Paternidad" },
  ],
  licencia: [{ value: "luto", label: "Luto" }],
}

function typeBadge(type: AbsenteeismType) {
  if (type === "permiso") return "bg-primary/10 text-primary"
  if (type === "incapacidad") return "bg-warning/10 text-warning"
  return "bg-destructive/10 text-destructive"
}

export function AbsenteeismTab({ employee }: { employee: Employee }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [records, setRecords] = useState<AbsenteeismRecord[]>([])

  const [form, setForm] = useState({
    type: "permiso" as AbsenteeismType,
    subType: "remunerado" as PermissionKind | DisabilityKind | LeaveKind,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date().toISOString().slice(0, 10),
    notes: "",
  })

  const [supportFile, setSupportFile] = useState<File | null>(null)
  const [supportDataUrl, setSupportDataUrl] = useState<string>("")
  const [saving, setSaving] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingSupport, setExistingSupport] = useState<AbsenteeismRecord["support"]>(null)

  useEffect(() => {
    setRecords(getAbsenteeismByEmployee(employee.id))
  }, [employee.id])

  // cuando cambia tipo, ajustamos subType al primer valor permitido
  useEffect(() => {
    const first = SUBTYPE_BY_TYPE[form.type][0]?.value
    if (!first) return
    setForm(prev => ({ ...prev, subType: first as any }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type])

  const stats = useMemo(() => {
    const total = records.length
    const permiso = records.filter(r => r.type === "permiso").length
    const incapacidad = records.filter(r => r.type === "incapacidad").length
    const licencia = records.filter(r => r.type === "licencia").length
    return { total, permiso, incapacidad, licencia }
  }, [records])

  const totalDays = useMemo(() => {
    return records.reduce((acc, r) => acc + daysBetween(r.startDate, r.endDate), 0)
  }, [records])

  const handleSupport = async (file?: File) => {
    if (!file) return
    setSupportFile(file)
    const dataUrl = await fileToDataUrl(file)
    setSupportDataUrl(dataUrl)
  }

  const resetForm = () => {
    setEditingId(null)
    setExistingSupport(null)
    setForm({
      type: "permiso",
      subType: "remunerado",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      notes: "",
    })
    setSupportFile(null)
    setSupportDataUrl("")
  }

    const startEdit = (r: AbsenteeismRecord) => {
    setEditingId(r.id)
    setExistingSupport(r.support ?? null)

    setForm({
      type: r.type,
      subType: r.subType as any,
      startDate: r.startDate,
      endDate: r.endDate,
      notes: r.notes || "",
    })

    // soporte: lo mantenemos (sin obligar a re-subir)
    setSupportFile(null)
    setSupportDataUrl("")
    setDialogOpen(true)
  }


    const validate = () => {
    if (!form.startDate) return "Selecciona fecha de inicio."
    if (!form.endDate) return "Selecciona fecha de fin."
    if (new Date(form.endDate) < new Date(form.startDate)) return "La fecha fin no puede ser menor a la fecha inicio."

    // soporte obligatorio solo si estamos CREANDO
    const creating = !editingId
    const hasExisting = !!existingSupport?.url
    const hasNew = !!supportFile && !!supportDataUrl

    if (creating && !hasNew) return "Adjunta el soporte (PDF/imagen)."
    if (!creating && !hasExisting && !hasNew) return "Adjunta el soporte (PDF/imagen)."

    return null
  }


    const saveRecord = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) return alert(err)

    setSaving(true)
    try {
      const isEditing = !!editingId

      // si hay archivo nuevo, reemplazamos soporte; si no, dejamos el anterior
      const support =
        supportFile && supportDataUrl
          ? {
              name: supportFile.name,
              url: supportDataUrl,
              size: supportFile.size,
              type: supportFile.type || "application/octet-stream",
            }
          : (existingSupport ?? null)

      const payload: AbsenteeismRecord = {
        id: isEditing ? editingId! : crypto.randomUUID(),
        employeeId: employee.id,
        type: form.type,
        subType: form.subType,
        startDate: form.startDate,
        endDate: form.endDate,
        notes: form.notes?.trim() || "",
        support,
        createdAtISO: isEditing
          ? (records.find(r => r.id === editingId)?.createdAtISO || new Date().toISOString())
          : new Date().toISOString(),
      }

      upsertAbsenteeism(payload)
      setRecords(getAbsenteeismByEmployee(employee.id))
      setDialogOpen(false)
      resetForm()
    } finally {
      setSaving(false)
    }
  }


  const removeRecord = (id: string) => {
    deleteAbsenteeism(id)
    setRecords(getAbsenteeismByEmployee(employee.id))
  }

  const downloadRecordPDF = (r: AbsenteeismRecord) => {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("Registro de Ausentismo Laboral", 105, 18, { align: "center" })

    doc.setFontSize(12)
    doc.text(`Empleado: ${employee.name} ${employee.lastName}`, 20, 35)
    doc.text(`Tipo: ${r.type}`, 20, 45)
    doc.text(`Subtipo: ${r.subType}`, 20, 55)
    doc.text(`Inicio: ${r.startDate}`, 20, 65)
    doc.text(`Fin: ${r.endDate}`, 20, 75)
    doc.text(`Días: ${daysBetween(r.startDate, r.endDate)}`, 20, 85)

    doc.text("Observaciones:", 20, 97)
    const obs = doc.splitTextToSize(r.notes || "—", 170)
    doc.text(obs, 20, 107)

    doc.save(`ausentismo-${employee.id}-${r.id}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Registros</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Permisos</p>
            <p className="text-2xl font-bold text-primary">{stats.permiso}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Incapacidades</p>
            <p className="text-2xl font-bold text-warning">{stats.incapacidad}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Licencias</p>
            <p className="text-2xl font-bold text-destructive">{stats.licencia}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ausentismo Laboral
              <Badge variant="secondary" className="ml-2 text-xs">
                Total días: {totalDays}
              </Badge>
            </CardTitle>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar ausentismo
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-card border-border max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar Ausentismo" : "Registrar Ausentismo"}</DialogTitle>
                </DialogHeader>

                <form onSubmit={saveRecord} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo *</Label>
                      <Select value={form.type} onValueChange={(v) => setForm(prev => ({ ...prev, type: v as AbsenteeismType }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TYPE_OPTIONS.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Subtipo *</Label>
                      <Select value={String(form.subType)} onValueChange={(v) => setForm(prev => ({ ...prev, subType: v as any }))}>
                        <SelectTrigger className="bg-secondary border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUBTYPE_BY_TYPE[form.type].map(st => (
                            <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fecha inicio *</Label>
                      <Input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                        className="bg-secondary border-border"
                        required
                      />
                    </div>

                    <div>
                      <Label>Fecha fin *</Label>
                      <Input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                        className="bg-secondary border-border"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Observaciones</Label>
                    <Textarea
                      value={form.notes}
                      onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                      className="bg-secondary border-border"
                      placeholder="Motivo, detalle, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Soporte (PDF/JPG/PNG) *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleSupport(e.target.files?.[0])}
                        className="bg-secondary border-border"
                      />
                      {editingId && existingSupport?.name && !supportFile && (
                        <p className="text-xs text-muted-foreground">
                            Soporte actual: <span className="font-medium">{existingSupport.name}</span> (si subes uno nuevo, se reemplaza)
                        </p>
                        )}

                      <Button type="button" variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    {supportFile && (
                      <p className="text-xs text-muted-foreground">
                        Archivo seleccionado: {supportFile.name}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay ausentismos registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div key={r.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className={cn("text-xs", typeBadge(r.type))}>
                          {r.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {String(r.subType).replaceAll("_", " ").toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {r.startDate} → {r.endDate} ({daysBetween(r.startDate, r.endDate)} días)
                        </span>
                      </div>

                      {r.notes && <p className="text-sm">{r.notes}</p>}

                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Registrado: {new Date(r.createdAtISO).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => startEdit(r)} title="Editar">
                            <Pencil className="h-4 w-4" />
                        </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadRecordPDF(r)}>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>

                      {r.support?.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadDataUrl(r.support!.url, r.support!.name)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Soporte
                        </Button>
                      )}

                      <Button variant="outline" size="sm" onClick={() => removeRecord(r.id)} title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
