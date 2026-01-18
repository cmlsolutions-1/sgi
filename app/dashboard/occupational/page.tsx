// app/dashboard/occupational/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, ClipboardList, Pencil, Trash2, UploadCloud } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

/* =========================================================
   1) CAPACITACIONES (original)
========================================================= */
type TrainingStatus = "completed" | "scheduled"

interface Training {
  id: string
  title: string
  date: string
  time: string
  responsible: string
  description: string
  status: TrainingStatus
}

const months = [
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
]

const generateHalfHourTimes = () => {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    times.push(`${String(h).padStart(2, "0")}:00`)
    times.push(`${String(h).padStart(2, "0")}:30`)
  }
  return times
}
const timeOptions = generateHalfHourTimes()

/* =========================================================
   2) MATRIZ DE RIESGOS (drawer + wizard + evidencias)
========================================================= */

type YesNo = "SI" | "NO"

type ControlType = "DATE" | "PERMANENT"
type ControlStatus = "PENDING" | "DONE"

type Evidence = {
  id: string
  name: string
  mime: string
  size: number
  dataUrl: string
  //createdAt: string
  performedAt: string // fecha de realización (YYYY-MM-DD)
  uploadedAt: string  // fecha/hora subida (ISO)
}

type MeasureKey =
  | "ELIMINACION"
  | "SUSTITUCION"
  | "INGENIERIA"
  | "ADMINISTRATIVOS"
  | "EPP"

type MeasureControl = {
  id: string
  key: MeasureKey
  title: string
  description: string
  type: ControlType
  dueDate?: string
  status: ControlStatus
  doneDate?: string
}

type RiskRow = {
  id: string

  proceso: string
  zonaLugar: string
  actividades: string
  tareas: string
  rutinario: YesNo

  peligroClasificacion: string
  peligroDescripcion: string
  efectosPosibles: string

  controlesFuente: string
  controlesMedio: string
  controlesPersona: string

  ndKey: "MA" | "A" | "M" | "B"
  neKey: "EC" | "EF" | "EO" | "EE"
  ncKey: "M" | "MG" | "G" | "L"

  np: number
  npInterpretacion: string

  nr: number
  nrNivel: string
  nrInterpretacion: string
  aceptabilidad: string

  numeroExpuestos: string
  peorConsecuencia: string
  requisitoLegal: YesNo

  measures: MeasureControl[]
  evidences: Evidence[]
}

const LS_RISK_KEY = "risk_matrix_rows_v1"

const PELIGROS: Record<string, string[]> = {
  BIOLOGICOS: [
    "VIRUS",
    "BACTERIAS",
    "HONGOS",
    "RICKTESIAS",
    "PARASITOS",
    "PICADURAS",
    "MORDEDURAS",
    "FLUIDOS O EXCREMENTOS",
  ],
  FISICOS: [
    "RUIDO (DE IMPACTO, INTERMITENTE O CONTINUO)",
    "ILUMINACION (LUZ EN EXCESO O AUSENCIA)",
    "VIBRACION (CUERPO ENTERO O SEGMENTARIA)",
    "EXPOSICION TEMPERATURAS EXTREMAS (FRIO O CALOR)",
    "CONTACTOS TERMICOS",
    "RADIACION IONIZANTE (RAYOS X, GAMA)",
    "RADIACION NO IONIZANTE (LASER, UV, IR)",
    "PRESIONES EXTREMAS (ALTA O BAJA)",
  ],
  QUIMICOS: [
    "POLVOS ORGANICOS O INORGANICOS",
    "LIQUIDOS (NIEBLAS Y ROCIOS)",
    "GASES Y VAPORES",
    "MATERIAL PARTICULADO",
  ],
  PSICOSOCIALES: [
    "GESTION ORGANIZACIONAL (ESTILO DE MANDO, PAGO, BIENESTAR SOCIAL, EVALUACION DEL DESEMPEÑO, MANEJO DE CAMBIOS)",
    "CARACTERISTICAS DE LA ORGANIZACIÓN DEL TRABAJO (COMUNICACIÓN, TECNOLOGIA, ORGANIZACION DEL TRABAJO, DEMANDAS CUALITATIVAS Y CUANTITATIVAS DE LA LABOR)",
    "CARACTERISTICAS DEL GRUPO SOCIAL DEL TRABAJO (RELACIONES, COHESION, CALIDAD DE INTERACCION, TRABAJO EN EQUIPO)",
    "CONDICIONES DE LA TAREA (CARGA MENTAL, CONTENIDO DE LA TAREA, DEMANDAS EMOCIONALES, SISTEMAS DE CONTROL, DEFINICION DE ROLES, MONOTONIA, ETC.)",
    "INTERFASE PERSONA - TAREA (CONOCIMIENTOS, HABILIDAD EN RELACION CON LA DEMANDA DE LA TAREA, INICIATIVA, AUTONOMIA Y RECONOCIMIENTO, IDENTIFICACION DE LA PERSONA CON LA TAREA Y LA ORGANIZACIÓN)",
    "JORNADA DE TRABAJO (PAUSAS, TRABAJO NOCTURNO, ROTACION, HORAS EXTRA, DESCANSO)",
  ],
  BIOMECANICOS: [
    "POSTURA (PROLONGADA, MANTENIDA, FORZADA, ANTIGRAVITACIONAL)",
    "ESFUERZO",
    "MOVIMIENTO REPETITIVO",
    "MANIPULACION MANUAL DE CARGAS",
  ],
  "CONDICIONES DE SEGURIDAD": [
    "MECANICOS (ELEMENTOS O PARTES DE MAQUINAS, HERRAMIENTAS, EQUIPOS, PIEZAS A TRABAJAR, MATERIALES PROYECTADOS SOLIDOS O FLUIDOS)",
    "ELECTRICO (ALTA Y BAJA TENSION, ESTATICA)",
    "LOCATIVO (SISTEMAS Y MEDIOS DE ALMACENAMIENTO) SUPERFICIES DE TRABAJO (IRREGULARIDAD, DESLIZANTE, CON DIFERENCIA DEL NIVEL) CONDICIONES DE ORDEN Y ASEO (CAIDAS DE PERSONAS AL MISMO U OTRO NIVEL)",
    "TECNOLOGICO (EXPLOSION, FUGA, DERRAME, INCENDIO)",
    "ATROPELLO O GOLPE DE PERSONAS CON VEHICULO",
    "PUBLICOS (ROBOS, ATRACOS, ASALTOS, ATENTADOS, DE ORDEN PUBLICO, ETC.)",
    "TRABAJO EN ALTURAS",
    "ESPACIOS CONFINADOS",
  ],
  "FENOMENOS NATURALES": [
    "SISMO",
    "TERREMOTO",
    "VENDAVAL",
    "INUNDACION",
    "DERRUMBE",
    "PRECIPITACIONES (LLUVIAS, GRANIZADAS, HELADAS)",
  ],
}

