// components/manager/super-admin/CiiuCard.tsx
"use client"

import type { NivelRiesgoItem } from "@/types/manager/super-admin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  ciiu: string
  setCiiu: (v: string) => void
  ciiuResults: NivelRiesgoItem[]
  ciiuError: string | null
  onConsultar: () => void
  onLimpiar: () => void
}

export function CiiuCard({ ciiu, setCiiu, ciiuResults, ciiuError, onConsultar, onLimpiar }: Props) {
  return (
    <Card className="bg-card border-border shadow-sm mb-8">
      <CardHeader>
        <CardTitle className="text-foreground">Consulta de Riesgo por CIIU</CardTitle>
        <CardDescription className="text-muted-foreground">
          Ingresa el código CIIU para ver a qué clase(s) de riesgo está asociado.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
          <div className="grid gap-2">
            <Label htmlFor="ciiu" className="text-foreground">
              CÓDIGO CIIU
            </Label>
            <Input
              id="ciiu"
              value={ciiu}
              onChange={(e) => setCiiu(e.target.value)}
              placeholder="Ej: 6201"
              className="bg-input border-border text-foreground"
              inputMode="numeric"
            />
          </div>

          <Button onClick={onConsultar} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Consultar
          </Button>

          {Boolean(ciiu || ciiuResults.length > 0 || ciiuError) && (
            <Button variant="outline" onClick={onLimpiar} className="border-border text-foreground hover:bg-secondary">
              Cerrar
            </Button>
          )}
        </div>

        {ciiuError && <div className="text-sm text-destructive">{ciiuError}</div>}

        {ciiuResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Resultados para:</span>

              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                CIIU {ciiu.replace(/[^\d]/g, "")}
              </Badge>

              {Array.from(new Set(ciiuResults.map((r) => r["CLASE DE RIESGO"])))
                .sort((a, b) => a - b)
                .map((clase) => (
                  <Badge key={clase} className="bg-primary/10 text-primary border-primary/20" variant="outline">
                    Clase de riesgo: {clase}
                  </Badge>
                ))}
            </div>

            <div className="grid gap-3">
              {ciiuResults.map((r, idx) => (
                <div
                  key={`${r["CÓDIGO CIIU"]}-${r["CODIGO ADICIONAL"]}-${idx}`}
                  className="p-4 rounded-lg border border-border bg-white shadow-sm space-y-2"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-border text-foreground">
                      CIIU {r["CÓDIGO CIIU"]}
                    </Badge>
                    <Badge variant="outline" className="border-border text-foreground">
                      Adicional {r["CODIGO ADICIONAL"]}
                    </Badge>
                    <Badge className="bg-success/20 text-success border-success/30" variant="outline">
                      Riesgo {r["CLASE DE RIESGO"]}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{r["DESCRIPCION DE ACTIVIDAD ECONÓMICA FINAL"]}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
