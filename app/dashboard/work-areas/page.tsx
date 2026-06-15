"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Edit, Loader2, Plus, Search, Trash2, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import {
  activateWorkArea,
  createWorkArea,
  deleteWorkArea,
  listWorkAreas,
  updateWorkArea,
} from "@/services/workAreaService"
import type { WorkArea } from "@/types/manager/work-area"

type FormState = {
  id?: string
  name: string
  description: string
}

const emptyForm: FormState = {
  name: "",
  description: "",
}

const fieldControlClassName =
  "w-full border-slate-400 bg-white shadow-sm hover:border-slate-500 focus-visible:border-primary focus-visible:ring-primary/25"

export function WorkAreasManager() {
  const [workAreas, setWorkAreas] = useState<WorkArea[]>([])
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const filteredWorkAreas = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return workAreas

    return workAreas.filter(
      (area) =>
        area.name.toLowerCase().includes(query) ||
        area.description.toLowerCase().includes(query)
    )
  }, [search, workAreas])

  async function loadWorkAreas() {
    setLoading(true)
    try {
      const data = await listWorkAreas()
      setWorkAreas(data)
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo cargar areas de trabajo")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadWorkAreas()
  }, [])

  function openCreateDialog() {
    setForm(emptyForm)
    setOpen(true)
  }

  function openEditDialog(area: WorkArea) {
    setForm({
      id: area.id,
      name: area.name,
      description: area.description,
    })
    setOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error("El nombre del area es requerido")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      }

      if (form.id) {
        await updateWorkArea(form.id, payload)
        toast.success("Area actualizada")
      } else {
        await createWorkArea(payload)
        toast.success("Area creada")
      }

      setOpen(false)
      await loadWorkAreas()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo guardar el area")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(area: WorkArea) {
    if (!window.confirm(`Eliminar el area "${area.name}"?`)) return

    try {
      await deleteWorkArea(area.id)
      toast.success("Area eliminada")
      await loadWorkAreas()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo eliminar el area")
    }
  }

  async function handleActivate(area: WorkArea) {
    try {
      await activateWorkArea(area.id)
      toast.success("Area activada")
      await loadWorkAreas()
    } catch (error: any) {
      toast.error(error.message ?? "No se pudo activar el area")
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Areas de trabajo</h1>
          <p className="text-muted-foreground">Crea las areas antes de registrar puestos de trabajo.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva area
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{form.id ? "Editar area" : "Crear area"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="work-area-name">Nombre</Label>
                  <Input
                    id="work-area-name"
                    className={fieldControlClassName}
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Ej: Produccion"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="work-area-description">Descripcion</Label>
                  <Textarea
                    id="work-area-description"
                    className={fieldControlClassName}
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Describe el area de trabajo"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar area"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar area..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base font-medium">{filteredWorkAreas.length} areas encontradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Area</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Descripcion</th>
                  <th className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                  <th className="px-2 py-3 text-right text-xs font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkAreas.map((area) => (
                  <tr key={area.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{area.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-sm text-muted-foreground">{area.description || "Sin descripcion"}</td>
                    <td className="px-2 py-3 ">
                      <Badge variant={area.status === "ACTIVE" ? "accentActivd" : "secondary"}>{area.status}</Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex justify-end gap-1">
                        {area.status !== "ACTIVE" && (
                          <Button variant="ghost" size="sm" onClick={() => handleActivate(area)}>
                            Activar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(area)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(area)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredWorkAreas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-2 py-10 text-center text-sm text-muted-foreground">
                      No hay areas de trabajo para mostrar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function WorkAreasPage() {
  return <WorkAreasManager />
}
