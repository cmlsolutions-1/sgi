//app/(auth)/login/page.tsx

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMyModules } from "@/services/modulesService";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Building2, Eye, EyeOff, Lock, Mail } from "lucide-react";


import { tokenHasRole } from "@/lib/jwt";
import { useAuthStore, type AuthState } from "@/store/auth.store";

type Company = { id: string; name: string };
type Role = "superadmin" | "asesor" | "empresa";

export default function LoginPage() {
  const router = useRouter();
  const setTokens = useAuthStore((s: AuthState) => s.setTokens);
  const setModules = useAuthStore((s: AuthState) => s.setModules);


  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [role, setRole] = useState<Role | null>(null);

  const [companyId, setCompanyId] = useState<string>("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const [userId, setUserId] = useState<string>("");

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
      setUserId(data?.userId ?? "");

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

  console.log("LOGIN DATA:", { email, userId, companyId, password });

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    // leer JSON UNA SOLA VEZ
    const json = await res.json().catch(() => ({}));
    console.log("LOGIN RESPONSE:", res.status, json);

    if (!res.ok) {
      setError(json?.error ?? json?.message ?? "Credenciales incorrectas");
      return;
    }

    //  validar tokens
    if (!json?.token || !json?.refreshToken) {
      setError("Login OK pero faltan tokens (token/refreshToken)");
      return;
    }

    const isAdmin = tokenHasRole(json.token, "ADMIN");

    // guardar tokens en Zustand
    setTokens(json.token, json.refreshToken);

    if (isAdmin) {
      setModules([]);
      router.push("/manager");
      router.refresh();
      return;
    }

    //  cargar módulos para usuarios de empresa
    const modules = await getMyModules();
    setModules(modules);
    router.push("/dashboard");

    router.refresh();
  } catch (err) {
    console.error("LOGIN ERROR:", err);
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
    setUserId("");
  }

  return (
    <main className="flex min-h-svh w-full flex-col overflow-x-hidden bg-white text-[#08213f] lg:flex-row">
      <section className="relative hidden min-h-svh overflow-hidden bg-[#061f38] px-10 py-10 text-white lg:flex lg:w-[55%] lg:flex-col lg:items-center lg:justify-center xl:px-16 xl:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_34%,rgba(26,188,220,0.24),transparent_28%),linear-gradient(135deg,#031d35_0%,#062844_52%,#041a30_100%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(120deg,transparent_0%,transparent_48%,rgba(32,181,232,0.22)_49%,transparent_50%),radial-gradient(circle,rgba(41,172,226,0.42)_1px,transparent_1px)] [background-position:0_0,0_0] [background-size:260px_260px,30px_30px]" />
        <div className="absolute -bottom-28 -left-10 h-80 w-[34rem] rounded-[50%] border-[54px] border-cyan-400/[0.06]" />
        <div className="absolute -bottom-36 left-52 h-[28rem] w-[38rem] rotate-[-42deg] rounded-[50%] border-[52px] border-sky-400/[0.06]" />
        <div className="absolute bottom-0 left-0 right-0 h-36 opacity-35 [background-image:repeating-radial-gradient(ellipse_at_bottom,rgba(0,194,255,0.45)_0_1px,transparent_2px_12px)]" />

        <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
          <div className="relative flex h-64 w-64 items-center justify-center xl:h-80 xl:w-80">
            <div className="absolute inset-0 rounded-full border border-cyan-300/15" />
            <div className="absolute inset-8 rounded-full border border-sky-300/10" />
            <div className="absolute h-px w-[22rem] bg-gradient-to-r from-transparent via-cyan-300/25 to-transparent xl:w-[29rem]" />
            <div className="absolute h-[22rem] w-px bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent xl:h-[29rem]" />
            <div className="absolute -left-10 top-12 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left shadow-2xl shadow-cyan-950/20 backdrop-blur-sm xl:-left-16 xl:top-16 xl:px-4 xl:py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Control</p>
              <p className="mt-1 text-sm font-medium text-white/90">Procesos SGI</p>
            </div>
            <div className="absolute -right-10 top-24 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left shadow-2xl shadow-cyan-950/20 backdrop-blur-sm xl:-right-16 xl:top-28 xl:px-4 xl:py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-sky-200/80">Gestión</p>
              <p className="mt-1 text-sm font-medium text-white/90">Indicadores</p>
            </div>
            <div className="absolute bottom-4 rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-left shadow-2xl shadow-cyan-950/20 backdrop-blur-sm xl:bottom-7 xl:px-4 xl:py-3">
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">Mejora</p>
              <p className="mt-1 text-sm font-medium text-white/90">Cumplimiento continuo</p>
            </div>
            <div className="relative h-20 w-20 overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-500/20 xl:h-30 xl:w-30 xl:rounded-[2.75rem]">
              <Image src="/icono4.png" alt="SafeCloud" fill priority className="object-cover" sizes="(min-width: 1280px) 160px, 112px" />
              <div className="absolute inset-0 rounded-[3.25rem] ring-1 ring-inset ring-white/10" />
            </div>
          </div>

          <p className="mt-6 px-4 text-2xl font-light leading-snug text-white xl:mt-8 xl:text-3xl">
            Gestión, cumplimiento y <span className="font-medium text-cyan-300">mejora continua</span>,
            <br />
            en un solo lugar.
          </p>
        </div>
      </section>

      <section className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-[#f7f9fd] px-4 py-8 sm:px-6 sm:py-10 lg:w-[45%]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.96),rgba(247,249,253,0.88)_46%,rgba(238,243,250,0.9)_100%)]" />
        <div className="absolute -bottom-44 -right-36 h-[32rem] w-[32rem] rounded-full border border-sky-200/60" />
        <div className="absolute -bottom-52 -right-48 h-[42rem] w-[42rem] rounded-full border border-sky-100/70" />
        <div className="absolute -bottom-64 -right-56 h-[54rem] w-[54rem] rounded-full border border-slate-200/70" />

        <div className="relative z-10 flex min-h-[calc(100svh-4rem)] w-full max-w-sm flex-col items-center justify-center gap-8 sm:max-w-md lg:min-h-[76vh] lg:justify-between">
          <div className="hidden w-full lg:block" />

          <div className="w-full space-y-7 sm:space-y-8">
            <div className="flex justify-center lg:hidden">
              <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-white/70 shadow-lg shadow-sky-900/10">
                <Image src="/icono4sinfondo.png" alt="SafeCloud" fill priority className="object-cover" sizes="64px" />
              </div>
            </div>

            <div className="flex justify-center">
              <Image
                src="/logoCompletoSinfondo.png"
                alt="SafeCloud Sistema de Gestión Integral"
                width={300}
                height={96}
                priority
                className="h-auto w-72 max-w-full object-contain mix-blend-multiply sm:w-96 lg:w-80 xl:w-96"
              />
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-[#08213f] sm:text-4xl">Iniciar sesión</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm text-slate-500 sm:mt-4 sm:max-w-md sm:text-base">
                {step === 1 ? "Ingresa tu correo electrónico para continuar" : "Selecciona la empresa e ingresa tu contraseña"}
              </p>
            </div>

            {step === 1 && (
              <div className="space-y-4 sm:space-y-5">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 sm:left-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo electrónico"
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white/75 pl-12 pr-4 text-sm text-[#08213f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 sm:h-14 sm:pl-14 sm:pr-5 sm:text-base"
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
                  className={`h-12 w-full rounded-2xl bg-gradient-to-r from-[#061f38] to-[#05b9d2] text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition sm:h-14 sm:text-base ${
                    !canConsult || loading
                      ? "cursor-not-allowed opacity-70"
                      : "hover:brightness-105 active:scale-[0.99]"
                  }`}
                >
                  {loading ? "Consultando..." : "Consultar"}
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-500 shadow-sm sm:px-5">
                  <span className="min-w-0 truncate">{email}</span>
                  <button
                    type="button"
                    className="font-semibold text-sky-700 hover:text-sky-800"
                    onClick={resetToStep1}
                  >
                    Cambiar
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Empresa</label>

                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-slate-400 sm:left-5" />

                    <Select value={companyId} onValueChange={setCompanyId} disabled={companies.length === 0}>
                      <SelectTrigger
                        className="
                          h-12 min-h-12 sm:h-14 sm:min-h-14
                          w-full rounded-2xl bg-white/75
                          border border-slate-300
                          pl-12 pr-4 sm:pl-14 sm:pr-5
                          py-0
                          flex items-center
                          outline-none
                          text-sm sm:text-base
                          shadow-sm
                          focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10
                          data-placeholder:text-slate-400
                        "
                      >
                        <SelectValue placeholder="Selecciona una empresa" />
                      </SelectTrigger>

                      <SelectContent className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
                        {companies.map((c) => (
                          <SelectItem
                            key={c.id}
                            value={c.id}
                            className="mx-1 my-1 cursor-pointer rounded-xl focus:bg-[#187ef2]/10"
                          >
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {companies.length === 0 && (
                    <p className="text-sm text-red-500">No hay empresas asociadas a este correo.</p>
                  )}
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 sm:left-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white/75 pl-12 pr-11 text-sm text-[#08213f] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10 sm:h-14 sm:pl-14 sm:pr-12 sm:text-base"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 sm:right-4"
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

                <button
                  type="submit"
                  disabled={loading || !companyId || !password || companies.length === 0}
                  className={`h-12 w-full rounded-2xl bg-gradient-to-r from-[#061f38] to-[#05b9d2] text-sm font-bold text-white shadow-lg shadow-sky-900/15 transition sm:h-14 sm:text-base ${
                    loading || !companyId || !password || companies.length === 0
                      ? "cursor-not-allowed opacity-70"
                      : "hover:brightness-105 active:scale-[0.99]"
                  }`}
                >
                  {loading ? "Iniciando..." : "Ingresar"}
                </button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-slate-500 sm:text-sm lg:pt-10">© 2026 SafeCloud · CML Solutions</p>
        </div>
      </section>
    </main>
  );
}
