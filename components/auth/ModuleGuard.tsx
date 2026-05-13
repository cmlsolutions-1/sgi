"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getMyModules } from "@/services/modulesService"
import { useAuthStore } from "@/store/auth.store"
import { getFirstAllowedNavigationHref, isDashboardPathAllowed } from "@/components/dashboard/navigation"

export default function ModuleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const accessToken = useAuthStore((s) => s.accessToken)
  const modules = useAuthStore((s) => s.modules)
  const setModules = useAuthStore((s) => s.setModules)
  const [loading, setLoading] = useState(modules.length === 0)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }

    if (modules.length > 0) {
      setLoading(false)
      return
    }

    let active = true

    getMyModules()
      .then((userModules) => {
        if (!active) return
        setModules(userModules)
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [accessToken, modules.length, setModules])

  const allowed = useMemo(() => isDashboardPathAllowed(pathname, modules), [pathname, modules])
  const fallbackHref = useMemo(() => getFirstAllowedNavigationHref(modules), [modules])

  useEffect(() => {
    if (loading || allowed) return

    router.replace(fallbackHref)
  }, [allowed, fallbackHref, loading, router])

  if (loading || !allowed) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return <>{children}</>
}
