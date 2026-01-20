//app/dashboard/documents/page.tsx

"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockDocuments, departments} from "@/lib/mock-data"
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  MoreVertical,
  BookOpen,
  ClipboardList,
  FileCheck,
  FilePlus2,
  FilePen,
  ScrollText,
  FileQuestion,
  Calendar as CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { StoredDocument } from "@/lib/documents-storage"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getAllDocuments, renewDocument } from "@/lib/documents-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Formularios embebidos en modal
import DocumentFormAssignment from "@/components/document/DocumentFormAssignment"
import DocumentFormPreventiveProcedure from "@/components/document/DocumentFormPreventiveProcedure"

const typeIcons = {
  manual: BookOpen,
  procedure: ClipboardList,
  record: FileCheck,
  policy: ScrollText,
  instruction: FileQuestion,
}

const typeLabels = {
  manual: "Manual",
  procedure: "Procedimiento",
  record: "Registro",
  policy: "Política",
  instruction: "Instructivo",
}

const statusColors = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-warning/10 text-warning",
  approved: "bg-accent/10 text-accent",
  obsolete: "bg-destructive/10 text-destructive",
}

const statusLabels = {
  draft: "Borrador",
  review: "En Revisión",
  approved: "Aprobado",
  obsolete: "Obsoleto",
}

