"use client"
import { SimConfig } from "@/lib/types"
import { cn } from "@/lib/utils"

interface SimConfigPanelProps {
  config: SimConfig
  onChange: (config: SimConfig) => void
  disabled?: boolean
}

const fields: {
  key: keyof SimConfig; label: string; unit: string
  min: number; max: number; step: number
}[] = [
    { key: "launch_angle", label: "Launch angle", unit: "°", min: 5, max: 89, step: 1 },
    { key: "launch_azimuth", label: "Azimuth", unit: "°", min: 0, max: 359, step: 1 },
    { key: "mass", label: "Mass", unit: "kg", min: 50, max: 2000, step: 10 },
    { key: "thrust", label: "Thrust", unit: "N", min: 1000, max: 200000, step: 1000 },
    { key: "burn_time", label: "Burn time", unit: "s", min: 1, max: 60, step: 1 },
    { key: "drag_coefficient", label: "Drag Cd", unit: "", min: 0.1, max: 1.5, step: 0.05 },
  ]

export default function SimConfigPanel({ config, onChange, disabled }: SimConfigPanelProps) {
  return (
    <div className="space-y-4">
      {fields.map(({ key, label, unit, min, max, step }) => (
        <div key={key}>
          <div className="flex justify-between mb-1.5">
            <label className="text-xs text-muted-foreground">{label}</label>
            <span className="mono text-xs font-medium text-foreground">
              {config[key]}{unit}
            </span>
          </div>
          <input
            type="range" min={min} max={max} step={step}
            value={config[key] as number}
            disabled={disabled}
            onChange={e => onChange({ ...config, [key]: parseFloat(e.target.value) })}
            className={cn(
              "w-full h-1.5 rounded-full appearance-none bg-secondary cursor-pointer",
              "accent-foreground disabled:opacity-40 disabled:cursor-not-allowed",
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5",
              "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full",
              "[&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:cursor-pointer"
            )}
          />
        </div>
      ))}
    </div>
  )
}