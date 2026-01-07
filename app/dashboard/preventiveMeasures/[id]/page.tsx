//src/app/dashboard/preventiveMeasures/[id]/page.tsx

"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ArrowLeft, Download, FileText, Trash2, Upload } from "lucide-react"

import {
  getPreventiveMeasures,
  savePreventiveMeasures,
  type PreventiveMeasure,
  type EvidenceFile,
} from "@/lib/preventive-measures-storage"

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a")
  a.href = dataUrl
  a.download = filename
  a.click()
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

const statusConfig = {
  open: { color: "text-destructive", badge: "Abierto" },
  "in-progress": { color: "text-warning", badge: "En Progreso" },
  closed: { color: "text-accent", badge: "Cerrado" },
}

export default function PreventiveMeasureDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const measureId = params.id

  const [measures, setMeasures] = useState<PreventiveMeasure[]>([])
  const [measure, setMeasure] = useState<PreventiveMeasure | null>(null)

  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const list = getPreventiveMeasures()
    setMeasures(list)
    setMeasure(list.find((m) => m.id === measureId) ?? null)
  }, [measureId])

  const statusInfo = useMemo(() => {
    if (!measure) return null
    return statusConfig[measure.status]
  }, [measure])

  const persist = (updated: PreventiveMeasure) => {
    const next = measures.map((m) => (m.id === updated.id ? updated : m))
    setMeasures(next)
    setMeasure(updated)
    savePreventiveMeasures(next)
  }

  const onChangeStatus = (status: PreventiveMeasure["status"]) => {
    if (!measure) return
    persist({ ...measure, status })
  }

  const onUploadEvidence = async (file?: File) => {
    if (!measure || !file) return
    setUploading(true)
    try {
      const dataUrl = await fileToDataUrl(file)

      const evidence: EvidenceFile = {
        id: crypto.randomUUID(),
        name: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
        uploadedAtISO: new Date().toISOString(),
      }

      persist({ ...measure, evidences: [evidence, ...measure.evidences] })
    } finally {
      setUploading(false)
    }
  }

  const onDeleteEvidence = (evidenceId: string) => {
    if (!measure) return
    const nextEvidences = measure.evidences.filter((e) => e.id !== evidenceId)
    persist({ ...measure, evidences: nextEvidences })
  }

  if (!measure) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Medida no encontrada.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="gap-2 mb-3">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>

          <h1 className="text-2xl font-bold text-foreground">Detalle de Medida</h1>
          <p className="text-muted-foreground">
            Basada en: <span className="font-medium">{measure.procedureTitle}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={cn("text-xs", statusInfo?.color)}>
            {statusInfo?.badge}
          </Badge>

          <div className="w-[200px]">
            <Select value={measure.status} onValueChange={(v) => onChangeStatus(v as PreventiveMeasure["status"])}>
              <SelectTrigger className="bg-secondary border-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in-progress">En Progreso</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Info principal */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {measure.department}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {measure.workArea}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Fecha límite: {measure.dueDateISO}
            </Badge>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Descripción</p>
            <p className="text-sm font-medium">{measure.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Evidencias */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Evidencias</h2>
              <p className="text-sm text-muted-foreground">
                Sube actas/documentos firmados (PDF, imagen, Word, etc.)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  className="hidden"
                  onChange={(e) => onUploadEvidence(e.target.files?.[0])}
                />
                <Button className="gap-2" disabled={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir evidencia"}
                </Button>
              </label>
            </div>
          </div>

          {measure.evidences.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Aún no hay evidencias cargadas.
            </div>
          ) : (
            <div className="space-y-3">
              {measure.evidences.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{ev.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(ev.size)} • {new Date(ev.uploadedAtISO).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {ev.mime}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => downloadDataUrl(ev.dataUrl, ev.name)}
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => onDeleteEvidence(ev.id)}
                      title="Eliminar evidencia"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
