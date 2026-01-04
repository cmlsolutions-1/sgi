"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Trash2,
  Upload,
  Download,
  ArrowLeft,
  Pencil,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

/* =====================
   TIPO
===================== */
interface Training {
  id: string
  title: string
  date: string
  time: string
  responsible: string
  description: string
  status: "scheduled" | "completed"
  actaFile?: string
}

export default function TrainingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const uploadRef = useRef<HTMLInputElement>(null)

  const [training, setTraining] = useState<Training | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [canEdit, setCanEdit] = useState(false)

  /* =====================
     CARGA INICIAL
  ===================== */
  useEffect(() => {
    const stored = localStorage.getItem("trainings")
    if (!stored) return
    const list: Training[] = JSON.parse(stored)
    const found = list.find(t => t.id === id)
    if (found) setTraining(found)
  }, [id])

  if (!training) return null

  const now = new Date()
  const trainingDate = new Date(`${training.date}T${training.time}`)
  const tenDaysAfter = new Date(trainingDate)
  tenDaysAfter.setDate(tenDaysAfter.getDate() + 10)

  const canDelete =
    training.status === "scheduled" &&
    now < trainingDate

  /* =====================
     ACTUALIZAR CAMPOS
  ===================== */
  const updateField = (field: keyof Training, value: string) => {
    const updated = { ...training, [field]: value }
    setTraining(updated)

    const stored = JSON.parse(localStorage.getItem("trainings") || "[]")
    const updatedList = stored.map((t: Training) =>
      t.id === updated.id ? updated : t
    )
    localStorage.setItem("trainings", JSON.stringify(updatedList))
  }

  const handleSaveEdit = () => {
    setCanEdit(false)
  }

  const handleCancelEdit = () => {
    const stored = localStorage.getItem("trainings")
    if (!stored) return
    const list: Training[] = JSON.parse(stored)
    const original = list.find(t => t.id === training.id)
    if (original) setTraining(original)
    setCanEdit(false)
  }

  /* =====================
     ELIMINAR
  ===================== */
  const handleDelete = () => {
    const stored = JSON.parse(localStorage.getItem("trainings") || "[]")
    const updated = stored.filter((t: Training) => t.id !== training.id)
    localStorage.setItem("trainings", JSON.stringify(updated))
    router.push("/dashboard/trainingPlan")
  }

  /* =====================
     SUBIR ACTA FIRMADA
  ===================== */
  const handleUpload = () => {
    if (!file) return

    const stored = JSON.parse(localStorage.getItem("trainings") || "[]")
    const updated = stored.map((t: Training) =>
      t.id === training.id
        ? { ...t, status: "completed", actaFile: file.name }
        : t
    )

    localStorage.setItem("trainings", JSON.stringify(updated))
    setTraining({ ...training, status: "completed", actaFile: file.name })
    setCanEdit(false)
  }

  /* =====================
     GENERAR ACTA SG-SST
  ===================== */
  const handleDownloadActa = () => {
    const doc = new jsPDF("p", "mm", "a4")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.text("ACTA DE CAPACITACIÓN SG-SST", 105, 15, { align: "center" })

    let y = 30
    doc.setFontSize(10)

    const row = (label: string, value: string) => {
      doc.setFont("helvetica", "bold")
      doc.text(label, 14, y)
      doc.setFont("helvetica", "normal")
      doc.text(value, 45, y)
      y += 6
    }

    row("Tema:", training.title)
    row("Fecha:", training.date)
    row("Hora inicio:", "________________")
    row("Hora fin:", "________________")
    row("Responsable:", training.responsible)

    doc.setFont("helvetica", "bold")
    doc.text("Descripción de la capacitación:", 14, y)
    y += 5
    doc.setFont("helvetica", "normal")
    doc.text(training.description, 14, y, { maxWidth: 180 })

    autoTable(doc, {
      startY: y + 12,
      theme: "grid",
      head: [[
        "No.",
        "NOMBRE COMPLETO",
        "DOCUMENTO",
        "CARGO",
        "TELÉFONO",
        "FIRMA",
      ]],
      body: Array.from({ length: 20 }).map((_, i) => [
        i + 1, "", "", "", "", ""
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.text("Firma del Responsable de la Capacitación:", 14, finalY)
    doc.rect(14, finalY + 3, 80, 10)

    doc.setFontSize(8)
    doc.text(
      "Este documento hace parte del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).",
      105,
      290,
      { align: "center" }
    )

    doc.save(`Acta_Capacitacion_${training.date}.pdf`)
  }

  return (
    <div className="space-y-6">

      {/* VOLVER */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => router.push("/dashboard/trainingPlan")}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Plan de Capacitación
      </Button>

      {/* DETALLE */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">
              Detalle de la Capacitación
            </h1>

            <Badge
              className={
                training.status === "completed"
                  ? "bg-green-600"
                  : "bg-red-600"
              }
            >
              {training.status === "completed"
                ? "Realizada"
                : "No realizada"}
            </Badge>
          </div>

          {training.status === "scheduled" && !canEdit && (
            <Button
              variant="outline"
              className="gap-2 w-fit"
              onClick={() => setCanEdit(true)}
            >
              <Pencil className="h-4 w-4" />
              Modificar
            </Button>
          )}

          {canEdit && (
            <div className="flex gap-2">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSaveEdit}
              >
                Guardar cambios
              </Button>

              <Button variant="outline" onClick={handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          )}

          <div>
            <label className="font-semibold">Tema</label>
            <Input
              disabled={!canEdit}
              value={training.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Fecha</label>
            <Input
              disabled={!canEdit}
              type="date"
              value={training.date}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Hora de inicio</label>
            <Input
              disabled={!canEdit}
              type="time"
              value={training.time}
              onChange={(e) => updateField("time", e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">Responsable</label>
            <Input
              disabled={!canEdit}
              value={training.responsible}
              onChange={(e) =>
                updateField("responsible", e.target.value)
              }
            />
          </div>

          <div>
            <label className="font-semibold">Descripción</label>
            <Textarea
              disabled={!canEdit}
              value={training.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* ACTA */}
      <Card>
        <CardContent className="p-6 space-y-4">

          {training.status === "completed" && training.actaFile ? (
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Descargar acta firmada
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleDownloadActa}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar acta para firma
              </Button>

              <input
                ref={uploadRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
              />

              <Button
                onClick={() => uploadRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Upload className="h-4 w-4" />
                Subir acta firmada
              </Button>

              {file && (
                <Button onClick={handleUpload}>
                  Confirmar carga
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {canDelete && (
        <Button
          onClick={handleDelete}
          className="bg-orange-700 hover:bg-orange-800 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar capacitación
        </Button>
      )}
    </div>
  )
}
