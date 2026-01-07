//src/dashboard/documents/page.tsx

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockDocuments, departments, type Document } from "@/lib/mock-data"
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
  ScrollText,
  FileQuestion,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || doc.type === typeFilter
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter
    const matchesDept = departmentFilter === "all" || doc.department === departmentFilter
    return matchesSearch && matchesType && matchesStatus && matchesDept
  })

  // Stats
  const stats = {
    total: documents.length,
    approved: documents.filter((d) => d.status === "approved").length,
    review: documents.filter((d) => d.status === "review").length,
    draft: documents.filter((d) => d.status === "draft").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Documentos</h1>
          <p className="text-muted-foreground">Control documental del SGC</p>
        </div>
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
          // const isSGSSTDocument = doc.name.toLowerCase().includes("sgsst") || 
          //                       doc.name.toLowerCase().includes("asignacion") ||
          //                       doc.name.toLowerCase().includes("responsable")
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
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" /> Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" /> Descargar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{doc.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Versión {doc.version} • {doc.size}
                </p>
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

                {/* Botón para formulario si es el documento SGSST */}
                 {/* {isSGSSTDocument && ( 
                   <Link href={`/dashboard/documents/${doc.id}/form`} className="block mt-3">
                     <Button className="w-full" >
                       Diligenciar Acta
                     </Button>
                   </Link>
                 )} */}
                {doc.id === "1" && (
                  <Link href={`/dashboard/documents/${doc.id}/assignment`} className="block mt-3">
                    <Button className="w-full">Diligenciar Acta</Button>
                  </Link>
                )}
                
                {doc.id === "10" && (
                  <Link href={`/dashboard/documents/${doc.id}/preventive-procedure`} className="block mt-3">
                    <Button className="w-full">Diligenciar Procedimiento</Button>
                  </Link>
                )}
                
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
