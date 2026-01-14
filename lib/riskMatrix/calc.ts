export function calcNP(nd: number, ne: number) {
    return nd * ne
  }
  
  export function interpretNP(np: number) {
    // Basado en los rangos del Excel:
    // Muy Alto: 40-24, Alto: 20-10, Medio: 8-6, Bajo: 4-2, y 0 si nd=0
    if (np >= 24) return "Muy Alto"
    if (np >= 10) return "Alto"
    if (np >= 6) return "Medio"
    if (np >= 2) return "Bajo"
    return "Sin valoración"
  }
  
  export function calcNR(np: number, nc: number) {
    return np * nc
  }
  
  export function classifyNR(nr: number) {
    // Rangos típicos del formato (coinciden con la tabla del archivo):
    // I: 600-400, II: 360-150, III: 120-40, IV: 20
    // Nota: el Excel muestra “I 400-600”, “II 150-360/500-150” (por formato),
    // aquí lo dejamos consistente para operar.
    if (nr >= 400) return "I"
    if (nr >= 150) return "II"
    if (nr >= 40) return "III"
    if (nr >= 20) return "IV"
    return "Sin clasificación"
  }
  
  export function interpretNR(level: string) {
    switch (level) {
      case "I":
        return "Situación crítica. Suspender actividades hasta controlar el riesgo. Intervención urgente."
      case "II":
        return "Corregir y adoptar medidas de control de inmediato."
      case "III":
        return "Mejorar si es posible. Justificar la intervención y su rentabilidad."
      case "IV":
        return "Mantener controles existentes. Considerar mejoras."
      default:
        return ""
    }
  }
  
  export function aceptabilidad(level: string) {
    // Tabla 8 (en tu Excel):
    if (level === "I") return "No aceptable"
    if (level === "II") return "No aceptable o aceptable con control específico"
    if (level === "III") return "Aceptable"
    if (level === "IV") return "Aceptable"
    return ""
  }
  