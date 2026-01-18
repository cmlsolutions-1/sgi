// app/api/auth/lookup/route.ts
import { NextResponse } from "next/server";
import { findUserByEmail } from "@/lib/auth-mock";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const user = findUserByEmail(email);

  // Por seguridad: no digas "no existe". Solo devuelve vacío.
  if (!user) {
    return NextResponse.json({ companies: [] }, { status: 200 });
  }

  return NextResponse.json({
    companies: user.companies,
    role: user.role,
  });
}
