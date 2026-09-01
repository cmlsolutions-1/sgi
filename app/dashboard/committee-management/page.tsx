"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CalendarDays, Edit, LayoutGrid, List, Loader2, MoreHorizontal, Plus, Power, Upload, UsersRound, X } from "lucide-react"
import { toast } from "sonner"

import { CommitteeDocumentPanel } from "@/components/committee/CommitteeDocumentPanel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  changeCommitteeStatus,
  createCommittee,
  listCommittees,
  updateCommittee,
} from "@/services/committeeService"
import { listEmployees } from "@/services/employeeService"
import type {
  Committee,
  CommitteeStatus,
  CommitteeType,
  CreateCommitteeDto,
} from "@/types/manager/committee"
import type { Employee } from "@/types/manager/employee"

const COMMITTEE_TYPES: Array<{ value: CommitteeType; label: string }> = [
  { value: "COPAST", label: "COPASST" },
  { value: "WORKPLACE_COEXISTENCE", label: "Comité de convivencia laboral" },
]

const emptyForm: CreateCommitteeDto = {
  type: "COPAST",
  startDate: "",
  endDate: "",
  presidentEmployeeId: "",
  secretaryEmployeeId: "",
  principalMemberIds: [],
  alternateMemberIds: [],
}

type ViewMode = "cards" | "list"

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.split("T")[0]
}

function getCommitteeTypeLabel(type: CommitteeType) {
  return COMMITTEE_TYPES.find((item) => item.value === type)?.label ?? type
}

