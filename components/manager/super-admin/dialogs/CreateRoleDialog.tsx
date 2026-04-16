// components/manager/super-admin/dialogs/CreateRoleDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Loader2, Shield, ChevronDown, ChevronRight } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import type { CreateRoleDto } from "@/types/manager/role"
import { cn } from "@/lib/utils"

type Props = {
  disabled?: boolean
  loading?: boolean
  onCreate: (payload: CreateRoleDto) => Promise<void>
}

export function CreateRoleDialog({ disabled, loading, onCreate }: Props) {
  const [open, setOpen] = useState(false)
  
  // ✅ Agregar fetchPermissions al destructuring
  const { groupedPermissions, loading: loadingPermissions, fetchPermissions } = usePermissions(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    permissionIds: [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})

  // ✅ Cargar permisos cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      fetchPermissions()
    }
  }, [open, fetchPermissions])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) {
      newErrors.name = "El nombre del rol es requerido"
    }

    if (form.permissionIds.length === 0) {
      newErrors.permissionIds = "Debe seleccionar al menos un permiso"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return

    await onCreate({
      name: form.name,
      description: form.description,
      permissionIds: form.permissionIds,
    })

    setForm({ name: "", description: "", permissionIds: [] })
    setErrors({})
    setOpen(false)
  }

  const togglePermission = (permissionId: string) => {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId],
    }))
  }

  const toggleModule = (module: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }))
  }

  const selectAllModule = (module: string, permissions: { id: string }[]) => {
    const moduleIds = permissions.map((p) => p.id)
    const allSelected = moduleIds.every((id) => form.permissionIds.includes(id))

    setForm((prev) => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds.filter((id) => !moduleIds.includes(id))
        : [...new Set([...prev.permissionIds, ...moduleIds])],
    }))
  }

  const modules = Object.keys(groupedPermissions).sort()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Shield className="h-4 w-4 mr-2" />
          Crear Rol
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">Crear Nuevo Rol</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Define un nuevo rol con los permisos necesarios para gestionar el sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-foreground">Nombre del Rol *</Label>
            <Input
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: "" })
              }}
              className={cn("bg-input border-border text-foreground", errors.name && "border-destructive")}
              placeholder="Ej: Administrador, Editor, Viewer"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="bg-input border-border text-frontend min-h-[80px]"
              placeholder="Descripción opcional del rol"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Permisos *</Label>
            
            {loadingPermissions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando permisos...</span>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No hay permisos disponibles
              </div>
            ) : (
              <div className="border border-border rounded-lg divide-y divide-border">
                {modules.map((module) => {
                  const perms = groupedPermissions[module]
                  const isExpanded = expandedModules[module] ?? true
                  const moduleIds = perms.map((p) => p.id)
                  const selectedCount = moduleIds.filter((id) => form.permissionIds.includes(id)).length
                  const allSelected = selectedCount === moduleIds.length

                  return (
                    <div key={module} className="p-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => toggleModule(module)}
                          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {module}
                          <span className="text-xs text-muted-foreground">
                            ({selectedCount}/{perms.length})
                          </span>
                        </button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllModule(module, perms)}
                          className="h-7 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {allSelected ? "Deseleccionar" : "Seleccionar todos"}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 grid gap-2 pl-6">
                          {perms.map((perm) => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Checkbox
                                id={perm.id}
                                checked={form.permissionIds.includes(perm.id)}
                                onCheckedChange={() => togglePermission(perm.id)}
                                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label
                                htmlFor={perm.id}
                                className="text-sm text-foreground cursor-pointer flex-1"
                              >
                                {perm.name}
                                {perm.key && (
                                  <span className="ml-2 text-xs text-muted-foreground font-mono">
                                    {perm.key}
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {errors.permissionIds && (
              <p className="text-xs text-destructive">{errors.permissionIds}</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-border text-foreground hover:bg-secondary"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={submit}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading || loadingPermissions}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Rol
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}