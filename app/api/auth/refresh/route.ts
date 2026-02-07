import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ message: "refreshToken requerido" }, { status: 400 });
    }

    const API_URL = process.env.API_URL;
    if (!API_URL) {
      return NextResponse.json({ message: "API_URL no configurada" }, { status: 500 });
    }

    const r = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const backendJson = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { message: backendJson?.message ?? "No se pudo refrescar sesión" },
        { status: r.status }
      );
    }

    const newAccess = backendJson?.data?.accesToken;
    const newRefresh = backendJson?.data?.refreshToken;

    if (!newAccess || !newRefresh) {
      return NextResponse.json({ message: "Respuesta inválida del servidor" }, { status: 502 });
    }

    // respuesta simple al front
    return NextResponse.json(
      { token: newAccess, refreshToken: newRefresh },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Error procesando refresh" }, { status: 400 });
  }
}
