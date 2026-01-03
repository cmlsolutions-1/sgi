"use client"

import { use, useState } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { mockEmployees, mockUsers, type SocialSecurityContribution } from "@/lib/mock-data"
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
  Plus,
  CheckCircle,
  CircleDashed
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SocialSecurityFormDialog } from "@/components/dashboard/SocialSecurityFormDialog"
import { MedicalEvaluationTab } from "@/components/employee/MedicalEvaluationTab"

type TrainingStatus = "completed" | "in-progress" | "pending";

const trainingStatusColors: Record<TrainingStatus, string> = {
  completed: "bg-accent/10 text-accent",
  "in-progress": "bg-warning/10 text-warning",
  pending: "bg-muted text-muted-foreground",
}

const trainingStatusLabels: Record<TrainingStatus, string> = {
  completed: "Completado",
  "in-progress": "En Progreso",
  pending: "Pendiente",
}

// Tipos de seguridad social
const SOCIAL_SECURITY_TYPES = [
  { id: "eps", name: "EPS", label: "Entidad Promotora de Salud" },
  { id: "arl", name: "ARL", label: "Administradora de Riesgos Laborales" },
  { id: "pension", name: "PENSION", label: "Fondo de Pensiones" },
  { id: "caja-compensacion", name: "CAJA_COMPENSACION", label: "Caja de Compensación" }
];

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [employee, setEmployee] = useState(() => {
    const emp = mockEmployees.find((e) => e.id === id)
    if (!emp) notFound()
    return emp
  })
  
  const user = mockUsers.find((u) => u.id === employee?.userId)

  if (!employee) {
    notFound()
  }

  // Datos de seguridad social del empleado
  const [socialSecurityContributions, setSocialSecurityContributions] = useState<SocialSecurityContribution[]>(
    employee.socialSecurity || []
  );

  // Estado para el diálogo de seguridad social
  const [socialSecurityDialog, setSocialSecurityDialog] = useState<{
    open: boolean;
    type: "EPS" | "ARL" | "PENSION" | "CAJA_COMPENSACION";
  }>({
    open: false,
    type: "EPS"
  });


  // Función para verificar si un tipo de contribución está registrado
  const hasContribution = (type: string) => {
    return socialSecurityContributions.some(contrib => contrib.type === type);
  };

  const avgScore = employee.evaluations && employee.evaluations.length > 0
    ? employee.evaluations.reduce((acc, e) => acc + e.score, 0) / employee.evaluations.length
    : 0

     // Función para guardar una nueva contribución
  const handleSaveContribution = (contribution: SocialSecurityContribution) => {
    setSocialSecurityContributions(prev => [...prev, contribution]);
  };

  // Función para agregar evaluación médico-ocupacional
  const handleAddMedicalEvaluation = (evaluation: any) => {
    setEmployee(prev => ({
      ...prev,
      medicalEvaluations: [...(prev.medicalEvaluations || []), evaluation]
    }));
  };

  

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
                  <h2 className="text-xl font-bold">{employee.name} {employee.lastName}</h2>
                  <p className="text-muted-foreground">{employee.position}</p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "mt-2",
                      employee.status === true || employee.status === "active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {(employee.status === true || employee.status === "active") ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-primary">{employee.certifications?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Certificaciones</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-accent">{employee.trainings?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Capacitaciones</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-secondary">
                    <p className="text-2xl font-bold text-warning">{avgScore.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Promedio Eval.</p>
                  </div>
                  {employee.medicalEvaluations && employee.medicalEvaluations.length > 0 && (
                    <div className="text-center p-3 rounded-lg bg-secondary">
                      <p className="text-2xl font-bold text-primary">{employee.medicalEvaluations.length}</p>
                      <p className="text-xs text-muted-foreground">Evaluaciones Médicas</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user?.email || employee.document}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone || "No registrado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.department || "No registrado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Desde {employee.hireDate || employee.entryDate}</span>
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
          <TabsTrigger value="medical">Evaluaciones médico-ocupacionales</TabsTrigger>
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
                  <p className="text-sm">{employee.birthDate || "No registrada"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="text-sm">{employee.address || "No registrada"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-xs text-muted-foreground">Formación Académica</p>
                  <p className="text-sm">{employee.education || "No registrada"}</p>
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
                {employee.certifications?.map((cert, index) => (
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
                {(!employee.certifications || employee.certifications.length === 0) && (
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
                {employee.trainings?.map((training) => (
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
                {(!employee.trainings || employee.trainings.length === 0) && (
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
                {employee.evaluations?.map((evaluation) => (
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
                {(!employee.evaluations || employee.evaluations.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No hay evaluaciones registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medical">
          <MedicalEvaluationTab 
            employee={employee} 
            onAddEvaluation={handleAddMedicalEvaluation}
          />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SOCIAL_SECURITY_TYPES.map((type) => {
                  const hasContributionForType = hasContribution(type.name);
                  
                  return (
                    <div 
                      key={type.id} 
                      className={`p-4 rounded-lg border ${
                        hasContributionForType 
                          ? "border-success bg-success/5" 
                          : "border-border bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{type.label}</h3>
                          <p className="text-sm text-muted-foreground">{type.name}</p>
                        </div>
                        
                        {hasContributionForType ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-success" />
                            <span className="text-sm font-medium text-success">Completado</span>
                          </div>
                        ) : (
                          <Button className="gap-1"
                          onClick={() => setSocialSecurityDialog({ 
                            open: true, 
                            type: type.name as "EPS" | "ARL" | "PENSION" | "CAJA_COMPENSACION" 
                          })}
                        >
                            <Plus className="h-4 w-4" />
                            Agregar
                          </Button>
                        )}
                        
                      </div>
                      
                      {hasContributionForType && (
                        <div className="mt-3 text-sm">
                          <p className="font-medium">
                            {socialSecurityContributions.find(c => c.type === type.name)?.entityName || "Entidad no especificada"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Desde: {socialSecurityContributions.find(c => c.type === type.name)?.startDate || "Sin fecha"}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {socialSecurityContributions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay registros de seguridad social
                </p>
              )}
            </CardContent>
          </Card>
          
        </TabsContent>
      </Tabs>

    {/* Diálogo para agregar contribución de seguridad social */}
      <SocialSecurityFormDialog
        open={socialSecurityDialog.open}
        onOpenChange={(open) => setSocialSecurityDialog({ ...socialSecurityDialog, open })}
        type={socialSecurityDialog.type}
        onSave={handleSaveContribution}
        employeeId={employee.id}
      />

    </div>
  )
}