// components/manager/super-admin/dialogs/CreateUserDialog.tsx
"use client"

import { useState } from "react"
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
import { Plus, Loader2 } from "lucide-react"
import type { CreateCompanyAdminDto } from "@/types/manager/user"
import type { User } from "@/types/manager/user"

type Props = {
  disabled?: boolean
  companyName?: string
  loading?: boolean
  onCreate: (payload: CreateCompanyAdminDto) => Promise<User | null> | Promise<void>
}

export function CreateUserDialog({ disabled, companyName, loading, onCreate }: Props) {
  const [open, setOpen] = useState(false)

  // Form SIN rolesIds
  const [form, setForm] = useState<CreateCompanyAdminDto>({
    name: "",
    email: "",
    phone: "",
    password: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const submit = async () => {
    if (!validate()) return

    const result = await onCreate(form)

    if (result === null) {
      return
    }

    setForm({ name: "", email: "", phone: "", password: "" })
    setErrors({})
    setOpen(false)
  }

  const handleChange = (field: keyof CreateCompanyAdminDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

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
            Crea un usuario administrador para esta empresa. La contraseña se encriptará en el backend.
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

          {/* ✅ Rol asignado automáticamente por el backend */}
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
            Crear Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}