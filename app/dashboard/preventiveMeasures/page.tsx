"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, Search, Clock, XCircle, CheckCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  getPreventiveMeasures,
  upsertPreventiveMeasure,
  type PreventiveMeasure,
} from "@/lib/preventive-measures-storage";

import {
  getPreventiveProceduresFilled,
  type PreventiveProcedureFilled,
} from "@/lib/preventive-procedure-storage";

const statusConfig = {
  open: { icon: XCircle, color: "text-destructive", label: "Abierto" },
  "in-progress": { icon: Clock, color: "text-warning", label: "En Progreso" },
  closed: { icon: CheckCircle, color: "text-accent", label: "Cerrado" },
};

export default function PreventiveMeasuresPage() {
  const [measures, setMeasures] = useState<PreventiveMeasure[]>([]);
  const [procedures, setProcedures] = useState<PreventiveProcedureFilled[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedProcedureId, setSelectedProcedureId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [dueDateISO, setDueDateISO] = useState("");

  useEffect(() => {
    setMeasures(getPreventiveMeasures());
    setProcedures(getPreventiveProceduresFilled());
  }, []);

  const filtered = useMemo(() => {
    return measures.filter((m) => {
      const matchesSearch =
        m.description.toLowerCase().includes(search.toLowerCase()) ||
        m.department.toLowerCase().includes(search.toLowerCase()) ||
        m.workArea.toLowerCase().includes(search.toLowerCase()) ||
        m.procedureTitle.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [measures, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: measures.length,
      open: measures.filter((m) => m.status === "open").length,
      inProgress: measures.filter((m) => m.status === "in-progress").length,
      closed: measures.filter((m) => m.status === "closed").length,
    };
  }, [measures]);

  const createMeasure = () => {
    const proc = procedures.find((p) => p.id === selectedProcedureId);
    if (!proc) return alert("Selecciona un procedimiento diligenciado.");
    if (!description.trim())
      return alert("Escribe la descripción de la medida.");
    if (!dueDateISO) return alert("Selecciona una fecha límite.");

    const payload: PreventiveMeasure = {
      id: crypto.randomUUID(),
      procedureFilledId: proc.id,
      procedureTitle:
        proc.procedureName || "Procedimiento - Medidas de Prevención",
      department: proc.department,
      workArea: proc.workArea,

      description: description.trim(),
      dueDateISO,
      status: "open",

      evidences: [],
      createdAtISO: new Date().toISOString(),
    };

    upsertPreventiveMeasure(payload);
    setMeasures(getPreventiveMeasures());

    // reset modal
    setSelectedProcedureId("");
    setDescription("");
    setDueDateISO("");
    setOpenModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Medidas de Prevención
          </h1>
          <p className="text-muted-foreground">
            Crea medidas basadas en procedimientos diligenciados y sube
            evidencias
          </p>
        </div>

        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Medida
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Medida de Prevención</DialogTitle>
            </DialogHeader>

            {procedures.length === 0 ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>No hay procedimientos diligenciados del Estándar 7.</p>
                <p>
                  Ve a <strong>Documentos</strong> →{" "}
                  <strong>Procedimiento - Medidas de Prevención</strong> →
                  <strong> Diligenciar Procedimiento</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Procedimiento diligenciado *
                  </label>
                  <Select
                    value={selectedProcedureId}
                    onValueChange={setSelectedProcedureId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecciona un procedimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedures.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.department} • {p.workArea}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    La medida quedará trazable al procedimiento seleccionado.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Descripción de la medida *
                  </label>
                  <Input
                    className="mt-1"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Implementar señalización en zona de químicos..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Fecha límite *</label>
                  <Input
                    className="mt-1"
                    type="date"
                    value={dueDateISO}
                    onChange={(e) => setDueDateISO(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setOpenModal(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createMeasure}>Crear</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Medidas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Abiertas</p>
            <p className="text-2xl font-bold text-destructive">{stats.open}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">En Progreso</p>
            <p className="text-2xl font-bold text-warning">
              {stats.inProgress}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Cerradas</p>
            <p className="text-2xl font-bold text-accent">{stats.closed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por medida, área o departamento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary border-0"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-secondary border-0">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in-progress">En Progreso</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No hay medidas que coincidan con los filtros. Crea una nueva
              medida para empezar.
            </CardContent>
          </Card>
        ) : (
          filtered.map((m) => {
            const s = statusConfig[m.status];
            const StatusIcon = s.icon;

            return (
              <Card
                key={m.id}
                className="bg-card border-border hover:border-primary/50 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn("text-xs", s.color)}
                        >
                          {s.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {m.department}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {m.workArea}
                        </span>
                      </div>

                      <p className="text-sm font-medium">{m.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Basada en: {m.procedureTitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("h-4 w-4", s.color)} />
                      <Badge variant="secondary" className="text-xs">
                        {s.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Fecha límite: {m.dueDateISO}
                    </span>

                    <Link href={`/dashboard/preventiveMeasures/${m.id}`}>
                      <Button variant="outline" size="sm">
                        Ver Detalles / Evidencias
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
