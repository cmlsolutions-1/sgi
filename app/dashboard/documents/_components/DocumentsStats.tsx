import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, FileCheck, FileText, ScrollText } from "lucide-react"

type Props = {
  stats: {
    total: number
    approved: number
    review: number
    draft: number
  }
}

export default function DocumentsStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Documentos</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Aprobados</p>
              <p className="text-2xl font-bold text-accent">{stats.approved}</p>
            </div>
            <FileCheck className="h-8 w-8 text-accent" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">En Revisión</p>
              <p className="text-2xl font-bold text-warning">{stats.review}</p>
            </div>
            <ClipboardList className="h-8 w-8 text-warning" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Borradores</p>
              <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
            </div>
            <ScrollText className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
