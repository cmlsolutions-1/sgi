"use client"

import { useEffect, useState } from "react"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UpdateCompanyAdminDto, User } from "@/types/manager/user"

type Props = {
  disabled?: boolean
  companyName?: string
  user: User
  onUpdateAdmin: (payload: UpdateCompanyAdminDto) => Promise<boolean>
}

export function EditCompanyAdminDialog({ disabled, companyName, user, onUpdateAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<UpdateCompanyAdminDto>({
    name: user.name,
    email: user.email,
    phone: user.phone,
  })
  const [saving, setSaving] = useState(false)

  function reset() {
    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
    })
  }

  useEffect(() => {
    if (open) reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user.id, user.name, user.email, user.phone])

  async function submit() {
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    }

    if (!payload.name) {
      toast.error("Ingresa el nombre del administrador")
      return
    }

    if (!payload.email) {
      toast.error("Ingresa el correo del administrador")
      return
    }

    if (!payload.phone) {
      toast.error("Ingresa el telefono del administrador")
      return
    }

    setSaving(true)
    try {
      const updated = await onUpdateAdmin(payload)
      if (!updated) return

      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-border text-foreground hover:bg-secondary"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Editar usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Editar administrador</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Actualiza los datos del administrador {companyName ? `de ${companyName}` : "de la empresa"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label className="text-foreground">Nombre</Label>
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Correo</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Telefono</Label>
            <Input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
