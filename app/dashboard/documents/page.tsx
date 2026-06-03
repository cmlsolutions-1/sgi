"use client"

import { useEffect, useMemo, useState } from "react"
import { BookOpen, Edit, FileText, Filter, Loader2, Plus, Power, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  activateManagedDocument,
  createManagedDocument,
  deleteManagedDocument,
  listManagedDocuments,
  updateManagedDocument,
} from "@/services/documentManagementService"
import { listWorkAreaOptions } from "@/services/workAreaService"
import type { ManagedDocument, ManagedDocumentType, UpsertManagedDocumentDto } from "@/types/manager/document-management"
import type { WorkAreaOption } from "@/types/manager/work-area"

type DocumentFormState = UpsertManagedDocumentDto & {
  id?: string
}

const DOCUMENT_TYPES: Array<{ value: ManagedDocumentType; label: string }> = [
  { value: "PROCEDURE", label: "Procedimiento" },
  { value: "MANUAL", label: "Manual" },
  { value: "INSTRUCTIVE", label: "Instructivo" },
  { value: "OTHERS", label: "Otros" },
]

const emptyForm: DocumentFormState = {
  name: "",
  type: "PROCEDURE",
  version: "1.0",
  workAreaId: "",
  consecutive: 1,
  code: "",
}

function documentTypeLabel(type: ManagedDocumentType) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label ?? type
}

function statusLabel(status: ManagedDocument["status"]) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function statusClass(status: ManagedDocument["status"]) {
  return status === "ACTIVE" ? "bg-green-600 text-white border-green-700" : "bg-muted text-foreground border-border"
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ManagedDocument[]>([])
  const [workAreas, setWorkAreas] = useState<WorkAreaOption[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<DocumentFormState>(emptyForm)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [workAreaFilter, setWorkAreaFilter] = useState<string>("all")

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase()

    return documents.filter((document) => {
      const matchesSearch =
        !query ||
        document.name.toLowerCase().includes(query) ||
        document.code.toLowerCase().includes(query) ||
        document.version.toLowerCase().includes(query) ||
        document.workArea?.name?.toLowerCase().includes(query)
      const matchesType = typeFilter === "all" || document.type === typeFilter
      const matchesStatus = statusFilter === "all" || document.status === statusFilter

      return matchesSearch && matchesType && matchesStatus
    })
  }, [documents, search, typeFilter, statusFilter])

  const stats = useMemo(
    () => ({
      total: documents.length,
      active: documents.filter((document) => document.status === "ACTIVE").length,
      inactive: documents.filter((document) => document.status === "INACTIVE").length,
      procedures: documents.filter((document) => document.type === "PROCEDURE").length,
    }),
    [documents],
  )

  async function loadData() {
    setLoading(true)
    const [documentResult, workAreaResult] = await Promise.allSettled([
      listManagedDocuments(workAreaFilter === "all" ? {} : { workAreaId: workAreaFilter }),
      listWorkAreaOptions(),
    ])

    if (documentResult.status === "fulfilled") {
      setDocuments(documentResult.value)
    } else {
      toast.error(
        documentResult.reason instanceof Error
          ? documentResult.reason.message
          : "No se pudo cargar la gestión documental",
      )
    }

    if (workAreaResult.status === "fulfilled") {
      setWorkAreas(workAreaResult.value)
    } else {
      toast.error(
        workAreaResult.reason instanceof Error
          ? workAreaResult.reason.message
          : "No se pudo cargar las áreas de trabajo",
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [workAreaFilter])

  function resetForm() {
    setForm(emptyForm)
    setDialogOpen(false)
  }

  function openCreateDialog() {
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(document: ManagedDocument) {
    setForm({
      id: document.id,
      name: document.name,
      type: document.type,
      version: document.version,
      workAreaId: document.workAreaId,
      consecutive: document.consecutive,
      code: document.code,
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Ingresa el nombre del documento")
      return
    }

    if (!form.version.trim()) {
      toast.error("Ingresa la versión del documento")
      return
    }

    if (!form.workAreaId) {
      toast.error("Selecciona un área de trabajo")
      return
    }

    if (!form.code.trim()) {
      toast.error("Ingresa el código del documento")
      return
    }

    const payload: UpsertManagedDocumentDto = {
      name: form.name.trim(),
      type: form.type,
      version: form.version.trim(),
      workAreaId: form.workAreaId,
      consecutive: Number(form.consecutive),
      code: form.code.trim(),
    }

    setSaving(true)
    try {
      if (form.id) {
        await updateManagedDocument(form.id, payload)
        toast.success("Documento actualizado")
      } else {
        await createManagedDocument(payload)
        toast.success("Documento creado")
      }

      resetForm()
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el documento")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(document: ManagedDocument) {
    const confirmed = window.confirm(`¿Eliminar el documento "${document.name}"?`)
    if (!confirmed) return

    try {
      await deleteManagedDocument(document.id)
      toast.success("Documento eliminado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  async function handleActivate(document: ManagedDocument) {
    try {
      await activateManagedDocument(document.id)
      toast.success(document.status === "ACTIVE" ? "Documento inactivado" : "Documento activado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado del documento")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión Documental</h1>
          <p className="text-muted-foreground">
            Administra procedimientos, manuales, instructivos y otros documentos por área de trabajo.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : resetForm())}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{form.id ? "Editar documento" : "Nuevo documento"}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-name">Nombre</Label>
                <Input
                  id="document-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ej: Procedimiento de inspección de seguridad"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((current) => ({ ...current, type: value as ManagedDocumentType }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área de trabajo</Label>
                <Select
                  value={form.workAreaId}
                  onValueChange={(value) => setForm((current) => ({ ...current, workAreaId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un área" />
                  </SelectTrigger>
                  <SelectContent>
                    {workAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-version">Versión</Label>
                <Input
                  id="document-version"
                  value={form.version}
                  onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
                  placeholder="1.0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document-consecutive">Consecutivo</Label>
                <Input
                  id="document-consecutive"
                  type="number"
                  min={1}
                  value={form.consecutive}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, consecutive: Number(event.target.value) || 1 }))
                  }
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="document-code">Código</Label>
                <Input
                  id="document-code"
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  placeholder="PR-LAB-001"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : form.id ? "Actualizar" : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Documentos</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Activos</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inactivos</p>
            <p className="text-2xl font-bold">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Procedimientos</p>
            <p className="text-2xl font-bold">{stats.procedures}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
                placeholder="Buscar por nombre, código, versión o área..."
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:col-span-2">
              <Select value={workAreaFilter} onValueChange={setWorkAreaFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Área de trabajo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  {workAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando documentos...
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No hay documentos que coincidan con los filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {document.type === "MANUAL" ? <BookOpen className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{document.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {document.code} · Versión {document.version} · Consecutivo {document.consecutive}
                      </p>
                      <p className="text-xs text-muted-foreground">{document.workArea?.name ?? "Sin área"}</p>
                    </div>
                  </div>

                  <Badge variant="outline" className={statusClass(document.status)}>
                    {statusLabel(document.status)}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{documentTypeLabel(document.type)}</Badge>
                  <Badge variant="outline">{document.workArea?.name ?? "Área no disponible"}</Badge>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditDialog(document)}>
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleActivate(document)}>
                    <Power className="h-4 w-4" />
                    {document.status === "ACTIVE" ? "Inactivar" : "Activar"}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDelete(document)}>
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
