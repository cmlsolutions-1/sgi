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
  title: "SafeCloud",
  description: "Sistema de Gestión Integral",
  generator: "v0.app",
  icons: {
    icon: "/icono4sinfondo.png",
    shortcut: "/icono4sinfondo.png",
    apple: "/icono4sinfondo.png",
  },
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