function getStatusLabel(status: CommitteeStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function getStatusClass(status: CommitteeStatus) {
  return status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-600 border-slate-200"
}

function getEmployeeName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "No asignado"
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

type CommitteeDialogProps = {
  open: boolean
  employees: Employee[]
  committee: Committee | null
  onClose: () => void
  onSave: (payload: CreateCommitteeDto) => Promise<void>
}

function CommitteeDialog({ open, employees, committee, onClose, onSave }: CommitteeDialogProps) {
  const [form, setForm] = useState<CreateCommitteeDto>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      committee
        ? {
            type: committee.type,
            startDate: formatDate(committee.startDate),
            endDate: formatDate(committee.endDate),
            presidentEmployeeId: committee.presidentEmployeeId,
            secretaryEmployeeId: committee.secretaryEmployeeId,
            principalMemberIds: committee.principalMemberIds ?? [],
            alternateMemberIds: committee.alternateMemberIds ?? [],
          }
        : emptyForm,
    )
  }, [committee, open])

  if (!open) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.startDate || !form.endDate) {
      toast.error("Selecciona la fecha de inicio y fin del comité")
      return
    }

    if (form.endDate < form.startDate) {
      toast.error("La fecha fin no puede ser anterior a la fecha de inicio")
      return
    }

    if (!form.presidentEmployeeId || !form.secretaryEmployeeId) {
      toast.error("Selecciona presidente y secretario")
      return
    }

    if (form.principalMemberIds.length === 0) {
      toast.error("Selecciona al menos un miembro principal")
      return
    }

    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{committee ? "Editar comité" : "Nuevo comité"}</h2>
            <p className="text-sm text-slate-500">Define responsables y miembros del comité.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Tipo</span>
              <select
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as CommitteeType }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {COMMITTEE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Fecha inicio</span>
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Fecha fin</span>
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Presidente</span>
              <select
                value={form.presidentEmployeeId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, presidentEmployeeId: event.target.value }))
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona funcionario</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {getEmployeeName(employee)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Secretario</span>
              <select
                value={form.secretaryEmployeeId}
                onChange={(event) => setForm((current) => ({ ...current, secretaryEmployeeId: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona funcionario</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {getEmployeeName(employee)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <MemberPicker
              title="Miembros principales"
              employees={employees}
              selectedIds={form.principalMemberIds}
              onToggle={(id) =>
                setForm((current) => ({ ...current, principalMemberIds: toggleId(current.principalMemberIds, id) }))
              }
            />
            <MemberPicker
              title="Miembros suplentes"
              employees={employees}
              selectedIds={form.alternateMemberIds}
              onToggle={(id) =>
                setForm((current) => ({ ...current, alternateMemberIds: toggleId(current.alternateMemberIds, id) }))
              }
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[#2f8ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2576b5] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MemberPicker({
  title,
  employees,
  selectedIds,
  onToggle,
}: {
  title: string
  employees: Employee[]
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <section className="rounded-md border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-900">{title}</h3>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {employees.length === 0 ? (
          <p className="text-sm text-slate-500">No hay funcionarios disponibles.</p>
        ) : (
          employees.map((employee) => (
            <label key={employee.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={selectedIds.includes(employee.id)}
                onChange={() => onToggle(employee.id)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-800">{getEmployeeName(employee)}</span>
                <span className="block truncate text-xs text-slate-500">{employee.email}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  )
}

export default function CommitteeManagementPage() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null)
  const [documentsCommittee, setDocumentsCommittee] = useState<Committee | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [typeFilter, setTypeFilter] = useState<CommitteeType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<CommitteeStatus | "all">("all")

  const activeCount = useMemo(() => committees.filter((committee) => committee.status === "ACTIVE").length, [committees])

  async function loadData() {
    setLoading(true)
    try {
      const [committeeList, employeeList] = await Promise.all([
        listCommittees({ limit: 100, type: typeFilter, status: statusFilter }),
        listEmployees(),
      ])
      setCommittees(committeeList.items ?? [])
      setEmployees(employeeList)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la información")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, statusFilter])

  async function handleSave(payload: CreateCommitteeDto) {
    try {
      if (editingCommittee) {
        await updateCommittee(editingCommittee.id, payload)
        toast.success("Comité actualizado")
      } else {
        await createCommittee(payload)
        toast.success("Comité creado")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el comité")
      throw error
    }
  }

  async function handleChangeStatus(committee: Committee) {
    const nextStatus: CommitteeStatus = committee.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changeCommitteeStatus(committee.id, nextStatus)
      toast.success(nextStatus === "ACTIVE" ? "Comité activado" : "Comité inactivado")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Comités</h1>
          <p className="text-muted-foreground">
            Administra los comités, responsables, miembros y documentos de soporte.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingCommittee(null)
            setDialogOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2f8ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2576b5]"
        >
          <Plus className="h-4 w-4" />
          Nuevo comité
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-slate-900">{committees.length}</span>
              <span className="ml-2 text-xs text-muted-foreground">Registrados</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-emerald-700">{activeCount}</span>
              <span className="ml-2 text-xs text-muted-foreground">Activos</span>
            </div>
            <div className="rounded-md bg-secondary px-3 py-1.5">
              <span className="text-sm font-bold text-slate-900">{employees.length}</span>
              <span className="ml-2 text-xs text-muted-foreground">Funcionarios</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Filtrar por tipo</span>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as CommitteeType | "all")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {COMMITTEE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Filtrar por estado</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CommitteeStatus | "all")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#2f8ed8]" />
        </div>
      ) : committees.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          No hay comités registrados con los filtros actuales.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Lista de comités</h2>
              <p className="text-sm text-muted-foreground">{committees.length} registros encontrados</p>
            </div>
            <div className="inline-flex w-fit rounded-md border border-border bg-secondary p-1">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "cards" ? "default" : "ghost"}
                className="h-8 gap-2"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
                Tarjetas
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-8 gap-2"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
            </div>
          </div>

          {viewMode === "cards" ? (
            <section className="grid gap-4">
              {committees.map((committee) => (
                <article key={committee.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{getCommitteeTypeLabel(committee.type)}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(committee.status)}`}>
                          {getStatusLabel(committee.status)}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Inicio: {formatDate(committee.startDate)}
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Fin: {formatDate(committee.endDate)}
                        </p>
                        <p>Presidente: {getEmployeeName(committee.president)}</p>
                        <p>Secretario: {getEmployeeName(committee.secretary)}</p>
                        <p>Principales: {committee.principalMembers?.length ?? committee.principalMemberIds?.length ?? 0}</p>
                        <p>Suplentes: {committee.alternateMembers?.length ?? committee.alternateMemberIds?.length ?? 0}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommittee(committee)
                          setDialogOpen(true)
                        }}
                        className="inline-flex items-center gap-2 rounded-md border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                      >
                        <Edit className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeStatus(committee)}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Power className="h-4 w-4" />
                        {committee.status === "ACTIVE" ? "Inactivar" : "Activar"}
                      </button>
                    </div>
                  </div>

                  <CommitteeDocumentPanel owner="committee" ownerId={committee.id} />
                </article>
              ))}
            </section>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border bg-card">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Comité</th>
                    <th className="px-4 py-3 font-medium">Vigencia</th>
                    <th className="px-4 py-3 font-medium">Responsables</th>
                    <th className="px-4 py-3 font-medium">Miembros</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {committees.map((committee) => (
                    <tr key={committee.id} className="align-middle">
                      <td className="px-4 py-3">
                        <p className="max-w-[240px] truncate font-medium text-foreground">
                          {getCommitteeTypeLabel(committee.type)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>Inicio: {formatDate(committee.startDate)}</span>
                          <span>Fin: {formatDate(committee.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span className="max-w-[220px] truncate">Presidente: {getEmployeeName(committee.president)}</span>
                          <span className="max-w-[220px] truncate">Secretario: {getEmployeeName(committee.secretary)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4" />
                          <span>
                            {committee.principalMembers?.length ?? committee.principalMemberIds?.length ?? 0} principales ·{" "}
                            {committee.alternateMembers?.length ?? committee.alternateMemberIds?.length ?? 0} suplentes
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(committee.status)}`}>
                          {getStatusLabel(committee.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem
                              onSelect={() => {
                                setEditingCommittee(committee)
                                setDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setDocumentsCommittee(committee)}>
                              <Upload className="h-4 w-4" />
                              Cargar / ver archivos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleChangeStatus(committee)}>
                              <Power className="h-4 w-4" />
                              {committee.status === "ACTIVE" ? "Inactivar" : "Activar"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <Dialog open={Boolean(documentsCommittee)} onOpenChange={(open) => !open && setDocumentsCommittee(null)}>
        <DialogContent className="max-h-[88vh] w-[calc(100vw-2rem)] max-w-4xl overflow-hidden bg-card p-0">
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>Documentos del comité</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto px-6 py-4">
            {documentsCommittee && <CommitteeDocumentPanel owner="committee" ownerId={documentsCommittee.id} />}
          </div>
        </DialogContent>
      </Dialog>

      <CommitteeDialog
        open={dialogOpen}
        employees={employees}
        committee={editingCommittee}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </main>
  )
}
