export type JwtPayload = Record<string, any>;
export type UserRole = "ADMIN" | "ADMIN_COMPANY" | string;

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const decoded = atob(padded);
  // soporta utf-8
  return decodeURIComponent(
    decoded.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
  );
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload;
  } catch {
    return null;
  }
}

export function getTokenRoles(token: string | null): UserRole[] {
  if (!token) return [];

  const payload = decodeJwt(token);
  if (!payload) return [];

  const roles = Array.isArray(payload.roles) ? payload.roles : [];
  const role = typeof payload.role === "string" ? [payload.role] : [];

  return Array.from(new Set([...role, ...roles].filter((r): r is string => typeof r === "string")));
}

export function tokenHasRole(token: string | null, role: UserRole): boolean {
  return getTokenRoles(token).includes(role);
}

export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const payload = decodeJwt(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;

  if (!exp) return false;

  return exp * 1000 <= Date.now();
}
