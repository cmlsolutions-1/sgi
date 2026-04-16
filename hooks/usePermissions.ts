// hooks/usePermissions.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { listPermissions } from "@/services/permissionService"
import type { Permission } from "@/types/manager/permission"
import { toast } from "sonner"

export function usePermissions(autoFetch = true) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPermissions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listPermissions()
      setPermissions(data)
    } catch (err: any) {
      setError(err.message ?? "Error al cargar permisos")
      toast.error(err.message ?? "Error al cargar permisos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoFetch) {
      fetchPermissions()
    }
  }, [autoFetch, fetchPermissions])

  // Agrupar permisos por módulo (basado en el key)
  const groupedPermissions = useCallback(() => {
    const groups: Record<string, Permission[]> = {}
    
    permissions.forEach((perm) => {
      const moduleKey = perm.key?.split(".")[0] || "OTROS"
      const moduleName = moduleKey.toUpperCase()
      
      if (!groups[moduleName]) {
        groups[moduleName] = []
      }
      groups[moduleName].push(perm)
    })
    
    return groups
  }, [permissions])

  const getPermissionById = useCallback((id: string): Permission | undefined => {
    return permissions.find((p) => p.id === id)
  }, [permissions])

  return {
    permissions,
    groupedPermissions: groupedPermissions(),
    loading,
    error,
    fetchPermissions,
    getPermissionById,
  }
}