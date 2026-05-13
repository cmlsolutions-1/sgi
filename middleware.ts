// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { tokenHasRole } from "@/lib/jwt";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");
  const isManager = pathname.startsWith("/manager");
  if (!isDashboard && !isManager) return NextResponse.next();

  const session = req.cookies.get("sgc_session")?.value;
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAdmin = tokenHasRole(session, "ADMIN");

  if (isManager && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isDashboard && isAdmin) {
    return NextResponse.redirect(new URL("/manager", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/manager/:path*"],
};
