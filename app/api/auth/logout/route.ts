import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const API_URL = process.env.API_URL;

  if (!API_URL) {
    return NextResponse.json(
      { message: "API_URL no configurada" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { message: "Token requerido" },
      { status: 401 }
    );
  }

  const r = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
  });

  const backendJson = await r.json().catch(() => ({}));

  if (!r.ok) {
    return NextResponse.json(
      { message: backendJson?.message ?? "No se pudo cerrar sesión" },
      { status: r.status }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
