//src/components/document/DocumentFormPreventiveProcedure.tsx

"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import jsPDF from "jspdf"
import { departments, mockCompany } from "@/lib/mock-data"
import {
  upsertPreventiveProcedureFilled,
  type PreventiveProcedureFilled,
} from "@/lib/preventive-procedure-storage"

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export default function DocumentFormPreventiveProcedure({ documentId }: { documentId: string }) {
  const companyName = useMemo(() => mockCompany?.name ?? "—", [])
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const [formData, setFormData] = useState({
    date: todayISO,
    company: companyName,

    department: "",
    workArea: "",

    procedureName: "Procedimiento - Medidas de Prevención",
    objective: "",
    activities: "",
    resources: "",

    responsibleName: "",
    responsibleRole: "",
  })

  const [signatureDataUrl, setSignatureDataUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSignature = async (file?: File) => {
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setSignatureDataUrl(dataUrl)
  }

  const validate = () => {
    if (!formData.department) return "Selecciona el departamento."
    if (!formData.workArea) return "Escribe el área de trabajo."
    if (!formData.objective) return "Completa el objetivo."
    if (!formData.activities) return "Completa las actividades / pasos."
    if (!formData.responsibleName) return "Completa el nombre del responsable."
    if (!signatureDataUrl) return "Sube la firma (imagen)."
    return null
  }

  const generatePDF = async () => {
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text("PROCEDIMIENTO - MEDIDAS DE PREVENCIÓN (ESTÁNDAR 7)", 105, 18, { align: "center" })

    doc.setFontSize(11)
    let y = 30

    const line = (label: string, value: string) => {
      doc.text(`${label}: ${value || "—"}`, 15, y)
      y += 7
    }

    line("Fecha", formData.date)
    line("Empresa", formData.company)
    line("Departamento", formData.department)
    line("Área de trabajo", formData.workArea)
    y += 4

    doc.setFontSize(12)
    doc.text("Objetivo:", 15, y); y += 6
    doc.setFontSize(11)
    const obj = doc.splitTextToSize(formData.objective, 180)
    doc.text(obj, 15, y); y += obj.length * 6 + 4

    doc.setFontSize(12)
    doc.text("Actividades / Pasos:", 15, y); y += 6
    doc.setFontSize(11)
    const act = doc.splitTextToSize(formData.activities, 180)
    doc.text(act, 15, y); y += act.length * 6 + 4

    doc.setFontSize(12)
    doc.text("Recursos / Evidencias esperadas:", 15, y); y += 6
    doc.setFontSize(11)
    const res = doc.splitTextToSize(formData.resources || "—", 180)
    doc.text(res, 15, y); y += res.length * 6 + 10

    // responsable
    doc.setFontSize(12)
    doc.text("Responsable:", 15, y); y += 7
    doc.setFontSize(11)
    doc.text(`${formData.responsibleName} ${formData.responsibleRole ? `- ${formData.responsibleRole}` : ""}`, 15, y)
    y += 12

    // firma
    doc.setFontSize(12)
    doc.text("Firma:", 15, y)
    y += 5

    try {
      // jsPDF espera base64 sin header o con header dependiendo. Esto suele funcionar con DataURL.
      doc.addImage(signatureDataUrl, "PNG", 15, y, 60, 25)
    } catch {
      // si la firma no es PNG, no reventamos el doc
      doc.text("(No fue posible incrustar la firma)", 15, y + 10)
    }

    doc.save("Procedimiento_Medidas_de_Prevencion.pdf")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) return alert(err)

    setIsSubmitting(true)

    const payload: PreventiveProcedureFilled = {
      id: crypto.randomUUID(),
      documentId,

      date: formData.date,
      company: formData.company,

      department: formData.department,
      workArea: formData.workArea,

      procedureName: formData.procedureName,
      objective: formData.objective,
      activities: formData.activities,
      resources: formData.resources,

      responsibleName: formData.responsibleName,
      responsibleRole: formData.responsibleRole,

      signatureDataUrl,
      createdAtISO: new Date().toISOString(),
    }

    upsertPreventiveProcedureFilled(payload)

    await generatePDF()
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Procedimiento - Medidas de Prevención</CardTitle>
          <p className="text-muted-foreground">
            Estándar 7 • Diligenciamiento en línea con firma y descarga
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha *</label>
                <Input type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Empresa *</label>
                <Input value={formData.company} onChange={(e) => handleChange("company", e.target.value)} />
              </div>

              <div>
                <label className="text-sm font-medium">Departamento *</label>
                <Select value={formData.department} onValueChange={(v) => handleChange("department", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Área de trabajo / Proceso *</label>
                <Input
                  className="mt-1"
                  value={formData.workArea}
                  onChange={(e) => handleChange("workArea", e.target.value)}
                  placeholder="Ej: Planta, Bodega, Desarrollo, etc."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Objetivo *</label>
              <Textarea
                className="mt-1"
                value={formData.objective}
                onChange={(e) => handleChange("objective", e.target.value)}
                placeholder="¿Qué busca prevenir / controlar este procedimiento?"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Actividades / Pasos *</label>
              <Textarea
                className="mt-1"
                rows={7}
                value={formData.activities}
                onChange={(e) => handleChange("activities", e.target.value)}
                placeholder="Describe los pasos y responsabilidades..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recursos / Evidencias esperadas</label>
              <Textarea
                className="mt-1"
                value={formData.resources}
                onChange={(e) => handleChange("resources", e.target.value)}
                placeholder="Ej: Actas firmadas, listas de chequeo, fotos, reportes..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Responsable (Nombre) *</label>
                <Input
                  className="mt-1"
                  value={formData.responsibleName}
                  onChange={(e) => handleChange("responsibleName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Cargo</label>
                <Input
                  className="mt-1"
                  value={formData.responsibleRole}
                  onChange={(e) => handleChange("responsibleRole", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Firma (imagen) *</label>
              <Input
                className="mt-1"
                type="file"
                accept="image/*"
                onChange={(e) => handleSignature(e.target.files?.[0])}
              />
              {signatureDataUrl && (
                <div className="mt-3 p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signatureDataUrl} alt="Firma" className="max-h-28" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Generando..." : "Guardar y Descargar PDF"}
              </Button>
              <Button type="button" variant="outline" onClick={() => { setSignatureDataUrl(""); setFormData({ ...formData, objective:"", activities:"", resources:"", workArea:"", department:"", responsibleName:"", responsibleRole:"" }) }}>
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
