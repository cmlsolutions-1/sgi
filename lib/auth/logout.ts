"use client";

export async function doLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // aunque falle la llamada, igual redirigimos al login
  }
}
