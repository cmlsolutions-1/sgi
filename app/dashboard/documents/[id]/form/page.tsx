// src/app/documents/[id]/form/page.tsx
"use client"

import { useParams } from "next/navigation"
import { mockDocuments } from "@/lib/mock-data"
import DocumentFormAssignment from "@/components/document/DocumentFormAssignment"
import { Card, CardContent } from "@/components/ui/card"

export default function DocumentFormPage() {
  const params = useParams()
  const documentId = params.id as string
  
  // Buscar el documento específico
  const document = mockDocuments.find(doc => doc.id === documentId)
  
  if (!document) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold">Documento no encontrado</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Verificar si es un documento SGSST para mostrar el formulario
  const isSGSSTDocument = document.name.toLowerCase().includes("sgsst") || 
                         document.name.toLowerCase().includes("asignacion") ||
                         document.name.toLowerCase().includes("responsable")

  if (isSGSSTDocument) {
    return <DocumentFormAssignment documentId={documentId} />
  }

  // Para otros documentos, mostrar mensaje o vista normal
  return (
    <div className="p-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">{document.name}</h2>
          <p>Este tipo de documento no tiene formulario interactivo disponible.</p>
        </CardContent>
      </Card>
    </div>
  )
}