// components/dashboard/sgi-responsible-form-dialog.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, FileText } from "lucide-react";
import { Employee } from "@/lib/mock-data";

// Define la interfaz para el archivo subido
interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

// Define la interfaz para los datos del responsable del SGI
export interface SgiResponsibleData {
  employeeId: string;
  responsibleName: string;
  responsibleId: string;
  company: string;
  certifications: string[];
  signatureDate: string;
  signedDocument: UploadedFile | null;
}

interface SgiResponsibleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  onSave: (data: SgiResponsibleData) => void;
}

export function SgiResponsibleFormDialog({
  open,
  onOpenChange,
  employee,
  onSave,
}: SgiResponsibleFormDialogProps) {
  const [formData, setFormData] = useState({
    responsibleName: employee.name + " " + employee.lastName,
    responsibleId: employee.document,
    company: "Tech Solutions S.A.S", // Puedes cambiarlo por el nombre de la empresa del empleado
    certifications: employee.certifications?.join(", ") || "",
    signatureDate: "",
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualiza el nombre y cédula cuando cambia el empleado
  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        responsibleName: employee.name + " " + employee.lastName,
        responsibleId: employee.document,
        certifications: employee.certifications?.join(", ") || "",
      }));
    }
  }, [employee, open]);

  const handleDownloadTemplate = () => {
    // Simular descarga de plantilla
    // En una implementación real, aquí generarías el PDF con los datos
    alert(`Descargando plantilla para ${formData.responsibleName}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular la subida del archivo
    // En una implementación real, aquí enviarías el archivo al servidor
    const fileUrl = file ? URL.createObjectURL(file) : null;

    // Verificar si file no es null antes de acceder a sus propiedades
    const signedDocument = file ? {
      name: file.name,
      url: fileUrl!,
      size: file.size,
      type: file.type,
    } : null;

    const responsibleData: SgiResponsibleData = {
      employeeId: employee.id,
      responsibleName: formData.responsibleName,
      responsibleId: formData.responsibleId,
      company: formData.company,
      certifications: formData.certifications.split(", ").filter(cert => cert.trim() !== ""),
      signatureDate: formData.signatureDate,
      signedDocument,
    };

    onSave(responsibleData);
    setIsSubmitting(false);
    onOpenChange(false);
    setFormData({
      responsibleName: employee.name + " " + employee.lastName,
      responsibleId: employee.document,
      company: "Tech Solutions S.A.S",
      certifications: employee.certifications?.join(", ") || "",
      signatureDate: "",
    });
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asignar Responsable del SGI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleName">Nombre del Responsable</Label>
              <Input
                id="responsibleName"
                value={formData.responsibleName}
                onChange={(e) =>
                  setFormData({ ...formData, responsibleName: e.target.value })
                }
                placeholder="Nombre completo"
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsibleId">Cédula del Responsable</Label>
              <Input
                id="responsibleId"
                value={formData.responsibleId}
                onChange={(e) =>
                  setFormData({ ...formData, responsibleId: e.target.value })
                }
                placeholder="Número de identificación"
                className="bg-secondary border-border"
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Nombre de la empresa"
                className="bg-secondary border-border"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certifications">Certificaciones Requeridas</Label>
            <Textarea
              id="certifications"
              value={formData.certifications}
              onChange={(e) =>
                setFormData({ ...formData, certifications: e.target.value })
              }
              placeholder="Lista de certificaciones requeridas, separadas por coma"
              className="bg-secondary border-border min-h-20"
              required
            />
            <div className="flex flex-wrap gap-1 mt-1">
              {formData.certifications.split(",").filter(cert => cert.trim() !== "").map((cert, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {cert.trim()}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatureDate">Fecha de Firma del Acta</Label>
            <Input
              id="signatureDate"
              type="date"
              value={formData.signatureDate}
              onChange={(e) =>
                setFormData({ ...formData, signatureDate: e.target.value })
              }
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signedDocument">Documento Firmado</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  id="signedDocument"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="bg-secondary border-border"
                />
                <Button type="button" variant="outline" size="icon" onClick={handleDownloadTemplate}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                  <span>({(file.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
              
              {uploadedFile && !file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{uploadedFile.name}</span>
                  <span>({(uploadedFile.size / 1024).toFixed(2)} KB)</span>
                </div>
              )}
            </div>
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