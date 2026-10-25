// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { verifySessionJwt, sessionVerificationConfig } from "@/lib/jwt-verification";

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
      cache: "no-store",
      body: JSON.stringify({ userId, password }),
    });

    const backendJson = await r.json().catch(() => ({}));

    if (!r.ok) {
      return NextResponse.json(
        { message: backendJson?.message ?? "Credenciales incorrectas" },
        { status: r.status }
      );
    }

    const token = backendJson?.data?.accesToken;
    const refreshToken = backendJson?.data?.refreshToken;

    if (!token || !refreshToken) {
      return NextResponse.json({ error: "Tokens faltantes" }, { status: 502 });
    }

    // mantenemos tu formato, pero devolvemos refreshToken también
    const payload = await verifySessionJwt(token, sessionVerificationConfig());
    if (!payload) return NextResponse.json({ message: "No se pudo verificar la sesion. Contacta al administrador del sistema." }, { status: 502 });
    const response = NextResponse.json(
      {
        token,
        refreshToken,
        user: {
          _id: userId,
          id: userId,
          email: "",
          name: "",
          role: typeof payload?.role === "string" ? payload.role : "",
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );

    response.cookies.set("sgc_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.max(payload.exp - Math.floor(Date.now() / 1000), 0),
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Error procesando login" }, { status: 400 });
  }
}
