// components/manager/super-admin/dialogs/CreateCompanyDialog.tsx
"use client"

import { type ReactNode, useEffect, useState } from "react"
import type { Company, CompanyStatus } from "@/types/manager/super-admin"


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

import { Edit, Loader2, Plus } from "lucide-react"

type CompanyForm = {
  name: string
  nit: string
  address: string
  phone: string
  email: string
  status: CompanyStatus
}

type Props = {
  company?: Company | null
  trigger?: ReactNode
  onCreate?: (payload: CompanyForm) => Promise<void>
  onUpdate?: (company: Company, payload: Omit<CompanyForm, "status">) => Promise<void>
}

const emptyForm: CompanyForm = {
  name: "",
  nit: "",
  address: "",
  phone: "",
  email: "",
  status: "active",
}

export function CreateCompanyDialog({ company, trigger, onCreate, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(company)

  const [form, setForm] = useState<CompanyForm>(emptyForm)

  useEffect(() => {
    if (!open) return

    setForm(
      company
        ? {
            name: company.name,
            nit: company.nit,
            address: company.address,
            phone: company.phone,
            email: company.email,
            status: company.status,
          }
        : emptyForm,
    )
  }, [company, open])

  const submit = async () => {
    if (!form.name.trim() || !form.nit.trim() || !form.email.trim()) return

    setSaving(true)
    try {
      if (company && onUpdate) {
        await onUpdate(company, {
          name: form.name.trim(),
          nit: form.nit.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        })
      } else if (onCreate) {
        await onCreate({
          ...form,
          name: form.name.trim(),
          nit: form.nit.trim(),
          address: form.address.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
        })
      }

      setForm(emptyForm)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Empresa
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">{isEditing ? "Actualizar Empresa" : "Crear Nueva Empresa"}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing
              ? "Actualiza los datos principales de la empresa seleccionada."
              : "Registra la empresa. Luego podrás crear usuarios para ella."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-foreground">Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-foreground">NIT</Label>
              <Input
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label className="text-foreground">Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="bg-input border-border text-foreground"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-foreground">Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
            className="border-border text-foreground hover:bg-secondary"
          >
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={saving || !form.name.trim() || !form.nit.trim() || !form.email.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isEditing ? (
              <Edit className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isEditing ? "Guardar cambios" : "Crear Empresa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
