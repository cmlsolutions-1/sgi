// components/document/DocumentFormAssgignment.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DocumentPreviewAssignment } from "@/components/document/DocumentPreviewAssignment"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ASSIGNMENT_RESPONSIBILITIES } from "@/lib/assignmentResponsibilities"

interface DocumentField {
  id: string
  label: string
  placeholder: string
  type: "text" | "textarea" | "date" | "time"
  required: boolean
  section?: "main" | "signatures"
}

interface DocumentTemplate {
  id: string
  title: string
  description: string
  fields: DocumentField[]
  templateText: string
  signatureText: string
}

const SGSST_TEMPLATE: DocumentTemplate = {
  id: "acta-sgsst",
  title: "Acta de Asignación de Responsable SGSST",
  description: "Formulario para asignar responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo",
  fields: [
    // Campos principales
    {
      id: "date",
      label: "Fecha",
      placeholder: "Seleccionar fecha",
      type: "date",
      required: true,
      section: "main"
    },
    {
      id: "time",
      label: "Hora",
      placeholder: "HH:MM",
      type: "time",
      required: true,
      section: "main"
    },
    {
      id: "company",
      label: "Nombre de la Empresa",
      placeholder: "Ingrese el nombre de la empresa",
      type: "text",
      required: true,
      section: "main"
    },
    {
      id: "location",
      label: "Lugar/Instalaciones",
      placeholder: "Ingrese las instalaciones",
      type: "text",
      required: true,
      section: "main"
    },
    {
      id: "responsible",
      label: "Nombre del Responsable",
      placeholder: "Ingrese el nombre del responsable",
      type: "text",
      required: true,
      section: "main"
    },
    {
      id: "position",
      label: "Cargo del Responsable",
      placeholder: "Ingrese el cargo del responsable",
      type: "text",
      required: true,
      section: "main"
    },
    {
      id: "additional_info",
      label: "Información Adicional (Responsabilidades)",
      placeholder: "Detalles adicionales del proceso...",
      type: "textarea",
      required: false,
      section: "main"
    },
    // Campos de firmas
    {
      id: "responsible_signature_name",
      label: "Nombre completo del Responsable",
      placeholder: "Nombre completo del responsable",
      type: "text",
      required: true,
      section: "signatures"
    },
    {
      id: "legal_representative_name",
      label: "Nombre completo del Representante Legal",
      placeholder: "Nombre completo del representante legal",
      type: "text",
      required: true,
      section: "signatures"
    },
    {
      id: "responsible_signature_date",
      label: "Fecha de Firma del Responsable",
      placeholder: "Fecha de firma",
      type: "date",
      required: true,
      section: "signatures"
    },
    {
      id: "legal_representative_date",
      label: "Fecha de Firma del Representante Legal",
      placeholder: "Fecha de firma",
      type: "date",
      required: true,
      section: "signatures"
    }
  ],
  templateText: `Siendo las {time} horas del día {date} en las instalaciones de la empresa {company} ubicada en {location}, se reunieron los representantes de la organización con el funcionario {responsible}, {position}, quien ha sido designado como responsable del proceso de Sistema de Gestión de Seguridad y Salud en el Trabajo (SGSST).

El responsable asume las siguientes responsabilidades:
{additional_info}

Se da fe de esta asignación y se invita al responsable a cumplir diligentemente con sus funciones en pro del bienestar de todos los trabajadores.`,
  signatureText: `\n\nFIRMAS:\n\n_________________________________                    _________________________________________\n{responsible_signature_name}                        {legal_representative_name}\nResponsable SGSST                                    Representante Legal\nFecha: {responsible_signature_date}                    Fecha: {legal_representative_date}`
}

export default function DocumentFormAssignment({ documentId }: { documentId: string }) {
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar el texto predeterminado cuando el componente se monte
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      additional_info: ASSIGNMENT_RESPONSIBILITIES
    }))
  }, [])

  const handleChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    
    // Crear el contenido completo del documento
    let fullContent = SGSST_TEMPLATE.templateText
    
    // Reemplazar todos los placeholders del cuerpo principal
    Object.entries(formData).forEach(([key, value]) => {
      if (value && key !== 'responsible_signature_name' && key !== 'legal_representative_name' && 
          key !== 'responsible_signature_date' && key !== 'legal_representative_date') {
        fullContent = fullContent.replace(new RegExp(`{${key}}`, 'g'), value)
      }
    })
    
    // Agregar título
    doc.setFontSize(16)
    doc.text(SGSST_TEMPLATE.title, 105, 20, { align: 'center' })
    
    // Configurar el contenido principal
    doc.setFontSize(12)
    const pageWidth = doc.internal.pageSize.width - 40 // Margen izquierdo y derecho
    const splitText = doc.splitTextToSize(fullContent, pageWidth)
    
    // Posición inicial para el contenido
    let currentY = 40
    
    // Renderizar el contenido principal con manejo de páginas
    splitText.forEach((line: string, index: number) => {
        // Si estamos cerca del final de la página, añadir nueva página
        if (currentY > doc.internal.pageSize.height - 60) {
          doc.addPage()
          currentY = 20
        }
        
        doc.text(line, 20, currentY)
        currentY += 7
      })
    
    // Añadir espacio antes de las firmas
    if (currentY > doc.internal.pageSize.height - 100) {
      doc.addPage()
      currentY = 20
    } else {
      currentY += 20
    }
    
    // Agregar sección de firmas en la última página
    doc.setFontSize(14)
    doc.text("FIRMAS:", 20, currentY)
    currentY += 15
    
    // Línea de firma del responsable
    doc.setFontSize(12)
    doc.line(20, currentY, 100, currentY) // Línea de firma
    doc.text(formData.responsible_signature_name || "_________________________", 20, currentY + 10)
    doc.text("Responsable SGSST", 20, currentY + 20)
    doc.text(`Fecha: ${formData.responsible_signature_date || "_____________"}`, 20, currentY + 30)
    
    // Línea de firma del representante legal
    doc.line(120, currentY, 200, currentY) // Línea de firma
    doc.text(formData.legal_representative_name || "_________________________", 120, currentY + 10)
    doc.text("Representante Legal", 120, currentY + 20)
    doc.text(`Fecha: ${formData.legal_representative_date || "_____________"}`, 120, currentY + 30)
    
    // Guardar el PDF
    doc.save(`${SGSST_TEMPLATE.title}.pdf`)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    generatePDF()
    setIsSubmitting(false)
  }

  const mainFields = SGSST_TEMPLATE.fields.filter(field => field.section === "main")
  const signatureFields = SGSST_TEMPLATE.fields.filter(field => field.section === "signatures")

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto p-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{SGSST_TEMPLATE.title}</CardTitle>
            <p className="text-muted-foreground">{SGSST_TEMPLATE.description}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Campos principales */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Información del Acta</h3>
                {mainFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    {field.type === "textarea" ? (
                      <Textarea
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className="min-h-[150px]"
                      />
                    ) : (
                      <Input
                        type={field.type}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleChange(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Campos de firmas */}
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground">Información de Firmas</h3>
                {signatureFields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <Input
                      type={field.type}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                  {isSubmitting ? "Generando PDF..." : "Descargar Acta"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFormData({})}>
                  Limpiar Formulario
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        {/* Vista previa del documento */}
        {Object.keys(formData).some(key => formData[key]) && (
          <DocumentPreviewAssignment 
            templateText={SGSST_TEMPLATE.templateText + SGSST_TEMPLATE.signatureText}
            formData={formData} 
          />
        )}
      </div>
    </div>
  )
}