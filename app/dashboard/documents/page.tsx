"use client"

import DocumentsHeader from "./_components/DocumentsHeader"
import DocumentsStats from "./_components/DocumentsStats"
import DocumentsFilters from "./_components/DocumentsFilters"
import DocumentsGrid from "./_components/DocumentsGrid"
import RenewDialog from "./_components/RenewDialog"
import CreateDialog from "./_components/CreateDialog"
import { useDocuments } from "./_hooks/useDocuments"

export default function DocumentsPage() {
  const doc = useDocuments()

  return (
    <div className="space-y-6">
      <DocumentsHeader onCreate={doc.openCreateDialog} />

      <DocumentsStats stats={doc.stats} />

      <DocumentsFilters
        search={doc.search}
        setSearch={doc.setSearch}
        typeFilter={doc.typeFilter}
        setTypeFilter={doc.setTypeFilter}
        statusFilter={doc.statusFilter}
        setStatusFilter={doc.setStatusFilter}
        departmentFilter={doc.departmentFilter}
        setDepartmentFilter={doc.setDepartmentFilter}
        departments={doc.departments}
      />

      <DocumentsGrid
        documents={doc.filteredDocuments}
        onView={doc.viewDoc}
        onDownload={doc.downloadDoc}
        onRenew={doc.openRenew}
        onFillOrModify={doc.fillOrModify}
      />

      <RenewDialog
        open={doc.renewDialogOpen}
        onOpenChange={doc.setRenewDialogOpen}
        target={doc.renewTarget}
        renewDate={doc.renewDate}
        setRenewDate={doc.setRenewDate}
        onCancel={doc.closeRenew}
        onConfirm={doc.confirmRenew}
      />

      <CreateDialog
        open={doc.createDialogOpen}
        onOpenChange={doc.setCreateDialogOpen}
        createFlow={doc.createFlow}
        setCreateFlow={doc.setCreateFlow}
        onClose={doc.closeCreateDialog}
        onCreated={() => {
          doc.closeCreateDialog()
          doc.refreshDocuments()
        }}
      />
    </div>
  )
}
