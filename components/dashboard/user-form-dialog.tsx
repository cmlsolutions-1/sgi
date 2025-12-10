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
import {
  roles,
  departments,
  typeContract,
  type User,
  type Role,
} from "@/lib/mock-data";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";

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
      status: "active",
      createdAt: new Date().toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
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
        status: "active",
      });
    }
  };

  const [showPassword, setShowPassword] = useState(false);

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
              <Label htmlFor="name">Compañia</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre de la compañía"
                className="bg-secondary border-border"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de Usuario</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nombre de usuario"
                className="bg-secondary border-border"
                required
              />
            </div>
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

          <div className="space-y-2 relative">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="crea contraseña"
                className="bg-secondary border-border pr-10"
                required
              />
              {/* Botón para mostrar/ocultar */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <Label htmlFor="createdAt">Fecha de creación</Label>
              <Input
                id="createdAt"
                type="text"
                value={formData.createdAt}
                readOnly
                className="bg-secondary border-border text-gray-500 cursor-not-allowed"
              />
            </div>
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
