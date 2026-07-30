"use client"

import { useEffect, useState } from "react"
import { Download, ExternalLink, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import jsPDF from "jspdf"

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

const SGI_RESPONSIBLE_RESPONSIBILITIES = [
  "Realizar el diseño y la planeación del SG-SST de acuerdo con la Resolución 0312 de 2019.",
  "Entregar los documentos diseñados a la empresa contratante.",
  "Realizar actividades de implementación del SG-SST.",
  "Realizar asesoría y acompañamiento en actividades de registro.",
  "Entrenar a los comités del SG-SST.",
]

const SGI_RESPONSIBLE_DOCUMENT_TYPE = "SGI_RESPONSIBLE"

const dayNames: Record<number, string> = {
  1: "uno",
  2: "dos",
  3: "tres",
  4: "cuatro",
  5: "cinco",
  6: "seis",
  7: "siete",
  8: "ocho",
  9: "nueve",
  10: "diez",
  11: "once",
  12: "doce",
  13: "trece",
  14: "catorce",
  15: "quince",
  16: "dieciseis",
  17: "diecisiete",
  18: "dieciocho",
  19: "diecinueve",
  20: "veinte",
  21: "veintiuno",
  22: "veintidos",
  23: "veintitres",
  24: "veinticuatro",
  25: "veinticinco",
  26: "veintiseis",
  27: "veintisiete",
  28: "veintiocho",
  29: "veintinueve",
  30: "treinta",
  31: "treinta y uno",
}

function formatSgiSignatureDate(value: string) {
  if (!value) return ""

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value

  const date = new Date(year, month - 1, day)
  const monthName = new Intl.DateTimeFormat("es-CO", { month: "long" }).format(date)
  return `${dayNames[day] ?? String(day)} (${String(day).padStart(2, "0")}) de ${monthName} de ${year}`
}

function getEmployeeFullName(employee?: Pick<Employee, "name" | "lastName" | "email"> | null) {
  return employee ? `${employee.name ?? ""} ${employee.lastName ?? ""}`.trim() || employee.email || "" : ""
}

function getEmployeePosition(employee?: Employee | null) {
  return employee?.job?.name || "ESPECIALISTA EN SST"
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function formatFileSize(size?: number | null) {
  if (!size) return "Tamano no disponible"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function canEmbedPreview(mimeType: string) {
  return mimeType.startsWith("application/pdf") || mimeType.startsWith("image/")
}

type DocumentPreviewState = {
  document: EmployeeDocument
  url: string
  mimeType: string
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
  const [companyName, setCompanyName] = useState("")
  const [legalRepresentativeName, setLegalRepresentativeName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentConfirmed, setDocumentConfirmed] = useState(true)
  const [preview, setPreview] = useState<DocumentPreviewState | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)
  const selectedEmployee = employees.find((employee) => employee.id === employeeId)
  const responsibleName = getEmployeeFullName(selectedEmployee ?? responsible?.employee)

  useEffect(() => {
    return () => {
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return null
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return

    setEmployeeId(responsible?.employeeId ?? "")
    setSignatureDate(responsible?.signatureDate ? responsible.signatureDate.slice(0, 10) : "")
    setCompanyName(window.localStorage.getItem("sgiResponsibleCompanyName") ?? "")
    setLegalRepresentativeName(window.localStorage.getItem("sgiResponsibleLegalRepresentativeName") ?? "")
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
        toast.error(error instanceof Error ? error.message : "No se pudo cargar los documentos del responsable SG-SST")
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

  function handleDownloadDesignation() {
    if (!employeeId || !responsibleName || !signatureDate || !companyName.trim() || !legalRepresentativeName.trim()) {
      toast.error("Completa empresa, responsable, fecha de firma y representante legal")
      return
    }

    window.localStorage.setItem("sgiResponsibleCompanyName", companyName.trim())
    window.localStorage.setItem("sgiResponsibleLegalRepresentativeName", legalRepresentativeName.trim())

    const doc = new jsPDF("p", "mm", "a4")
    const marginX = 22
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const contentWidth = pageWidth - marginX * 2
    let y = 24

    function addWrappedText(text: string, options?: { fontSize?: number; lineHeight?: number; align?: "left" | "center" }) {
      const fontSize = options?.fontSize ?? 11
      const lineHeight = options?.lineHeight ?? 6
      const align = options?.align ?? "left"
      doc.setFontSize(fontSize)
      const lines = doc.splitTextToSize(text, contentWidth)

      lines.forEach((line: string) => {
        if (y > pageHeight - 28) {
          doc.addPage()
          y = 24
        }
        doc.text(line, align === "center" ? pageWidth / 2 : marginX, y, { align })
        y += lineHeight
      })
    }

    doc.setFont("helvetica", "bold")
    addWrappedText("DESIGNACION DEL RESPONSABLE DEL SISTEMA DE GESTION DE LA SEGURIDAD Y SALUD EN EL TRABAJO", {
      fontSize: 13,
      lineHeight: 7,
      align: "center",
    })

    y += 10
    doc.setFont("helvetica", "normal")
    addWrappedText(
      "El presente documento tiene como proposito oficializar el nombramiento del responsable del diseno y planeacion del Sistema de Gestion de Seguridad y Salud en el Trabajo al interior de la empresa como cumplimiento del Sistema de Gestion de Seguridad y Salud en el Trabajo bajo la normativa del Decreto 1072 del 2015 y la Resolucion 0312 de 2019.",
      { lineHeight: 6.5 },
    )

    y += 6
    addWrappedText(
      `El Representante Legal de ${companyName.trim()} designa responsable del Diseno y planeacion del SG-SST a ${responsibleName}, quien debera:`,
      { lineHeight: 6.5 },
    )

    y += 4
    SGI_RESPONSIBLE_RESPONSIBILITIES.forEach((responsibility) => {
      const lines = doc.splitTextToSize(responsibility, contentWidth - 8)
      lines.forEach((line: string, index: number) => {
        if (y > pageHeight - 28) {
          doc.addPage()
          y = 24
        }
        doc.text(index === 0 ? "-" : " ", marginX, y)
        doc.text(line, marginX + 6, y)
        y += 6
      })
    })

    y += 8
    addWrappedText(`Para constancia se firma el ${formatSgiSignatureDate(signatureDate)}.`, { lineHeight: 6.5 })

    if (y > pageHeight - 75) {
      doc.addPage()
      y = 34
    } else {
      y += 28
    }

    const leftX = marginX
    const rightX = pageWidth / 2 + 12
    const signatureWidth = 72

    doc.line(leftX, y, leftX + signatureWidth, y)
    doc.line(rightX, y, rightX + signatureWidth, y)

    y += 7
    doc.setFont("helvetica", "bold")
    doc.text(legalRepresentativeName.trim().toUpperCase(), leftX, y)
    doc.text(responsibleName.toUpperCase(), rightX, y)

    y += 6
    doc.setFont("helvetica", "normal")
    doc.text("REPRESENTANTE LEGAL", leftX, y)
    doc.text(getEmployeePosition(selectedEmployee).toUpperCase(), rightX, y)

    doc.save(`designacion-responsable-sgi-${safeFilename(responsibleName || "responsable")}.pdf`)
    toast.success("Documento de designacion generado")
  }

  async function handleUploadDocument() {
    if (!responsible?.id) {
      toast.error("Primero guarda el responsable SG-SST")
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
        type: SGI_RESPONSIBLE_DOCUMENT_TYPE,
        isConfirmed: documentConfirmed,
      })
      setDocumentFile(null)
      const data = await listSgiResponsibleDocuments()
      setDocuments(data)
      toast.success("Documento del responsable SG-SST subido correctamente")
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

    setPreviewLoadingId(document.id)
    try {
      const blob = await downloadEmployeeDocumentFile(document.downloadUrl)
      const url = URL.createObjectURL(blob)
      setPreview((current) => {
        if (current?.url) URL.revokeObjectURL(current.url)
        return {
          document,
          url,
          mimeType: blob.type || document.mimeType || "",
        }
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo abrir el documento")
    } finally {
      setPreviewLoadingId(null)
    }
  }

  function closePreview() {
    setPreview((current) => {
      if (current?.url) URL.revokeObjectURL(current.url)
      return null
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Asignar Responsable SG-SST</DialogTitle>
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

            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Designacion del responsable SG-SST
                </h3>
                <p className="text-xs text-muted-foreground">
                  Diligencia el documento en linea y descargalo listo para imprimir y firmar.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="sgi-company-name">Nombre de la empresa</Label>
                  <Input
                    id="sgi-company-name"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Ej: Empresa S.A.S."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sgi-responsible-name">Nombre del responsable</Label>
                  <Input id="sgi-responsible-name" value={responsibleName} readOnly placeholder="Selecciona un funcionario" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sgi-legal-representative">Nombre del representante legal</Label>
                  <Input
                    id="sgi-legal-representative"
                    value={legalRepresentativeName}
                    onChange={(event) => setLegalRepresentativeName(event.target.value)}
                    placeholder="Nombre completo del representante legal"
                  />
                </div>

                <Button type="button" variant="outline" className="gap-2 justify-self-start" onClick={handleDownloadDesignation}>
                  <Download className="h-4 w-4" />
                  Descargar documento para firma
                </Button>
              </div>
            </div>

            {responsible?.id && (
              <div className="rounded-lg border border-dashed border-border bg-secondary/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Documentos del responsable SG-SST
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
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
                          <p className="truncate font-medium">{document.originalName || "Documento"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(document.size)} - {document.isConfirmed ? "Confirmado" : "Pendiente"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {document.downloadUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-2"
                              onClick={() => handleViewDocument(document)}
                              disabled={previewLoadingId === document.id}
                            >
                              {previewLoadingId === document.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              {previewLoadingId === document.id ? "Cargando" : "Ver"}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="gap-2"
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

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="truncate text-base">
              {preview?.document.originalName || "Documento"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 p-4">
            {preview && canEmbedPreview(preview.mimeType) ? (
              preview.mimeType.startsWith("image/") ? (
                <div className="flex max-h-[70dvh] items-center justify-center overflow-auto rounded-md bg-secondary/40 p-2">
                  <img
                    src={preview.url}
                    alt={preview.document.originalName || "Documento"}
                    className="max-h-[68dvh] max-w-full rounded-md object-contain"
                  />
                </div>
              ) : (
                <iframe
                  title={preview.document.originalName || "Documento"}
                  src={preview.url}
                  className="h-[70dvh] w-full rounded-md border border-border bg-white"
                />
              )
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-secondary/30 p-6 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Vista previa no disponible</p>
                  <p className="text-sm text-muted-foreground">
                    Este archivo se puede abrir o descargar desde una pestana nueva.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3">
            {preview && (
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en pestaña
              </Button>
            )}
            <Button type="button" onClick={closePreview}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
