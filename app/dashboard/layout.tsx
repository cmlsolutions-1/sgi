// app/dashboard/layout.tsx

import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"

import AuthGuard from "@/components/auth/AuthGuard";
import ModuleGuard from "@/components/auth/ModuleGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard redirectAdminToManager>
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
          <ModuleGuard>{children}</ModuleGuard>
        </main>
      </div>
    </div>
    </AuthGuard>
  )
}


