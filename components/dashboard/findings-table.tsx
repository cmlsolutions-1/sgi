"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { mockFindings } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const typeColors = {
  major: "bg-destructive/10 text-destructive border-destructive/20",
  minor: "bg-warning/10 text-warning border-warning/20",
  observation: "bg-primary/10 text-primary border-primary/20",
  opportunity: "bg-accent/10 text-accent border-accent/20",
}

const typeLabels = {
  major: "Mayor",
  minor: "Menor",
  observation: "Observación",
  opportunity: "Oportunidad",
}

const statusColors = {
  open: "bg-destructive/10 text-destructive",
  "in-progress": "bg-warning/10 text-warning",
  closed: "bg-accent/10 text-accent",
}

const statusLabels = {
  open: "Abierto",
  "in-progress": "En Progreso",
  closed: "Cerrado",
}

export function FindingsTable() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Hallazgos de Auditoría Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Descripción</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Área</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Estado</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground">Fecha Límite</th>
              </tr>
            </thead>
            <tbody>
              {mockFindings.map((finding) => (
                <tr key={finding.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <td className="py-3 px-2">
                    <Badge variant="outline" className={cn("text-xs", typeColors[finding.type])}>
                      {typeLabels[finding.type]}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm max-w-xs truncate">{finding.description}</td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">{finding.area}</td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary" className={cn("text-xs", statusColors[finding.status])}>
                      {statusLabels[finding.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-sm text-muted-foreground">{finding.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