const ND_OPTIONS = [
  { label: "Muy Alto (MA)", value: "MA" as const, nd: 10 },
  { label: "Alto (A)", value: "A" as const, nd: 6 },
  { label: "Medio (M)", value: "M" as const, nd: 2 },
  { label: "Bajo (B)", value: "B" as const, nd: 0 },
]
const NE_OPTIONS = [
  { label: "Continua (EC)", value: "EC" as const, ne: 4 },
  { label: "Frecuente (EF)", value: "EF" as const, ne: 3 },
  { label: "Ocasional (EO)", value: "EO" as const, ne: 2 },
  { label: "Esporádica (EE)", value: "EE" as const, ne: 1 },
]
const NC_OPTIONS = [
  { label: "Mortal (M)", value: "M" as const, nc: 100 },
  { label: "Muy grave (MG)", value: "MG" as const, nc: 60 },
  { label: "Grave (G)", value: "G" as const, nc: 25 },
  { label: "Leve (L)", value: "L" as const, nc: 10 },
]

function calcNP(nd: number, ne: number) {
  return nd * ne
}
function interpretNP(np: number) {
  if (np >= 24) return "Muy Alto"
  if (np >= 10) return "Alto"
  if (np >= 6) return "Medio"
  if (np >= 2) return "Bajo"
  return "Sin valoración"
}
function calcNR(np: number, nc: number) {
  return np * nc
}
function classifyNR(nr: number) {
  if (nr >= 400) return "I"
  if (nr >= 150) return "II"
  if (nr >= 40) return "III"
  if (nr >= 20) return "IV"
  return ""
}
function interpretNR(level: string) {
  switch (level) {
    case "I":
      return "Situación crítica. Suspender actividades hasta controlar el riesgo. Intervención urgente."
    case "II":
      return "Corregir y adoptar medidas de control de inmediato."
    case "III":
      return "Mejorar si es posible. Justificar la intervención y su rentabilidad."
    case "IV":
      return "Mantener controles existentes. Considerar mejoras."
    default:
      return ""
  }
}
function aceptabilidad(level: string) {
  if (level === "I") return "No aceptable"
  if (level === "II") return "No aceptable o aceptable con control específico"
  if (level === "III") return "Aceptable"
  if (level === "IV") return "Aceptable"
  return ""
}

function nrLevelColor(level: string) {
  switch (level) {
    case "I":
      return "bg-green-600 text-white border-green-700"
    case "II":
      return "bg-yellow-400 text-white border-yellow-600"
    case "III":
      return "bg-orange-500 text-black border-orange-600"
    case "IV":
      return "bg-red-600 text-white border-red-700"
    default:
      return "bg-muted text-foreground border-border"
  }
}
function aceptabilidadColor(a: string) {
  const val = (a || "").toLowerCase()
  if (val.includes("no aceptable")) return "bg-red-600 text-white border-red-700"
  if (val.includes("control")) return "bg-orange-500 text-white border-orange-600"
  if (val.includes("aceptable")) return "bg-green-600 text-white border-green-700"
  return "bg-muted text-foreground border-border"
}
function npColor(np: number) {
  if (np >= 24) return "bg-red-600 text-white border-red-700"
  if (np >= 10) return "bg-orange-500 text-white border-orange-600"
  if (np >= 6) return "bg-yellow-400 text-black border-yellow-500"
  if (np >= 2) return "bg-green-600 text-white border-green-700"
  return "bg-muted text-foreground border-border"
}

type RiskProgressState = "CUMPLIDO" | "ACTIVO" | "VENCIDO"

function getRiskProgress(measures?: MeasureControl[]): {
  total: number
  done: number
  pct: number
  state: RiskProgressState
} {
  const safe = Array.isArray(measures) ? measures : []
  const total = safe.length
  const done = safe.filter((m) => m.status === "DONE").length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  const today = new Date()
  const overdue = safe.some((m) => {
    if (m.status !== "PENDING") return false
    if (m.type !== "DATE") return false
    if (!m.dueDate) return false
    const d = new Date(`${m.dueDate}T00:00:00`)
    return d < today
  })

  const state: RiskProgressState =
    pct === 100 ? "CUMPLIDO" : overdue ? "VENCIDO" : "ACTIVO"

  return { total, done, pct, state }
}

