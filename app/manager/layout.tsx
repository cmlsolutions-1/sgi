// app/manager/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Administrador",
  description: "Panel de gestión de empresas y módulos",
  generator: "v0.app",
  icons: {
    icon: [
      { url: "/SGI-nube.png", media: "(prefers-color-scheme: light)" },
      { url: "/SGI-nube", media: "(prefers-color-scheme: dark)" },
      { url: "/SGI-nube.png", type: "image/svg+xml" },
    ],
    apple: "/SGI-nube.png",
  },
};

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
