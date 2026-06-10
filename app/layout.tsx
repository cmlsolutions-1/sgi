//app/layout.tsx

import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

// <CHANGE> Metadata actualizada para SGC
export const metadata: Metadata = {
  title: "SGC - Sistema de Gestión de Calidad",
  description: "Dashboard administrativo para gestión de calidad ISO 9001",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark h-full overflow-hidden">
      <body className="h-full overflow-hidden font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" closeButton />
        <Analytics />
      </body>
    </html>
  )
}
