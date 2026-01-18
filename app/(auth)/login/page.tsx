"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Company = { id: string; name: string };
type Role = "superadmin" | "asesor" | "empresa";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [role, setRole] = useState<Role | null>(null);

  const [companyId, setCompanyId] = useState<string>("");
  const [password, setPassword] = useState("");

  const [bannerError, setBannerError] = useState(false);

  const canConsult = useMemo(() => email.trim().includes("@"), [email]);

  async function handleConsult() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      const list: Company[] = data?.companies ?? [];

      setCompanies(list);
      setRole(data?.role ?? null);

      if (list.length === 1) setCompanyId(list[0].id);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyId, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "No se pudo iniciar sesión");
        return;
      }

      // ✅ Redirect por rol
      if (role === "superadmin") router.push("/manager");
      else router.push("/dashboard");

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function resetToStep1() {
    setStep(1);
    setCompanies([]);
    setCompanyId("");
    setPassword("");
    setRole(null);
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-slate-50">
      {/* LADO IZQUIERDO – HERO */}
      <div className="relative hidden md:flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Fondo con gradiente */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-blue-900" />

        {/* Glow decorativo */}
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

        {/* Contenido */}
        <div className="relative z-10 w-[86%] max-w-2xl">
          {/* Imagen o fallback */}
          {!bannerError ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur">
              <Image
                src="logo.png"
                alt="SafeCloud"
                width={1600}
                height={900}
                priority
                onError={() => setBannerError(true)}
                className="w-full h-auto rounded-xl object-contain"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-white/10 grid place-items-center text-white text-2xl font-bold">
                SC
              </div>
              <p className="text-slate-200">
                (No se encontró <span className="font-semibold">/public/safecloud-logo.png</span>)
              </p>
              <p className="text-slate-400 text-sm mt-2">
                Pon tu banner en la carpeta <span className="font-semibold">public</span> y reinicia el servidor.
              </p>
            </div>
          )}

          <div className="mt-8 text-center">

          </div>
        </div>
      </div>

      {/* LADO DERECHO – FORMULARIO */}
        <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="text-center">
            <CardTitle className="text-center">
                Iniciar Sesión
            </CardTitle>
            </CardHeader>

          <CardContent>
            {/* PASO 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  disabled={!canConsult || loading}
                  className="w-full"
                  onClick={handleConsult}
                >
                  {loading ? "Consultando..." : "Consultar"}
                </Button>
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="truncate max-w-[240px]">{email}</span>
                  <button
                    type="button"
                    className="underline"
                    onClick={resetToStep1}
                  >
                    Cambiar
                  </button>
                </div>

                <div className="space-y-2">
                  <Label>Empresa</Label>
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {companies.length === 0 && (
                    <p className="text-sm text-destructive">
                      No hay empresas asociadas a este correo.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !companyId || !password || companies.length === 0}
                >
                  {loading ? "Ingresando..." : "Iniciar sesión"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
