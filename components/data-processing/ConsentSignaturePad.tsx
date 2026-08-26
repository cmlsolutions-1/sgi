"use client"

import { type PointerEvent, useEffect, useRef, useState } from "react"
import { RotateCcw, Signature } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ConsentSignaturePadProps = {
  onChange: (value: { isSigned: boolean; dataUrl: string }) => void
  disabled?: boolean
  className?: string
}

export function ConsentSignaturePad({ onChange, disabled, className }: ConsentSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const signedRef = useRef(false)
  const [isSigned, setIsSigned] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      const currentImage = signedRef.current ? canvas.toDataURL("image/png") : null
      canvas.width = Math.max(1, Math.floor(rect.width * ratio))
      canvas.height = Math.max(1, Math.floor(rect.height * ratio))

      const context = canvas.getContext("2d")
      if (!context) return
      context.scale(ratio, ratio)
      context.lineCap = "round"
      context.lineJoin = "round"
      context.lineWidth = 2.5
      context.strokeStyle = "#0f172a"

      if (currentImage) {
        const image = new Image()
        image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height)
        image.src = currentImage
      }
    }

    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [])

  function getPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function notifySigned() {
    const canvas = canvasRef.current
    if (!canvas) return
    signedRef.current = true
    setIsSigned(true)
    onChange({ isSigned: true, dataUrl: canvas.toDataURL("image/png") })
  }

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    canvas.setPointerCapture(event.pointerId)
    drawingRef.current = true
    const point = getPoint(event)
    context.beginPath()
    context.moveTo(point.x, point.y)
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return
    const context = canvasRef.current?.getContext("2d")
    if (!context) return

    const point = getPoint(event)
    context.lineTo(point.x, point.y)
    context.stroke()
    notifySigned()
  }

  function handlePointerEnd(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (canvas?.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId)
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    context.clearRect(0, 0, canvas.width, canvas.height)
    signedRef.current = false
    setIsSigned(false)
    onChange({ isSigned: false, dataUrl: "" })
  }

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-white p-3 shadow-sm", className)}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Signature className="h-4 w-4 text-primary" />
            Firma del titular
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Firme dentro del recuadro utilizando el mouse o su dispositivo táctil.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={clearSignature} disabled={disabled}>
          <RotateCcw className="h-4 w-4" />
          Limpiar
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        className={cn(
          "h-44 w-full touch-none rounded-md border border-dashed border-slate-300 bg-slate-50",
          disabled && "cursor-not-allowed opacity-60",
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      />
      <p className={cn("mt-2 text-xs", isSigned ? "text-emerald-600" : "text-slate-500")}>
        {isSigned ? "Firma capturada correctamente." : "La firma es obligatoria para completar la autorización."}
      </p>
    </div>
  )
}
