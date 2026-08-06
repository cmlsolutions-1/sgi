// app/manager/layout.tsx
import type { Metadata } from "next";
import AuthGuard from "@/components/auth/AuthGuard";

export const metadata: Metadata = {
  title: "Super Administrador",
  description: "Panel de gestión de empresas y módulos",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/icono4sinfondo.png", media: "(prefers-color-scheme: light)" },
      { url: "/icono4sinfondo.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icono4sinfondo.png", type: "image/svg+xml" },
    ],
    apple: "/icono4sinfondo.png",
  },
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAdmin>
      <div className="h-dvh overflow-y-auto overflow-x-hidden bg-background">
        {children}
      </div>
    </AuthGuard>
  );
}
