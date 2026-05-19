"use client"

import { useEffect, useState } from "react"
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  deleteSgiResponsibleDocument,
  downloadEmployeeDocumentFile,
  listSgiResponsibleDocuments,
  uploadSgiResponsibleDocument,
} from "@/services/employeeService"
import type {
  Employee,
  EmployeeDocument,
  EmployeeSgiResponsible,
  UpsertEmployeeSgiResponsibleDto,
} from "@/types/manager/employee"

interface SgiResponsibleFormDialogProps {
  employees: Employee[]
  open: boolean
  responsible?: EmployeeSgiResponsible | null
  onOpenChange: (open: boolean) => void
  onSave: (data: UpsertEmployeeSgiResponsibleDto) => Promise<void>
}

export function SgiResponsibleFormDialog({
  employees,
  open,
  responsible,
  onOpenChange,
  onSave,
}: SgiResponsibleFormDialogProps) {
  const [employeeId, setEmployeeId] = useState("")
  const [signatureDate, setSignatureDate] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("SGI_RESPONSIBLE")
  const [documentConfirmed, setDocumentConfirmed] = useState(true)

  useEffect(() => {
    if (!open) return

    setEmployeeId(responsible?.employeeId ?? "")
    setSignatureDate(responsible?.signatureDate ? responsible.signatureDate.slice(0, 10) : "")
  }, [open, responsible])

  useEffect(() => {
    if (!open || !responsible?.id) {
      setDocuments([])
      return
    }

    let mounted = true

    async function loadDocuments() {
      setDocumentsLoading(true)
      try {
        const data = await listSgiResponsibleDocuments()
        if (mounted) setDocuments(data)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo cargar los documentos del responsable SGI")
      } finally {
        if (mounted) setDocumentsLoading(false)
      }
    }

    loadDocuments()

    return () => {
      mounted = false
    }
  }, [open, responsible?.id])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (!employeeId || !signatureDate) {
      toast.error("Selecciona el responsable y la fecha de firma")
      return
    }

    setIsSubmitting(true)
    try {
      await onSave({ employeeId, signatureDate })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUploadDocument() {
    if (!responsible?.id) {
      toast.error("Primero guarda el responsable SGI")
      return
    }

    if (!documentFile) {
      toast.error("Selecciona un archivo para subir")
      return
    }

    setUploadingDocument(true)
    try {
      await uploadSgiResponsibleDocument({
        file: documentFile,
        type: documentType,
        isConfirmed: documentConfirmed,
      })
      setDocumentFile(null)
      const data = await listSgiResponsibleDocuments()
      setDocuments(data)
      toast.success("Documento del responsable SGI subido correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el documento")
    } finally {
      setUploadingDocument(false)
    }
  }

  async function handleDeleteDocument(documentId: string) {
    try {
      await deleteSgiResponsibleDocument(documentId)
      setDocuments((current) => current.filter((document) => document.id !== documentId))
      toast.success("Documento eliminado correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  async function handleViewDocument(document: EmployeeDocument) {
    if (!document.downloadUrl) return

    try {
      const blob = await downloadEmployeeDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Asignar Responsable del SGI</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {responsible?.employee && (
              <div className="rounded-lg border border-border bg-secondary/40 p-3 text-sm">
                <p className="font-medium">
                  Responsable actual: {responsible.employee.name} {responsible.employee.lastName}
                </p>
                <p className="text-muted-foreground">{responsible.employee.email || responsible.employee.phone}</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Funcionario responsable</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un funcionario" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {`${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || employee.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sgi-signature-date">Fecha de firma</Label>
              <Input
                id="sgi-signature-date"
                type="date"
                value={signatureDate}
                onChange={(event) => setSignatureDate(event.target.value)}
                required
              />
            </div>

            {responsible?.id && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Documentos del responsable SGI
                    </h3>
                    <p className="text-xs text-muted-foreground">Sube el soporte despues de asignar el responsable.</p>
                  </div>
                  {documentsLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="grid gap-2">
                    <Label>Archivo</Label>
                    <Input
                      type="file"
                      onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                      disabled={uploadingDocument}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Input
                        value={documentType}
                        onChange={(event) => setDocumentType(event.target.value)}
                        disabled={uploadingDocument}
                      />
                    </div>
                    <label className="flex h-10 items-center gap-2 text-sm">
                      <Checkbox
                        checked={documentConfirmed}
                        onCheckedChange={(checked) => setDocumentConfirmed(checked === true)}
                        disabled={uploadingDocument}
                      />
                      Confirmado
                    </label>
                    <Button type="button" size="sm" className="gap-2" disabled={uploadingDocument} onClick={handleUploadDocument}>
                      {uploadingDocument ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Subir
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {documents.length === 0 && !documentsLoading ? (
                    <p className="rounded-md bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                      Sin documentos cargados.
                    </p>
                  ) : (
                    documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-2 rounded-md bg-background/80 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{document.originalName || document.type}</p>
                          <p className="text-xs text-muted-foreground">{document.type}</p>
                        </div>
                        <div className="flex gap-2">
                          {document.downloadUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleViewDocument(document)}
                            >
                              <Download className="h-4 w-4" />
                              Ver
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDocument(document.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : responsible ? "Actualizar" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
