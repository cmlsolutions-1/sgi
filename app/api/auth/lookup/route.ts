// app/api/auth/lookup/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 });
    }

    const API_URL = process.env.API_URL;
    if (!API_URL) {
      return NextResponse.json({ message: "API_URL no configurada" }, { status: 500 });
    }

    // Backend: GET /api/auth/companies-by-email?email=...
    const url = new URL(`${API_URL}/api/auth/companies-by-email`);
    url.searchParams.set("email", email);

    const r = await fetch(url.toString(), { method: "GET" });
    const backendJson = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { message: backendJson?.message ?? "No se pudo consultar el correo" },
        { status: r.status }
      );
    }

    const rows = backendJson?.data ?? [];

    // Adaptar al formato que tu UI espera:
    // { companies: [{id,name}], userId, role? }
    const companies = rows.map((x: any) => ({
      id: x.companyId,
      name: x.companyName,
    }));

    const userId = rows[0]?.userId ?? "";

    // Role: si el backend aún no lo da aquí, déjalo null
    return NextResponse.json({ companies, userId, role: null }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Error procesando lookup" }, { status: 400 });
  }
}
