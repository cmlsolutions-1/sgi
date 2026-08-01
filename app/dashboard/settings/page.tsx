"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Bell,
  Check,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  MessageCircle,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  applySgiPreferences,
  defaultSgiPreferences,
  readSgiPreferences,
  saveSgiPreferences,
  type SgiAccent,
  type SgiDensity,
  type SgiPreferences,
  type SgiRadius,
} from "@/lib/sgi-preferences"
import { cn } from "@/lib/utils"

const accentOptions: Array<{
  value: SgiAccent
  label: string
  description: string
  swatch: string
}> = [
  {
    value: "azul",
    label: "Corporativo",
    description: "Azul SGI con buena lectura para sidebar y acciones.",
    swatch: "bg-[#13325e]",
  },
  {
    value: "verde",
    label: "Preventivo",
    description: "Verde sobrio para entornos de SST y seguimiento.",
    swatch: "bg-[#143a2c]",
  },
  {
    value: "teal",
    label: "Operativo",
    description: "Tono intermedio para una interfaz tranquila y tecnica.",
    swatch: "bg-[#103a42]",
  },
  {
    value: "grafito",
    label: "Neutral",
    description: "Paleta sobria cuando se prioriza lectura y contraste.",
    swatch: "bg-[#1f2933]",
  },
]

const densityOptions: Array<{
  value: SgiDensity
  label: string
  description: string
}> = [
  {
    value: "comfortable",
    label: "Comoda",
    description: "Mas aire entre secciones para pantallas amplias.",
  },
  {
    value: "compact",
    label: "Compacta",
    description: "Reduce altura de tarjetas y contenido para trabajo operativo.",
  },
]

const radiusOptions: Array<{
  value: SgiRadius
  label: string
  description: string
}> = [
  {
    value: "suave",
    label: "Suave",
    description: "Bordes discretos para vistas densas.",
  },
  {
    value: "medio",
    label: "Medio",
    description: "Equilibrio actual del sistema.",
  },
  {
    value: "marcado",
    label: "Marcado",
    description: "Componentes con una apariencia mas amable.",
  },
]

