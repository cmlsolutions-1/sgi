"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type PesvSelectOption = {
  value: string
  label: string
}

export function PesvSelect({
  value,
  options,
  onValueChange,
  placeholder = "Seleccionar",
  ariaLabel,
  disabled = false,
}: {
  value: string
  options: PesvSelectOption[]
  onValueChange: (value: string) => void
  placeholder?: string
  ariaLabel: string
  disabled?: boolean
}) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={ariaLabel} className="h-10 w-full min-w-0 bg-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
