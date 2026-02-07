//app/api/modules/me/route.ts

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    return NextResponse.json({ message: "API_URL no configurada" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Token requerido" }, { status: 401 });
  }

  const r = await fetch(`${API_URL}/api/modules/me`, {
    method: "GET",
    headers: { Authorization: auth },
  });

  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    return NextResponse.json(
      { message: data?.message ?? "No se pudo obtener módulos" },
      { status: r.status }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
