import { useAuthStore } from "@/store/auth.store";

let refreshPromise: Promise<string | null> | null = null;

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

  setTokens(data.token, data.refreshToken);
  return data.token as string;
}

export async function apiFetch(input: string, init: RequestInit = {}) {
  const { accessToken, clear } = useAuthStore.getState();

  const doFetch = (t?: string | null) =>
    fetch(input, {
      ...init,
      headers: {
        ...(init.headers || {}),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
      },
    });

  let res = await doFetch(accessToken);

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
