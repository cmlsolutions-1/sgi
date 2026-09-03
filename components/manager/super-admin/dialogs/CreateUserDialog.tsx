// components/manager/super-admin/dialogs/CreateUserDialog.tsx
"use client"

import { useEffect, useState } from "react"
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
import { Edit2, Plus, Loader2 } from "lucide-react"
import type { CreateCompanyAdminDto } from "@/types/manager/user"
import type { User } from "@/types/manager/user"

type Props = {
  disabled?: boolean
  companyName?: string
  loading?: boolean
  user?: User | null
  onCreate: (payload: CreateCompanyAdminDto) => Promise<User | null> | Promise<void>
  onUpdate?: (payload: CreateCompanyAdminDto) => Promise<boolean>
}

const emptyForm: CreateCompanyAdminDto = {
  name: "",
  email: "",
  phone: "",
  password: "",
}

function sanitizePhone(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits.length > 10 && digits.startsWith("57") ? digits.slice(2, 12) : digits.slice(0, 10)
}

export function CreateUserDialog({ disabled, companyName, loading, user, onCreate, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const isEditing = Boolean(user)

  const [form, setForm] = useState<CreateCompanyAdminDto>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return

    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: sanitizePhone(user.phone ?? ""),
        password: "",
      })
    } else {
      setForm(emptyForm)
    }

    setErrors({})
  }, [open, user])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = "El nombre es requerido"

    if (!form.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email inválido"
    }

    if (!form.phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "El teléfono debe tener 10 dígitos"
    }

    if (!form.password.trim()) {
      newErrors.password = "La contraseña es requerida"
    } else if (form.password.length < 8) {
      newErrors.password = "Mínimo 8 caracteres"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return

    if (user) {
      if (!onUpdate) return

      const updated = await onUpdate({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      })

      if (!updated) return

      setErrors({})
      setOpen(false)
      return
    }

    const result = await onCreate(form)

    if (result === null) {
      return
    }

    setForm(emptyForm)
    setErrors({})
    setOpen(false)
  }

  const handleChange = (field: keyof CreateCompanyAdminDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: field === "phone" ? sanitizePhone(value) : value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isEditing ? "action" : "default"}
          size={isEditing ? "icon" : "default"}
          className={isEditing ? "h-8 w-8" : "bg-primary text-primary-foreground hover:bg-primary/90"}
          disabled={disabled}
          aria-label={isEditing ? "Editar usuario" : "Nuevo usuario"}
        >
          {isEditing ? (
            <Edit2 className="h-4 w-4" />
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {isEditing ? "Editar Usuario" : "Crear Usuario"} {companyName ? `- ${companyName}` : ""}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Actualiza la información básica del usuario administrador de esta empresa."
              : "Crea un usuario administrador para esta empresa. La contraseña se encriptará en el backend."}
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
              maxLength={10}
              inputMode="numeric"
              pattern="[0-9]{10}"
              className={`bg-input border-border text-foreground ${errors.phone ? "border-destructive" : ""}`}
              placeholder="3000000000"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">{isEditing ? "Nueva contraseña *" : "Contraseña *"}</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              className={`bg-input border-border text-foreground ${errors.password ? "border-destructive" : ""}`}
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            {isEditing ? (
              <p className="text-xs text-muted-foreground">
                Este endpoint actualiza el administrador de empresa y requiere enviar una contraseña.
              </p>
            ) : null}
          </div>

          {/* Rol asignado automáticamente por el backend */}
          <div className="text-xs text-muted-foreground">
            Rol asignado: <span className="font-medium text-foreground">Administrador de Empresa</span>
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
            {isEditing ? "Guardar cambios" : "Crear Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
