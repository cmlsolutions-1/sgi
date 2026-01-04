"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

/* =====================
   TIPOS
===================== */
type TrainingStatus = "completed" | "scheduled"

interface Training {
  id: string
  title: string
  date: string
  time: string
  responsible: string
  description: string
  status: TrainingStatus
}

/* =====================
   MESES
===================== */
const months = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

/* =====================
   HORAS CADA 30 MIN
===================== */
const generateHalfHourTimes = () => {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    times.push(`${String(h).padStart(2, "0")}:00`)
    times.push(`${String(h).padStart(2, "0")}:30`)
  }
  return times
}

const timeOptions = generateHalfHourTimes()

/* =====================
   COMPONENTE
===================== */
export default function TrainingPlanPage() {
  const router = useRouter()

  /* ===== ESTADO PRINCIPAL (localStorage) ===== */
  const [trainings, setTrainings] = useState<Training[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("trainings")
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem("trainings", JSON.stringify(trainings))
  }, [trainings])

  /* ===== FILTROS ===== */
  const [yearFilter, setYearFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  /* ===== MODAL ===== */
  const [open, setOpen] = useState(false)

  const [newTraining, setNewTraining] = useState({
    title: "",
    date: "",
    time: "",
    responsible: "",
    description: "",
    status: "scheduled" as TrainingStatus,
  })

  /* =====================
     FILTRADO
  ===================== */
  const filteredTrainings = trainings.filter((t) => {
    const d = new Date(`${t.date}T${t.time}`)
    const year = d.getFullYear().toString()
    const month = (d.getMonth() + 1).toString().padStart(2, "0")

    return (
      (yearFilter === "all" || year === yearFilter) &&
      (monthFilter === "all" || month === monthFilter) &&
      (statusFilter === "all" || t.status === statusFilter)
    )
  })

  const years = Array.from(
    new Set(trainings.map((t) => new Date(t.date).getFullYear().toString()))
  )

  /* =====================
     VALIDACIÓN FECHA/HORA
  ===================== */
  const isPastDateTime = () => {
    const selected = new Date(`${newTraining.date}T${newTraining.time}`)
    return selected < new Date()
  }

  /* =====================
     UI
  ===================== */
  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Plan Anual de Capacitaciones
          </h1>
          <p className="text-muted-foreground">
            Sistema de Gestión de Seguridad y Salud en el Trabajo
          </p>
        </div>

        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Capacitación
        </Button>
      </div>

      {/* FILTROS */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold">Filtrar por</h3>

          <div className="flex gap-4 flex-wrap">
            {/* AÑO */}
            <div>
              <p className="text-sm mb-1">Año</p>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* MES */}
            <div>
              <p className="text-sm mb-1">Mes</p>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ESTADO */}
            <div>
              <p className="text-sm mb-1">Estado</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="completed">Realizadas</SelectItem>
                  <SelectItem value="scheduled">No realizadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LISTA */}
      <div className="space-y-4">
        {filteredTrainings.map((t) => (
          <Card
            key={t.id}
            className={cn(
              "border-l-4",
              t.status === "completed"
                ? "border-l-green-600"
                : "border-l-red-600"
            )}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.date} – {t.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  Responsable: {t.responsible}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={
                    t.status === "completed"
                      ? "text-green-600 border-green-600"
                      : "text-red-600 border-red-600"
                  }
                >
                  {t.status === "completed"
                    ? "Realizada"
                    : "No realizada"}
                </Badge>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/dashboard/trainingPlan/${t.id}`)
                  }
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver detalle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL NUEVA */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Capacitación</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              placeholder="Tema"
              value={newTraining.title}
              onChange={(e) =>
                setNewTraining({ ...newTraining, title: e.target.value })
              }
            />

            <Input
              type="date"
              value={newTraining.date}
              onChange={(e) =>
                setNewTraining({ ...newTraining, date: e.target.value })
              }
            />

            {/* HORA CADA 30 MIN */}
            <Select
              value={newTraining.time}
              onValueChange={(value) =>
                setNewTraining({ ...newTraining, time: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Hora de la capacitación" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Responsable"
              value={newTraining.responsible}
              onChange={(e) =>
                setNewTraining({ ...newTraining, responsible: e.target.value })
              }
            />

            <Textarea
              placeholder="Descripción de la capacitación"
              value={newTraining.description}
              onChange={(e) =>
                setNewTraining({
                  ...newTraining,
                  description: e.target.value,
                })
              }
              className="resize-none h-28 max-h-40 overflow-y-auto"
            />
          </div>

          <DialogFooter>
            <Button
              disabled={
                !newTraining.title ||
                !newTraining.date ||
                !newTraining.time ||
                isPastDateTime()
              }
              onClick={() => {
                setTrainings([
                  ...trainings,
                  {
                    id: Date.now().toString(),
                    ...newTraining,
                  },
                ])
                setOpen(false)
                setNewTraining({
                  title: "",
                  date: "",
                  time: "",
                  responsible: "",
                  description: "",
                  status: "scheduled",
                })
              }}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