function SelectableOption({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-20 w-full items-start gap-3 rounded-md border bg-background px-3 py-3 text-left transition-colors hover:border-primary/60",
        active ? "border-primary ring-2 ring-primary/15" : "border-border",
      )}
    >
      {children}
      {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
    </button>
  )
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<SgiPreferences>(defaultSgiPreferences)
  const [savedPreferences, setSavedPreferences] = useState<SgiPreferences>(defaultSgiPreferences)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    "default",
  )

  const hasChanges = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(savedPreferences),
    [preferences, savedPreferences],
  )

  useEffect(() => {
    const stored = readSgiPreferences()
    setPreferences(stored)
    setSavedPreferences(stored)
    applySgiPreferences(stored)
    setNotificationPermission(
      typeof window !== "undefined" && "Notification" in window ? window.Notification.permission : "unsupported",
    )
  }, [])

  function updatePreferences(next: Partial<SgiPreferences>) {
    setPreferences((current) => {
      const merged = { ...current, ...next }
      applySgiPreferences(merged)
      return merged
    })
  }

  function handleSave() {
    saveSgiPreferences(preferences)
    setSavedPreferences(preferences)
    toast.success("Configuracion aplicada")
  }

  function handleReset() {
    setPreferences(defaultSgiPreferences)
    setSavedPreferences(defaultSgiPreferences)
    saveSgiPreferences(defaultSgiPreferences)
    toast.success("Configuracion restaurada")
  }

  async function requestBrowserNotifications(enabled: boolean) {
    if (!enabled) {
      updatePreferences({ browserNotifications: false })
      return
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Este navegador no soporta notificaciones")
      setNotificationPermission("unsupported")
      return
    }

    const permission = await window.Notification.requestPermission()
    setNotificationPermission(permission)

    if (permission === "granted") {
      updatePreferences({ browserNotifications: true })
      toast.success("Notificaciones del navegador habilitadas")
      return
    }

    updatePreferences({ browserNotifications: false })
    toast.error("El navegador no concedio permisos de notificacion")
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ajustes</h1>
          <p className="text-muted-foreground">Ajusta la experiencia de trabajo del SGI para esta sesion de usuario.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Button>
          <Button type="button" className="gap-2" onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4" />
            Guardar preferencias
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto px-3 py-1">
        <div className="flex min-w-max items-center justify-center gap-2">
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Color</span>
            <span className="text-sm font-semibold">
              {accentOptions.find((option) => option.value === preferences.accent)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Densidad</span>
            <span className="text-sm font-semibold">
              {densityOptions.find((option) => option.value === preferences.density)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Bordes</span>
            <span className="text-sm font-semibold">
              {radiusOptions.find((option) => option.value === preferences.radius)?.label}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Movimiento</span>
            <span className="text-sm font-semibold">{preferences.reduceMotion ? "Reducido" : "Normal"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Palette className="h-5 w-5" />
              Apariencia del SGI
            </CardTitle>
            <CardDescription>Estos cambios se aplican de inmediato en el dashboard y quedan guardados al confirmar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              <Label>Color institucional</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {accentOptions.map((option) => (
                  <SelectableOption
                    key={option.value}
                    active={preferences.accent === option.value}
                    onClick={() => updatePreferences({ accent: option.value })}
                  >
                    <span className={cn("mt-0.5 h-4 w-4 rounded-full", option.swatch)} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </SelectableOption>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Densidad de trabajo</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {densityOptions.map((option) => (
                  <SelectableOption
                    key={option.value}
                    active={preferences.density === option.value}
                    onClick={() => updatePreferences({ density: option.value })}
                  >
                    <LayoutDashboard className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </SelectableOption>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Bordes de componentes</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {radiusOptions.map((option) => (
                  <SelectableOption
                    key={option.value}
                    active={preferences.radius === option.value}
                    onClick={() => updatePreferences({ radius: option.value })}
                  >
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </SelectableOption>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <ShieldCheck className="h-5 w-5" />
                Experiencia operativa
              </CardTitle>
              <CardDescription>Preferencias locales para reducir ruido visual durante el trabajo diario.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Reducir animaciones</p>
                  <p className="text-xs text-muted-foreground">Disminuye transiciones y movimientos de la interfaz.</p>
                </div>
                <Switch
                  checked={preferences.reduceMotion}
                  onCheckedChange={(checked) => updatePreferences({ reduceMotion: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Notificaciones del navegador</p>
                  <p className="text-xs text-muted-foreground">Permite avisos del SGI cuando el navegador lo autorice.</p>
                </div>
                <Switch
                  checked={preferences.browserNotifications && notificationPermission === "granted"}
                  disabled={notificationPermission === "unsupported"}
                  onCheckedChange={requestBrowserNotifications}
                />
              </div>
              <Badge variant="outline">
                {notificationPermission === "unsupported"
                  ? "No soportadas"
                  : notificationPermission === "granted"
                    ? "Permiso concedido"
                    : notificationPermission === "denied"
                      ? "Permiso bloqueado"
                      : "Pendiente de autorizacion"}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <HelpCircle className="h-5 w-5" />
                Necesitas ayuda?
              </CardTitle>
              <CardDescription>Contacta al soporte tecnico del SGI cuando necesites asistencia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-background p-3">
                <p className="text-sm font-medium">Soporte tecnico</p>
                <p className="mt-1 text-2xl font-semibold tracking-wide">321 890 0642</p>
                <p className="mt-1 text-xs text-muted-foreground">Atencion por WhatsApp para novedades del sistema.</p>
              </div>

              <Button asChild type="button" className="w-full gap-2">
                <a href="https://wa.me/573218900642" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Escribir por WhatsApp
                </a>
              </Button>

              <Separator />

              <div className="flex items-start gap-3 rounded-md bg-secondary px-3 py-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">Cambio de clave</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Aun no hay una opcion directa integrada para cambiar la clave desde ajustes. Por ahora debe
                    gestionarse con el administrador o soporte tecnico.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Bell className="h-5 w-5" />
                Vista previa
              </CardTitle>
              <CardDescription>Referencia visual de como se aplican las preferencias.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-border bg-background p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Panel SGI</p>
                    <p className="text-xs text-muted-foreground">Indicadores y controles compactos</p>
                  </div>
                  <Badge>Activo</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-md bg-secondary px-3 py-2">
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-semibold">8</p>
                  </div>
                  <div className="rounded-md bg-secondary px-3 py-2">
                    <p className="text-xs text-muted-foreground">Cumplidos</p>
                    <p className="text-lg font-semibold text-green-600">14</p>
                  </div>
                  <div className="rounded-md bg-secondary px-3 py-2">
                    <p className="text-xs text-muted-foreground">Alertas</p>
                    <p className="text-lg font-semibold text-destructive">2</p>
                  </div>
                </div>
              </div>
              <Button type="button" className="w-full" onClick={handleSave} disabled={!hasChanges}>
                Aplicar esta configuracion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
