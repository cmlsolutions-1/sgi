"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Upload,
  Download,
  Printer,
  CalendarCheck,
  User,
} from "lucide-react"

/* =========================
   MODELO DE CAPACITACIÓN
========================= */
type TrainingDetail = {
  id: string
  title: string
  date: string
  responsible: string
  description: string
  fileUrl?: string
}

/* =========================
   MOCK DE DATOS
========================= */
const mockTraining: TrainingDetail = {
  id: "1",
  title: "Inducción en Seguridad y Salud en el Trabajo",
  date: "2024-02-15",
  responsible: "Juan Pérez",
  description:
    "Capacitación dirigida a todos los trabajadores sobre los conceptos básicos del SG-SST, deberes y derechos, políticas de seguridad y normas internas.",
}

/* =========================
   COMPONENTE
========================= */
export default function TrainingDetailPage() {
  const { id } = useParams()
  const [training, setTraining] = useState<TrainingDetail>(mockTraining)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
  }

  const handlePrint = () => {
    if (!preview) return
    const win = window.open(preview, "_blank")
    win?.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-green-600" />
          Detalle de Capacitación Realizada
        </h1>
        <p className="text-muted-foreground">
          Evidencia de capacitación – SG-SST
        </p>
      </div>

      {/* Información general */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">{training.title}</h2>
            <Badge className="bg-green-100 text-green-700 ml-2">
              Realizada
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              Fecha: {training.date}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Responsable: {training.responsible}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              value={training.description}
              readOnly
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Evidencia */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">
            Evidencia de Asistencia (Firmas)
          </h3>

          <Input
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
          />

          {preview && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden h-[500px]">
                {file?.type === "application/pdf" ? (
                  <iframe
                    src={preview}
                    className="w-full h-full"
                  />
                ) : (
                  <img
                    src={preview}
                    alt="Vista previa"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(preview, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement("a")
                    link.href = preview
                    link.download = file?.name || "asistencia"
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>

                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
