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
  const store = useAuthStore.getState();
  const token = store.accessToken;

  try {
    if (token) {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      // Para debug
      const body = await res.json().catch(() => null);
      console.log("LOGOUT RESPONSE:", res.status, body);

      // Si no es 401, y no ok, avisa
      if (!res.ok && res.status !== 401) {
        console.warn("Logout backend failed:", res.status, body);
      }
    }
  } finally {
    // ✅ 1) limpia el estado en memoria
    store.clear();

    // ✅ 2) borra el storage persistido de zustand (CRÍTICO)
    await useAuthStore.persist.clearStorage();

    // ✅ 3) borra llaves legacy por si quedaron de antes
    localStorage.removeItem("sgc_at");
    localStorage.removeItem("sgc_rt");
    localStorage.removeItem("sgc_role");
    localStorage.removeItem("sgc_modules");
    localStorage.removeItem("sgc_auth"); // nombre del persist
  }
}
