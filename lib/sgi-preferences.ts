"use client"

export type SgiAccent = "azul" | "verde" | "teal" | "grafito"
export type SgiDensity = "comfortable" | "compact"
export type SgiRadius = "suave" | "medio" | "marcado"

export type SgiPreferences = {
  accent: SgiAccent
  density: SgiDensity
  radius: SgiRadius
  reduceMotion: boolean
  browserNotifications: boolean
}

export const SGI_PREFERENCES_KEY = "sgi-user-preferences"

export const defaultSgiPreferences: SgiPreferences = {
  accent: "azul",
  density: "comfortable",
  radius: "medio",
  reduceMotion: false,
  browserNotifications: false,
}

const accentTokens: Record<SgiAccent, Record<string, string>> = {
  azul: {
    "--primary": "oklch(0.6 0.15 250)",
    "--ring": "oklch(0.65 0.18 250)",
    "--sidebar": "#13325e",
    "--sidebar-primary": "#4bbdbd",
    "--sidebar-accent": "#2f6f9f",
  },
  verde: {
    "--primary": "oklch(0.55 0.16 148)",
    "--ring": "oklch(0.62 0.18 148)",
    "--sidebar": "#143a2c",
    "--sidebar-primary": "#2fb36d",
    "--sidebar-accent": "#21694d",
  },
  teal: {
    "--primary": "oklch(0.58 0.13 190)",
    "--ring": "oklch(0.64 0.15 190)",
    "--sidebar": "#103a42",
    "--sidebar-primary": "#28a9a9",
    "--sidebar-accent": "#1f6870",
  },
  grafito: {
    "--primary": "oklch(0.45 0.04 250)",
    "--ring": "oklch(0.52 0.05 250)",
    "--sidebar": "#1f2933",
    "--sidebar-primary": "#64748b",
    "--sidebar-accent": "#334155",
  },
}

const radiusTokens: Record<SgiRadius, string> = {
  suave: "0.375rem",
  medio: "0.5rem",
  marcado: "0.75rem",
}

function normalizePreferences(value: Partial<SgiPreferences> | null): SgiPreferences {
  return {
    ...defaultSgiPreferences,
    ...(value ?? {}),
  }
}

export function readSgiPreferences(): SgiPreferences {
  if (typeof window === "undefined") return defaultSgiPreferences

  try {
    const stored = window.localStorage.getItem(SGI_PREFERENCES_KEY)
    return normalizePreferences(stored ? (JSON.parse(stored) as Partial<SgiPreferences>) : null)
  } catch {
    return defaultSgiPreferences
  }
}

export function saveSgiPreferences(preferences: SgiPreferences) {
  window.localStorage.setItem(SGI_PREFERENCES_KEY, JSON.stringify(preferences))
  applySgiPreferences(preferences)
}

export function applySgiPreferences(preferences: SgiPreferences) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  const tokens = accentTokens[preferences.accent] ?? accentTokens[defaultSgiPreferences.accent]

  Object.entries(tokens).forEach(([property, value]) => {
    root.style.setProperty(property, value)
  })

  root.style.setProperty("--radius", radiusTokens[preferences.radius])
  root.style.setProperty("--sgi-content-padding", preferences.density === "compact" ? "1rem" : "1.5rem")
  root.dataset.sgiDensity = preferences.density
  root.dataset.sgiReduceMotion = preferences.reduceMotion ? "true" : "false"
}
