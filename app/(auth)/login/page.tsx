//app/(auth)/login/page.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Lock, User } from "lucide-react";

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

  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const canConsult = useMemo(() => email.trim().includes("@"), [email]);

  async function handleConsult() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("No se pudo consultar el correo. Intenta nuevamente.");
        return;
      }

      const data = await res.json();
      const list: Company[] = data?.companies ?? [];

      setCompanies(list);
      setRole(data?.role ?? null);

      if (list.length === 1) setCompanyId(list[0].id);
      setStep(2);

      if (list.length === 0) setError("No hay empresas asociadas a este correo.");
    } catch {
      setError("Error al consultar. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, companyId, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.error ?? "Credenciales incorrectas");
        return;
      }

      if (role === "superadmin") router.push("/manager");
      else router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error al iniciar sesión. Intente nuevamente.");
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
    setError("");
  }

  return (
    <div className="flex h-screen w-screen bg-white">
      {/* IZQUIERDA (50%) - banner a pantalla completa */}
      <div className="relative hidden md:block w-1/2 overflow-hidden">
        {/* Banner como background */}
        <Image
          src="/logo.png"
          alt="SafeCloud"
          fill
          priority
          className="object-cover"
          sizes="50vw"
        />

        {/* Overlay leve para legibilidad del texto */}
        <div className="absolute inset-0 bg-black/15" />


      </div>

      {/* DERECHA (50%) - formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
          </div>

          {/* PASO 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="h-12 w-full rounded-full bg-white
                  border border-gray-300
                  pl-11 pr-4
                  outline-none
                  focus:ring-2 focus:ring-[#187ef2]/30"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center text-sm text-red-500">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!canConsult || loading}
                onClick={handleConsult}
                className={`w-full h-12 rounded-full text-lg font-medium transition-colors ${
                  !canConsult || loading
                    ? "bg-[#187ef2] cursor-not-allowed text-white"
                    : "bg-[#187ef2] hover:bg-[#187ef2c7] text-white"
                }`}
              >
                {loading ? "Consultando..." : "Consultar"}
              </button>

              {/* Logo empresa (corrige la ruta en /public) */}
              <div className="mt-2 text-center">
                <img
                  src="/SGI.png"
                  alt="Logo Empresa"
                  className="max-w-full h-12 md:h-16 mx-auto"
                />
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="truncate max-w-[240px]">{email}</span>
                <button
                  type="button"
                  className="underline hover:text-gray-700"
                  onClick={resetToStep1}
                >
                  Cambiar
                </button>
              </div>

              <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Empresa</label>

          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 z-10 pointer-events-none" />

            <Select
              value={companyId}
              onValueChange={setCompanyId}
              disabled={companies.length === 0}
            >
              <SelectTrigger
                className="
                h-12 min-h-[3rem]
                w-full rounded-full bg-white
                border border-gray-300
                pl-11 pr-4
                py-0
                flex items-center
                outline-none
                focus:ring-2 focus:ring-[#187ef2]/30
                data-placeholder:text-gray-400
                "
              >
                <SelectValue placeholder="Selecciona una empresa" />
              </SelectTrigger>

              <SelectContent
                className="
                  mt-2 rounded-2xl border border-gray-200
                  bg-white shadow-xl
                  overflow-hidden
                "
              >
                {companies.map((c) => (
                  <SelectItem
                    key={c.id}
                    value={c.id}
                    className="cursor-pointer rounded-xl mx-1 my-1 focus:bg-[#187ef2]/10"
                  >
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {companies.length === 0 && (
            <p className="text-sm text-red-500">
              No hay empresas asociadas a este correo.
            </p>
          )}
        </div>


              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="h-12 w-full rounded-full bg-white
                  border border-gray-300
                  pl-11 pr-11
                  outline-none
                  focus:ring-2 focus:ring-[#187ef2]/30"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {error && (
                <div className="flex items-center text-sm text-red-500">
                  <AlertCircle className="mr-2 h-5 w-5" />
                  {error}
                </div>
              )}
              {/* ? "bg-[#187ef2] cursor-not-allowed text-white"
                    : "bg-[#187ef2] hover:bg-[#187ef2c7] text-white" */}

              <button
                type="submit"
                disabled={loading || !companyId || !password || companies.length === 0}
                className={`w-full h-12 rounded-full text-lg font-medium transition-colors ${
                  loading || !companyId || !password || companies.length === 0
                    ? "bg-[#187ef2] cursor-not-allowed text-white"
                    : "bg-[#187ef2] hover:bg-[#187ef2c7] text-white"
                }`}
              >
                {loading ? "Iniciando..." : "Ingresar"}
              </button>

              <div className="mt-2 text-center">
                <img
                  src="/SGI.png"
                  alt="Logo Empresa"
                  className="max-w-full h-12 md:h-16 mx-auto"
                />
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
