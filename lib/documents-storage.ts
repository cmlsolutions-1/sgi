import type { Document } from "@/lib/mock-data"

export type StoredDocument = Document & {
  // Para vigencia real (si renuevan, cambia este)
  validFromISO: string // YYYY-MM-DD
  // Archivo final (pdf generado, etc.)
  file?: {
    name: string
    url: string // dataURL base64 en demo o URL real en futuro
    size: number
    type: string
  } | null
  // Bandera para documentos creados por usuario
  createdByUser?: boolean
  source?: {
    kind: "preventiveProcedure"
    filledId: string
  }
}

const KEY = "sgsst:documents:v1"

function safeParse<T>(v: string | null, fallback: T): T {
  if (!v) return fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

export function getUserDocuments(): StoredDocument[] {
  return safeParse(localStorage.getItem(KEY), [])
}

export function saveUserDocuments(docs: StoredDocument[]) {
  localStorage.setItem(KEY, JSON.stringify(docs))
}

export function upsertUserDocument(doc: StoredDocument) {
  const all = getUserDocuments()
  const idx = all.findIndex((d) => d.id === doc.id)
  const next = idx >= 0 ? all.map((d) => (d.id === doc.id ? doc : d)) : [doc, ...all]
  saveUserDocuments(next)
}

export function deleteUserDocument(id: string) {
  const all = getUserDocuments()
  saveUserDocuments(all.filter((d) => d.id !== id))
}

// Devuelve lista combinada: base + user
export function getAllDocuments(mockDocuments: Document[]): StoredDocument[] {
  const userDocs = getUserDocuments()

  // Convertimos mocks a StoredDocument sin romper
  const base: StoredDocument[] = mockDocuments.map((d) => ({
    ...d,
    validFromISO: d.createdAt, // en mock asumimos createdAt YYYY-MM-DD
    file: null,
    createdByUser: false,
  }))

  return [...userDocs, ...base]
}

export function renewDocument(documentId: string, newValidFromISO: string) {
  const all = getUserDocuments()
  const doc = all.find((d) => d.id === documentId)
  if (!doc) return

  // Sube versión simple: 1.0 -> 1.1
  const [major, minor = "0"] = doc.version.split(".")
  const nextVersion = `${major}.${Number(minor) + 1}`

  const updated: StoredDocument = {
    ...doc,
    validFromISO: newValidFromISO,
    updatedAt: newValidFromISO,
    version: nextVersion,
    status: "approved",
  }

  upsertUserDocument(updated)
}
