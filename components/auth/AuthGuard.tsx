//components/auth/AuthGuard.tsx

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { tokenHasRole } from "@/lib/jwt";

type AuthGuardProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
  redirectAdminToManager?: boolean;
};

export default function AuthGuard({
  children,
  requireAdmin = false,
  redirectAdminToManager = false,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const accessToken = useAuthStore((s) => s.accessToken);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAdmin = tokenHasRole(accessToken, "ADMIN");

  useEffect(() => {
    if (!hasHydrated) return;

    if (!accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (requireAdmin && !isAdmin) {
      router.replace("/dashboard");
      return;
    }

    if (redirectAdminToManager && isAdmin) {
      router.replace("/manager");
    }
  }, [hasHydrated, accessToken, isAdmin, requireAdmin, redirectAdminToManager, router, pathname]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!accessToken) return null;
  if (requireAdmin && !isAdmin) return null;
  if (redirectAdminToManager && isAdmin) return null;

  return <>{children}</>;
}
