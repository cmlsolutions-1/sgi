"use client"

import type { StoredDocument } from "@/lib/documents-storage"
import DocumentCard from "./DocumentCard"

type Props = {
  documents: StoredDocument[]
  onView: (docId: string) => void
  onDownload: (doc: StoredDocument) => void
  onRenew: (doc: StoredDocument) => void
  onFillOrModify: (doc: StoredDocument) => void
}

export default function DocumentsGrid({ documents, onView, onDownload, onRenew, onFillOrModify }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          onView={onView}
          onDownload={onDownload}
          onRenew={onRenew}
          onFillOrModify={onFillOrModify}
        />
      ))}
    </div>
  )
}
