"use client"

import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { User } from "@/types/manager/user"

type Props = {
  disabled?: boolean
  companyName?: string
  user: User
  onChangePassword: (password: string) => Promise<boolean>
}

export function ChangeCompanyAdminPasswordDialog({ disabled, companyName, user, onChangePassword }: Props) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)

  function reset() {
    setPassword("")
    setConfirmPassword("")
  }

  async function submit() {
    if (password.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setSaving(true)
    try {
      const changed = await onChangePassword(password)
      if (!changed) return

      toast.success("Contraseña actualizada correctamente")
      reset()
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="border-border text-foreground hover:bg-secondary"
        >
          <KeyRound className="h-4 w-4 mr-2" />
          Cambiar contraseña
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Cambiar contraseña</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Actualiza la contraseña del administrador {user.name} {companyName ? `de ${companyName}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2 rounded-md bg-secondary p-3 text-sm">
            <p className="font-medium text-foreground">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Nueva contraseña</Label>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="bg-input border-border text-foreground"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-foreground">Confirmar contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite la contraseña"
              className="bg-input border-border text-foreground"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={saving || password.length < 8 || confirmPassword.length < 8}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar contraseña
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
