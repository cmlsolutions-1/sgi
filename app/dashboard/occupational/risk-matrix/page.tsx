"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"

import { PELIGROS, ND_OPTIONS, NE_OPTIONS, NC_OPTIONS } from "@/lib/riskMatrix/constants"
import { aceptabilidad, calcNP, calcNR, classifyNR, interpretNP, interpretNR } from "@/lib/riskMatrix/calc"

type YesNo = "SI" | "NO"

export type RiskRow = {
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

  ndKey: string
  neKey: string
  ncKey: string

  np: number
  npInterpretacion: string

  nr: number
  nrNivel: string
  nrInterpretacion: string
  aceptabilidad: string

  numeroExpuestos: string
  peorConsecuencia: string
  requisitoLegal: YesNo

  eliminacion: string
  sustitucion: string
  controlesIngenieria: string
  controlesAdministrativos: string
  epp: string
}

const LS_KEY = "risk_matrix_rows_v1"

export default function RiskMatrixPage() {
  const [rows, setRows] = useState<RiskRow[]>(() => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(LS_KEY)
    return stored ? JSON.parse(stored) : []
  })

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(rows))
  }, [rows])

  const [open, setOpen] = useState(false)

  const [form, setForm] = useState<Omit<RiskRow, "id">>({
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
  })

  const peligroDescripcionOptions = useMemo(() => {
    if (!form.peligroClasificacion) return []
    return PELIGROS[form.peligroClasificacion] ?? []
  }, [form.peligroClasificacion])

  // recalcular NP/NR cada vez que cambien ND/NE/NC
  useEffect(() => {
    const nd = ND_OPTIONS.find((x) => x.value === form.ndKey)?.nd ?? 0
    const ne = NE_OPTIONS.find((x) => x.value === form.neKey)?.ne ?? 0
    const nc = NC_OPTIONS.find((x) => x.value === form.ncKey)?.nc ?? 0

    const np = calcNP(nd, ne)
    const npI = interpretNP(np)

    const nr = calcNR(np, nc)
    const nrNivel = classifyNR(nr)
    const nrI = interpretNR(nrNivel)
    const acep = aceptabilidad(nrNivel)

    setForm((prev) => ({
      ...prev,
      np,
      npInterpretacion: npI,
      nr,
      nrNivel,
      nrInterpretacion: nrI,
      aceptabilidad: acep,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.ndKey, form.neKey, form.ncKey])

  const canSave =
    form.proceso.trim() &&
    form.zonaLugar.trim() &&
    form.actividades.trim() &&
    form.tareas.trim() &&
    form.peligroClasificacion &&
    form.peligroDescripcion

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Matriz de Peligros | Cuadro de Riesgos</h1>
          <p className="text-muted-foreground">
            Diligenciamiento tipo Excel, con cálculos automáticos (NP/NR).
          </p>
        </div>

        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nueva fila de riesgo
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay filas. Crea la primera con “Nueva fila de riesgo”.
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <p className="font-semibold">
                        {r.proceso} — {r.zonaLugar}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.actividades} / {r.tareas}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Peligro:</span> {r.peligroClasificacion} — {r.peligroDescripcion}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">NP:</span> {r.np} ({r.npInterpretacion}) ·{" "}
                        <span className="font-medium">NR:</span> {r.nr} ({r.nrNivel})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.aceptabilidad || "—"}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nueva fila | Cuadro de Riesgos</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Proceso"
              value={form.proceso}
              onChange={(e) => setForm((p) => ({ ...p, proceso: e.target.value }))}
            />
            <Input
              placeholder="Zona / Lugar"
              value={form.zonaLugar}
              onChange={(e) => setForm((p) => ({ ...p, zonaLugar: e.target.value }))}
            />
            <Input
              placeholder="Actividades"
              value={form.actividades}
              onChange={(e) => setForm((p) => ({ ...p, actividades: e.target.value }))}
            />
            <Input
              placeholder="Tareas"
              value={form.tareas}
              onChange={(e) => setForm((p) => ({ ...p, tareas: e.target.value }))}
            />

            <div>
              <p className="text-sm mb-1">Rutinario</p>
              <Select
                value={form.rutinario}
                onValueChange={(v) => setForm((p) => ({ ...p, rutinario: v as YesNo }))}
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

            <div />

            <div>
              <p className="text-sm mb-1">Clasificación del peligro</p>
              <Select
                value={form.peligroClasificacion}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    peligroClasificacion: v,
                    peligroDescripcion: "", // reset dependiente
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona clasificación" />
                </SelectTrigger>
                <SelectContent>
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
                value={form.peligroDescripcion}
                onValueChange={(v) => setForm((p) => ({ ...p, peligroDescripcion: v }))}
                disabled={!form.peligroClasificacion}
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
              className="md:col-span-2"
              placeholder="Efectos posibles"
              value={form.efectosPosibles}
              onChange={(e) => setForm((p) => ({ ...p, efectosPosibles: e.target.value }))}
            />

            <Input
              placeholder="Controles existentes - Fuente"
              value={form.controlesFuente}
              onChange={(e) => setForm((p) => ({ ...p, controlesFuente: e.target.value }))}
            />
            <Input
              placeholder="Controles existentes - Medio"
              value={form.controlesMedio}
              onChange={(e) => setForm((p) => ({ ...p, controlesMedio: e.target.value }))}
            />
            <Input
              placeholder="Controles existentes - Persona"
              value={form.controlesPersona}
              onChange={(e) => setForm((p) => ({ ...p, controlesPersona: e.target.value }))}
            />

            <div>
              <p className="text-sm mb-1">ND (Deficiencia)</p>
              <Select value={form.ndKey} onValueChange={(v) => setForm((p) => ({ ...p, ndKey: v }))}>
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
              <Select value={form.neKey} onValueChange={(v) => setForm((p) => ({ ...p, neKey: v }))}>
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
              <Select value={form.ncKey} onValueChange={(v) => setForm((p) => ({ ...p, ncKey: v }))}>
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

            <Card className="md:col-span-2">
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">NP (ND x NE)</p>
                  <p className="font-semibold">{form.np}</p>
                  <p className="text-sm text-muted-foreground">{form.npInterpretacion}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">NR (NP x NC)</p>
                  <p className="font-semibold">{form.nr}</p>
                  <p className="text-sm text-muted-foreground">{form.nrNivel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Aceptabilidad</p>
                  <p className="font-semibold">{form.aceptabilidad || "—"}</p>
                </div>
                <div className="md:col-span-3">
                  <p className="text-xs text-muted-foreground">Interpretación NR</p>
                  <p className="text-sm">{form.nrInterpretacion}</p>
                </div>
              </CardContent>
            </Card>

            <Input
              placeholder="Criterios - Número de expuestos"
              value={form.numeroExpuestos}
              onChange={(e) => setForm((p) => ({ ...p, numeroExpuestos: e.target.value }))}
            />
            <Input
              placeholder="Criterios - Peor consecuencia"
              value={form.peorConsecuencia}
              onChange={(e) => setForm((p) => ({ ...p, peorConsecuencia: e.target.value }))}
            />

            <div>
              <p className="text-sm mb-1">Requisito legal específico</p>
              <Select
                value={form.requisitoLegal}
                onValueChange={(v) => setForm((p) => ({ ...p, requisitoLegal: v as YesNo }))}
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

            <Textarea
              placeholder="Medidas - Eliminación"
              value={form.eliminacion}
              onChange={(e) => setForm((p) => ({ ...p, eliminacion: e.target.value }))}
            />
            <Textarea
              placeholder="Medidas - Sustitución"
              value={form.sustitucion}
              onChange={(e) => setForm((p) => ({ ...p, sustitucion: e.target.value }))}
            />
            <Textarea
              placeholder="Medidas - Controles de ingeniería"
              value={form.controlesIngenieria}
              onChange={(e) => setForm((p) => ({ ...p, controlesIngenieria: e.target.value }))}
            />
            <Textarea
              placeholder="Medidas - Controles administrativos / señalización / advertencia"
              value={form.controlesAdministrativos}
              onChange={(e) => setForm((p) => ({ ...p, controlesAdministrativos: e.target.value }))}
            />
            <Textarea
              placeholder="Medidas - Equipos y elementos de protección personal (EPP)"
              value={form.epp}
              onChange={(e) => setForm((p) => ({ ...p, epp: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button
              disabled={!canSave}
              onClick={() => {
                setRows((prev) => [
                  ...prev,
                  { id: Date.now().toString(), ...form },
                ])
                setOpen(false)
              }}
            >
              Guardar fila
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
