"use client"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/pesv/planning-module"
import { downloadPesv, listPesvDocuments, pesvBlob, pesvDocumentUrl, pesvPath, pesvRequest, uploadPesvDocument, type PesvDocument, type PesvResource } from "@/services/pesvService"

export function PesvApiDocuments({ resource, id, targetId, onChanged }: { resource: PesvResource; id: string; targetId?: string; onChanged?: () => void }) {
  const [documents, setDocuments] = useState<PesvDocument[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [preview, setPreview] = useState<{ url: string; document: PesvDocument } | null>(null)
  async function refresh() { try { setDocuments(await listPesvDocuments(resource, id)); setError("") } catch (e) { setError(e instanceof Error ? e.message : "No se pudieron cargar los documentos") } }
  useEffect(() => { void refresh() }, [resource, id])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url) }, [preview])
  return <section className="space-y-3"><h3 className="font-semibold">Documentos y evidencias</h3>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}<div className="grid gap-3"><Input aria-label="Seleccionar evidencia" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={e => setFile(e.target.files?.[0] ?? null)} /><Button disabled={!file || busy} onClick={async () => { if (!file || busy) return; setBusy(true); try { await uploadPesvDocument(resource, id, file, "", targetId); setFile(null); await refresh(); onChanged?.(); toast.success("Evidencia cargada") } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo cargar") } finally { setBusy(false) } }}>Cargar evidencia</Button></div>{documents.filter(d => targetId ? d.targetId === targetId : !d.targetId).map(document => <div key={document.id} className="flex flex-wrap items-center gap-2 border-b py-2 text-sm"><span className="min-w-0 flex-1 break-words">{document.fileName}</span><Button variant="outline" size="sm" onClick={async () => { try { const blob = await pesvBlob(pesvDocumentUrl(resource, id, document.id), document.mimeType); setPreview({ url: URL.createObjectURL(blob), document: { ...document, mimeType: blob.type || document.mimeType } }) } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo abrir") } }}>Ver</Button><Button variant="outline" size="sm" onClick={() => { void downloadPesv(pesvDocumentUrl(resource, id, document.id), document.fileName).catch(e => toast.error(e.message)) }}>Descargar</Button><Button disabled={busy} variant="ghost" size="sm" onClick={async () => { if (!confirm("¿Eliminar esta evidencia?")) return; setBusy(true); try { await pesvRequest(`${pesvPath(resource, id)}/documents/${encodeURIComponent(document.id)}`, "DELETE"); await refresh(); onChanged?.() } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo eliminar") } finally { setBusy(false) } }}>Eliminar</Button></div>)}<Modal open={!!preview} onOpenChange={open => !open && setPreview(null)} title={preview?.document.fileName ?? "Documento"}>{preview && <div className="h-[65dvh]">{preview.document.mimeType.startsWith("image/") ? <img src={preview.url} alt={preview.document.fileName} className="h-full w-full object-contain" /> : <iframe src={preview.url} title={preview.document.fileName} className="h-full w-full" />}</div>}</Modal></section>
}
