"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download } from "lucide-react"
import { mockDocuments } from "@/lib/mock-data"
import { getAllDocuments, type StoredDocument } from "@/lib/documents-storage"

export default function DocumentViewPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [doc, setDoc] = useState<StoredDocument | null>(null)

  useEffect(() => {
    const all = getAllDocuments(mockDocuments)
    setDoc(all.find(d => d.id === params.id) ?? null)
  }, [params.id])

  if (!doc) {
    return (
      <Card><CardContent className="p-6">Documento no encontrado</CardContent></Card>
    )
  }

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.click()
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold">{doc.name}</h1>
              <p className="text-sm text-muted-foreground">
                Versión {doc.version} • Departamento: {doc.department}
              </p>
            </div>

            <Button
              variant="outline"
              className="gap-2"
              disabled={!doc.file?.url}
              onClick={() => doc.file?.url && downloadDataUrl(doc.file.url, doc.file.name || `${doc.name}.pdf`)}
            >
              <Download className="h-4 w-4" /> Descargar
            </Button>
          </div>

          {!doc.file?.url ? (
            <div className="text-sm text-muted-foreground">
              Este documento aún no tiene archivo asociado (solo metadata).
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden border">
              <iframe
                src={doc.file.url}
                className="w-full h-[75vh]"
                title={doc.name}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
