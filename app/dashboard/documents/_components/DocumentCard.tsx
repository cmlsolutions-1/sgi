"use client"

import type { StoredDocument } from "@/lib/documents-storage"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, ClipboardList, Download, Eye, MoreVertical } from "lucide-react"
import { typeIcons, typeLabels, statusColors, statusLabels } from "../_lib/constants"
import { addOneYear, isExpired } from "../_lib/utils"

type Props = {
  doc: StoredDocument
  onView: (docId: string) => void
  onDownload: (doc: StoredDocument) => void
  onRenew: (doc: StoredDocument) => void
  onFillOrModify: (doc: StoredDocument) => void
}

export default function DocumentCard({ doc, onView, onDownload, onRenew, onFillOrModify }: Props) {
  const TypeIcon = typeIcons[doc.type]
  const expired = isExpired(doc.validFromISO)
  const expiresISO = addOneYear(doc.validFromISO)

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <TypeIcon className="h-5 w-5" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onView(doc.id)}>
                <Eye className="h-4 w-4 mr-2" /> Ver
              </DropdownMenuItem>

              <DropdownMenuItem disabled={!doc.file?.url} onSelect={() => onDownload(doc)}>
                <Download className="h-4 w-4 mr-2" /> Descargar
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => onRenew(doc)}>
                <CalendarIcon className="h-4 w-4 mr-2" /> Renovar
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => onFillOrModify(doc)}>
                <ClipboardList className="h-4 w-4 mr-2" /> Diligenciar / Modificar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-medium text-sm mb-1 line-clamp-2">{doc.name}</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Versión {doc.version} • {doc.size}
        </p>

        <div className="flex gap-2 mb-3">
          <Badge
            variant="secondary"
            className={expired ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}
          >
            {expired ? "Vencido" : "Vigente"}
          </Badge>
          <Badge variant="outline" className="text-xs">
            Vence: {expiresISO}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {typeLabels[doc.type]}
          </Badge>
          <Badge variant="secondary" className={cn("text-xs", statusColors[doc.status])}>
            {statusLabels[doc.status]}
          </Badge>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doc.department}</span>
            <span>{doc.updatedAt}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
