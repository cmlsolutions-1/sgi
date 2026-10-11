"use client"

import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SafeCloudFormDrawerFrame } from "@/components/ui/safecloud-form-drawer"
import { Button } from "@/components/ui/button"
import { FilePen, FilePlus2 } from "lucide-react"
import DocumentFormAssignment from "@/components/document/DocumentFormAssignment"
import DocumentFormPreventiveProcedure from "@/components/document/DocumentFormPreventiveProcedure"
import type { CreateFlow } from "../_hooks/useDocuments"
import { TEMPLATES } from "../_lib/constants"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void

  createFlow: CreateFlow
  setCreateFlow: (v: CreateFlow) => void

  onClose: () => void
  onCreated: () => void
}

export default function CreateDialog({
  open,
  onOpenChange,
  createFlow,
  setCreateFlow,
  onClose,
  onCreated,
}: Props) {
  return (
    <SafeCloudFormDrawerFrame open={open} onOpenChange={onOpenChange}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear documentación</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {createFlow === null && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Selecciona qué deseas crear:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button className="gap-2" onClick={() => setCreateFlow("assignment")}>
                  <FilePen className="h-4 w-4" />
                  Acta de asignación SGSST
                </Button>

                <Button className="gap-2" onClick={() => setCreateFlow("procedure")}>
                  <FilePlus2 className="h-4 w-4" />
                  Crear otros documentos
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {createFlow === "procedure" && (
            <DocumentFormPreventiveProcedure
              documentId={TEMPLATES.preventive}
              embedded
              onCreated={onCreated}
            />
          )}

          {createFlow === "assignment" && (
            <DocumentFormAssignment
              documentId={TEMPLATES.assignment}
              embedded
              onCreated={onCreated}
            />
          )}

          {createFlow !== null && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateFlow(null)}>
                Volver
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          )}
        </div>
    </SafeCloudFormDrawerFrame>
  )
}
