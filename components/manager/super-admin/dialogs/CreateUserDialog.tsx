// components/manager/super-admin/dialogs/CreateUserDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import type { CreateUserDto, User } from "@/types/manager/user"
import { useRoles } from "@/hooks/useRoles"

type Props = {
  disabled?: boolean
  companyName?: string
  loading?: boolean
  onCreate: (payload: CreateUserDto) => Promise<User | null> | Promise<void>
}

export function CreateUserDialog({ disabled, companyName, loading, onCreate }: Props) {
  const [open, setOpen] = useState(false)
  const { roles, loading: loadingRoles, getRoleByName } = useRoles(false)
  const [form, setForm] = useState<CreateUserDto>({
    name: "",
    email: "",
    phone: "",
    password: "",
    rolesIds: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar roles cuando se abre el diálogo
  useEffect(() => {
    if (open && roles.length === 0) {
      // useRoles ya maneja el fetch si autoFetch=true
      // Si usas autoFetch=false, descomenta:
      // fetchRoles()
    }
  }, [open, roles.length])

  // Seleccionar rol por defecto cuando carguen los roles
  useEffect(() => {
    if (roles.length > 0 && form.rolesIds.length === 0) {
      // Prioridad: buscar "admin", luego "ADMIN", luego primer rol activo
      const adminRole = getRoleByName("admin") || getRoleByName("ADMIN")
      const defaultRole = adminRole || roles[0]
      
      if (defaultRole) {
        setForm((prev) => ({ ...prev, rolesIds: [defaultRole.id] }))
      }
    }
  }, [roles, getRoleByName, form.rolesIds.length])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = "El nombre es requerido"

    if (!form.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email inválido"
    }

    if (!form.phone.trim()) newErrors.phone = "El teléfono es requerido"

    if (!form.password.trim()) {
      newErrors.password = "La contraseña es requerida"
    } else if (form.password.length < 6) {
      newErrors.password = "Mínimo 6 caracteres"
    }

    if (form.rolesIds.length === 0) {
      newErrors.rolesIds = "Debe seleccionar al menos un rol"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return

    const result = await onCreate(form)

    if (result === null) {
      return
    }

    // Éxito → limpiar y cerrar
    const defaultRoleId = form.rolesIds[0]
    
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      rolesIds: defaultRoleId ? [defaultRoleId] : [],
    })
    setErrors({})
    setOpen(false)
  }

  const handleChange = (field: keyof CreateUserDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleRoleChange = (roleId: string) => {
    setForm((prev) => ({ ...prev, rolesIds: [roleId] }))
    if (errors.rolesIds) {
      setErrors((prev) => ({ ...prev, rolesIds: "" }))
    }
  }

  // Filtrar solo roles activos
  const activeRoles = roles.filter((r) => r.status === "ACTIVE")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            Crear Usuario {companyName ? `- ${companyName}` : ""}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crea un usuario para esta empresa. La contraseña se encriptará en el backend.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-foreground">Nombre *</Label>
            <Input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`bg-input border-border text-foreground ${errors.name ? "border-destructive" : ""}`}
              placeholder="Nombre completo"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`bg-input border-border text-foreground ${errors.email ? "border-destructive" : ""}`}
              placeholder="usuario@empresa.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Teléfono *</Label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className={`bg-input border-border text-foreground ${errors.phone ? "border-destructive" : ""}`}
              placeholder="+57 300 123 4567"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Contraseña *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={`bg-input border-border text-foreground ${errors.password ? "border-destructive" : ""}`}
              placeholder="Mínimo 6 caracteres"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Rol *</Label>
            <Select
              value={form.rolesIds[0]}
              onValueChange={handleRoleChange}
              disabled={loadingRoles || activeRoles.length === 0}
            >
              <SelectTrigger
                className={`bg-input border-border text-foreground ${errors.rolesIds ? "border-destructive" : ""}`}
              >
                <SelectValue
                  placeholder={
                    loadingRoles
                      ? "Cargando roles..."
                      : activeRoles.length === 0
                      ? "No hay roles disponibles"
                      : "Seleccionar rol"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {activeRoles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id}
                    className="text-foreground hover:bg-accent"
                  >
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rolesIds && <p className="text-xs text-destructive">{errors.rolesIds}</p>}
            {form.rolesIds[0] && (
              <p className="text-xs text-muted-foreground">
                ID: <span className="font-mono">{form.rolesIds[0]}</span>
              </p>
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
            disabled={disabled || loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crear Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}