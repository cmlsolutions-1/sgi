import { NextResponse } from "next/server";

export async function POST() {
  // Ajusta el nombre de tu cookie real si ya usas uno distinto.
  // Ejemplos comunes: "token", "access_token", "session", etc.
  const cookieName = "token";

  const res = NextResponse.json({ ok: true });

  // Borra cookie (Max-Age=0). Si tu cookie usa path/domain específicos, igualarlos aquí.
  res.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}
