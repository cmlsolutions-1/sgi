"use client"

import { useEffect, useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useModuleAccess } from "@/components/auth/ModuleAccessProvider"
import { Button } from "@/components/ui/button"
import { getFirstAllowedNavigationHref, isDashboardPathAllowed } from "@/components/dashboard/navigation"

export default function ModuleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { modules, loading, error, refresh } = useModuleAccess()

  const allowed = useMemo(() => isDashboardPathAllowed(pathname, modules), [pathname, modules])
  const fallbackHref = useMemo(() => getFirstAllowedNavigationHref(modules), [modules])

  useEffect(() => {
    if (loading || error || allowed) return

    router.replace(fallbackHref)
  }, [allowed, fallbackHref, loading, error, router])

  if (error) return <div role="alert" className="space-y-3 p-4 text-sm"><p>No se pudieron verificar tus módulos autorizados.</p><Button variant="outline" onClick={() => void refresh()}>Reintentar</Button></div>

  if (loading || !allowed) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p>Cargando...</p>
      </div>
    )
  }

  return <>{children}</>
}
