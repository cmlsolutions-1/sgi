"use client"

import { useEffect } from "react"

import { applySgiPreferences, readSgiPreferences } from "@/lib/sgi-preferences"

export function SgiPreferencesProvider() {
  useEffect(() => {
    applySgiPreferences(readSgiPreferences())
  }, [])

  return null
}
