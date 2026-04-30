// hooks/useUsers.ts
"use client"

import { useState, useCallback, useEffect } from "react"
import {
  getCompanyAdmin,
  createCompanyAdmin,
  updateUser,
  deleteUser,
} from "@/services/userService"
import type {
  User,
  CreateCompanyAdminDto,
  UpdateUserDto,
} from "@/types/manager/user"
import { toast } from "sonner"

export function useUsers(companyId?: string, autoFetch = true) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ✅ LIMPIAR USUARIOS AL CAMBIAR DE EMPRESA
  // Esto asegura que no queden datos "stale" de la empresa anterior
  useEffect(() => {
    setUsers([])
    setError(null)
  }, [companyId])

  const fetchUsers = useCallback(async () => {
    if (!companyId) {
      setUsers([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const adminUser = await getCompanyAdmin(companyId)
      setUsers([adminUser])
    } catch (err: any) {
      // Si no hay admin (404), lista vacía
      if (err.message?.includes("404") || err.message?.includes("not found")) {
        setUsers([])
      } else {
        setError(err.message ?? "Error al cargar usuarios")
        toast.error(err.message ?? "Error al cargar usuarios")
        // ✅ Limpiar usuarios en error para no mostrar datos viejos
        setUsers([])
      }
    } finally {
      setLoading(false)
    }
  }, [companyId])

  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
  }, [autoFetch, fetchUsers])

  const createUserHandler = useCallback(
    async (dto: CreateCompanyAdminDto): Promise<User | null> => {
      if (!companyId) {
        toast.error("No hay empresa seleccionada")
        return null
      }

      setLoading(true)
      setError(null)
      try {
        const response = await createCompanyAdmin(companyId, dto)

        const newUser: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          phone: response.user.phone,
          description: "",
          status: "ACTIVE",
          companyId: response.company.id,
          roles: [response.role],
        }

        setUsers([newUser])
        toast.success("Usuario creado exitosamente")
        return newUser
      } catch (err: any) {
        setError(err.message ?? "Error al crear usuario")
        toast.error(err.message ?? "Error al crear usuario")
        return null
      } finally {
        setLoading(false)
      }
    },
    [companyId]
  )

  const updateUserHandler = useCallback(
    async (id: string, dto: UpdateUserDto): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        await updateUser(id, dto)
        await fetchUsers()
        toast.success("Usuario actualizado exitosamente")
        return true
      } catch (err: any) {
        setError(err.message ?? "Error al actualizar usuario")
        toast.error(err.message ?? "Error al actualizar usuario")
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchUsers]
  )

  const deleteUserHandler = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      await deleteUser(id)
      setUsers([])
      toast.success("Usuario eliminado exitosamente")
      return true
    } catch (err: any) {
      setError(err.message ?? "Error al eliminar usuario")
      toast.error(err.message ?? "Error al eliminar usuario")
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser: createUserHandler,
    updateUser: updateUserHandler,
    deleteUser: deleteUserHandler,
  }
}