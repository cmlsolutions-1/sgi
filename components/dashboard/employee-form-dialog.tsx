"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { typeContract, type Employee } from "@/lib/mock-data";
import { Plus, Pencil } from "lucide-react";

interface EmployeeFormDialogProps {
  employee?: Employee;
  onSave: (employee: Partial<Employee>) => void;
  trigger?: React.ReactNode;
}

export function EmployeeFormDialog({ employee, onSave, trigger }: EmployeeFormDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Ajustamos los valores por defecto según el modelo de Employee
  const [formData, setFormData] = useState<Partial<Employee>>(
    employee || {
      id: "",
      name: "",
      lastName: "",
      document: "",
      companyId: "comp-001", // Valor por defecto, puedes cambiarlo
      userId: "", // Este campo probablemente deba ser seleccionable de los usuarios existentes
      jobId: "", // Este campo probablemente deba ser seleccionable de los jobs existentes
      workAreId: "", // Este campo probablemente deba ser seleccionable de las áreas existentes
      entryDate: new Date().toISOString().split("T")[0], // Fecha actual por defecto
      typeContract: "Término indefinido", // Valor por defecto
      status: true, // Booleano por defecto
      position: "",
      department: "",
      phone: "",
      hireDate: new Date().toISOString().split("T")[0],
      birthDate: "",
      address: "",
      education: "",
      certifications: [],
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si es un nuevo empleado, generamos un ID único
    const employeeToSave = {
      ...formData,
      id: employee?.id || `emp-${Date.now()}`, // Generamos un ID único para el empleado
    };
    
    onSave(employeeToSave);
    setOpen(false);
    
    // Reiniciar el formulario después de guardar un nuevo empleado
    if (!employee) {
      setFormData({
        id: "",
        name: "",
        lastName: "",
        document: "",
        companyId: "comp-001",
        userId: "",
        jobId: "",
        workAreId: "",
        entryDate: new Date().toISOString().split("T")[0],
        typeContract: "Término indefinido",
        status: true,
        position: "",
        department: "",
        phone: "",
        hireDate: new Date().toISOString().split("T")[0],
        birthDate: "",
        address: "",
        education: "",
        certifications: [],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Empleado
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle>{employee ? "Editar Empleado" : "Crear Empleado"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="document">Documento</Label>
              <Input
                id="document"
                value={formData.document}
                onChange={(e) =>
                  setFormData({ ...formData, document: e.target.value })
                }
                placeholder="Número de documento"
                className="bg-secondary border-border"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre del empleado"
                className="bg-secondary border-border"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                placeholder="Apellido del empleado"
                className="bg-secondary border-border"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position || ""}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                placeholder="Cargo del empleado"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Información Adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Teléfono de contacto"
                className="bg-secondary border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hireDate">Fecha de Ingreso</Label>
              <Input
                id="hireDate"
                type="date"
                value={formData.hireDate || formData.entryDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, hireDate: e.target.value, entryDate: e.target.value })
                }
                className="bg-secondary border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                className="bg-secondary border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Dirección del empleado"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Selecciones */}
          <div className="grid grid-cols-6 md:grid-cols-3 lg:grid-cols-3 gap-3">

          <div className="space-y-2">
              <Label htmlFor="jobId">Cargo/Posición</Label>
              <Select
                value={formData.jobId}
                onValueChange={(value) =>
                  setFormData({ ...formData, jobId: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {/* Aquí deberías mapear los jobs disponibles */}
                  <SelectItem value="job-001">Desarrollador Full Stack</SelectItem>
                  <SelectItem value="job-002">Analista de Calidad</SelectItem>
                  {/* Agrega más opciones según tus datos reales */}
                </SelectContent>
              </Select>
            </div>
          
          <div className="space-y-2">
              <Label htmlFor="typeContract">Tipo de Contrato</Label>
              <Select
                value={formData.typeContract || "Término indefinido"}
                onValueChange={(value) =>
                  setFormData({ ...formData, typeContract: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeContract.map((contract) => (
                    <SelectItem key={contract} value={contract}>
                      {contract}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            

            

            <div className="space-y-2">
              <Label htmlFor="workAreId">Área de Trabajo</Label>
              <Select
                value={formData.workAreId}
                onValueChange={(value) =>
                  setFormData({ ...formData, workAreId: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {/* Aquí deberías mapear las áreas disponibles */}
                  <SelectItem value="area-001">Desarrollo de Software</SelectItem>
                  <SelectItem value="area-002">Calidad</SelectItem>
                  {/* Agrega más opciones según tus datos reales */}
                </SelectContent>
              </Select>
            </div>

            
          </div>

          {/* Estado */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4">

          <div className="space-y-2">
              <Label htmlFor="userId">Usuario Asociado</Label>
              <Select
                value={formData.userId}
                onValueChange={(value) =>
                  setFormData({ ...formData, userId: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {/* Aquí deberías mapear los usuarios disponibles */}
                  <SelectItem value="usr-123">Usuario 1</SelectItem>
                  <SelectItem value="usr-124">Usuario 2</SelectItem>
                  {/* Agrega más opciones según tus datos reales */}
                </SelectContent>
              </Select>
            </div>
            
          

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status !== undefined ? formData.status.toString() : "true"}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value === "true" })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Educación</Label>
              <Input
                id="education"
                value={formData.education || ""}
                onChange={(e) =>
                  setFormData({ ...formData, education: e.target.value })
                }
                placeholder="Nivel educativo"
                className="bg-secondary border-border"
              />
            </div>
          </div>

          {/* Certificaciones */}
          <div className="space-y-2">
            <Label htmlFor="certifications">Certificaciones (separadas por coma)</Label>
            <Input
              id="certifications"
              value={formData.certifications ? formData.certifications.join(", ") : ""}
              onChange={(e) => {
                const certs = e.target.value.split(",").map(cert => cert.trim()).filter(cert => cert);
                setFormData({ ...formData, certifications: certs });
              }}
              placeholder="Certificado 1, Certificado 2, etc."
              className="bg-secondary border-border"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {employee ? "Guardar Cambios" : "Crear Empleado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditEmployeeButton({
  employee,
  onSave,
}: {
  employee: Employee;
  onSave: (employee: Partial<Employee>) => void;
}) {
  return (
    <EmployeeFormDialog
      employee={employee}
      onSave={onSave}
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}