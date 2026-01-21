"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { departments, mockDocuments } from "@/lib/mock-data"
import type { StoredDocument } from "@/lib/documents-storage"
import { getAllDocuments, renewDocument } from "@/lib/documents-storage"
import { TEMPLATES } from "../_lib/constants"
import { downloadDataUrl } from "../_lib/utils"

export type CreateFlow = "assignment" | "procedure" | null

export function useDocuments() {
  const router = useRouter()

  // data
  const [documents, setDocuments] = useState<StoredDocument[]>([])

  // filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  // renew dialog
  const [renewDialogOpen, setRenewDialogOpen] = useState(false)
  const [renewTarget, setRenewTarget] = useState<StoredDocument | null>(null)
  const [renewDate, setRenewDate] = useState(new Date().toISOString().slice(0, 10))

  // create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createFlow, setCreateFlow] = useState<CreateFlow>(null)

  useEffect(() => {
    setDocuments(getAllDocuments(mockDocuments))
  }, [])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "all" || doc.type === typeFilter
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter
      const matchesDept = departmentFilter === "all" || doc.department === departmentFilter
      return matchesSearch && matchesType && matchesStatus && matchesDept
    })
  }, [documents, search, typeFilter, statusFilter, departmentFilter])

  const stats = useMemo(() => {
    return {
      total: documents.length,
      approved: documents.filter((d) => d.status === "approved").length,
      review: documents.filter((d) => d.status === "review").length,
      draft: documents.filter((d) => d.status === "draft").length,
    }
  }, [documents])

  const refreshDocuments = () => setDocuments(getAllDocuments(mockDocuments))

  // actions - navigation / downloads
  const viewDoc = (docId: string) => router.push(`/dashboard/documents/${docId}`)

  const downloadDoc = (doc: StoredDocument) => {
    if (!doc.file?.url) return
    downloadDataUrl(doc.file.url, doc.file.name || `${doc.name}.pdf`)
  }

  // renew actions
  const openRenew = (doc: StoredDocument) => {
    setRenewTarget(doc)
    setRenewDate(new Date().toISOString().slice(0, 10))
    setRenewDialogOpen(true)
  }

  const closeRenew = () => {
    setRenewDialogOpen(false)
  }

  const confirmRenew = () => {
    if (!renewTarget?.createdByUser) {
      alert("Solo se pueden renovar documentos creados por el usuario (demo).")
      return
    }
    renewDocument(renewTarget.id, renewDate)
    refreshDocuments()
    setRenewDialogOpen(false)
  }

  // create actions
  const openCreateDialog = () => {
    setCreateFlow(null)
    setCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    setCreateDialogOpen(false)
    setCreateFlow(null)
  }

  const openCreateFlow = (flow: Exclude<CreateFlow, null>) => {
    setCreateFlow(flow)
    setCreateDialogOpen(true)
  }

  const fillOrModify = (doc: StoredDocument) => {
    if (doc.id === TEMPLATES.assignment) {
      openCreateFlow("assignment")
      return
    }
    if (doc.id === TEMPLATES.preventive) {
      openCreateFlow("procedure")
      return
    }
    alert("Este documento no tiene diligenciamiento en línea configurado.")
  }

  return {
    // data
    documents,
    filteredDocuments,
    stats,
    departments,

    // filters
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,

    // actions
    viewDoc,
    downloadDoc,
    fillOrModify,

    // renew
    renewDialogOpen,
    setRenewDialogOpen,
    renewTarget,
    renewDate,
    setRenewDate,
    openRenew,
    closeRenew,
    confirmRenew,

    // create
    createDialogOpen,
    setCreateDialogOpen,
    createFlow,
    setCreateFlow,
    openCreateDialog,
    closeCreateDialog,
    openCreateFlow,

    // refresh
    refreshDocuments,
  }
}
