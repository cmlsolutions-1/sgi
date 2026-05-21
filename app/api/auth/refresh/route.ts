import { NextResponse } from "next/server";
import { decodeJwt } from "@/lib/jwt";

function getTokenMaxAge(token: string) {
  const payload = decodeJwt(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;

  if (!exp) return 60 * 60;

  return Math.max(exp - Math.floor(Date.now() / 1000), 0);
}

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

    const newAccess =
      backendJson?.data?.accesToken ??
      backendJson?.data?.accessToken ??
      backendJson?.accesToken ??
      backendJson?.accessToken ??
      backendJson?.token;
    const newRefresh = backendJson?.data?.refreshToken ?? backendJson?.refreshToken ?? refreshToken;

    if (!newAccess) {
      return NextResponse.json({ message: "Respuesta inválida del servidor" }, { status: 502 });
    }

    const response = NextResponse.json(
      { token: newAccess, refreshToken: newRefresh },
      { status: 200 }
    );

    response.cookies.set("sgc_session", newAccess, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getTokenMaxAge(newAccess),
    });

    return response;
  } catch {
    return NextResponse.json({ message: "Error procesando refresh" }, { status: 400 });
  }
}
