"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { getMyModules } from "@/services/modulesService"
import { useAuthStore, type ModuleNode } from "@/store/auth.store"

type ModuleAccess = { modules: ModuleNode[]; loading: boolean; error: string | null; refresh: () => Promise<void> }
const ModuleAccessContext = createContext<ModuleAccess | null>(null)

export function ModuleAccessProvider({ children }: { children: ReactNode }) {
  const token = useAuthStore(state => state.accessToken)
  const setModules = useAuthStore(state => state.setModules)
  const pathname = usePathname()
  const [modules, setVerifiedModules] = useState<ModuleNode[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sequence = useRef(0)
  const pending = useRef<{ token: string; request: number; promise: Promise<void> } | null>(null)
  const mounted = useRef(true)

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; sequence.current++; pending.current = null } }, [])

  const refresh = useCallback(async () => {
    if (!token) return
    if (pending.current?.token === token) return pending.current.promise
    const request = ++sequence.current
    const promise = (async () => {
      try {
        const current = await getMyModules()
        if (!mounted.current || request !== sequence.current) return
        setVerifiedModules(current); setModules(current); setError(null)
      } catch (error) {
        if (!mounted.current || request !== sequence.current) return
        setVerifiedModules([]); setModules([])
        setError(error instanceof Error ? error.message : "No se pudieron verificar los módulos autorizados")
      } finally { if (pending.current?.request === request) pending.current = null }
    })()
    pending.current = { token, request, promise }
    return promise
  }, [token, setModules])

  useEffect(() => { void refresh() }, [refresh, pathname])
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") void refresh() }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onFocus)
    const interval = window.setInterval(onFocus, 60000)
    return () => { window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); clearInterval(interval) }
  }, [refresh])

  return <ModuleAccessContext.Provider value={{ modules: modules ?? [], loading: modules === null, error, refresh }}>{children}</ModuleAccessContext.Provider>
}

export function useModuleAccess() {
  const context = useContext(ModuleAccessContext)
  if (!context) throw new Error("useModuleAccess requiere ModuleAccessProvider")
  return context
}