function progressChipColor(state: RiskProgressState) {
  switch (state) {
    case "CUMPLIDO":
      return "bg-green-600 text-white border-green-700"
    case "VENCIDO":
      return "bg-red-600 text-white border-red-700"
    case "ACTIVO":
    default:
      return "bg-blue-600 text-white border-blue-700"
  }
}

const steps = ["Contexto", "Peligro", "Controles", "Evaluación", "Medidas"]

const defaultMeasuresBase: Omit<MeasureControl, "id">[] = [
  {
    key: "ELIMINACION",
    title: "Eliminación",
    description: "",
    type: "PERMANENT",
    status: "PENDING",
  },
  {
    key: "SUSTITUCION",
    title: "Sustitución",
    description: "",
    type: "PERMANENT",
    status: "PENDING",
  },
  {
    key: "INGENIERIA",
    title: "Controles de ingeniería",
    description: "",
    type: "PERMANENT",
    status: "PENDING",
  },
  {
    key: "ADMINISTRATIVOS",
    title: "Controles administrativos / señalización / advertencia",
    description: "",
    type: "PERMANENT",
    status: "PENDING",
  },
  {
    key: "EPP",
    title: "Equipos y elementos de protección personal (EPP)",
    description: "",
    type: "PERMANENT",
    status: "PENDING",
  },
]

function makeDefaultMeasures(): MeasureControl[] {
  return defaultMeasuresBase.map((m) => ({
    id: crypto.randomUUID?.() ?? `${Date.now()}-${m.key}`,
    ...m,
  }))
}

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString()
  } catch {
    return iso
  }
}

function formatDate(yyyyMMdd: string) {
  try {
    const d = new Date(`${yyyyMMdd}T00:00:00`)
    return d.toLocaleDateString()
  } catch {
    return yyyyMMdd
  }
}

