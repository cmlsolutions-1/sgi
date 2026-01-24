// app/api/auth/lookup/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const API_URL = process.env.API_URL;
    if (!API_URL) {
      return NextResponse.json({ error: "API_URL no configurada" }, { status: 500 });
    }

    const r = await fetch(`${API_URL}/api/auth/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const backendJson = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { error: backendJson?.message ?? "No se pudo consultar" },
        { status: r.status }
      );
    }

    // ADAPTACIÓN: aquí debes mapear a lo que tu UI espera:
    // { role: "superadmin"|"asesor"|"empresa", companies: [{id,name}] }
    return NextResponse.json(
      {
        role: backendJson?.role ?? backendJson?.data?.role ?? null,
        companies: backendJson?.companies ?? backendJson?.data?.companies ?? [],
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Error procesando lookup" }, { status: 400 });
  }
}
