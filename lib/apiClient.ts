//lib/apiClient.ts

import { useAuthStore } from "@/store/auth.store";
import { decodeJwt } from "@/lib/jwt";

let refreshPromise: Promise<string | null> | null = null;
const REFRESH_SKEW_MS = 60_000;

function getTokenMsUntilExpiry(token: string | null) {
  if (!token) return 0;

  const payload = decodeJwt(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;

  if (!exp) return Number.POSITIVE_INFINITY;

  return exp * 1000 - Date.now();
}

function shouldRefreshToken(token: string | null) {
  const msUntilExpiry = getTokenMsUntilExpiry(token);
  return msUntilExpiry <= REFRESH_SKEW_MS;
}

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setTokens } = useAuthStore.getState();
  if (!refreshToken) return null;

  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) return null;

  const token = data?.token ?? data?.accessToken ?? data?.accesToken ?? data?.data?.accesToken ?? data?.data?.accessToken;
  const nextRefreshToken = data?.refreshToken ?? data?.data?.refreshToken ?? refreshToken;

  if (!token) return null;

  setTokens(token, nextRefreshToken);
  return token as string;
}

export async function ensureFreshAccessToken(): Promise<string | null> {
  const { accessToken, clear } = useAuthStore.getState();

  if (!accessToken) return null;
  if (!shouldRefreshToken(accessToken)) return accessToken;

  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  const token = await refreshPromise;

  if (!token) {
    clear();
    return null;
  }

  return token;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const { clear } = useAuthStore.getState();

  const doFetch = (t?: string | null) =>
    fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
    });

  const token = await ensureFreshAccessToken();
  let res = await doFetch(token);

  if (res.status === 401) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;

    if (!newToken) {
      clear();
      throw new Error("Sesión expirada");
    }

    res = await doFetch(newToken);
  }

  return res;
}
