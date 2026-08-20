"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CalendarDays, Edit, Loader2, MapPin, Plus, Power, Search, UsersRound, X } from "lucide-react"
import { toast } from "sonner"

import { CommitteeDocumentPanel } from "@/components/committee/CommitteeDocumentPanel"
import {
  changeMeetingStatus,
  createMeeting,
  listCommittees,
  listMeetings,
  updateMeeting,
} from "@/services/committeeService"
import { listEmployees } from "@/services/employeeService"
import type {
  Committee,
  CommitteeStatus,
  CreateMeetingDto,
  Meeting,
} from "@/types/manager/committee"
import type { Employee } from "@/types/manager/employee"

const emptyForm: CreateMeetingDto = {
  committeeId: "",
  minutesNumber: "",
  topic: "",
  description: "",
  observations: "",
  meetingDate: "",
  startTime: "",
  endTime: "",
  location: "",
  attendeeIds: [],
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.split("T")[0]
}

function formatTime(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 5)
}

function getEmployeeName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  if (!employee) return "No asignado"
  return `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "No asignado"
}

function getCommitteeTypeLabel(type?: string) {
  if (type === "COPAST") return "COPASST"
  if (type === "WORKPLACE_COEXISTENCE") return "Comité de convivencia laboral"
  return "Comité"
}

function getStatusLabel(status: CommitteeStatus) {
  return status === "ACTIVE" ? "Activo" : "Inactivo"
}

function getStatusClass(status: CommitteeStatus) {
  return status === "ACTIVE"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-600 border-slate-200"
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]
}

type MeetingDialogProps = {
  open: boolean
  committees: Committee[]
  employees: Employee[]
  meeting: Meeting | null
  onClose: () => void
  onSave: (payload: CreateMeetingDto) => Promise<void>
}

function MeetingDialog({ open, committees, employees, meeting, onClose, onSave }: MeetingDialogProps) {
  const [form, setForm] = useState<CreateMeetingDto>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      meeting
        ? {
            committeeId: meeting.committeeId,
            minutesNumber: meeting.minutesNumber,
            topic: meeting.topic,
            description: meeting.description,
            observations: meeting.observations ?? "",
            meetingDate: formatDate(meeting.meetingDate),
            startTime: formatTime(meeting.startTime),
            endTime: formatTime(meeting.endTime),
            location: meeting.location,
            attendeeIds: meeting.attendeeIds ?? [],
          }
        : emptyForm,
    )
  }, [meeting, open])

  if (!open) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!form.committeeId || !form.minutesNumber || !form.topic || !form.description || !form.location) {
      toast.error("Diligencia comité, acta, tema, descripción y lugar")
      return
    }

    if (!form.meetingDate || !form.startTime || !form.endTime) {
      toast.error("Selecciona fecha, hora de inicio y hora de fin")
      return
    }

    if (form.endTime <= form.startTime) {
      toast.error("La hora fin debe ser posterior a la hora de inicio")
      return
    }

    if (form.attendeeIds.length === 0) {
      toast.error("Selecciona al menos un asistente")
      return
    }

    setSaving(true)
    try {
      await onSave({
        ...form,
        observations: form.observations?.trim() ? form.observations : null,
      })
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
            <h2 className="text-lg font-bold text-slate-900">{meeting ? "Editar reunión" : "Nueva reunión"}</h2>
            <p className="text-sm text-slate-500">Registra actas, tema, horario y asistentes.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Comité</span>
              <select
                value={form.committeeId}
                onChange={(event) => setForm((current) => ({ ...current, committeeId: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Selecciona comité</option>
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {getCommitteeTypeLabel(committee.type)} · {formatDate(committee.startDate)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Número de acta</span>
              <input
                value={form.minutesNumber}
                onChange={(event) => setForm((current) => ({ ...current, minutesNumber: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="ACTA-001"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Tema</span>
              <input
                value={form.topic}
                onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Lugar</span>
              <input
                value={form.location}
                onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Fecha</span>
              <input
                type="date"
                value={form.meetingDate}
                onChange={(event) => setForm((current) => ({ ...current, meetingDate: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Hora inicio</span>
              <input
                type="time"
                value={form.startTime}
                onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-700">Hora fin</span>
              <input
                type="time"
                value={form.endTime}
                onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Descripción</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Observaciones</span>
            <textarea
              value={form.observations ?? ""}
              onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <section className="rounded-md border border-slate-200 p-4">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Asistentes</h3>
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {employees.map((employee) => (
                <label key={employee.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={form.attendeeIds.includes(employee.id)}
                    onChange={() =>
                      setForm((current) => ({ ...current, attendeeIds: toggleId(current.attendeeIds, employee.id) }))
                    }
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-slate-800">{getEmployeeName(employee)}</span>
                    <span className="block truncate text-xs text-slate-500">{employee.email}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

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

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [committees, setCommittees] = useState<Committee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [statusFilter, setStatusFilter] = useState<CommitteeStatus | "all">("all")
  const [committeeFilter, setCommitteeFilter] = useState("all")
  const [search, setSearch] = useState("")

  const activeCount = useMemo(() => meetings.filter((meeting) => meeting.status === "ACTIVE").length, [meetings])

  async function loadData() {
    setLoading(true)
    try {
      const [meetingList, committeeList, employeeList] = await Promise.all([
        listMeetings({
          limit: 100,
          status: statusFilter,
          committeeId: committeeFilter === "all" ? undefined : committeeFilter,
          search: search.trim(),
        }),
        listCommittees({ limit: 100, status: "ACTIVE" }),
        listEmployees(),
      ])
      setMeetings(meetingList.items ?? [])
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
  }, [statusFilter, committeeFilter])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await loadData()
  }

  async function handleSave(payload: CreateMeetingDto) {
    try {
      if (editingMeeting) {
        await updateMeeting(editingMeeting.id, payload)
        toast.success("Reunión actualizada")
      } else {
        await createMeeting(payload)
        toast.success("Reunión creada")
      }
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la reunión")
      throw error
    }
  }

  async function handleChangeStatus(meeting: Meeting) {
    const nextStatus: CommitteeStatus = meeting.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    try {
      await changeMeetingStatus(meeting.id, nextStatus)
      toast.success(nextStatus === "ACTIVE" ? "Reunión activada" : "Reunión inactivada")
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar el estado")
    }
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reuniones</h1>
          <p className="text-muted-foreground">Gestiona actas, asistentes y soportes documentales.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingMeeting(null)
            setDialogOpen(true)
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#2f8ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2576b5]"
        >
          <Plus className="h-4 w-4" />
          Nueva reunión
        </button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-900">{meetings.length}</p>
            <p className="text-sm text-slate-500">Reuniones registradas</p>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
            <p className="text-sm text-slate-500">Reuniones activas</p>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <p className="text-2xl font-bold text-slate-900">{committees.length}</p>
            <p className="text-sm text-slate-500">Comités disponibles</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Buscar</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tema o descripción"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Comité</span>
            <select
              value={committeeFilter}
              onChange={(event) => setCommitteeFilter(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {committees.map((committee) => (
                <option key={committee.id} value={committee.id}>
                  {getCommitteeTypeLabel(committee.type)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold text-slate-700">Estado</span>
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
          <button
            type="submit"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Search className="h-4 w-4" />
            Filtrar
          </button>
        </form>
      </section>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-white py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#2f8ed8]" />
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
          No hay reuniones registradas con los filtros actuales.
        </div>
      ) : (
        <section className="grid gap-4">
          {meetings.map((meeting) => (
            <article key={meeting.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{meeting.topic}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(meeting.status)}`}>
                      {getStatusLabel(meeting.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Acta {meeting.minutesNumber}</p>
                  <p className="mt-2 text-sm text-slate-600">{meeting.description}</p>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(meeting.meetingDate)} · {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {meeting.location}
                    </p>
                    <p>{getCommitteeTypeLabel(meeting.committee?.type)}</p>
                    <p className="flex items-center gap-2">
                      <UsersRound className="h-4 w-4" />
                      {meeting.attendees?.length ?? meeting.attendeeIds?.length ?? 0} asistentes
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMeeting(meeting)
                      setDialogOpen(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-md border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChangeStatus(meeting)}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Power className="h-4 w-4" />
                    {meeting.status === "ACTIVE" ? "Inactivar" : "Activar"}
                  </button>
                </div>
              </div>

              <CommitteeDocumentPanel owner="meeting" ownerId={meeting.id} />
            </article>
          ))}
        </section>
      )}

      <MeetingDialog
        open={dialogOpen}
        committees={committees}
        employees={employees}
        meeting={editingMeeting}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </main>
  )
}
