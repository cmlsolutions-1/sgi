"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Employee, EmployeeSgiResponsible, UpsertEmployeeSgiResponsibleDto } from "@/types/manager/employee"

interface SgiResponsibleFormDialogProps {
  employees: Employee[]
  open: boolean
  responsible?: EmployeeSgiResponsible | null
  onOpenChange: (open: boolean) => void
  onSave: (data: UpsertEmployeeSgiResponsibleDto) => Promise<void>
}

export function SgiResponsibleFormDialog({
  employees,
  open,
  responsible,
  onOpenChange,
  onSave,
}: SgiResponsibleFormDialogProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [signatureDate, setSignatureDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setEmployeeId(responsible?.employeeId ?? "")
    setSignatureDate(responsible?.signatureDate ? responsible.signatureDate.slice(0, 10) : "")
  }, [open, responsible])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!employeeId || !signatureDate) {
      toast.error("Selecciona el responsable y la fecha de firma")
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({ employeeId, signatureDate })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Asignar Responsable del SGI</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {responsible?.employee && (
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <p className="font-medium">
                  Responsable actual: {responsible.employee.name} {responsible.employee.lastName}
                </p>
                <p className="text-muted-foreground">{responsible.employee.email || responsible.employee.phone}</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Funcionario responsable</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un funcionario" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {`${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sgi-signature-date">Fecha de firma</Label>
              <Input
                id="sgi-signature-date"
                type="date"
                value={signatureDate}
                onChange={(event) => setSignatureDate(event.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : responsible ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
