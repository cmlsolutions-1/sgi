// components/document/DocumentPreviewAssgignment.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DocumentPreviewProps {
  templateText: string
  formData: Record<string, string>
}

export function DocumentPreviewAssignment({ templateText, formData }: DocumentPreviewProps) {
  let previewText = templateText
  
  // Reemplazar todos los placeholders
  Object.entries(formData).forEach(([key, value]) => {
    previewText = previewText.replace(new RegExp(`{${key}}`, 'g'), value || `[${key}]`)
  })

  return (
    <Card className="bg-secondary border-border">
      <CardHeader>
        <CardTitle className="text-lg">Vista Previa del Documento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-white p-6 rounded border min-h-[400px]">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">
            {previewText}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}