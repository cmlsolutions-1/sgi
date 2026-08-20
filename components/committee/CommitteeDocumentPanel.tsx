"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import { Download, ExternalLink, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  deleteCommitteeDocument,
  deleteMeetingDocument,
  downloadCommitteeDocumentFile,
  downloadMeetingDocumentFile,
  listCommitteeDocuments,
  listMeetingDocuments,
  uploadCommitteeDocument,
  uploadMeetingDocument,
} from "@/services/committeeService"
import type { CommitteeDocument } from "@/types/manager/committee"

type DocumentOwner = "committee" | "meeting"

type CommitteeDocumentPanelProps = {
  owner: DocumentOwner
  ownerId: string
}

type DocumentPreviewState = {
  document: CommitteeDocument
  url: string
  mimeType: string
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B"
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function canEmbedPreview(mimeType: string) {
  return mimeType.startsWith("application/pdf") || mimeType.startsWith("image/")
}

export function CommitteeDocumentPanel({ owner, ownerId }: CommitteeDocumentPanelProps) {
  const [documents, setDocuments] = useState<CommitteeDocument[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [loadingDocuments, setLoadingDocuments] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<DocumentPreviewState | null>(null)
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function loadDocuments() {
    if (!ownerId) return

    setLoadingDocuments(true)
    try {
      const loader = owner === "committee" ? listCommitteeDocuments : listMeetingDocuments
      const data = await loader(ownerId)
      setDocuments(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar documentos")
    } finally {
      setLoadingDocuments(false)
    }
  }

  useEffect(() => {
    loadDocuments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, ownerId])

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url)
    }
  }, [preview?.url])

  async function handleUpload(event: FormEvent) {
    event.preventDefault()

    if (!file) {
      toast.error("Selecciona un archivo para subir")
      return
    }

    setUploading(true)
    try {
      const uploader = owner === "committee" ? uploadCommitteeDocument : uploadMeetingDocument
      await uploader(ownerId, { file })
      toast.success("Documento subido correctamente")
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadDocuments()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el documento")
    } finally {
      setUploading(false)
    }
  }

  async function handleView(document: CommitteeDocument) {
    if (!document.downloadUrl) return

    setPreviewLoadingId(document.id)
    try {
      const downloader = owner === "committee" ? downloadCommitteeDocumentFile : downloadMeetingDocumentFile
      const blob = await downloader(document.downloadUrl)
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

  function handleDownloadPreview() {
    if (!preview) return

    const anchor = window.document.createElement("a")
    anchor.href = preview.url
    anchor.download = preview.document.originalName || "documento"
    window.document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }

  async function handleDelete(documentId: string) {
    try {
      const deleter = owner === "committee" ? deleteCommitteeDocument : deleteMeetingDocument
      await deleter(ownerId, documentId)
      setDocuments((current) => current.filter((document) => document.id !== documentId))
      toast.success("Documento eliminado")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el documento")
    }
  }

  return (
    <div className="mt-4 rounded-md border border-dashed p-3">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        Documentos
      </div>

      <form onSubmit={handleUpload} className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-2">
          <Label>Archivo</Label>
          <Input
            ref={fileInputRef}
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={uploading}
          />
        </div>
        <Button type="submit" size="sm" className="gap-2" disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Subir
        </Button>
      </form>

      <div className="mt-3 space-y-2">
        {loadingDocuments ? (
          <div className="flex justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Sin documentos cargados.</p>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col gap-3 rounded-md border px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{document.originalName || "Documento"}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(document.size)}</p>
              </div>
              <div className="flex gap-2">
                {document.downloadUrl && (
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => handleView(document)}>
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
                  onClick={() => handleDelete(document.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-5xl flex-col bg-card p-0">
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="truncate text-base">{preview?.document.originalName || "Documento"}</DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-3">
            {preview && canEmbedPreview(preview.mimeType) ? (
              preview.mimeType.startsWith("image/") ? (
                <div className="flex h-[65vh] items-center justify-center overflow-auto rounded-md border bg-muted/30 p-3">
                  <img
                    src={preview.url}
                    alt={preview.document.originalName || "Documento"}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <iframe
                  title={preview.document.originalName || "Documento"}
                  src={preview.url}
                  className="h-[65vh] w-full rounded-md border bg-background"
                />
              )
            ) : (
              <div className="flex h-[45vh] flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 text-center">
                <FileText className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Vista previa no disponible</p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Este archivo puede abrirse en una pestaña nueva o descargarse.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-border px-4 py-3">
            {preview && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open(preview.url, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Abrir en pestaña
                </Button>
                <Button type="button" variant="outline" className="gap-2" onClick={handleDownloadPreview}>
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              </>
            )}
            <Button type="button" onClick={closePreview}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
