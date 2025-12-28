"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, CalendarCheck, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"

/* =========================
   MODELO DE CAPACITACIÓN
========================= */
type Training = {
  id: string
  title: string
  date: string
  responsible: string
  status: "completed" | "scheduled"
}

/* =========================
   DATOS MOCK (TEMPORALES)
========================= */
const mockTrainings: Training[] = [
  {
    id: "1",
    title: "Inducción en Seguridad y Salud en el Trabajo",
    date: "2024-02-15",
    responsible: "Juan Pérez",
    status: "completed",
  },
  {
    id: "2",
    title: "Uso correcto de Elementos de Protección Personal",
    date: "2024-04-10",
    responsible: "María Gómez",
    status: "completed",
  },
  {
    id: "3",
    title: "Prevención de Riesgo Eléctrico",
    date: "2024-09-20",
    responsible: "Carlos Rodríguez",
    status: "scheduled",
  },
  {
    id: "4",
    title: "Plan de Emergencias y Evacuación",
    date: "2024-11-05",
    responsible: "Laura Martínez",
    status: "scheduled",
  },
]

/* =========================
   CONFIGURACIÓN DE ESTADOS
========================= */
const statusConfig = {
  completed: {
    label: "Realizada",
    color: "text-green-700",
    bg: "bg-green-100",
    icon: CalendarCheck,
  },
  scheduled: {
    label: "Programada",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    icon: CalendarClock,
  },
}

export default function TrainingPlanPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")

  const filteredTrainings = mockTrainings.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plan Anual de Capacitaciones</h1>
          <p className="text-muted-foreground">
            SG-SST · Capacitaciones realizadas y programadas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva Capacitación
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar capacitación..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Listado */}
      <div className="space-y-4">
        {filteredTrainings.map((training) => {
          const status = statusConfig[training.status]
          const StatusIcon = status.icon

          return (
            <Card
              key={training.id}
              className={cn(
                "border transition-colors",
                training.status === "completed"
                  ? "border-green-300 hover:border-green-500"
                  : "border-yellow-300 hover:border-yellow-500"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        status.bg
                      )}
                    >
                      <StatusIcon className={cn("h-6 w-6", status.color)} />
                    </div>

                    <div>
                      <h3 className="font-semibold">{training.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Responsable: {training.responsible}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fecha: {training.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={cn(status.bg, status.color)}>
                      {status.label}
                    </Badge>

                    {training.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/trainingPlan/${training.id}`)
                        }
                      >
                        Ver Detalle
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
