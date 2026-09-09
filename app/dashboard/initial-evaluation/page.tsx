"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
} from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Cycle = "PLANEAR" | "HACER" | "VERIFICAR" | "ACTUAR"
type Compliance = "COMPLIES" | "DOES_NOT_COMPLY" | "NOT_APPLICABLE"

type StandardItem = {
  id: string
  cycle: Cycle
  standard: string
  standardItem: string
  value: number
  percentageWeight: number
  possibleScore: number
  action: string
  appliesModule: string
}

type EvaluationAnswer = {
  compliance: Compliance
  observation: string
}

type Evaluation = {
  id: string
  name: string
  year: number
  date: string
  company: string
  responsible: string
  observations: string
  answers: Record<string, EvaluationAnswer>
  createdAt: string
}

type EvaluationForm = {
  name: string
  year: string
  date: string
  company: string
  responsible: string
  observations: string
}

const currentYear = new Date().getFullYear()

const emptyForm: EvaluationForm = {
  name: "",
  year: String(currentYear),
  date: new Date().toISOString().slice(0, 10),
  company: "",
  responsible: "",
  observations: "",
}

const standardItems: StandardItem[] = [
  {
    id: "1.1.1",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Designar responsable SG-SST y conservar soporte documental.",
    appliesModule: "Responsable SG-SST",
  },
  {
    id: "1.1.2",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Responsabilidades en el Sistema de Gestión de Seguridad y Salud en el Trabajo SG-SST",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Definir, comunicar y documentar responsabilidades SG-SST.",
    appliesModule: "Gestión documental",
  },
  {
    id: "1.1.3",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Asignación de recursos para el Sistema de Gestión en Seguridad y Salud en el Trabajo SG-SST",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Registrar recursos humanos, técnicos, financieros y tecnológicos.",
    appliesModule: "Plan de Trabajo",
  },
  {
    id: "1.1.4",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Afiliación al Sistema General de Riesgos Laborales",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Verificar afiliación ARL de los trabajadores.",
    appliesModule: "Gestión Empleados",
  },
  {
    id: "1.1.5",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Identificación de trabajadores de alto riesgo y cotización de pensión especial",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Identificar cargos o actividades con riesgo especial.",
    appliesModule: "Riesgo Especial",
  },
  {
    id: "1.1.6",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Conformación COPASST",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Conformar y documentar el COPASST.",
    appliesModule: "Gestión de Comités",
  },
  {
    id: "1.1.7",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Capacitación COPASST",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Programar capacitación de integrantes COPASST.",
    appliesModule: "Capacitaciones",
  },
  {
    id: "1.1.8",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Conformación Comité de Convivencia Laboral",
    value: 0.5,
    percentageWeight: 4,
    possibleScore: 0.5,
    action: "Conformar y documentar el Comité de Convivencia Laboral.",
    appliesModule: "Gestión de Comités",
  },
  {
    id: "1.2.1",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Programa Capacitación promoción y prevención PYP",
    value: 2,
    percentageWeight: 6,
    possibleScore: 2,
    action: "Crear programa anual de capacitación, promoción y prevención.",
    appliesModule: "Capacitaciones",
  },
  {
    id: "1.2.2",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Inducción y Reinducción en SG-SST, actividades de Promoción y Prevención PYP",
    value: 2,
    percentageWeight: 6,
    possibleScore: 2,
    action: "Registrar inducción y reinducción con participantes y evidencias.",
    appliesModule: "Capacitaciones",
  },
  {
    id: "1.2.3",
    cycle: "PLANEAR",
    standard: "RECURSOS (10%)",
    standardItem: "Responsables del SG-SST con curso virtual de 50 horas",
    value: 2,
    percentageWeight: 6,
    possibleScore: 2,
    action: "Cargar certificado de 50 horas o actualización del responsable.",
    appliesModule: "Formación y Certificaciones",
  },
  {
    id: "2.1.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Política del SG-SST firmada, fechada y comunicada al COPASST",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Crear, firmar, fechar y divulgar política SST.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "2.2.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Objetivos definidos, claros, medibles, cuantificables, con metas, documentados y revisados",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Definir objetivos SST con metas e indicadores.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "2.3.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Evaluación e identificación de prioridades del SG-SST",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Realizar evaluación inicial y priorizar plan de mejora.",
    appliesModule: "Evaluación Inicial",
  },
  {
    id: "2.4.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Plan Anual de Trabajo",
    value: 2,
    percentageWeight: 2,
    possibleScore: 2,
    action: "Crear plan anual de trabajo firmado y con responsables.",
    appliesModule: "Plan de Trabajo",
  },
  {
    id: "2.5.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Archivo o retención documental del SG-SST",
    value: 2,
    percentageWeight: 2,
    possibleScore: 2,
    action: "Organizar documentos SG-SST y evidencias por tipo.",
    appliesModule: "Gestión documental",
  },
  {
    id: "2.6.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Rendición sobre el desempeño",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Registrar rendición de cuentas del SG-SST.",
    appliesModule: "Reuniones",
  },
  {
    id: "2.7.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Matriz legal",
    value: 2,
    percentageWeight: 2,
    possibleScore: 2,
    action: "Actualizar matriz legal aplicable a la empresa.",
    appliesModule: "Gestión documental",
  },
  {
    id: "2.8.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Mecanismos de comunicación, auto reporte en SG-SST",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Definir canales de comunicación y autorreporte.",
    appliesModule: "Gestión documental",
  },
  {
    id: "2.9.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Identificación, evaluación para adquisición de bienes y servicios",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Definir criterios SST para compras y contratación.",
    appliesModule: "Gestión documental",
  },
  {
    id: "2.10.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Evaluación y selección de proveedores y contratistas",
    value: 2,
    percentageWeight: 2,
    possibleScore: 2,
    action: "Definir requisitos SST para evaluación de proveedores y contratistas.",
    appliesModule: "Gestión documental",
  },
  {
    id: "2.11.1",
    cycle: "PLANEAR",
    standard: "GESTIÓN INTEGRAL DEL SG-SST (15%)",
    standardItem: "Gestión del cambio",
    value: 1,
    percentageWeight: 1,
    possibleScore: 1,
    action: "Documentar cambios internos o externos que impacten el SG-SST.",
    appliesModule: "Gestión documental",
  },
  {
    id: "3.1.1",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Evaluación Médica Ocupacional",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Registrar evaluaciones médicas ocupacionales y conceptos.",
    appliesModule: "Gestión Empleados",
  },
  {
    id: "3.1.2",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Actividades de Promoción y Prevención en Salud",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Programar actividades de promoción y prevención.",
    appliesModule: "Capacitaciones",
  },
  {
    id: "3.1.3",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Información al médico de perfiles de cargo",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Remitir perfiles de cargos al médico ocupacional.",
    appliesModule: "Cargos",
  },
  {
    id: "3.1.4",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Realización de exámenes médicos ocupacionales",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Registrar ejecución de exámenes médicos ocupacionales.",
    appliesModule: "Gestión Empleados",
  },
  {
    id: "3.1.5",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Custodia de historias clínicas",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Registrar custodia por institución o médico competente.",
    appliesModule: "Gestión documental",
  },
  {
    id: "3.1.6",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Restricciones y recomendaciones médico laborales",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Registrar restricciones, recomendaciones y seguimiento médico laboral.",
    appliesModule: "Gestión Empleados",
  },
  {
    id: "3.1.7",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Estilos de vida y entorno saludable",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Registrar actividades de promoción de estilos de vida saludables.",
    appliesModule: "Capacitaciones",
  },
  {
    id: "3.1.8",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Agua potable, servicios sanitarios y disposición de basuras",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Conservar soportes de condiciones sanitarias básicas.",
    appliesModule: "Gestión Sanitaria",
  },
  {
    id: "3.1.9",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Eliminación adecuada de residuos sólidos, líquidos o gaseosos",
    value: 1,
    percentageWeight: 9,
    possibleScore: 1,
    action: "Registrar manejo y disposición de residuos aplicables.",
    appliesModule: "Gestión Sanitaria",
  },
  {
    id: "3.2.1",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Reporte de accidentes de trabajo y enfermedades laborales",
    value: 2,
    percentageWeight: 5,
    possibleScore: 2,
    action: "Registrar y reportar novedades laborales.",
    appliesModule: "Novedades Laborales",
  },
  {
    id: "3.2.2",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Investigación de incidentes, accidentes y enfermedades laborales",
    value: 2,
    percentageWeight: 5,
    possibleScore: 2,
    action: "Crear investigación con acciones y trazabilidad.",
    appliesModule: "Investigaciones",
  },
  {
    id: "3.2.3",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Registro y análisis estadístico de accidentes y enfermedades laborales",
    value: 1,
    percentageWeight: 5,
    possibleScore: 1,
    action: "Mantener estadística y análisis de novedades laborales.",
    appliesModule: "Novedades Laborales",
  },
  {
    id: "3.3.1",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Medición de la frecuencia de accidentalidad",
    value: 1,
    percentageWeight: 6,
    possibleScore: 1,
    action: "Calcular y documentar indicador de frecuencia de accidentalidad.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "3.3.2",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Medición de la severidad de accidentalidad",
    value: 1,
    percentageWeight: 6,
    possibleScore: 1,
    action: "Calcular y documentar indicador de severidad de accidentalidad.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "3.3.3",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Medición de la mortalidad por accidentes de trabajo",
    value: 1,
    percentageWeight: 6,
    possibleScore: 1,
    action: "Registrar indicador de mortalidad por accidentes de trabajo.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "3.3.4",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Medición de la prevalencia de enfermedad laboral",
    value: 1,
    percentageWeight: 6,
    possibleScore: 1,
    action: "Registrar indicador de prevalencia de enfermedad laboral.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "3.3.5",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Medición de la incidencia de enfermedad laboral",
    value: 1,
    percentageWeight: 6,
    possibleScore: 1,
    action: "Registrar indicador de incidencia de enfermedad laboral.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "3.3.6",
    cycle: "HACER",
    standard: "GESTIÓN DE LA SALUD (20%)",
    standardItem: "Medición del ausentismo por causa médica",
    value: 1,
    percentageWeight: 6,
    possibleScore: 1,
    action: "Registrar indicador de ausentismo por causa médica.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "4.1.1",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Metodología para identificación de peligros, evaluación y valoración de riesgos",
    value: 4,
    percentageWeight: 15,
    possibleScore: 4,
    action: "Definir metodología de matriz de peligros.",
    appliesModule: "Laborales",
  },
  {
    id: "4.1.2",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Identificación de peligros con participación de todos los niveles de la empresa",
    value: 4,
    percentageWeight: 15,
    possibleScore: 4,
    action: "Actualizar matriz de peligros con participación documentada.",
    appliesModule: "Laborales",
  },
  {
    id: "4.1.3",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Identificación de sustancias catalogadas como carcinógenas o con toxicidad aguda",
    value: 3,
    percentageWeight: 15,
    possibleScore: 3,
    action: "Identificar sustancias peligrosas y definir controles documentados.",
    appliesModule: "Laborales",
  },
  {
    id: "4.1.4",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Mediciones ambientales",
    value: 4,
    percentageWeight: 15,
    possibleScore: 4,
    action: "Registrar mediciones higiénicas o ambientales cuando apliquen.",
    appliesModule: "Laborales",
  },
  {
    id: "4.2.1",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Medidas de prevención y control frente a peligros/riesgos identificados",
    value: 2.5,
    percentageWeight: 15,
    possibleScore: 2.5,
    action: "Definir medidas de prevención y controles.",
    appliesModule: "Medidas de Prevencion",
  },
  {
    id: "4.2.2",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Aplicación de medidas de prevención y control por parte de los trabajadores",
    value: 2.5,
    percentageWeight: 15,
    possibleScore: 2.5,
    action: "Registrar seguimiento a implementación de controles.",
    appliesModule: "Medidas de Prevencion",
  },
  {
    id: "4.2.3",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Procedimientos, instructivos y fichas técnicas de seguridad",
    value: 2.5,
    percentageWeight: 15,
    possibleScore: 2.5,
    action: "Cargar procedimientos e instructivos aplicables.",
    appliesModule: "Gestión documental",
  },
  {
    id: "4.2.4",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Inspecciones a instalaciones, maquinaria o equipos",
    value: 2.5,
    percentageWeight: 15,
    possibleScore: 2.5,
    action: "Programar inspecciones y evidenciar hallazgos.",
    appliesModule: "Mantenimiento Preventivo",
  },
  {
    id: "4.2.5",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Mantenimiento periódico de instalaciones, equipos, máquinas y herramientas",
    value: 2.5,
    percentageWeight: 15,
    possibleScore: 2.5,
    action: "Registrar planes y evidencias de mantenimiento.",
    appliesModule: "Mantenimiento Preventivo",
  },
  {
    id: "4.2.6",
    cycle: "HACER",
    standard: "GESTIÓN DE PELIGROS Y RIESGOS (30%)",
    standardItem: "Entrega de Elementos de Protección Personal EPP",
    value: 2.5,
    percentageWeight: 15,
    possibleScore: 2.5,
    action: "Registrar entrega, reposición y capacitación de EPP.",
    appliesModule: "Gestión documental",
  },
  {
    id: "5.1.1",
    cycle: "HACER",
    standard: "GESTIÓN DE AMENAZAS (10%)",
    standardItem: "Plan de prevención, preparación y respuesta ante emergencias",
    value: 5,
    percentageWeight: 10,
    possibleScore: 5,
    action: "Actualizar plan de emergencias y divulgarlo.",
    appliesModule: "Gestión de Emergencias",
  },
  {
    id: "5.1.2",
    cycle: "HACER",
    standard: "GESTIÓN DE AMENAZAS (10%)",
    standardItem: "Brigada de prevención, preparación y respuesta ante emergencias",
    value: 5,
    percentageWeight: 10,
    possibleScore: 5,
    action: "Conformar, capacitar y evidenciar brigada de emergencias.",
    appliesModule: "Brigada de Emergencias",
  },
  {
    id: "6.1.1",
    cycle: "VERIFICAR",
    standard: "VERIFICACIÓN DEL SG-SST (5%)",
    standardItem: "Indicadores, estructura, proceso y resultado",
    value: 1.25,
    percentageWeight: 5,
    possibleScore: 1.25,
    action: "Definir y medir indicadores del SG-SST.",
    appliesModule: "Objetivos SST",
  },
  {
    id: "6.1.2",
    cycle: "VERIFICAR",
    standard: "VERIFICACIÓN DEL SG-SST (5%)",
    standardItem: "Auditoría anual",
    value: 1.25,
    percentageWeight: 5,
    possibleScore: 1.25,
    action: "Planificar auditoría anual y registrar hallazgos.",
    appliesModule: "Auditorías",
  },
  {
    id: "6.1.3",
    cycle: "VERIFICAR",
    standard: "VERIFICACIÓN DEL SG-SST (5%)",
    standardItem: "Revisión por la alta dirección",
    value: 1.25,
    percentageWeight: 5,
    possibleScore: 1.25,
    action: "Registrar revisión por la dirección y compromisos.",
    appliesModule: "Novedades Laborales",
  },
  {
    id: "6.1.4",
    cycle: "VERIFICAR",
    standard: "VERIFICACIÓN DEL SG-SST (5%)",
    standardItem: "Planificación de auditoría con el COPASST",
    value: 1.25,
    percentageWeight: 5,
    possibleScore: 1.25,
    action: "Vincular COPASST a la planeación de auditoría.",
    appliesModule: "Gestión de Comités",
  },
  {
    id: "7.1.1",
    cycle: "ACTUAR",
    standard: "MEJORAMIENTO (10%)",
    standardItem: "Acciones preventivas y correctivas con base en resultados del SG-SST",
    value: 2.5,
    percentageWeight: 10,
    possibleScore: 2.5,
    action: "Crear ACPM derivado del hallazgo.",
    appliesModule: "ACPM",
  },
  {
    id: "7.1.2",
    cycle: "ACTUAR",
    standard: "MEJORAMIENTO (10%)",
    standardItem: "Acciones de mejora conforme a investigación de incidentes, accidentes y enfermedades laborales",
    value: 2.5,
    percentageWeight: 10,
    possibleScore: 2.5,
    action: "Relacionar acciones de mejora a investigaciones laborales.",
    appliesModule: "Investigaciones",
  },
  {
    id: "7.1.3",
    cycle: "ACTUAR",
    standard: "MEJORAMIENTO (10%)",
    standardItem: "Acciones de mejora con base en inspecciones y recomendaciones",
    value: 2.5,
    percentageWeight: 10,
    possibleScore: 2.5,
    action: "Registrar ACPM o medida preventiva según inspección.",
    appliesModule: "ACPM",
  },
  {
    id: "7.1.4",
    cycle: "ACTUAR",
    standard: "MEJORAMIENTO (10%)",
    standardItem: "Plan de mejoramiento",
    value: 2.5,
    percentageWeight: 10,
    possibleScore: 2.5,
    action: "Consolidar plan de mejora con responsables y fechas.",
    appliesModule: "Plan de Trabajo",
  },
]

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "No registrada"
  return value.slice(0, 10)
}

