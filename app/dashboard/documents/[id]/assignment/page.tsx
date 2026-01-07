//src/app/dashboard/documents/[id]/assignment/page.tsx

"use client"

import { useParams } from "next/navigation"
import DocumentFormAssignment from "@/components/document/DocumentFormAssignment"

export default function AssignmentFormPage() {
  const params = useParams<{ id: string }>()
  return <DocumentFormAssignment documentId={params.id} />
}
