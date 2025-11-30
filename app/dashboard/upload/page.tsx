"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { departments } from "@/lib/mock-data"
import { Upload, X, FileText, CheckCircle, AlertCircle, CloudUpload } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  name: string
  size: string
  type: string
  progress: number
  status: "uploading" | "complete" | "error"
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [formData, setFormData] = useState({
    documentType: "",
    department: "",
    version: "",
    description: "",
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const processFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type,
      progress: 0,
      status: "uploading" as const,
    }))

    setFiles((prev) => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach((file) => {
      simulateUpload(file.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress: 100, status: "complete" } : f)))
      } else {
        setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, progress } : f)))
      }
    }, 500)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFiles(e.dataTransfer.files)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files)
    }
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    alert("Documentos cargados exitosamente")
    setFiles([])
    setFormData({ documentType: "", department: "", version: "", description: "" })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cargar Archivos</h1>
        <p className="text-muted-foreground">Sube nuevos documentos al sistema de gestión</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Zone */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Área de Carga</CardTitle>
            <CardDescription>Arrastra archivos o haz clic para seleccionar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInput}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              <CloudUpload
                className={cn(
                  "h-12 w-12 mx-auto mb-4 transition-colors",
                  dragActive ? "text-primary" : "text-muted-foreground",
                )}
              />
              <p className="text-sm font-medium mb-1">
                {dragActive ? "Suelta los archivos aquí" : "Arrastra y suelta archivos"}
              </p>
              <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint (máx. 10MB)</p>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Archivos ({files.length})</h3>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                        {file.status === "complete" && (
                          <span className="flex items-center gap-1 text-xs text-accent">
                            <CheckCircle className="h-3 w-3" /> Completado
                          </span>
                        )}
                        {file.status === "error" && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="h-3 w-3" /> Error
                          </span>
                        )}
                      </div>
                      {file.status === "uploading" && <Progress value={file.progress} className="h-1 mt-2" />}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Info Form */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Información del Documento</CardTitle>
            <CardDescription>Completa los metadatos del documento</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="procedure">Procedimiento</SelectItem>
                    <SelectItem value="record">Registro</SelectItem>
                    <SelectItem value="policy">Política</SelectItem>
                    <SelectItem value="instruction">Instructivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => setFormData({ ...formData, department: value })}
                >
                  <SelectTrigger className="bg-secondary border-0">
                    <SelectValue placeholder="Seleccionar departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Versión</Label>
                <Input
                  id="version"
                  placeholder="Ej: 1.0"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="bg-secondary border-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción breve del documento..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-secondary border-0 min-h-[100px]"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={files.length === 0 || files.some((f) => f.status === "uploading")}
              >
                <Upload className="h-4 w-4" />
                Cargar Documentos
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