function cycleWeight(cycle: Cycle) {
  return standardItems
    .filter((item) => item.cycle === cycle)
    .reduce((sum, item) => sum + item.possibleScore, 0)
}

function getScore(item: StandardItem, answer?: EvaluationAnswer) {
  if (!answer || answer.compliance === "DOES_NOT_COMPLY") return 0
  return item.possibleScore
}

function complianceLabel(value: Compliance) {
  if (value === "COMPLIES") return "Cumple totalmente"
  if (value === "NOT_APPLICABLE") return "No aplica"
  return "No cumple"
}

function defaultAnswers(seed: "mixed" | "empty" = "mixed"): Record<string, EvaluationAnswer> {
  return Object.fromEntries(
    standardItems.map((item, index) => [
      item.id,
      {
        compliance:
          seed === "empty"
            ? "DOES_NOT_COMPLY"
            : index % 7 === 0
              ? "DOES_NOT_COMPLY"
              : index % 11 === 0
                ? "NOT_APPLICABLE"
                : "COMPLIES",
        observation: "",
      },
    ]),
  )
}

const initialEvaluations: Evaluation[] = [
  {
    id: "eval-1",
    name: "Evaluación inicial SG-SST 2026",
    year: 2026,
    date: "2026-01-18",
    company: "Empresa Demo S.A.S.",
    responsible: "Responsable SG-SST",
    observations: "Evaluación inicial realizada con base en estándares mínimos SG-SST.",
    answers: defaultAnswers("mixed"),
    createdAt: "2026-01-18T09:00:00",
  },
]

