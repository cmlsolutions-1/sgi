// hooks/useRoles.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { listRoles } from "@/services/roleService"
import type { Role } from "@/types/manager/role"
import { toast } from "sonner"

export function useRoles(autoFetch = true) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listRoles()
      setRoles(data)
    } catch (err: any) {
      setError(err.message ?? "Error al cargar roles")
      toast.error(err.message ?? "Error al cargar roles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchRoles()
    }
  }, [autoFetch, fetchRoles])

  const getRoleById = useCallback((id: string): Role | undefined => {
    return roles.find((r) => r.id === id)
  }, [roles])

  const getRoleByName = useCallback((name: string): Role | undefined => {
    return roles.find((r) => r.name.toLowerCase() === name.toLowerCase())
  }, [roles])

  const getActiveRoles = useCallback((): Role[] => {
    return roles.filter((r) => r.status === "ACTIVE")
  }, [roles])

  return {
    roles,
    activeRoles: getActiveRoles(),
    loading,
    error,
    fetchRoles,
    getRoleById,
    getRoleByName,
  }
}