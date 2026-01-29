//services/authService.ts

import type { LoginResponse } from "@/interfaces/auth.interface";
import { useAuthStore } from "@/store/auth.store";

export async function loginRequest(userId: string, password: string): Promise<LoginResponse> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message ?? "Credenciales incorrectas");
  }

  return data as LoginResponse;
}

const ACCESS_TOKEN_KEY = "sgc_at";


export async function logoutRequest(): Promise<void> {
  const { accessToken, clear } = useAuthStore.getState();

  try {
    if (accessToken) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } finally {
    clear();
  }
}

