// app/api/auth/login/route.ts

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json({ message: "Datos incompletos" }, { status: 400 });
    }

    const API_URL = process.env.API_URL;
    if (!API_URL) {
      return NextResponse.json({ message: "API_URL no configurada" }, { status: 500 });
    }

    const r = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    const backendJson = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { message: backendJson?.message ?? "Credenciales incorrectas" },
        { status: r.status }
      );
    }

    // Tokens reales del backend
    const token = backendJson?.data?.accesToken;
    if (!token) {
      return NextResponse.json({ error: "Token faltante" }, { status: 502 });
    }

    // Manteniendo tu interface actual (token + user)
    return NextResponse.json(
      {
        token,
        user: {
          _id: userId,
          id: userId,
          email: "",
          name: "",
          role: "",
        },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ error: "Error procesando login" }, { status: 400 });
  }
}
