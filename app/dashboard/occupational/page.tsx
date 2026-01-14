// app/dashboard/occupational/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Eye, ClipboardList } from "lucide-react"

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

// ✅ Drawer lateral (Sheet en shadcn)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

/* =========================================================
   1) CAPACITACIONES (lo que ya tenías)
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
   2) MATRIZ DE RIESGOS (catálogos + cálculos + colores)
   - Hecho tipo app: Drawer lateral + wizard (pasos)
========================================================= */

type YesNo = "SI" | "NO"

type RiskRow = {
  id: string

  // Contexto
  proceso: string
  zonaLugar: string
  actividades: string
  tareas: string
  rutinario: YesNo

  // Peligro
  peligroClasificacion: string
  peligroDescripcion: string
  efectosPosibles: string

  // Controles existentes
  controlesFuente: string
  controlesMedio: string
  controlesPersona: string

  // Evaluación
  ndKey: "MA" | "A" | "M" | "B"
  neKey: "EC" | "EF" | "EO" | "EE"
  ncKey: "M" | "MG" | "G" | "L"

  np: number
  npInterpretacion: string

  nr: number
  nrNivel: string
  nrInterpretacion: string
  aceptabilidad: string

  // Criterios
  numeroExpuestos: string
  peorConsecuencia: string
  requisitoLegal: YesNo

  // Medidas
  eliminacion: string
  sustitucion: string
  controlesIngenieria: string
  controlesAdministrativos: string
  epp: string
}

const LS_RISK_KEY = "risk_matrix_rows_v1"

/** Catálogo (desde tu Excel) */
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
  { label: "Bajo (B)", value: "B" as const, nd: 0 }, // en Excel “sin valor” => aquí lo tratamos 0
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
  // Ajustable si tu Excel tiene umbrales diferentes
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

