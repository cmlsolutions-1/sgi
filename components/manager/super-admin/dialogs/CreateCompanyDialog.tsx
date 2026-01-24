// components/manager/super-admin/dialogs/CreateCompanyDialog.tsx
"use client"

import { useState } from "react"
import type { CompanyStatus } from "@/types/manager/super-admin"


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
  onCreate: (payload: {
    name: string
    nit: string
    address: string
    phone: string
    email: string
    status: CompanyStatus
  }) => void
}

export function CreateCompanyDialog({ onCreate }: Props) {
  const [open, setOpen] = useState(false)

  const [form, setForm] = useState({
    name: "",
    nit: "",
    address: "",
    phone: "",
    email: "",
    status: "active" as CompanyStatus,
  })

  const submit = () => {
    onCreate(form)
    setForm({ name: "", nit: "", address: "", phone: "", email: "", status: "active" })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Crear Nueva Empresa</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Registra la empresa. Luego podrás crear usuarios para ella.
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
            className="border-border text-foreground hover:bg-secondary"
          >
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Crear Empresa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
