"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockFindings, type AuditFinding } from "@/lib/mock-data"
import {
  Search,
  Filter,
  Plus,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const typeConfig = {
  major: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Mayor" },
  minor: { icon: AlertCircle, color: "text-warning", bgColor: "bg-warning/10", label: "Menor" },
  observation: { icon: Info, color: "text-primary", bgColor: "bg-primary/10", label: "Observación" },
  opportunity: { icon: Lightbulb, color: "text-accent", bgColor: "bg-accent/10", label: "Oportunidad" },
}

const statusConfig = {
  open: { icon: XCircle, color: "text-destructive", label: "Abierto" },
  "in-progress": { icon: Clock, color: "text-warning", label: "En Progreso" },
  closed: { icon: CheckCircle, color: "text-accent", label: "Cerrado" },
}

export default function TrainingPlanPage() {
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredFindings = findings.filter((finding) => {
    const matchesSearch =
      finding.description.toLowerCase().includes(search.toLowerCase()) ||
      finding.area.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || finding.type === typeFilter
    const matchesStatus = statusFilter === "all" || finding.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Stats
  const stats = {
    total: findings.length,
    open: findings.filter((f) => f.status === "open").length,
    inProgress: findings.filter((f) => f.status === "in-progress").length,
    closed: findings.filter((f) => f.status === "closed").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plan Anual Capacitaciones</h1>
          <p className="text-muted-foreground">Hallazgos y acciones correctivas</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Hallazgo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Hallazgos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Abiertos</p>
                <p className="text-2xl font-bold text-destructive">{stats.open}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold text-warning">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cerrados</p>
                <p className="text-2xl font-bold text-accent">{stats.closed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar hallazgos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>
            <div className="flex gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] bg-secondary border-0">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="major">Mayor</SelectItem>
                  <SelectItem value="minor">Menor</SelectItem>
                  <SelectItem value="observation">Observación</SelectItem>
                  <SelectItem value="opportunity">Oportunidad</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-secondary border-0">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="open">Abierto</SelectItem>
                  <SelectItem value="in-progress">En Progreso</SelectItem>
                  <SelectItem value="closed">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <div className="space-y-4">
        {filteredFindings.map((finding) => {
          const typeInfo = typeConfig[finding.type]
          const statusInfo = statusConfig[finding.status]
          const TypeIcon = typeInfo.icon
          const StatusIcon = statusInfo.icon

          return (
            <Card key={finding.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", typeInfo.bgColor)}>
                    <TypeIcon className={cn("h-6 w-6", typeInfo.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={cn("text-xs", typeInfo.color)}>
                            {typeInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{finding.area}</span>
                        </div>
                        <p className="text-sm">{finding.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-4 w-4", statusInfo.color)} />
                        <Badge variant="secondary" className="text-xs">
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">Fecha límite: {finding.dueDate}</span>
                      <Button variant="outline" size="sm">
                        Ver Detalles
                      </Button>
                    </div>
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
