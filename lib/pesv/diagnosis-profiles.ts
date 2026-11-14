export const collaboratorFields = [
  ["name", "Nombre", 300], ["birthDate", "Fecha de nacimiento", "date"], ["gender", "Género", "gender"],
  ["role", "Cargo", 300], ["educationLevel", "Escolaridad", 200], ["maritalStatus", "Estado civil", 200],
  ["licenseValidUntil", "Vencimiento de la licencia", "date"], ["trainings", "Capacitaciones", "number"],
  ["competencyEvaluation", "Evaluación de competencia", 10000], ["roadAccidents", "Siniestros viales", "number"],
  ["trafficFines", "Infracciones", "number"], ["finesPaymentStatus", "Estado de pago", 300],
  ["commuteTransport", "Medio de transporte", 300], ["isWorkDriver", "Conduce por trabajo", "boolean"],
  ["vehicleTypeDriven", "Tipo de vehículo", 300], ["linkedAt", "Fecha de vinculación", "date"],
] as const

export type CollaboratorDraft = Partial<Record<(typeof collaboratorFields)[number][0] | "sourceEmployeeId", string | number | boolean | null>>

export function missingCollaboratorFields(row: CollaboratorDraft) {
  return collaboratorFields.filter(([key, , kind]) => {
    const value = row[key]
    if (kind === "boolean") return typeof value !== "boolean"
    if (kind === "number") return typeof value !== "number" || !Number.isInteger(value) || value < 0
    if (typeof value !== "string" || !value.trim()) return true
    if (kind === "gender") return !["MASCULINO", "FEMENINO"].includes(value)
    if (kind === "date") {
      const date = new Date(value)
      return !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    }
    return value.trim().length > kind
  }).map(([, label]) => label)
}

export function collaboratorPayload(row: CollaboratorDraft) {
  return {
    ...(row.sourceEmployeeId ? { sourceEmployeeId: row.sourceEmployeeId } : {}),
    ...Object.fromEntries(collaboratorFields.map(([key]) => {
      const value = row[key]
      return [key, typeof value === "string" ? value.trim() : value]
    })),
  }
}
