import { apiFetch } from "@/lib/apiClient"

export const pesvResources = {
  responsible: "/api/pesv/responsible",
  committee: "/api/pesv/committee",
  policies: "/api/pesv/policies",
  leadership: "/api/pesv/leadership",
  diagnoses: "/api/pesv/diagnoses",
  objectives: "/api/pesv/objectives/objectives",
} as const
export type PesvResource = keyof typeof pesvResources
export type PesvDocument = { id: string; fileName: string; description: string; uploadedAt: string; mimeType: string; url?: string; targetId?: string }

async function data<T>(response: Response): Promise<T> {
  if (response.status === 204 && response.ok) return undefined as T
  const body = await response.json().catch(() => null)
  if (!response.ok || !body || body.ok === false) throw new Error(body?.errors?.find((e: { message?: string }) => e.message)?.message ?? body?.message ?? "No se pudo completar la operación PESV")
  return body.data as T
}
export async function pesvRequest<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  return data<T>(await apiFetch(url, { method, cache: "no-store", ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) }))
}
export async function listPesv<T>(url: string): Promise<T[]> {
  const result: T[] = []
  for (let page = 1; ; page++) {
    const separator = url.includes("?") ? "&" : "?"
    const payload = await pesvRequest<T[] | { items: T[]; total: number }>(`${url}${separator}page=${page}&limit=100`)
    if (Array.isArray(payload)) return payload
    if (!payload || !Array.isArray(payload.items) || !Number.isFinite(payload.total)) throw new Error("Respuesta de listado PESV inválida")
    result.push(...payload.items)
    if (result.length >= payload.total) return result
    if (!payload.items.length || page >= 1000) throw new Error("No se pudo completar la paginación PESV")
  }
}
export function pesvPath(resource: PesvResource, id?: string) { return `${pesvResources[resource]}${id ? `/${encodeURIComponent(id)}` : ""}` }
export function pesvVersion(record: unknown): { version?: number; lockVersion?: number } {
  if (record && typeof record === "object" && "lockVersion" in record && typeof record.lockVersion === "number") return { lockVersion: record.lockVersion }
  const version = record && typeof record === "object" && "version" in record ? record.version : undefined
  return typeof version === "number" ? { version } : {}
}
export async function savePesv<T>(resource: PesvResource, body: unknown, id?: string): Promise<T> {
  return pesvRequest<T>(pesvPath(resource, id), id ? "PUT" : "POST", body)
}
export async function deletePesv(resource: PesvResource, id: string) { await pesvRequest(pesvPath(resource, id), "DELETE") }
export async function listPesvDocuments(resource: PesvResource, id: string): Promise<PesvDocument[]> {
  const docs = await listPesv<Record<string, unknown>>(`${pesvPath(resource, id)}/documents`)
  return docs.map(document => ({ id: String(document.id), fileName: String(document.originalName ?? document.fileName ?? "Documento"), description: String(document.description ?? ""), mimeType: String(document.mimeType ?? "application/octet-stream"), uploadedAt: String(document.uploadedAt ?? document.createdAt ?? ""), ...(document.targetId || ["PESV_COMMITTEE_REVIEW", "PESV_OBJECTIVE_ENTRY"].includes(String(document.referenceType)) ? { targetId: String(document.targetId ?? document.referenceId) } : {}) }))
}
export async function getPesv<T>(resource: PesvResource, id: string): Promise<T> {
  const record = await pesvRequest<T>(pesvPath(resource, id))
  return record
}
export async function loadPesv<T extends { id: string }>(resource: PesvResource): Promise<T[]> {
  const records = await listPesv<T>(`${pesvPath(resource)}${resource === "responsible" || resource === "committee" ? "?status=CURRENT" : ""}`)
  return Promise.all(records.map(async record => {
    const detail = await getPesv<T>(resource, record.id)
    const documents = await listPesvDocuments(resource, record.id)
    const normalized = { ...detail } as T & Record<string, unknown>
    for (const key of ["observations", "committeeMeetingDate", "supportDescription", "supportFileName"]) {
      if (normalized[key] == null) Object.assign(normalized, { [key]: "" })
    }
    return { ...normalized, documents, evidence: documents.filter(d => !d.targetId).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0] }
  }))
}
export async function uploadPesvDocument(resource: PesvResource, id: string, file: File, description = "", targetId?: string): Promise<void> {
  if (!file.size || file.size > 3 * 1024 * 1024) throw new Error("Selecciona un archivo de hasta 3 MB")
  if (file.type !== "application/pdf" && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Selecciona un PDF o una imagen PNG, JPG o WebP")
  const body = new FormData()
  body.append("file", file); body.append("description", description); body.append("isConfirmed", "true")
  body.append("type", { responsible: "PESV_RESPONSIBLE_SUPPORT", committee: "PESV_COMMITTEE_EVIDENCE", policies: "PESV_POLICY_SIGNED", leadership: "PESV_LEADERSHIP_EVIDENCE", diagnoses: "PESV_DIAGNOSIS_EVIDENCE", objectives: "PESV_OBJECTIVE_EVIDENCE" }[resource])
  if (targetId) body.append("targetId", targetId)
  await data(await apiFetch(`${pesvPath(resource, id)}/documents`, { method: "POST", body }))
}
export async function pesvBlob(url: string, mimeType?: string): Promise<Blob> {
  const previewable = ["application/pdf", "image/png", "image/jpeg", "image/webp"]
  const withMime = (blob: Blob) => (!blob.type || blob.type === "application/octet-stream") && mimeType && previewable.includes(mimeType) ? blob.slice(0, blob.size, mimeType) : blob
  const response = await apiFetch(url, { cache: "no-store" })
  if (!response.ok) { await data(response); throw new Error("No se pudo descargar el archivo") }
  if (response.headers.get("content-type")?.includes("application/json")) {
    const document = await data<{ downloadUrl?: string }>(response)
    if (!document?.downloadUrl) throw new Error("El backend no devolvió el archivo ni una URL de descarga")
    const location = new URL(document.downloadUrl, window.location.origin)
    if (!["http:", "https:"].includes(location.protocol)) throw new Error("URL de descarga inválida")
    const download = location.origin === window.location.origin
      ? await apiFetch(location.pathname + location.search, { cache: "no-store" })
      : await fetch(location.href, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" })
    if (!download.ok) throw new Error("No se pudo descargar el documento")
    return withMime(await download.blob())
  }
  return withMime(await response.blob())
}
export function pesvDocumentUrl(resource: PesvResource, id: string, documentId: string) { return `${pesvPath(resource, id)}/documents/${encodeURIComponent(documentId)}` }
export async function downloadPesv(url: string, name: string) {
  const blob = await pesvBlob(url)
  const href = URL.createObjectURL(blob), link = document.createElement("a")
  link.href = href; link.download = name; link.click()
  setTimeout(() => URL.revokeObjectURL(href), 1000)
}