function calculateResults(evaluation: Evaluation) {
  const totalScore = standardItems.reduce((sum, item) => sum + getScore(item, evaluation.answers[item.id]), 0)
  const totalPossible = standardItems.reduce((sum, item) => sum + item.possibleScore, 0)
  const findings = standardItems.filter((item) => evaluation.answers[item.id]?.compliance === "DOES_NOT_COMPLY")

  const byCycle = (["PLANEAR", "HACER", "VERIFICAR", "ACTUAR"] as Cycle[]).map((cycle) => {
    const items = standardItems.filter((item) => item.cycle === cycle)
    const score = items.reduce((sum, item) => sum + getScore(item, evaluation.answers[item.id]), 0)
    const possible = cycleWeight(cycle)

    return {
      cycle,
      score,
      possible,
      percentage: possible ? (score / possible) * 100 : 0,
    }
  })

  return {
    totalScore,
    totalPossible,
    totalPercentage: totalPossible ? (totalScore / totalPossible) * 100 : 0,
    findings,
    byCycle,
  }
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function Metric({ label, value, tone = "default" }: { label: string; value: string | number; tone?: "default" | "blue" | "green" | "red" | "amber" }) {
  const toneClass =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : tone === "red"
          ? "text-destructive"
          : tone === "amber"
            ? "text-amber-700"
            : "text-foreground"

  return (
    <div className="rounded-md bg-secondary px-3 py-1.5">
      <span className={`text-sm font-bold ${toneClass}`}>{value}</span>
      <span className="ml-2 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function EvaluationDialog({
  open,
  evaluation,
  onClose,
  onSave,
}: {
  open: boolean
  evaluation: Evaluation | null
  onClose: () => void
  onSave: (form: EvaluationForm, answers: Record<string, EvaluationAnswer>, evaluationId?: string) => void
}) {
  const [form, setForm] = useState<EvaluationForm>(emptyForm)
  const [answers, setAnswers] = useState<Record<string, EvaluationAnswer>>(defaultAnswers("empty"))
  const [query, setQuery] = useState("")
  const editing = Boolean(evaluation)

  useEffect(() => {
    if (!open) return
    setForm(
      evaluation
        ? {
            name: evaluation.name,
            year: String(evaluation.year),
            date: evaluation.date,
            company: evaluation.company,
            responsible: evaluation.responsible,
            observations: evaluation.observations,
          }
        : emptyForm,
    )
    setAnswers(evaluation?.answers ?? defaultAnswers("empty"))
    setQuery("")
  }, [evaluation, open])

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return standardItems

    return standardItems.filter(
      (item) =>
        item.id.toLowerCase().includes(term) ||
        item.cycle.toLowerCase().includes(term) ||
        item.standard.toLowerCase().includes(term) ||
        item.standardItem.toLowerCase().includes(term) ||
        item.appliesModule.toLowerCase().includes(term),
    )
  }, [query])

  function updateAnswer(itemId: string, compliance: Compliance) {
    setAnswers((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? { observation: "" }),
        compliance,
      },
    }))
  }

  function updateObservation(itemId: string, observation: string) {
    setAnswers((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? { compliance: "DOES_NOT_COMPLY" }),
        observation,
      },
    }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const year = Number(form.year)

    if (!form.name.trim()) return toast.error("Ingresa el nombre de la evaluación")
    if (!Number.isInteger(year) || year < 2019) return toast.error("Ingresa una vigencia válida")
    if (!form.date) return toast.error("Selecciona la fecha")
    if (!form.company.trim()) return toast.error("Ingresa la empresa")
    if (!form.responsible.trim()) return toast.error("Ingresa el responsable")

    onSave(form, answers, evaluation?.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-7xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-7xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>{editing ? "Editar evaluación inicial" : "Crear evaluación inicial"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Diligencia la tabla de valores y calificación de estándares mínimos SG-SST.
          </p>
        </DialogHeader>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <section className="rounded-md border border-border p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Datos de la evaluación</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_120px_170px_minmax(0,1fr)]">
                <Label className="grid gap-2">
                  Nombre
                  <Input
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Evaluación inicial SG-SST"
                  />
                </Label>
                <Label className="grid gap-2">
                  Vigencia
                  <Input
                    type="number"
                    value={form.year}
                    onChange={(event) => setForm((current) => ({ ...current, year: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Fecha
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                  />
                </Label>
                <Label className="grid gap-2">
                  Empresa
                  <Input
                    value={form.company}
                    onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                    placeholder="Nombre de la empresa"
                  />
                </Label>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-[300px_minmax(0,1fr)]">
                <Label className="grid gap-2">
                  Responsable
                  <Input
                    value={form.responsible}
                    onChange={(event) => setForm((current) => ({ ...current, responsible: event.target.value }))}
                    placeholder="Responsable de ejecución del SG-SST"
                  />
                </Label>
                <Label className="grid gap-2">
                  Observaciones
                  <Textarea
                    value={form.observations}
                    onChange={(event) => setForm((current) => ({ ...current, observations: event.target.value }))}
                    rows={2}
                  />
                </Label>
              </div>
            </section>

            <section className="rounded-md border border-border p-4">
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Tabla de valores y calificación</h3>
                  <p className="text-sm text-muted-foreground">
                    Cumple totalmente o No aplica otorgan el puntaje posible; No cumple genera hallazgo.
                  </p>
                </div>
                <div className="relative w-full lg:w-[360px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Buscar ítem, ciclo o módulo" />
                </div>
              </div>

              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[1280px] text-sm">
                  <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-3 font-medium">Ciclo</th>
                      <th className="px-3 py-3 font-medium">Estándar</th>
                      <th className="px-3 py-3 font-medium">Ítem del estándar</th>
                      <th className="px-3 py-3 font-medium">Valor</th>
                      <th className="px-3 py-3 font-medium">Peso porcentual</th>
                      <th className="px-3 py-3 font-medium">Puntaje posible</th>
                      <th className="px-3 py-3 font-medium">Calificación</th>
                      <th className="px-3 py-3 font-medium">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map((item) => {
                      const answer = answers[item.id] ?? { compliance: "DOES_NOT_COMPLY", observation: "" }

                      return (
                        <tr key={item.id} className="align-top">
                          <td className="px-3 py-3 text-muted-foreground">{item.cycle}</td>
                          <td className="px-3 py-3 text-muted-foreground">{item.standard}</td>
                          <td className="px-3 py-3">
                            <p className="font-medium text-foreground">{item.id}</p>
                            <p className="mt-1 max-w-[360px] text-muted-foreground">{item.standardItem}</p>
                          </td>
                          <td className="px-3 py-3 text-muted-foreground">{formatNumber(item.value)}</td>
                          <td className="px-3 py-3 text-muted-foreground">{formatNumber(item.percentageWeight)}%</td>
                          <td className="px-3 py-3 text-muted-foreground">{formatNumber(item.possibleScore)}</td>
                          <td className="px-3 py-3">
                            <select
                              value={answer.compliance}
                              onChange={(event) => updateAnswer(item.id, event.target.value as Compliance)}
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="COMPLIES">Cumple totalmente</option>
                              <option value="DOES_NOT_COMPLY">No cumple</option>
                              <option value="NOT_APPLICABLE">No aplica</option>
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <Input
                              value={answer.observation}
                              onChange={(event) => updateObservation(item.id, event.target.value)}
                              placeholder="Opcional"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">{editing ? "Guardar cambios" : "Crear evaluación"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FindingsDialog({
  evaluation,
  onClose,
}: {
  evaluation: Evaluation | null
  onClose: () => void
}) {
  if (!evaluation) return null
  const results = calculateResults(evaluation)

  return (
    <Dialog open={Boolean(evaluation)} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="!flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-6xl flex-col gap-0 overflow-hidden bg-card p-0 sm:max-w-6xl">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-4 pr-12">
          <DialogTitle>Hallazgos de la evaluación inicial</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Solo se muestran los ítems marcados como No cumple, con acción requerida y módulo aplicable.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <InfoBlock label="Evaluación" value={evaluation.name} />
            <InfoBlock label="Puntaje" value={`${formatNumber(results.totalScore)} / ${formatNumber(results.totalPossible)}`} />
            <InfoBlock label="Cumplimiento" value={`${formatNumber(results.totalPercentage)}%`} />
            <InfoBlock label="Hallazgos" value={String(results.findings.length)} />
          </div>

          {results.findings.length === 0 ? (
            <Card>
              <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                No hay hallazgos registrados en esta evaluación.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ciclo</th>
                    <th className="px-4 py-3 font-medium">Ítem</th>
                    <th className="px-4 py-3 font-medium">Valor perdido</th>
                    <th className="px-4 py-3 font-medium">Acción requerida</th>
                    <th className="px-4 py-3 font-medium">Módulo aplica</th>
                    <th className="px-4 py-3 font-medium">Observación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.findings.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-3 text-muted-foreground">{item.cycle}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{item.id}</p>
                        <p className="max-w-[340px] text-muted-foreground">{item.standardItem}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatNumber(item.possibleScore)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.action}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{item.appliesModule}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {evaluation.answers[item.id]?.observation || "Sin observación"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border bg-card px-6 py-4">
          <Button type="button" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function InitialEvaluationPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>(initialEvaluations)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null)
  const [findingsEvaluation, setFindingsEvaluation] = useState<Evaluation | null>(null)

  const filteredEvaluations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return evaluations.filter(
      (evaluation) =>
        !query ||
        evaluation.name.toLowerCase().includes(query) ||
        evaluation.company.toLowerCase().includes(query) ||
        evaluation.responsible.toLowerCase().includes(query) ||
        String(evaluation.year).includes(query),
    )
  }, [evaluations, search])

  const currentResults = useMemo(() => {
    const latest = evaluations[0]
    return latest ? calculateResults(latest) : null
  }, [evaluations])

  function saveEvaluation(form: EvaluationForm, answers: Record<string, EvaluationAnswer>, evaluationId?: string) {
    const payload = {
      name: form.name.trim(),
      year: Number(form.year),
      date: form.date,
      company: form.company.trim(),
      responsible: form.responsible.trim(),
      observations: form.observations.trim(),
      answers,
    }

    if (evaluationId) {
      setEvaluations((current) =>
        current.map((evaluation) =>
          evaluation.id === evaluationId
            ? {
                ...evaluation,
                ...payload,
              }
            : evaluation,
        ),
      )
      toast.success("Evaluación inicial actualizada")
      return
    }

    setEvaluations((current) => [
      {
        id: createId("evaluation"),
        ...payload,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ])
    toast.success("Evaluación inicial creada")
  }

  function downloadPdf(evaluation: Evaluation) {
    const results = calculateResults(evaluation)
    const doc = new jsPDF("l", "mm", "a4")
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 12
    const primaryColor: [number, number, number] = [31, 92, 77]

    doc.setFillColor(...primaryColor)
    doc.roundedRect(margin, 10, pageWidth - margin * 2, 22, 3, 3, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.text("EVALUACIÓN INICIAL - ESTÁNDARES MÍNIMOS SG-SST", margin + 5, 19)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.text(`Resolución 0312 de 2019 · Fecha: ${formatDate(evaluation.date)}`, margin + 5, 26)

    autoTable(doc, {
      startY: 38,
      theme: "grid",
      margin: { left: margin, right: margin },
      body: [
        ["Empresa", evaluation.company, "Vigencia", String(evaluation.year)],
        ["Responsable", evaluation.responsible, "Cumplimiento", `${formatNumber(results.totalPercentage)}%`],
        ["Puntaje", `${formatNumber(results.totalScore)} / ${formatNumber(results.totalPossible)}`, "Hallazgos", String(results.findings.length)],
      ],
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2, lineColor: [220, 226, 224], lineWidth: 0.1 },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 30 },
        2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 30 },
      },
    })

    autoTable(doc, {
      startY: ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 62) + 7,
      theme: "grid",
      margin: { left: margin, right: margin },
      head: [["Ciclo", "Estándar", "Ítem del estándar", "Valor", "Peso", "Puntaje posible", "Calificación empresa"]],
      body: standardItems.map((item) => {
        const answer = evaluation.answers[item.id] ?? { compliance: "DOES_NOT_COMPLY", observation: "" }
        return [
          item.cycle,
          item.standard,
          `${item.id}. ${item.standardItem}`,
          formatNumber(item.value),
          `${formatNumber(item.percentageWeight)}%`,
          formatNumber(item.possibleScore),
          complianceLabel(answer.compliance),
        ]
      }),
      styles: { font: "helvetica", fontSize: 6.5, cellPadding: 1.6, lineColor: [220, 226, 224], lineWidth: 0.1 },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 42 },
        2: { cellWidth: 118 },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 22, halign: "center" },
        6: { cellWidth: 36 },
      },
    })

    doc.addPage()
    doc.setTextColor(...primaryColor)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(12)
    doc.text("HALLAZGOS Y PLAN DE MEJORA", margin, 16)

    autoTable(doc, {
      startY: 22,
      theme: "grid",
      margin: { left: margin, right: margin },
      head: [["Ciclo", "Ítem", "Acción requerida", "Módulo aplica", "Observación"]],
      body: results.findings.length
        ? results.findings.map((item) => [
            item.cycle,
            `${item.id}. ${item.standardItem}`,
            item.action,
            item.appliesModule,
            evaluation.answers[item.id]?.observation || "",
          ])
        : [["-", "Sin hallazgos", "No requiere acción", "-", "-"]],
      styles: { font: "helvetica", fontSize: 7, cellPadding: 1.8, lineColor: [220, 226, 224], lineWidth: 0.1 },
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 95 },
        2: { cellWidth: 85 },
        3: { cellWidth: 45 },
        4: { cellWidth: pageWidth - margin * 2 - 250 },
      },
    })

    const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120) + 18
    const signatureY = Math.min(finalY, pageHeight - 28)
    doc.setDrawColor(120, 130, 140)
    doc.line(margin, signatureY, margin + 90, signatureY)
    doc.line(pageWidth - margin - 90, signatureY, pageWidth - margin, signatureY)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(30, 41, 59)
    doc.text("Firma del empleador o contratante", margin, signatureY + 6)
    doc.text("Responsable de la ejecución del SG-SST", pageWidth - margin - 90, signatureY + 6)

    const pageCount = Math.max(1, ((doc.internal as unknown as { pages?: unknown[] }).pages?.length ?? 2) - 1)
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      doc.setPage(pageNumber)
      doc.setDrawColor(220, 226, 224)
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text("Documento generado desde el Sistema de Gestión SG-SST", margin, pageHeight - 5)
      doc.text(`Página ${pageNumber} de ${pageCount}`, pageWidth - margin, pageHeight - 5, { align: "right" })
    }

    doc.save(`evaluacion-inicial-sg-sst-${evaluation.year}.pdf`)
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evaluación Inicial</h1>
          <p className="text-muted-foreground">
            Diligencia estándares mínimos SG-SST, calcula resultados por ciclo y visualiza solo hallazgos.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => {
            setEditingEvaluation(null)
            setOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Nueva evaluación
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex justify-center overflow-x-auto px-3 py-1">
          <div className="flex w-fit min-w-max items-center gap-2">
            <Metric label="Evaluaciones" value={evaluations.length} />
            <Metric label="Puntaje actual" value={currentResults ? formatNumber(currentResults.totalScore) : "0"} tone="blue" />
            <Metric label="Cumplimiento" value={currentResults ? `${formatNumber(currentResults.totalPercentage)}%` : "0%"} tone="green" />
            <Metric label="Hallazgos" value={currentResults?.findings.length ?? 0} tone="red" />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1fr)_auto] md:items-end">
          <Label className="grid gap-2">
            Buscar
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Evaluación, empresa, responsable o vigencia"
              />
            </div>
          </Label>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => evaluations[0] && downloadPdf(evaluations[0])}
            disabled={evaluations.length === 0}
          >
            <Download className="h-4 w-4" />
            Descargar última evaluación
          </Button>
        </div>
      </section>

      {currentResults && (
        <section className="grid gap-4 md:grid-cols-4">
          {currentResults.byCycle.map((cycle) => (
            <Card key={cycle.cycle} className="border-border bg-card">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground">{cycle.cycle}</p>
                <p className="mt-2 text-2xl font-bold text-primary">{formatNumber(cycle.score)}</p>
                <p className="text-xs text-muted-foreground">de {formatNumber(cycle.possible)} puntos</p>
                <div className="mt-3 h-2 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(100, cycle.percentage)}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Evaluaciones iniciales</h2>
          <p className="text-sm text-muted-foreground">{filteredEvaluations.length} registros encontrados</p>
        </div>

        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b border-border bg-secondary text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Evaluación</th>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Responsable</th>
                <th className="px-4 py-3 font-medium">Puntaje</th>
                <th className="px-4 py-3 font-medium">Hallazgos</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvaluations.map((evaluation) => {
                const results = calculateResults(evaluation)

                return (
                  <tr key={evaluation.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{evaluation.name}</p>
                      <p className="text-muted-foreground">Vigencia {evaluation.year}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{evaluation.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(evaluation.date)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{evaluation.responsible}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {formatNumber(results.totalScore)} / {formatNumber(results.totalPossible)}
                      </p>
                      <p className="text-muted-foreground">{formatNumber(results.totalPercentage)}%</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={results.findings.length ? "border-destructive bg-destructive/10 text-destructive" : "border-emerald-200 bg-emerald-50 text-emerald-700"}>
                        {results.findings.length}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" aria-label="Abrir acciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onSelect={() => setFindingsEvaluation(evaluation)}>
                            <Eye className="h-4 w-4" />
                            Ver hallazgos
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setEditingEvaluation(evaluation)
                              setOpen(true)
                            }}
                          >
                            <ClipboardList className="h-4 w-4" />
                            Diligenciar tabla
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => downloadPdf(evaluation)}>
                            <Download className="h-4 w-4" />
                            Descargar para firma
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                )
              })}
              {filteredEvaluations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No hay evaluaciones iniciales para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Hallazgos visibles</h3>
            <p className="text-sm text-muted-foreground">
              Este módulo lista como hallazgo únicamente los ítems marcados como No cumple. Cada hallazgo muestra la acción sugerida
              y el módulo donde aplica para facilitar el plan de mejora.
            </p>
          </div>
        </div>
      </section>

      <EvaluationDialog
        open={open}
        evaluation={editingEvaluation}
        onClose={() => {
          setOpen(false)
          setEditingEvaluation(null)
        }}
        onSave={saveEvaluation}
      />
      <FindingsDialog evaluation={findingsEvaluation} onClose={() => setFindingsEvaluation(null)} />
    </main>
  )
}
