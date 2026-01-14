export function nrLevelColor(level: string) {
    switch (level) {
      case "I":
        return "bg-red-600 text-white border-red-700"
      case "II":
        return "bg-orange-500 text-white border-orange-600"
      case "III":
        return "bg-yellow-400 text-black border-yellow-500"
      case "IV":
        return "bg-green-600 text-white border-green-700"
      default:
        return "bg-muted text-foreground border-border"
    }
  }
  
  export function aceptabilidadColor(a: string) {
    const val = (a || "").toLowerCase()
    if (val.includes("no aceptable")) return "bg-red-600 text-white border-red-700"
    if (val.includes("control")) return "bg-orange-500 text-white border-orange-600"
    if (val.includes("aceptable")) return "bg-green-600 text-white border-green-700"
    return "bg-muted text-foreground border-border"
  }
  
  export function npColor(np: number) {
    // Puedes ajustar según tus rangos exactos (los mismos del Excel)
    if (np >= 24) return "bg-red-600 text-white border-red-700"
    if (np >= 10) return "bg-orange-500 text-white border-orange-600"
    if (np >= 6) return "bg-yellow-400 text-black border-yellow-500"
    if (np >= 2) return "bg-green-600 text-white border-green-700"
    return "bg-muted text-foreground border-border"
  }
  