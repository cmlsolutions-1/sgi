"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { mockEmployees, mockUsers } from "@/lib/mock-data"
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Award,
  ClipboardCheck,
  Star,
  Building,
  User,
  Activity,
} from "lucide-react"
import { cn } from "@/lib/utils"

const trainingStatusColors = {
  completed: "bg-accent/10 text-accent",
  "in-progress": "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
}

const trainingStatusLabels = {
  completed: "Completado",
  "in-progress": "En Progreso",
  pending: "Pendiente",
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const employee = mockEmployees.find((e) => e.id === id)
  const user = mockUsers.find((e) => e.id === id)

  if (!employee) {
    notFound()
  }

  const avgScore =
    employee.evaluations.length > 0
      ? employee.evaluations.reduce((acc, e) => acc + e.score, 0) / employee.evaluations.length
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hoja de Vida</h1>
          <p className="text-muted-foreground">Información completa del funcionario</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {employee.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">{employee.name}</h2>
                  <p className="text-muted-foreground">{employee.position}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-2",
                      employee.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {employee.status === "active" ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-primary">{employee.certifications.length}</p>
                    <p className="text-xs text-muted-foreground">Certificaciones</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-accent">{employee.trainings.length}</p>
                    <p className="text-xs text-muted-foreground">Capacitaciones</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-warning">{avgScore.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Promedio Eval.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Desde {employee.hireDate}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="bg-secondary">
          <TabsTrigger value="info">Información Personal</TabsTrigger>
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
          <TabsTrigger value="trainings">Capacitaciones</TabsTrigger>
          <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          <TabsTrigger value="socialSecurity">Seguridad Social</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos Personales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="text-sm">{employee.birthDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="text-sm">{employee.address}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-muted-foreground">Formación Académica</p>
                  <p className="text-sm">{employee.education}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificaciones Obtenidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employee.certifications.map((cert, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cert}</p>
                      <p className="text-xs text-muted-foreground">Certificación vigente</p>
                    </div>
                  </div>
                ))}
                {employee.certifications.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay certificaciones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainings">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Historial de Capacitaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employee.trainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <GraduationCap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{training.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {training.date} • {training.duration}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs", trainingStatusColors[training.status])}>
                      {trainingStatusLabels[training.status]}
                    </Badge>
                  </div>
                ))}
                {employee.trainings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay capacitaciones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                Evaluaciones de Desempeño
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employee.evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="p-4 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium">Período: {evaluation.period}</p>
                        <p className="text-xs text-muted-foreground">Evaluador: {evaluation.evaluator}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="text-xl font-bold">{evaluation.score}%</span>
                      </div>
                    </div>
                    <Progress value={evaluation.score} className="h-2 mb-3" />
                    <p className="text-sm text-muted-foreground">{evaluation.comments}</p>
                  </div>
                ))}
                {employee.evaluations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay evaluaciones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="socialSecurity">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aportes Seguridad Social
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {employee.trainings.map((training) => (
                  <div
                    key={training.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{training.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {training.date} • {training.duration}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs", trainingStatusColors[training.status])}>
                      {trainingStatusLabels[training.status]}
                    </Badge>
                  </div>
                ))}
                {employee.trainings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay capacitaciones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
