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
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <ModuleGuard>{children}</ModuleGuard>
        </main>
      </div>
    </div>
    </AuthGuard>
  )
}


