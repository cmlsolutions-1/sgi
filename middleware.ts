// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionJwt, sessionVerificationConfig } from "@/lib/jwt-verification";
import { contentSecurityPolicy } from "@/lib/security-headers.mjs";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isDashboard = /^\/dashboard(\/|$)/.test(pathname);
  const isManager = /^\/manager(\/|$)/.test(pathname);
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24))));
  const csp = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const secure = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  if (!isDashboard && !isManager) return secure(NextResponse.next({ request: { headers: requestHeaders } }));

  const session = req.cookies.get("sgc_session")?.value;
  const payload = session ? await verifySessionJwt(session, sessionVerificationConfig()) : null;
  if (!payload) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    const response = NextResponse.redirect(url);
    response.cookies.delete("sgc_session");
    return secure(response);
  }

  const roles = [payload.role, ...(Array.isArray(payload.roles) ? payload.roles : [])];
  const isAdmin = roles.includes("ADMIN");

  if (isManager && !isAdmin) {
    return secure(NextResponse.redirect(new URL("/dashboard", req.url)));
  }

  if (isDashboard && isAdmin) {
    return secure(NextResponse.redirect(new URL("/manager", req.url)));
  }

  return secure(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: ["/dashboard/:path*", "/manager/:path*", "/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|css|js|map|txt|xml)$).*)"],
};
