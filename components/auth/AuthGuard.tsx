"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const TOKEN_KEY = "sgc_at";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return; // no marcamos ready
    }

    setReady(true);
  }, [router, pathname]);

  // Mientras valida, NO renderiza el contenido protegido
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
