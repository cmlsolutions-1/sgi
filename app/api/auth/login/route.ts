// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth-mock";

function encodeSession(payload: any) {
  // MVP simple (NO prod). En prod usa JWT firmado + cookie httpOnly.
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export async function POST(req: Request) {
  const { email, companyId, password } = await req.json();

  if (!email || !companyId || !password) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });

  const allowed = user.companies.some((c) => c.id === companyId);
  if (!allowed) return NextResponse.json({ error: "Empresa no permitida" }, { status: 403 });

  if (user.password !== password) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const session = encodeSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    companyId,
    // puedes agregar companyName si quieres
  });

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set("sgc_session", session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // secure: true en prod
  });

  return res;
}
