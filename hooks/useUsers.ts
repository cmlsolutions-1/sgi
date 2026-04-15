// hooks/useUsers.ts
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/services/userService";
import type { User, CreateUserDto, UpdateUserDto } from "@/types/manager/user";
import { toast } from "sonner";

export function useUsers(autoFetch = true) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message ?? "Error al cargar usuarios");
      toast.error(err.message ?? "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchUsers();
    }
  }, [autoFetch, fetchUsers]);

  const createUserHandler = useCallback(async (dto: CreateUserDto): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await createUser(dto);
      setUsers((prev) => [...prev, newUser]);
      toast.success("Usuario creado exitosamente");
      return newUser;
    } catch (err: any) {
      setError(err.message ?? "Error al crear usuario");
      toast.error(err.message ?? "Error al crear usuario");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserHandler = useCallback(async (id: string, dto: UpdateUserDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await updateUser(id, dto);
      await fetchUsers();
      toast.success("Usuario actualizado exitosamente");
      return true;
    } catch (err: any) {
      setError(err.message ?? "Error al actualizar usuario");
      toast.error(err.message ?? "Error al actualizar usuario");
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUserHandler = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Usuario eliminado exitosamente");
      return true;
    } catch (err: any) {
      setError(err.message ?? "Error al eliminar usuario");
      toast.error(err.message ?? "Error al eliminar usuario");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser: createUserHandler,
    updateUser: updateUserHandler,
    deleteUser: deleteUserHandler,
  };
}