type CreateFlow = "assignment" | "procedure" | null

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<StoredDocument[]>([])
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // Renovación
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [renewTarget, setRenewTarget] = useState<StoredDocument | null>(null)
  const [renewDate, setRenewDate] = useState(new Date().toISOString().slice(0,10))

  // Crear documentación (modal)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createFlow, setCreateFlow] = useState<CreateFlow>(null)

  // Puedes apuntar a una “plantilla base” para el acta y otra para procedimiento
  // (esto evita hardcodear en 2 lados)
  const assignmentTemplateId = "1"
  const preventiveTemplateId = "10"

  useEffect(() => {
    setDocuments(getAllDocuments(mockDocuments))
  }, [])

  // Helpers
  const addOneYear = (iso: string) => {
    const d = new Date(iso + "T00:00:00")
    d.setFullYear(d.getFullYear() + 1)
    return d.toISOString().slice(0, 10)
  }

  const isExpired = (validFromISO: string) => {
    const expiresISO = addOneYear(validFromISO)
    const todayISO = new Date().toISOString().slice(0, 10)
    return expiresISO < todayISO
  }

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = filename
    a.click()
  }

 const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "all" || doc.type === typeFilter
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      const matchesDept = departmentFilter === "all" || doc.department === departmentFilter
      return matchesSearch && matchesType && matchesStatus && matchesDept
    })
  }, [documents, search, typeFilter, statusFilter, departmentFilter])

  // Stats
  const stats = useMemo(() => {
    return {
      total: documents.length,
      approved: documents.filter((d) => d.status === "approved").length,
      review: documents.filter((d) => d.status === "review").length,
      draft: documents.filter((d) => d.status === "draft").length,
    }
  }, [documents])

  const refreshDocuments = () => setDocuments(getAllDocuments(mockDocuments))

  const openCreateDialog = () => {
    setCreateFlow(null)
    setCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreateFlow(null)
  }

  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Documentos</h1>
          <p className="text-muted-foreground">Control documental del SGC</p>
        </div>
          <Button className="gap-2" onClick={openCreateDialog}>
            <FilePlus2 className="h-4 w-4" />
            Crear documentación
          </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Documentos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aprobados</p>
                <p className="text-2xl font-bold text-accent">{stats.approved}</p>
              </div>
              <FileCheck className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En Revisión</p>
                <p className="text-2xl font-bold text-warning">{stats.review}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Borradores</p>
                <p className="text-2xl font-bold text-muted-foreground">{stats.draft}</p>
              </div>
              <ScrollText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] bg-secondary border-0">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="procedure">Procedimiento</SelectItem>
                  <SelectItem value="record">Registro</SelectItem>
                  <SelectItem value="policy">Política</SelectItem>
                  <SelectItem value="instruction">Instructivo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] bg-secondary border-0">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="review">En Revisión</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="obsolete">Obsoleto</SelectItem>
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[180px] bg-secondary border-0">
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
     

 

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => {
          const TypeIcon = typeIcons[doc.type]
          const expired = isExpired(doc.validFromISO)
          const expiresISO = addOneYear(doc.validFromISO)

          return (
            <Card key={doc.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => {
                          window.location.href = `/dashboard/documents/${doc.id}`
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" /> Ver
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        disabled={!doc.file?.url}
                        onSelect={() => {
                          if (!doc.file?.url) return
                          downloadDataUrl(doc.file.url, doc.file.name || `${doc.name}.pdf`)
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" /> Descargar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => {
                          setRenewTarget(doc)
                          setRenewDate(new Date().toISOString().slice(0, 10))
                          setRenewDialogOpen(true)
                        }}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" /> Renovar
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onSelect={() => {
                          // ya no navegamos para "crear", sino que abrimos modal con el flujo correcto
                          if (doc.id === assignmentTemplateId) {
                            setCreateFlow("assignment")
                            setCreateDialogOpen(true)
                            return
                          }
                          if (doc.id === preventiveTemplateId) {
                            setCreateFlow("procedure")
                            setCreateDialogOpen(true)
                            return
                          }
                          alert("Este documento no tiene diligenciamiento en línea configurado.")
                        }}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" /> Diligenciar / Modificar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-medium text-sm mb-1 line-clamp-2">{doc.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Versión {doc.version} • {doc.size}
                </p>

                <div className="flex gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className={expired ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}
                  >
                    {expired ? "Vencido" : "Vigente"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Vence: {expiresISO}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {typeLabels[doc.type]}
                  </Badge>
                  <Badge variant="secondary" className={cn("text-xs", statusColors[doc.status])}>
                    {statusLabels[doc.status]}
                  </Badge>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{doc.department}</span>
                    <span>{doc.updatedAt}</span>
                  </div>
                </div>

                {/* {doc.id === assignmentTemplateId && (
                  <Button
                    className="w-full mt-3"
                    onClick={() => {
                      setCreateFlow("assignment")
                      setCreateDialogOpen(true)
                    }}
                  >
                    Diligenciar Acta
                  </Button>
                )} */}

                {/* {doc.id === "10" && (
                  <Link href={`/dashboard/documents/${doc.id}/preventive-procedure`} className="block mt-3">
                    <Button className="w-full">Diligenciar Procedimiento</Button>
                  </Link>
                )} */}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dialog Renovar */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Renovar documento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Documento: <span className="font-medium text-foreground">{renewTarget?.name}</span>
            </div>

            <div className="space-y-2">
              <Label>Nueva fecha de vigencia (inicio)</Label>
              <Input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenewDialogOpen(false)}>
                Cancelar
              </Button>

              <Button
                onClick={() => {
                  if (!renewTarget?.createdByUser) {
                    alert("Solo se pueden renovar documentos creados por el usuario (demo).")
                    return
                  }
                  renewDocument(renewTarget.id, renewDate)
                  setDocuments(getAllDocuments(mockDocuments))
                  setRenewDialogOpen(false)
                }}
              >
                Renovar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Crear Documentación */}
    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
      <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Crear documentación</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* 1) Si no hay flujo elegido, mostramos opciones */}
          {createFlow === null && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona qué deseas crear:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {/*  <Button 
                className="gap-2" 
                onClick={openCreateDialog}>
                <FilePlus2 className="h-4 w-4" />
                  Crear documentación
                </Button> */}
                
                <Button
                  className="gap-2"
                  onClick={() => setCreateFlow("assignment")}
                >
                  <FilePen className="h-4 w-4" />
                    Acta de asignación SGSST
                </Button>

                <Button
                  className="gap-2"
                  onClick={() => setCreateFlow("procedure")}
                >
                  <FilePlus2 className="h-4 w-4" />
                  Crear otros documentos
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          )}

          {/* 2) Si ya eligió flujo, renderizamos el formulario */}
          {createFlow === "procedure" && (
            <DocumentFormPreventiveProcedure
              documentId={preventiveTemplateId}
              embedded
              onCreated={() => {
                setCreateDialogOpen(false)
                setCreateFlow(null)
                refreshDocuments()
              }}
            />
          )}

          {createFlow === "assignment" && (
            <DocumentFormAssignment
              documentId={assignmentTemplateId}
              embedded
              onCreated={() => {
                setCreateDialogOpen(false)
                setCreateFlow(null)
                refreshDocuments()
              }}
            />
          )}

          {/* ✅ 3) botón volver cuando esté en un formulario */}
          {createFlow !== null && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCreateFlow(null)}>
                Volver
              </Button>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>


    </div>
  )
}
