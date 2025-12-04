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
import { roles, departments, type User, type Role } from "@/lib/mock-data";
import { Plus, Pencil } from "lucide-react";

interface UserFormDialogProps {
  user?: User;
  onSave: (user: Partial<User>) => void;
  trigger?: React.ReactNode;
}

export function UserFormDialog({ user, onSave, trigger }: UserFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(
    user || {
      name: "",
      email: "",
      role: "empleado",
      department: "",
      status: "active",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: user?.id || crypto.randomUUID(),
      createdAt: user?.createdAt || new Date().toISOString().split("T")[0],
    });
    setOpen(false);
    if (!user) {
      setFormData({
        name: "",
        email: "",
        role: "empleado",
        department: "",
        status: "active",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre del usuario"
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Apellido</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Apellido del usuario"
                className="bg-secondary border-border"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cedula </Label>
            <Input
              id="id"
              name="id"
              value={formData.id}
              placeholder="Cedula del usuario"
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="correo@ejemplo.com"
              className="bg-secondary border-border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: Role) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
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
              {user ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EditUserButton({
  user,
  onSave,
}: {
  user: User;
  onSave: (user: Partial<User>) => void;
}) {
  return (
    <UserFormDialog
      user={user}
      onSave={onSave}
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
  );
}
