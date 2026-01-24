// components/manager/super-admin/dialogs/CreateUserDialog.tsx
"use client"

import { useState } from "react"
import type { UserStatus } from "@/types/manager/super-admin"

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
import { Plus } from "lucide-react"

type Props = {
  disabled?: boolean
  companyName?: string
  onCreate: (payload: {
    name: string
    email: string
    password: string
    roleId: string
    status: UserStatus
  }) => void
}

export function CreateUserDialog({ disabled, companyName, onCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "admin",
    status: "active" as UserStatus,
  })

  const submit = () => {
    onCreate(form)
    setForm({ name: "", email: "", password: "", roleId: "admin", status: "active" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Crear Usuario {companyName ? `- ${companyName}` : ""}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crea un usuario para esta empresa. El hash de la contraseña se genera en backend.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label className="text-foreground">Nombre</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Contraseña</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="text-xs text-muted-foreground">
            Rol asignado: <span className="font-medium text-foreground">Administrador</span>{" "}
            <span className="font-mono">(roleId: {form.roleId})</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} className="border-border text-foreground hover:bg-secondary">
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={disabled}>
            Crear Usuario
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
