"use client"

import type { StoredDocument } from "@/lib/documents-storage"
import { SafeCloudFormDrawer } from "@/components/ui/safecloud-form-drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: StoredDocument | null
  renewDate: string
  setRenewDate: (v: string) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function RenewDialog({
  open,
  onOpenChange,
  target,
  renewDate,
  setRenewDate,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <SafeCloudFormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Renovar documento"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onConfirm}>Renovar</Button>
        </>
      }
    >
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Documento: <span className="font-medium text-foreground">{target?.name}</span>
          </div>

          <div className="space-y-2">
            <Label>Nueva fecha de vigencia (inicio)</Label>
            <Input type="date" value={renewDate} onChange={(e) => setRenewDate(e.target.value)} />
          </div>

        </div>
    </SafeCloudFormDrawer>
  )
}
