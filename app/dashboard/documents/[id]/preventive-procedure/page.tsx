//src/app/dashboard/documents/[id]/preventive-procedure/page.tsx


"use client"

import { useParams } from "next/navigation"
import DocumentFormPreventiveProcedure from "@/components/document/DocumentFormPreventiveProcedure"

export default function PreventiveProcedurePage() {
  const params = useParams<{ id: string }>()
  return <DocumentFormPreventiveProcedure documentId={params.id} />
}