function todayYYYYMMDD() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/* =========================================================
   COMPONENTE
========================================================= */
export default function OcupationalPage() {
  const router = useRouter()

  /* ===== CAPACITACIONES ===== */
  const [trainings, setTrainings] = useState<Training[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("trainings")
      return stored ? JSON.parse(stored) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem("trainings", JSON.stringify(trainings))
  }, [trainings])

  const [yearFilter, setYearFilter] = useState("all")
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [trainingOpen, setTrainingOpen] = useState(false)

  const [newTraining, setNewTraining] = useState({
    title: "",
    date: "",
    time: "",
    responsible: "",
    description: "",
    status: "scheduled" as TrainingStatus,
  })

  const filteredTrainings = trainings.filter((t) => {
    const d = new Date(`${t.date}T${t.time}`)
    const year = d.getFullYear().toString()
    const month = (d.getMonth() + 1).toString().padStart(2, "0")

    return (
      (yearFilter === "all" || year === yearFilter) &&
      (monthFilter === "all" || month === monthFilter) &&
      (statusFilter === "all" || t.status === statusFilter)
    )
  })

  const years = Array.from(
    new Set(trainings.map((t) => new Date(t.date).getFullYear().toString()))
  )

  const isPastDateTime = () => {
    const selected = new Date(`${newTraining.date}T${newTraining.time}`)
    return selected < new Date()
  }

  /* ===== MATRIZ DE RIESGOS ===== */
  const [riskRows, setRiskRows] = useState<RiskRow[]>(() => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(LS_RISK_KEY)
const raw = stored ? (JSON.parse(stored) as any[]) : []

// Migración: si venían evidencias viejas sin performedAt/uploadedAt, las normalizamos.
    const normalizeEvidence = (e: any): Evidence => ({
      id: String(e?.id ?? crypto.randomUUID?.() ?? Date.now()),
      name: String(e?.name ?? "archivo"),
      mime: String(e?.mime ?? "application/octet-stream"),
      size: Number(e?.size ?? 0),
      dataUrl: String(e?.dataUrl ?? ""),
      performedAt: String(e?.performedAt ?? todayYYYYMMDD()),
      uploadedAt: String(e?.uploadedAt ?? e?.createdAt ?? new Date().toISOString()),
    })



return Array.isArray(raw)
  ? raw.map((r) => ({
      ...r,
      measures: Array.isArray(r.measures) ? r.measures : makeDefaultMeasures(),
      evidences: Array.isArray(r.evidences) ? r.evidences.map(normalizeEvidence) : [],
    }))
  : []
  })

  useEffect(() => {
    localStorage.setItem(LS_RISK_KEY, JSON.stringify(riskRows))
  }, [riskRows])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const [step, setStep] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [detailRow, setDetailRow] = useState<RiskRow | null>(null)

  // ===== Modal: Subir evidencia a un riesgo existente
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadRiskId, setUploadRiskId] = useState<string | null>(null)
  const [evidencePerformedAt, setEvidencePerformedAt] = useState<string>(todayYYYYMMDD())
  const [evidenceFiles, setEvidenceFiles] = useState<FileList | null>(null)

  const emptyForm: Omit<RiskRow, "id"> = {
    proceso: "",
    zonaLugar: "",
    actividades: "",
    tareas: "",
    rutinario: "SI",

    peligroClasificacion: "",
    peligroDescripcion: "",
    efectosPosibles: "",

    controlesFuente: "",
    controlesMedio: "",
    controlesPersona: "",

    ndKey: "B",
    neKey: "EE",
    ncKey: "L",

    np: 0,
    npInterpretacion: "",
    nr: 0,
    nrNivel: "",
    nrInterpretacion: "",
    aceptabilidad: "",

    numeroExpuestos: "",
    peorConsecuencia: "",
    requisitoLegal: "NO",

    measures: makeDefaultMeasures(),
    evidences: [],
  }

  const [riskForm, setRiskForm] = useState<Omit<RiskRow, "id">>(emptyForm)

  const peligroDescripcionOptions = useMemo(() => {
    if (!riskForm.peligroClasificacion) return []
    return PELIGROS[riskForm.peligroClasificacion] ?? []
  }, [riskForm.peligroClasificacion])

  useEffect(() => {
    const nd = ND_OPTIONS.find((x) => x.value === riskForm.ndKey)?.nd ?? 0
    const ne = NE_OPTIONS.find((x) => x.value === riskForm.neKey)?.ne ?? 0
    const nc = NC_OPTIONS.find((x) => x.value === riskForm.ncKey)?.nc ?? 0

    const np = calcNP(nd, ne)
    const npI = interpretNP(np)

    const nr = calcNR(np, nc)
    const nrNivel = classifyNR(nr)
    const nrI = interpretNR(nrNivel)
    const acep = aceptabilidad(nrNivel)

    setRiskForm((prev) => ({
      ...prev,
      np,
      npInterpretacion: npI,
      nr,
      nrNivel,
      nrInterpretacion: nrI,
      aceptabilidad: acep,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskForm.ndKey, riskForm.neKey, riskForm.ncKey])

  const stepValid = useMemo(() => {
    if (step === 1) {
      return (
        riskForm.proceso.trim() &&
        riskForm.zonaLugar.trim() &&
        riskForm.actividades.trim() &&
        riskForm.tareas.trim()
      )
    }
    if (step === 2) {
      return riskForm.peligroClasificacion && riskForm.peligroDescripcion
    }
    return true
  }, [step, riskForm])

  const canSaveRisk = useMemo(() => {
    return (
      riskForm.proceso.trim() &&
      riskForm.zonaLugar.trim() &&
      riskForm.actividades.trim() &&
      riskForm.tareas.trim() &&
      riskForm.peligroClasificacion &&
      riskForm.peligroDescripcion
    )
  }, [riskForm])

  function openNewRiskDrawer() {
    setEditingId(null)
    setRiskForm({
      ...emptyForm,
      measures: makeDefaultMeasures(),
      evidences: [],
    })
    setStep(1)
    setDrawerOpen(true)
  }

  function openEditRiskDrawer(row: RiskRow) {
    setEditingId(row.id)
    const { id, ...rest } = row
    setRiskForm(rest)
    setStep(1)
    setDrawerOpen(true)
  }

  function saveRiskRow() {
    if (!canSaveRisk) return

    if (editingId) {
      setRiskRows((prev) =>
        prev.map((r) => (r.id === editingId ? { id: editingId, ...riskForm } : r))
      )
    } else {
      setRiskRows((prev) => [...prev, { id: Date.now().toString(), ...riskForm }])
    }

    setDrawerOpen(false)
    setEditingId(null)
  }

  function deleteRiskRow(id: string) {
    setRiskRows((prev) => prev.filter((r) => r.id !== id))
  }

  function openDetail(row: RiskRow) {
    setDetailRow(row)
    setDetailOpen(true)
  }

  useEffect(() => {
    if (!detailOpen || !detailRow) return
    const updated = riskRows.find((r) => r.id === detailRow.id)
    if (updated) setDetailRow(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskRows])

  function updateMeasure(id: string, patch: Partial<MeasureControl>) {
    setRiskForm((p) => ({
      ...p,
      measures: p.measures.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }))
  }

  function readFileAsDataURL(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Evidencias dentro del wizard (cuando creas/edita)
  async function addEvidencesToForm(files: FileList | null, performedAt: string) {
    if (!files || files.length === 0) return

    const allowed = ["application/pdf"]
    const isImage = (m: string) => m.startsWith("image/")

    const list: Evidence[] = []
    for (const file of Array.from(files)) {
      if (!isImage(file.type) && !allowed.includes(file.type)) continue

      const dataUrl = await readFileAsDataURL(file)
      list.push({
        id: crypto.randomUUID?.() ?? `${Date.now()}-${file.name}`,
        name: file.name,
        mime: file.type,
        size: file.size,
        dataUrl,
        performedAt,
        uploadedAt: new Date().toISOString(),
      })
    }

    setRiskForm((p) => ({ ...p, evidences: [...p.evidences, ...list] }))
  }


  function removeEvidenceFromForm(id: string) {
    setRiskForm((p) => ({ ...p, evidences: p.evidences.filter((e) => e.id !== id) }))
  }

  // NUEVO: abrir modal “Subir evidencia” desde una card
  function openUploadEvidence(riskId: string) {
    setUploadRiskId(riskId)
    setEvidencePerformedAt(todayYYYYMMDD())
    setEvidenceFiles(null)
    setUploadOpen(true)
  }

  // NUEVO: guardar evidencias al riskRow existente
  async function commitUploadEvidence() {
    if (!uploadRiskId) return
    if (!evidenceFiles || evidenceFiles.length === 0) return
    if (!evidencePerformedAt) return

    const allowed = ["application/pdf"]
    const isImage = (m: string) => m.startsWith("image/")

    const list: Evidence[] = []
    for (const file of Array.from(evidenceFiles)) {
      if (!isImage(file.type) && !allowed.includes(file.type)) continue

      const dataUrl = await readFileAsDataURL(file)
      list.push({
        id: crypto.randomUUID?.() ?? `${Date.now()}-${file.name}`,
        name: file.name,
        mime: file.type,
        size: file.size,
        dataUrl,
        performedAt: evidencePerformedAt,
        uploadedAt: new Date().toISOString(),
      })
    }

    setRiskRows((prev) =>
      prev.map((r) =>
        r.id === uploadRiskId
          ? { ...r, evidences: [...(Array.isArray(r.evidences) ? r.evidences : []), ...list] }
          : r
      )
    )

    setUploadOpen(false)

    // Si el detalle está abierto en ese mismo riesgo, refrescamos visualmente
    if (detailOpen && detailRow?.id === uploadRiskId) {
      const updated = riskRows.find((rr) => rr.id === uploadRiskId)
      if (updated) setDetailRow(updated)
    }
  }

  const dashboard = useMemo(() => {
    const byLevel = { I: 0, II: 0, III: 0, IV: 0, NA: 0 }
    type RiskProgressState = "CUMPLIDO" | "ACTIVO" | "VENCIDO"

      const byState: Record<RiskProgressState, number> = {
        CUMPLIDO: 0,
        ACTIVO: 0,
        VENCIDO: 0,
      }
    for (const r of riskRows) {
      if (r.nrNivel === "I") byLevel.I++
      else if (r.nrNivel === "II") byLevel.II++
      else if (r.nrNivel === "III") byLevel.III++
      else if (r.nrNivel === "IV") byLevel.IV++
      else byLevel.NA++

      const pr = getRiskProgress(r.measures)
        byState[pr.state]++
    }

    return { byLevel, byState, total: riskRows.length }
  }, [riskRows])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Diagnóstico de Condiciones de Trabajo</h1>
          <p className="text-muted-foreground">
            SG-SST · Matriz de Peligros (Drawer) y Capacitaciones
          </p>
        </div>
      </div>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="risk" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Matriz de Peligros
          </TabsTrigger>
          {/* <TabsTrigger value="trainings">Capacitaciones</TabsTrigger> */}
        </TabsList>

        {/* ================= MATRIZ ================= */}
        <TabsContent value="risk" className="space-y-4">
          {/* Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold">Niveles de intervención</p>
                <div className="flex flex-wrap gap-2">
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor("I"))}>
                    I: {dashboard.byLevel.I}
                  </span>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor("II"))}>
                    II: {dashboard.byLevel.II}
                  </span>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor("III"))}>
                    III: {dashboard.byLevel.III}
                  </span>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor("IV"))}>
                    IV: {dashboard.byLevel.IV}
                  </span>
                  {dashboard.byLevel.NA ? (
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold bg-muted">
                      Sin nivel: {dashboard.byLevel.NA}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">Total riesgos: {dashboard.total}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold">Estado del proceso</p>
                <div className="flex flex-wrap gap-2">
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", progressChipColor("ACTIVO"))}>
                    Activos: {dashboard.byState.ACTIVO}
                  </span>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", progressChipColor("VENCIDO"))}>
                    Vencidos: {dashboard.byState.VENCIDO}
                  </span>
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", progressChipColor("CUMPLIDO"))}>
                    Cumplidos: {dashboard.byState.CUMPLIDO}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se calcula según avance de medidas (cumplido/pendiente) y fechas.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Cuadro de riesgos</h2>
              <p className="text-sm text-muted-foreground">
                Crea filas, adjunta evidencias y haz seguimiento del avance.
              </p>
            </div>

            <Button onClick={openNewRiskDrawer} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva fila de riesgo
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              {riskRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay filas registradas.</p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {riskRows.map((r) => {
                    const pr = getRiskProgress(r.measures)
                    return (
                      <Card key={r.id} className="border">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <p className="font-semibold">
                                {r.proceso} · {r.zonaLugar}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {r.actividades} / {r.tareas}
                              </p>
                            </div>

                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor(r.nrNivel))}>
                              Nivel {r.nrNivel || "—"}
                            </span>
                          </div>

                          <p className="text-sm">
                            <span className="font-medium">Peligro:</span>{" "}
                            {r.peligroClasificacion} — {r.peligroDescripcion}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", npColor(r.np))}>
                              NP: {r.np} · {r.npInterpretacion || "—"}
                            </span>

                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor(r.nrNivel))}>
                              NR: {r.nr || 0}
                            </span>

                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", aceptabilidadColor(r.aceptabilidad))}>
                              {r.aceptabilidad || "Aceptabilidad —"}
                            </span>

                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", progressChipColor(pr.state))}>
                              {pr.state === "CUMPLIDO" ? "Cumplido" : pr.state === "VENCIDO" ? "Vencido" : "Activo"} ·{" "}
                              {pr.pct}%
                            </span>

                            <span className="rounded-full border px-3 py-1 text-xs font-semibold bg-muted">
                              Evidencias: {r.evidences.length}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button size="sm" variant="secondary" onClick={() => openDetail(r)} className="gap-2">
                              <Eye className="h-4 w-4" />
                              Ver detalle
                            </Button>

                            <Button size="sm" variant="secondary" onClick={() => openEditRiskDrawer(r)} className="gap-2">
                              <Pencil className="h-4 w-4" />
                              Editar
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => openUploadEvidence(r.id)} className="gap-2">
                              <UploadCloud className="h-4 w-4" />
                              Subir evidencia
                            </Button>

                            <Button size="sm" variant="destructive" onClick={() => deleteRiskRow(r.id)} className="gap-2">
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                   )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
          {/* =========================================
              MODAL SUBIR EVIDENCIA (por riesgo)
          ========================================== */}
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Subir evidencia</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <p className="text-sm mb-1">Fecha de realización</p>
                  <Input
                    type="date"
                    value={evidencePerformedAt}
                    onChange={(e) => setEvidencePerformedAt(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta es la fecha en que se ejecutó la actividad / se generó la evidencia.
                  </p>
                </div>

                <div>
                  <p className="text-sm mb-1">Archivos (fotos / PDF)</p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => setEvidenceFiles(e.target.files)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setUploadOpen(false)}
                >
                  Cancelar
                </Button>

                <Button
                  disabled={!uploadRiskId || !evidencePerformedAt || !evidenceFiles || evidenceFiles.length === 0}
                  onClick={commitUploadEvidence}
                >
                  Subir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Drawer Crear/Editar */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader className="space-y-2">
                <SheetTitle>
                  {editingId ? "Editar fila · Matriz de Peligros" : "Nueva fila · Matriz de Peligros"}
                </SheetTitle>

                <div className="flex flex-wrap gap-2">
                  {steps.map((s, i) => {
                    const idx = i + 1
                    const active = idx === step
                    const done = idx < step
                    return (
                      <div
                        key={s}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs",
                          active && "bg-primary text-primary-foreground",
                          done && "bg-muted"
                        )}
                      >
                        {idx}. {s}
                      </div>
                    )
                  })}
                </div>

                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor(riskForm.nrNivel))}>
                        NR: {riskForm.nr} · Nivel {riskForm.nrNivel || "—"}
                      </span>
                      <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", npColor(riskForm.np))}>
                        NP: {riskForm.np} · {riskForm.npInterpretacion || "—"}
                      </span>
                      <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", aceptabilidadColor(riskForm.aceptabilidad))}>
                        {riskForm.aceptabilidad || "Aceptabilidad —"}
                      </span>
                    </div>

                    {riskForm.nrInterpretacion ? (
                      <p className="text-xs text-muted-foreground">{riskForm.nrInterpretacion}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </SheetHeader>

              <div className="py-4 space-y-4">
                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Proceso"
                      value={riskForm.proceso}
                      onChange={(e) => setRiskForm((p) => ({ ...p, proceso: e.target.value }))}
                    />
                    <Input
                      placeholder="Zona / Lugar"
                      value={riskForm.zonaLugar}
                      onChange={(e) => setRiskForm((p) => ({ ...p, zonaLugar: e.target.value }))}
                    />
                    <Input
                      placeholder="Actividades"
                      value={riskForm.actividades}
                      onChange={(e) => setRiskForm((p) => ({ ...p, actividades: e.target.value }))}
                    />
                    <Input
                      placeholder="Tareas"
                      value={riskForm.tareas}
                      onChange={(e) => setRiskForm((p) => ({ ...p, tareas: e.target.value }))}
                    />
                    <div>
                      <p className="text-sm mb-1">¿Rutinario?</p>
                      <Select
                        value={riskForm.rutinario}
                        onValueChange={(v) => setRiskForm((p) => ({ ...p, rutinario: v as YesNo }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rutinario" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SI">SI</SelectItem>
                          <SelectItem value="NO">NO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm mb-1">Clasificación del peligro</p>
                      <Select
                        value={riskForm.peligroClasificacion}
                        onValueChange={(v) =>
                          setRiskForm((p) => ({ ...p, peligroClasificacion: v, peligroDescripcion: "" }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona clasificación" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {Object.keys(PELIGROS).map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-sm mb-1">Descripción del peligro</p>
                      <Select
                        value={riskForm.peligroDescripcion}
                        onValueChange={(v) => setRiskForm((p) => ({ ...p, peligroDescripcion: v }))}
                        disabled={!riskForm.peligroClasificacion}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona descripción" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          {peligroDescripcionOptions.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Textarea
                      placeholder="Efectos posibles"
                      value={riskForm.efectosPosibles}
                      onChange={(e) => setRiskForm((p) => ({ ...p, efectosPosibles: e.target.value }))}
                      className="resize-none min-h-28"
                    />
                  </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Controles existentes - Fuente"
                      value={riskForm.controlesFuente}
                      onChange={(e) => setRiskForm((p) => ({ ...p, controlesFuente: e.target.value }))}
                    />
                    <Input
                      placeholder="Controles existentes - Medio"
                      value={riskForm.controlesMedio}
                      onChange={(e) => setRiskForm((p) => ({ ...p, controlesMedio: e.target.value }))}
                    />
                    <Input
                      placeholder="Controles existentes - Persona"
                      value={riskForm.controlesPersona}
                      onChange={(e) => setRiskForm((p) => ({ ...p, controlesPersona: e.target.value }))}
                    />
                  </div>
                )}

                {/* STEP 4 */}
                {step === 4 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm mb-1">ND (Deficiencia)</p>
                      <Select
                        value={riskForm.ndKey}
                        onValueChange={(v) => setRiskForm((p) => ({ ...p, ndKey: v as RiskRow["ndKey"] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="ND" />
                        </SelectTrigger>
                        <SelectContent>
                          {ND_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-sm mb-1">NE (Exposición)</p>
                      <Select
                        value={riskForm.neKey}
                        onValueChange={(v) => setRiskForm((p) => ({ ...p, neKey: v as RiskRow["neKey"] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="NE" />
                        </SelectTrigger>
                        <SelectContent>
                          {NE_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <p className="text-sm mb-1">NC (Consecuencia)</p>
                      <Select
                        value={riskForm.ncKey}
                        onValueChange={(v) => setRiskForm((p) => ({ ...p, ncKey: v as RiskRow["ncKey"] }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="NC" />
                        </SelectTrigger>
                        <SelectContent>
                          {NC_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p className="text-xs text-muted-foreground">NP = ND×NE · NR = NP×NC</p>
                        <div className="flex flex-wrap gap-2">
                          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", npColor(riskForm.np))}>
                            NP {riskForm.np} · {riskForm.npInterpretacion || "—"}
                          </span>
                          <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor(riskForm.nrNivel))}>
                            NR {riskForm.nr} · Nivel {riskForm.nrNivel || "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* STEP 5 */}
                {step === 5 && (
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="font-semibold text-sm">Criterios</p>
                        <Input
                          placeholder="Número de expuestos"
                          value={riskForm.numeroExpuestos}
                          onChange={(e) => setRiskForm((p) => ({ ...p, numeroExpuestos: e.target.value }))}
                        />
                        <Input
                          placeholder="Peor consecuencia"
                          value={riskForm.peorConsecuencia}
                          onChange={(e) => setRiskForm((p) => ({ ...p, peorConsecuencia: e.target.value }))}
                        />
                        <div>
                          <p className="text-sm mb-1">Requisito legal específico</p>
                          <Select
                            value={riskForm.requisitoLegal}
                            onValueChange={(v) => setRiskForm((p) => ({ ...p, requisitoLegal: v as YesNo }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Requisito legal" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SI">SI</SelectItem>
                              <SelectItem value="NO">NO</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="font-semibold text-sm">Medidas de intervención</p>

                        <div className="space-y-3">
                          {riskForm.measures.map((m) => (
                            <div key={m.id} className="rounded-md border p-3 space-y-3">
                              <p className="text-sm font-medium">{m.title}</p>

                              <Textarea
                                placeholder={`Describe la medida (${m.title})`}
                                value={m.description}
                                onChange={(e) => updateMeasure(m.id, { description: e.target.value })}
                                className="resize-none min-h-20"
                              />

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                                  <Select
                                    value={m.type}
                                    onValueChange={(v) => {
                                      if (v === "PERMANENT") {
                                        updateMeasure(m.id, { type: "PERMANENT", dueDate: undefined })
                                      } else {
                                        updateMeasure(m.id, { type: "DATE" })
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="DATE">Por fecha</SelectItem>
                                      <SelectItem value="PERMANENT">Permanente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Fecha (si aplica)</p>
                                  <Input
                                    type="date"
                                    disabled={m.type !== "DATE"}
                                    value={m.dueDate ?? ""}
                                    onChange={(e) => updateMeasure(m.id, { dueDate: e.target.value })}
                                  />
                                </div>

                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Estado</p>
                                  <Select
                                    value={m.status}
                                    onValueChange={(v) => {
                                      if (v === "DONE") {
                                        updateMeasure(m.id, {
                                          status: "DONE",
                                          doneDate: new Date().toISOString().slice(0, 10),
                                        })
                                      } else {
                                        updateMeasure(m.id, { status: "PENDING", doneDate: undefined })
                                      }
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Estado" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">Pendiente</SelectItem>
                                      <SelectItem value="DONE">Cumplido</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {m.status === "DONE" && m.doneDate ? (
                                <p className="text-xs text-muted-foreground">Marcado como cumplido el {m.doneDate}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="font-semibold text-sm">Evidencias (fotos / PDF)</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fecha de realización</p>
                            <Input
                              type="date"
                              value={evidencePerformedAt}
                              onChange={(e) => setEvidencePerformedAt(e.target.value)}
                            />
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Archivos</p>
                            <Input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              onChange={(e) => addEvidencesToForm(e.target.files, evidencePerformedAt)}
                            />
                          </div>
                        </div>

                        {riskForm.evidences.length === 0 ? (
                          <p className="text-xs text-muted-foreground">Aún no hay evidencias.</p>
                        ) : (
                          <div className="space-y-2">
                            {riskForm.evidences.map((ev) => (
                              <div key={ev.id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{ev.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    Realización: {formatDate(ev.performedAt)} · Subida: {formatDateTime(ev.uploadedAt)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="secondary" onClick={() => window.open(ev.dataUrl, "_blank")}>
                                    Ver
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => removeEvidenceFromForm(ev.id)}>
                                    Quitar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <SheetFooter className="gap-2 sm:gap-2">
                <div className="flex w-full items-center justify-between gap-2">
                  <Button variant="secondary" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>
                    Atrás
                  </Button>

                  <div className="flex gap-2">
                    {step < 5 ? (
                      <Button disabled={!stepValid} onClick={() => setStep((s) => Math.min(5, s + 1))}>
                        Siguiente
                      </Button>
                    ) : (
                      <Button disabled={!canSaveRisk} onClick={saveRiskRow}>
                        {editingId ? "Guardar cambios" : "Guardar fila"}
                      </Button>
                    )}
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Drawer Detalle solo lectura + timeline evidencias */}
          <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader className="space-y-2">
                <SheetTitle>Detalle del riesgo</SheetTitle>

                {detailRow ? (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", nrLevelColor(detailRow.nrNivel))}>
                          NR: {detailRow.nr} · Nivel {detailRow.nrNivel || "—"}
                        </span>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", npColor(detailRow.np))}>
                          NP: {detailRow.np} · {detailRow.npInterpretacion || "—"}
                        </span>
                        <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", aceptabilidadColor(detailRow.aceptabilidad))}>
                          {detailRow.aceptabilidad || "Aceptabilidad —"}
                        </span>
                        {(() => {
                          const pr = getRiskProgress(detailRow.measures)
                          return (
                            <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", progressChipColor(pr.state))}>
                              {pr.state === "CUMPLIDO" ? "Cumplido" : pr.state === "VENCIDO" ? "Vencido" : "Activo"} ·{" "}
                              {pr.pct}%
                            </span>
                          )
                        })()}
                      </div>

                      {detailRow.nrInterpretacion ? (
                        <p className="text-xs text-muted-foreground">{detailRow.nrInterpretacion}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : null}
              </SheetHeader>

              <div className="py-4 space-y-4">
                {detailRow ? (
                  <>
                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p className="font-semibold">Contexto</p>
                        <p className="text-sm">
                          <span className="font-medium">Proceso:</span> {detailRow.proceso}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Zona/Lugar:</span> {detailRow.zonaLugar}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Actividad/Tarea:</span> {detailRow.actividades} / {detailRow.tareas}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Rutinario:</span> {detailRow.rutinario}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p className="font-semibold">Peligro</p>
                        <p className="text-sm">
                          <span className="font-medium">Clasificación:</span> {detailRow.peligroClasificacion}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Descripción:</span> {detailRow.peligroDescripcion}
                        </p>
                        {detailRow.efectosPosibles ? (
                          <p className="text-sm">
                            <span className="font-medium">Efectos posibles:</span> {detailRow.efectosPosibles}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-2">
                        <p className="font-semibold">Medidas de intervención</p>
                        <div className="space-y-2">
                          {detailRow.measures.map((m) => (
                            <div key={m.id} className="rounded-md border p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">{m.title}</p>
                                <Badge variant="outline">{m.status === "DONE" ? "Cumplido" : "Pendiente"}</Badge>
                              </div>

                              <p className="text-sm text-muted-foreground">{m.description || "—"}</p>

                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full border px-3 py-1 text-xs bg-muted">
                                  Tipo: {m.type === "PERMANENT" ? "Permanente" : "Por fecha"}
                                </span>
                                {m.type === "DATE" ? (
                                  <span className="rounded-full border px-3 py-1 text-xs bg-muted">
                                    Fecha: {m.dueDate || "—"}
                                  </span>
                                ) : null}
                                {m.status === "DONE" && m.doneDate ? (
                                  <span className="rounded-full border px-3 py-1 text-xs bg-muted">
                                    Cumplido: {m.doneDate}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="font-semibold">Evidencias (timeline)</p>

                        {detailRow.evidences.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Sin evidencias.</p>
                        ) : (
                          <div className="space-y-3">
                            {[...detailRow.evidences]
                              .sort((a, b) => {
                                // Orden principal por fecha de realización, y luego por subida
                                const pa = a.performedAt ?? "0000-00-00"
                                const pb = b.performedAt ?? "0000-00-00"
                                if (pa !== pb) return pa < pb ? 1 : -1
                                return (a.uploadedAt ?? "") < (b.uploadedAt ?? "") ? 1 : -1
                              })
                              .map((ev) => (
                                <div key={ev.id} className="flex gap-3">
                                  <div className="flex flex-col items-center">
                                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                    <div className="w-px flex-1 bg-border" />
                                  </div>

                                  <div className="flex-1 rounded-md border p-3">
                                    <p className="text-xs text-muted-foreground">
                                      Realización: {formatDate(ev.performedAt)} · Subida: {formatDateTime(ev.uploadedAt)}
                                    </p>
                                    <p className="text-sm font-medium">{ev.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {ev.mime} · {(ev.size / 1024).toFixed(0)} KB
                                    </p>

                                    <div className="pt-2">
                                      <Button size="sm" variant="secondary" onClick={() => window.open(ev.dataUrl, "_blank")}>
                                        Ver evidencia
                                      </Button>
                                    </div>

                                    {ev.mime.startsWith("image/") ? (
                                      <div className="pt-3">
                                        <img src={ev.dataUrl} alt={ev.name} className="w-full rounded-md border object-cover" />
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay detalle para mostrar.</p>
                )}
              </div>

              <SheetFooter className="gap-2 sm:gap-2">
                <div className="flex w-full items-center justify-between gap-2">
                  <Button variant="secondary" onClick={() => setDetailOpen(false)}>
                    Cerrar
                  </Button>

                  <div className="flex gap-2">
                    {detailRow ? (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => openUploadEvidence(detailRow.id)}
                          className="gap-2"
                        >
                          <UploadCloud className="h-4 w-4" />
                          Subir evidencia
                        </Button>

                        <Button
                          variant="secondary"
                          onClick={() => {
                            setDetailOpen(false)
                            openEditRiskDrawer(detailRow)
                          }}
                          className="gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </TabsContent>
      </Tabs>
    </div>
  )
}