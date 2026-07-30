"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Loader2, ShieldCheck, UserCheck, Users } from "lucide-react"
import { toast } from "sonner"

import { SgiResponsibleFormDialog } from "@/components/dashboard/SgiResponsibleFormDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createSgiResponsible,
  getSgiResponsible,
  listEmployees,
  updateSgiResponsible,
} from "@/services/employeeService"
import type {
  Employee,
  EmployeeSgiResponsible,
  UpsertEmployeeSgiResponsibleDto,
} from "@/types/manager/employee"

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function getEmployeeName(employee?: Pick<Employee, "name" | "lastName" | "email" | "id"> | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id
}

export function SgiResponsibleManager() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [responsible, setResponsible] = useState<EmployeeSgiResponsible | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const responsibleEmployee = useMemo(
    () =>
      responsible?.employee ??
      (responsible?.employeeId ? employees.find((employee) => employee.id === responsible.employeeId) : null),
    [employees, responsible],
  )

  async function loadData() {
    setLoading(true)
    try {
      const employeesData = await listEmployees()
      setEmployees(employeesData)

      try {
        const responsibleData = await getSgiResponsible()
        setResponsible(responsibleData)
      } catch {
        setResponsible(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el responsable SG-SST")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSave(data: UpsertEmployeeSgiResponsibleDto) {
    try {
      const saved = responsible ? await updateSgiResponsible(data) : await createSgiResponsible(data)
      const selectedEmployee = employees.find((employee) => employee.id === data.employeeId)

      setResponsible({
        ...saved,
        employeeId: data.employeeId,
        signatureDate: data.signatureDate,
        employee: selectedEmployee
          ? {
              id: selectedEmployee.id,
              name: selectedEmployee.name,
              lastName: selectedEmployee.lastName,
              email: selectedEmployee.email,
              phone: selectedEmployee.phone,
            }
          : saved.employee,
      })

      toast.success(responsible ? "Responsable SG-SST actualizado" : "Responsable SG-SST asignado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el responsable SG-SST")
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Responsable SG-SST</h1>
          <p className="text-muted-foreground">
            Gestiona la designacion y los soportes del responsable del Sistema de Gestion de Seguridad y Salud en el Trabajo.
          </p>
        </div>
        <Button className="gap-2" disabled={loading || employees.length === 0} onClick={() => setDialogOpen(true)}>
          <UserCheck className="h-4 w-4" />
          {responsible ? "Gestionar Responsable SG-SST" : "Asignar Responsable SG-SST"}
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5" />
                Designacion actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Funcionario responsable</p>
                <p className="text-lg font-semibold text-foreground">{getEmployeeName(responsibleEmployee)}</p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Fecha de firma: {formatDate(responsible?.signatureDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Funcionarios disponibles: {employees.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" disabled={employees.length === 0} onClick={() => setDialogOpen(true)}>
                <UserCheck className="h-4 w-4" />
                {responsible ? "Actualizar responsable" : "Asignar responsable"}
              </Button>
              <p className="text-sm text-muted-foreground">
                Desde esta opcion puedes generar la designacion, cargar soportes y administrar documentos asociados.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <SgiResponsibleFormDialog
        employees={employees}
        open={dialogOpen}
        responsible={responsible}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
      />
    </div>
  )
}