/** Colores (Tailwind) para chips/semáforo */
function nrLevelColor(level: string) {
  switch (level) {
    case "I":
      return "bg-red-600 text-white border-red-700"
    case "II":
      return "bg-orange-500 text-white border-orange-600"
    case "III":
      return "bg-yellow-400 text-black border-yellow-500"
    case "IV":
      return "bg-green-600 text-white border-green-700"
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

const steps = ["Contexto", "Peligro", "Controles", "Evaluación", "Medidas"]

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */
export default function OcupationalPage() {
  const router = useRouter()

  /* ============  CAPACITACIONES  ============ */
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

  /* ============  MATRIZ DE RIESGOS  ============ */
  const [riskRows, setRiskRows] = useState<RiskRow[]>(() => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(LS_RISK_KEY)
    return stored ? JSON.parse(stored) : []
  })
  useEffect(() => {
    localStorage.setItem(LS_RISK_KEY, JSON.stringify(riskRows))
  }, [riskRows])

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [step, setStep] = useState(1)

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

    eliminacion: "",
    sustitucion: "",
    controlesIngenieria: "",
    controlesAdministrativos: "",
    epp: "",
  }

  const [riskForm, setRiskForm] = useState<Omit<RiskRow, "id">>(emptyForm)

  const peligroDescripcionOptions = useMemo(() => {
    if (!riskForm.peligroClasificacion) return []
    return PELIGROS[riskForm.peligroClasificacion] ?? []
  }, [riskForm.peligroClasificacion])

  // Recalcular automáticamente NP/NR al cambiar ND/NE/NC
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

  // Validación por pasos (para que el wizard sea fluido)
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
    if (step === 3) {
      // Controles: no obligatorios en todos los formatos, lo dejamos libre
      return true
    }
    if (step === 4) {
      // Evaluación siempre tendrá algo; ND/NE/NC tienen defaults
      return true
    }
    if (step === 5) {
      return true
    }
    return false
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
    setRiskForm(emptyForm)
    setStep(1)
    setDrawerOpen(true)
  }

  function saveRiskRow() {
    if (!canSaveRisk) return
    setRiskRows((prev) => [
      ...prev,
      { id: Date.now().toString(), ...riskForm },
    ])
    setDrawerOpen(false)
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">
            Diagnóstico de Condiciones de Trabajo
          </h1>
          <p className="text-muted-foreground">
            SG-SST · Capacitaciones y Matriz de Peligros (UI tipo app)
          </p>
        </div>
      </div>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="risk" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Matriz de Peligros
          </TabsTrigger>
          <TabsTrigger value="trainings">Capacitaciones</TabsTrigger>
        </TabsList>

        {/* =========================================================
            TAB: MATRIZ DE PELIGROS
        ========================================================= */}
        <TabsContent value="risk" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold">Cuadro de riesgos</h2>
              <p className="text-sm text-muted-foreground">
                Crear filas con Drawer lateral (wizard) y semáforo de resultados.
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
                <p className="text-sm text-muted-foreground">
                  Aún no hay filas registradas.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {riskRows.map((r) => (
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

                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              nrLevelColor(r.nrNivel)
                            )}
                          >
                            Nivel {r.nrNivel || "—"}
                          </span>
                        </div>

                        <p className="text-sm">
                          <span className="font-medium">Peligro:</span>{" "}
                          {r.peligroClasificacion} — {r.peligroDescripcion}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              npColor(r.np)
                            )}
                          >
                            NP: {r.np} · {r.npInterpretacion || "—"}
                          </span>

                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              nrLevelColor(r.nrNivel)
                            )}
                          >
                            NR: {r.nr || 0}
                          </span>

                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              aceptabilidadColor(r.aceptabilidad)
                            )}
                          >
                            {r.aceptabilidad || "Aceptabilidad —"}
                          </span>
                        </div>

                        {r.nrInterpretacion ? (
                          <p className="text-xs text-muted-foreground">
                            {r.nrInterpretacion}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drawer lateral (Sheet) */}
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
              <SheetHeader className="space-y-2">
                <SheetTitle>Nueva fila · Matriz de Peligros</SheetTitle>

                {/* Steps */}
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

                {/* Resultado (siempre visible) */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          nrLevelColor(riskForm.nrNivel)
                        )}
                      >
                        NR: {riskForm.nr} · Nivel {riskForm.nrNivel || "—"}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          npColor(riskForm.np)
                        )}
                      >
                        NP: {riskForm.np} · {riskForm.npInterpretacion || "—"}
                      </span>

                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          aceptabilidadColor(riskForm.aceptabilidad)
                        )}
                      >
                        {riskForm.aceptabilidad || "Aceptabilidad —"}
                      </span>
                    </div>

                    {riskForm.nrInterpretacion ? (
                      <p className="text-xs text-muted-foreground">
                        {riskForm.nrInterpretacion}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </SheetHeader>

              <div className="py-4 space-y-4">
                {/* ======================
                    STEP 1 — CONTEXTO
                ====================== */}
                {step === 1 && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Proceso"
                      value={riskForm.proceso}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, proceso: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Zona / Lugar"
                      value={riskForm.zonaLugar}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, zonaLugar: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Actividades"
                      value={riskForm.actividades}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, actividades: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Tareas"
                      value={riskForm.tareas}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, tareas: e.target.value }))
                      }
                    />

                    <div>
                      <p className="text-sm mb-1">¿Rutinario?</p>
                      <Select
                        value={riskForm.rutinario}
                        onValueChange={(v) =>
                          setRiskForm((p) => ({ ...p, rutinario: v as YesNo }))
                        }
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

                {/* ======================
                    STEP 2 — PELIGRO
                ====================== */}
                {step === 2 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm mb-1">Clasificación del peligro</p>
                      <Select
                        value={riskForm.peligroClasificacion}
                        onValueChange={(v) =>
                          setRiskForm((p) => ({
                            ...p,
                            peligroClasificacion: v,
                            peligroDescripcion: "",
                          }))
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
                        onValueChange={(v) =>
                          setRiskForm((p) => ({ ...p, peligroDescripcion: v }))
                        }
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
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, efectosPosibles: e.target.value }))
                      }
                      className="resize-none min-h-28"
                    />
                  </div>
                )}

                {/* ======================
                    STEP 3 — CONTROLES
                ====================== */}
                {step === 3 && (
                  <div className="space-y-3">
                    <Input
                      placeholder="Controles existentes - Fuente"
                      value={riskForm.controlesFuente}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, controlesFuente: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Controles existentes - Medio"
                      value={riskForm.controlesMedio}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, controlesMedio: e.target.value }))
                      }
                    />
                    <Input
                      placeholder="Controles existentes - Persona"
                      value={riskForm.controlesPersona}
                      onChange={(e) =>
                        setRiskForm((p) => ({ ...p, controlesPersona: e.target.value }))
                      }
                    />
                  </div>
                )}

                {/* ======================
                    STEP 4 — EVALUACIÓN
                ====================== */}
                {step === 4 && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm mb-1">ND (Deficiencia)</p>
                      <Select
                        value={riskForm.ndKey}
                        onValueChange={(v) =>
                          setRiskForm((p) => ({ ...p, ndKey: v as RiskRow["ndKey"] }))
                        }
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
                        onValueChange={(v) =>
                          setRiskForm((p) => ({ ...p, neKey: v as RiskRow["neKey"] }))
                        }
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
                        onValueChange={(v) =>
                          setRiskForm((p) => ({ ...p, ncKey: v as RiskRow["ncKey"] }))
                        }
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
                        <p className="text-xs text-muted-foreground">
                          Cálculo automático (Excel): NP = ND×NE · NR = NP×NC
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              npColor(riskForm.np)
                            )}
                          >
                            NP {riskForm.np} · {riskForm.npInterpretacion || "—"}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              nrLevelColor(riskForm.nrNivel)
                            )}
                          >
                            NR {riskForm.nr} · Nivel {riskForm.nrNivel || "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ======================
                    STEP 5 — MEDIDAS + CRITERIOS
                ====================== */}
                {step === 5 && (
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <p className="font-semibold text-sm">Criterios</p>

                        <Input
                          placeholder="Número de expuestos"
                          value={riskForm.numeroExpuestos}
                          onChange={(e) =>
                            setRiskForm((p) => ({ ...p, numeroExpuestos: e.target.value }))
                          }
                        />
                        <Input
                          placeholder="Peor consecuencia"
                          value={riskForm.peorConsecuencia}
                          onChange={(e) =>
                            setRiskForm((p) => ({ ...p, peorConsecuencia: e.target.value }))
                          }
                        />

                        <div>
                          <p className="text-sm mb-1">Requisito legal específico</p>
                          <Select
                            value={riskForm.requisitoLegal}
                            onValueChange={(v) =>
                              setRiskForm((p) => ({ ...p, requisitoLegal: v as YesNo }))
                            }
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

                        <Textarea
                          placeholder="Eliminación"
                          value={riskForm.eliminacion}
                          onChange={(e) =>
                            setRiskForm((p) => ({ ...p, eliminacion: e.target.value }))
                          }
                          className="resize-none min-h-20"
                        />
                        <Textarea
                          placeholder="Sustitución"
                          value={riskForm.sustitucion}
                          onChange={(e) =>
                            setRiskForm((p) => ({ ...p, sustitucion: e.target.value }))
                          }
                          className="resize-none min-h-20"
                        />
                        <Textarea
                          placeholder="Controles de ingeniería"
                          value={riskForm.controlesIngenieria}
                          onChange={(e) =>
                            setRiskForm((p) => ({
                              ...p,
                              controlesIngenieria: e.target.value,
                            }))
                          }
                          className="resize-none min-h-20"
                        />
                        <Textarea
                          placeholder="Controles administrativos / señalización / advertencia"
                          value={riskForm.controlesAdministrativos}
                          onChange={(e) =>
                            setRiskForm((p) => ({
                              ...p,
                              controlesAdministrativos: e.target.value,
                            }))
                          }
                          className="resize-none min-h-20"
                        />
                        <Textarea
                          placeholder="EPP"
                          value={riskForm.epp}
                          onChange={(e) =>
                            setRiskForm((p) => ({ ...p, epp: e.target.value }))
                          }
                          className="resize-none min-h-20"
                        />
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              <SheetFooter className="gap-2 sm:gap-2">
                <div className="flex w-full items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    disabled={step === 1}
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                  >
                    Atrás
                  </Button>

                  <div className="flex gap-2">
                    {step < 5 ? (
                      <Button
                        disabled={!stepValid}
                        onClick={() => setStep((s) => Math.min(5, s + 1))}
                      >
                        Siguiente
                      </Button>
                    ) : (
                      <Button disabled={!canSaveRisk} onClick={saveRiskRow}>
                        Guardar fila
                      </Button>
                    )}
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </TabsContent>

        {/* =========================================================
            TAB: CAPACITACIONES (tu código original)
        ========================================================= */}
        <TabsContent value="trainings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Capacitaciones</h2>
              <p className="text-sm text-muted-foreground">
                Gestión de capacitaciones (mock/localStorage)
              </p>
            </div>

            <Button onClick={() => setTrainingOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Capacitación
            </Button>
          </div>

          {/* FILTROS */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold">Filtrar por</h3>

              <div className="flex gap-4 flex-wrap">
                {/* AÑO */}
                <div>
                  <p className="text-sm mb-1">Año</p>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {years.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* MES */}
                <div>
                  <p className="text-sm mb-1">Mes</p>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Mes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {months.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ESTADO */}
                <div>
                  <p className="text-sm mb-1">Estado</p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="completed">Realizadas</SelectItem>
                      <SelectItem value="scheduled">No realizadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LISTA */}
          <div className="space-y-4">
            {filteredTrainings.map((t) => (
              <Card
                key={t.id}
                className={cn(
                  "border-l-4",
                  t.status === "completed" ? "border-l-green-600" : "border-l-red-600"
                )}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{t.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t.date} – {t.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Responsable: {t.responsible}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        t.status === "completed"
                          ? "text-green-600 border-green-600"
                          : "text-red-600 border-red-600"
                      }
                    >
                      {t.status === "completed" ? "Realizada" : "No realizada"}
                    </Badge>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => router.push(`/dashboard/trainingPlan/${t.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver detalle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* MODAL NUEVA CAPACITACIÓN */}
          <Dialog open={trainingOpen} onOpenChange={setTrainingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Capacitación</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                <Input
                  placeholder="Tema"
                  value={newTraining.title}
                  onChange={(e) =>
                    setNewTraining({ ...newTraining, title: e.target.value })
                  }
                />

                <Input
                  type="date"
                  value={newTraining.date}
                  onChange={(e) =>
                    setNewTraining({ ...newTraining, date: e.target.value })
                  }
                />

                <Select
                  value={newTraining.time}
                  onValueChange={(value) =>
                    setNewTraining({ ...newTraining, time: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hora de la capacitación" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Responsable"
                  value={newTraining.responsible}
                  onChange={(e) =>
                    setNewTraining({ ...newTraining, responsible: e.target.value })
                  }
                />

                <Textarea
                  placeholder="Descripción de la capacitación"
                  value={newTraining.description}
                  onChange={(e) =>
                    setNewTraining({
                      ...newTraining,
                      description: e.target.value,
                    })
                  }
                  className="resize-none h-28 max-h-40 overflow-y-auto"
                />
              </div>

              <DialogFooter>
                <Button
                  disabled={
                    !newTraining.title ||
                    !newTraining.date ||
                    !newTraining.time ||
                    isPastDateTime()
                  }
                  onClick={() => {
                    setTrainings([
                      ...trainings,
                      {
                        id: Date.now().toString(),
                        ...newTraining,
                      },
                    ])
                    setTrainingOpen(false)
                    setNewTraining({
                      title: "",
                      date: "",
                      time: "",
                      responsible: "",
                      description: "",
                      status: "scheduled",
                    })
                  }}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
