"use client"

import { Button } from "@/components/ui/button"
import { FilePlus2 } from "lucide-react"

type Props = {
  onCreate: () => void
}

export default function DocumentsHeader({ onCreate }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Documentos</h1>
        <p className="text-muted-foreground">Control documental del SGC</p>
      </div>

      <Button className="gap-2" onClick={onCreate}>
        <FilePlus2 className="h-4 w-4" />
        Crear documentación
      </Button>
    </div>
  )
}
