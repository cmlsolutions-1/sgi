import {
    BookOpen,
    ClipboardList,
    FileCheck,
    FileQuestion,
    ScrollText,
  } from "lucide-react"
  
  export const TEMPLATES = {
    assignment: "1",
    preventive: "10",
  } as const
  
  export const typeIcons = {
    manual: BookOpen,
    procedure: ClipboardList,
    record: FileCheck,
    policy: ScrollText,
    instruction: FileQuestion,
  } as const
  
  export const typeLabels = {
    manual: "Manual",
    procedure: "Procedimiento",
    record: "Registro",
    policy: "Política",
    instruction: "Instructivo",
  } as const
  
  export const statusColors = {
    draft: "bg-muted text-muted-foreground",
    review: "bg-warning/10 text-warning",
    approved: "bg-accent/10 text-accent",
    obsolete: "bg-destructive/10 text-destructive",
  } as const
  
  export const statusLabels = {
    draft: "Borrador",
    review: "En Revisión",
    approved: "Aprobado",
    obsolete: "Obsoleto",
  } as const
  