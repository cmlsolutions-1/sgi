// components/dashboard/social-security-form-dialog.tsx
"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SocialSecurityContribution, type SocialSecurityType } from "@/lib/mock-data";
import { Upload } from "lucide-react";

interface SocialSecurityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: SocialSecurityType;
  onSave: (contribution: SocialSecurityContribution) => void;
  employeeId: string;
}

export function SocialSecurityFormDialog({
  open,
  onOpenChange,
  type,
  onSave,
  employeeId,
}: SocialSecurityFormDialogProps) {
  const [formData, setFormData] = useState({
    entityName: "",
    startDate: "",
    endDate: "",
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular la subida del archivo
    // En una implementación real, aquí enviarías el archivo al servidor
    const fileUrl = file ? URL.createObjectURL(file) : null;

    const newContribution: SocialSecurityContribution = {
      id: `ss-${Date.now()}`,
      employeeId,
      type,
      entityName: formData.entityName,
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      status: true,
    };

    // Aquí puedes agregar la lógica para subir el archivo y obtener una URL real
    // newContribution.fileUrl = await uploadFile(file);

    onSave(newContribution);
    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({ entityName: "", startDate: "", endDate: "" });
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const getDialogTitle = () => {
    switch (type) {
      case "EPS": return "Agregar Entidad Promotora de Salud";
      case "ARL": return "Agregar Administradora de Riesgos Laborales";
      case "PENSION": return "Agregar Fondo de Pensiones";
      case "CAJA_COMPENSACION": return "Agregar Caja de Compensación";
      default: return "Agregar Contribución";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="entityName">Nombre de la Entidad</Label>
            <Input
              id="entityName"
              value={formData.entityName}
              onChange={(e) =>
                setFormData({ ...formData, entityName: e.target.value })
              }
              placeholder="Ingrese el nombre de la entidad"
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin (Opcional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="bg-secondary border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Documento (PDF, JPG, PNG)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="bg-secondary border-border"
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                Archivo seleccionado: {file.name}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}