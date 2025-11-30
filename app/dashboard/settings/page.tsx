"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Building, Bell, Shield, Palette } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administra la configuración del sistema</p>
      </div>

      {/* Company Info */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building className="h-5 w-5" />
            Información de la Empresa
          </CardTitle>
          <CardDescription>Datos generales de la organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Nombre de la Empresa</Label>
              <Input id="company" defaultValue="Empresa S.A.S." className="bg-secondary border-0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nit">NIT</Label>
              <Input id="nit" defaultValue="900.123.456-7" className="bg-secondary border-0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" defaultValue="Calle 100 #15-20, Bogotá" className="bg-secondary border-0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" defaultValue="+57 1 234 5678" className="bg-secondary border-0" />
            </div>
          </div>
          <Button>Guardar Cambios</Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura las alertas del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Auditorías Próximas</p>
              <p className="text-xs text-muted-foreground">Recibir alertas de auditorías programadas</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Hallazgos Vencidos</p>
              <p className="text-xs text-muted-foreground">Alertas de acciones correctivas vencidas</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Documentos por Revisar</p>
              <p className="text-xs text-muted-foreground">Notificar documentos pendientes de aprobación</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Capacitaciones</p>
              <p className="text-xs text-muted-foreground">Recordatorios de capacitaciones programadas</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguridad
          </CardTitle>
          <CardDescription>Configuración de seguridad del sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Autenticación de dos factores</p>
              <p className="text-xs text-muted-foreground">Requiere verificación adicional al iniciar sesión</p>
            </div>
            <Switch />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Cierre de sesión automático</p>
              <p className="text-xs text-muted-foreground">Cerrar sesión después de 30 minutos de inactividad</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Cambiar Contraseña</Label>
            <div className="flex gap-2">
              <Input type="password" placeholder="Nueva contraseña" className="bg-secondary border-0" />
              <Button variant="outline">Cambiar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Apariencia
          </CardTitle>
          <CardDescription>Personaliza la interfaz del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Modo Oscuro</p>
              <p className="text-xs text-muted-foreground">Usar tema oscuro en toda la aplicación</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
