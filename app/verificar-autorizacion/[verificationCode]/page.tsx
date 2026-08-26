"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams } from "next/navigation"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { dataAuthorizationStatusLabels, getPublicConsentVerification } from "@/services/dataProcessingService"
import type { PublicConsentVerification } from "@/types/manager/data-processing"

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function VerifyAuthorizationPage() {
  const params = useParams<{ verificationCode: string }>()
  const verificationCode = String(params?.verificationCode ?? "")
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState<PublicConsentVerification | null>(null)

  useEffect(() => {
    async function loadVerification() {
      setLoading(true)
      const data = await getPublicConsentVerification(verificationCode)
      setVerification(data)
      setLoading(false)
    }

    loadVerification()
  }, [verificationCode])

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <Card className="mx-auto max-w-lg rounded-2xl">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
              <Image src="/SGI-nube.png" alt="SafeCloud" fill className="object-contain p-1" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-primary">SafeCloud</p>
              <h1 className="text-lg font-bold text-slate-900">Verificación de autorización</h1>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : verification?.valid ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <h2 className="font-bold">Documento válido</h2>
                  <p className="text-sm">La constancia existe y se encuentra registrada en SafeCloud.</p>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                <p>
                  <span className="font-medium">Empresa:</span> {verification.companyName}
                </p>
                <p>
                  <span className="font-medium">Titular:</span> {verification.protectedEmployeeName}
                </p>
                <p>
                  <span className="font-medium">Fecha de aceptación:</span> {formatDateTime(verification.acceptedAt)}
                </p>
                <p>
                  <span className="font-medium">Versión:</span> {verification.templateVersion}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Estado:</span>
                  <Badge className="bg-emerald-600 text-white">{dataAuthorizationStatusLabels[verification.status]}</Badge>
                </div>
                <p className="break-all">
                  <span className="font-medium">Código de verificación:</span> {verification.verificationCode}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-700">
              <AlertTriangle className="h-6 w-6" />
              <div>
                <h2 className="font-bold">No se encontró la constancia</h2>
                <p className="text-sm">Verifica el código o solicita una constancia válida a la empresa.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
