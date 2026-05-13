import { NextResponse } from "next/server";

function clearSessionCookie(response: NextResponse) {
  response.cookies.delete("sgc_session");
  return response;
}

export async function POST(req: Request) {
  const API_URL = process.env.API_URL;

  if (!API_URL) {
    return clearSessionCookie(
      NextResponse.json(
        { message: "API_URL no configurada" },
        { status: 500 }
      )
    );
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return clearSessionCookie(
      NextResponse.json(
        { message: "Token requerido" },
        { status: 401 }
      )
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
    return clearSessionCookie(NextResponse.json(
      { message: backendJson?.message ?? "No se pudo cerrar sesión" },
      { status: r.status }
    ));
  }

  return clearSessionCookie(NextResponse.json({ ok: true }, { status: 200 }));
}
