"use client"

import { type FormEvent, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, FileCheck2, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { ConsentSignaturePad } from "@/components/data-processing/ConsentSignaturePad"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  acceptDataConsent,
  dataAuthorizationStatusLabels,
  downloadConsentCertificate,
  getPublicDataConsent,
  verifyDataConsentIdentity,
} from "@/services/dataProcessingService"
import type { EmployeeDataConsent, PublicDataConsent } from "@/types/manager/data-processing"

type Step = 1 | 2 | 3 | 4

function formatDateTime(value?: string | null) {
  if (!value) return "No registrada"
  return new Date(value).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StepBadge({ currentStep }: { currentStep: Step }) {
  if (currentStep === 4) return null
  const titles = {
    1: "Paso 1 de 3 — Verifica tu identidad",
    2: "Paso 2 de 3 — Revisa la autorización",
    3: "Paso 3 de 3 — Firma y acepta",
  }

  return <Badge className="bg-primary text-primary-foreground">{titles[currentStep]}</Badge>
}

export default function PublicAuthorizationPage() {
  const params = useParams<{ token: string }>()
  const token = String(params?.token ?? "")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [publicConsent, setPublicConsent] = useState<PublicDataConsent | null>(null)
  const [acceptedConsent, setAcceptedConsent] = useState<EmployeeDataConsent | null>(null)
  const [documentNumber, setDocumentNumber] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [identityError, setIdentityError] = useState("")
  const [readAccepted, setReadAccepted] = useState(false)
  const [signature, setSignature] = useState({ isSigned: false, dataUrl: "" })

  useEffect(() => {
    async function loadConsent() {
      setLoading(true)
      const data = await getPublicDataConsent(token)
      setPublicConsent(data)
      setLoading(false)
    }

    loadConsent()
  }, [token])

  const canShowDocument = useMemo(() => Boolean(publicConsent?.templateContent), [publicConsent?.templateContent])

  async function handleVerify(event: FormEvent) {
    event.preventDefault()
    setIdentityError("")

    if (!documentNumber.trim() || !birthDate) {
      setIdentityError("Ingresa el número de documento y la fecha de nacimiento para continuar.")
      return
    }

    setSubmitting(true)
    try {
      const result = await verifyDataConsentIdentity(token, documentNumber, birthDate)
      if (!result.ok || !result.publicConsent) {
        setIdentityError(result.message)
        return
      }

      setPublicConsent(result.publicConsent)
      setStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  function handleContinueToSignature() {
    if (!readAccepted) {
      toast.error("Debes confirmar que leíste y comprendiste la autorización")
      return
    }
    setStep(3)
  }

  async function handleAccept() {
    if (!signature.isSigned || !signature.dataUrl) {
      toast.error("La firma del titular es obligatoria")
      return
    }

    setSubmitting(true)
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const consent = await acceptDataConsent(token, signature.dataUrl, idempotencyKey)
      setAcceptedConsent(consent)
      setStep(4)
      toast.success("Autorización registrada correctamente")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar la autorización")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!publicConsent || publicConsent.status === "EXPIRED") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <Card className="mx-auto max-w-lg rounded-xl">
          <CardContent className="space-y-4 p-6 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="text-xl font-bold text-slate-900">Enlace no disponible</h1>
            <p className="text-sm text-muted-foreground">
              La autorización no existe, ya fue utilizada o el enlace se encuentra vencido. Solicita un nuevo enlace a la empresa.
            </p>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-5 sm:py-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
              <Image src="/SGI-nube.png" alt="SafeCloud" fill className="object-contain p-1" priority />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">SafeCloud</p>
              <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-2xl">
                Autorización para el Tratamiento de Datos Personales
              </h1>
            </div>
          </div>
          <div className="mt-4 grid gap-2 rounded-xl bg-slate-50 p-3 text-sm sm:grid-cols-2">
            <p>
              <span className="font-medium">Empresa:</span> {publicConsent.companyName}
            </p>
            <p>
              <span className="font-medium">Titular:</span> {publicConsent.employeeName}
            </p>
          </div>
        </header>

        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <StepBadge currentStep={step} />

            {step === 1 && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Verifica tu identidad</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Antes de mostrar el documento completo necesitamos confirmar que los datos coinciden con el registro de la empresa.
                  </p>
                </div>
                {identityError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No pudimos validar la información</AlertTitle>
                    <AlertDescription>{identityError}</AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="documentNumber">Número de documento</Label>
                    <Input
                      id="documentNumber"
                      inputMode="numeric"
                      value={documentNumber}
                      onChange={(event) => setDocumentNumber(event.target.value)}
                      placeholder="Ingresa tu documento"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                    <Input id="birthDate" type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2 sm:w-auto" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Validar identidad
                </Button>
              </form>
            )}

            {step === 2 && canShowDocument && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{publicConsent.templateTitle}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Versión {publicConsent.templateVersion}</p>
                </div>
                <div className="max-h-[48vh] overflow-y-auto rounded-xl border bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {publicConsent.templateContent}
                </div>
                <label className="flex items-start gap-3 rounded-xl border p-3 text-sm">
                  <Checkbox checked={readAccepted} onCheckedChange={(checked) => setReadAccepted(checked === true)} />
                  <span>
                    Declaro que he leído y comprendido la autorización para el tratamiento de mis datos personales y autorizo
                    su tratamiento conforme a las finalidades y condiciones allí establecidas.
                  </span>
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Volver
                  </Button>
                  <Button type="button" onClick={handleContinueToSignature}>
                    Continuar a firma
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Confirma y firma</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estás a punto de autorizar el tratamiento de tus datos personales.
                  </p>
                </div>
                <div className="grid gap-3 rounded-xl border bg-slate-50 p-4 text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-medium">Titular:</span> {publicConsent.employeeName}
                  </p>
                  <p>
                    <span className="font-medium">Documento:</span> {publicConsent.documentType} {publicConsent.documentNumberMasked}
                  </p>
                  <p>
                    <span className="font-medium">Empresa:</span> {publicConsent.companyName}
                  </p>
                  <p>
                    <span className="font-medium">Versión:</span> {publicConsent.templateVersion}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-medium">Fecha:</span> {formatDateTime(new Date().toISOString())}
                  </p>
                </div>
                <ConsentSignaturePad onChange={setSignature} disabled={submitting} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} disabled={submitting}>
                    Volver
                  </Button>
                  <Button type="button" className="gap-2" onClick={handleAccept} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                    Aceptar y firmar autorización
                  </Button>
                </div>
              </div>
            )}

            {step === 4 && acceptedConsent && (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Autorización registrada correctamente</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Tu autorización para el tratamiento de datos personales fue registrada satisfactoriamente.
                  </p>
                </div>
                <div className="mx-auto grid max-w-xl gap-3 rounded-xl border bg-slate-50 p-4 text-left text-sm sm:grid-cols-2">
                  <p>
                    <span className="font-medium">Empresa:</span> {acceptedConsent.employee.companyName}
                  </p>
                  <p>
                    <span className="font-medium">Fecha:</span> {formatDateTime(acceptedConsent.acceptedAt)}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-medium">Número de constancia:</span> {acceptedConsent.verificationCode}
                  </p>
                </div>
                <Button type="button" className="gap-2" onClick={() => downloadConsentCertificate(acceptedConsent)}>
                  <FileCheck2 className="h-4 w-4" />
                  Descargar constancia
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
