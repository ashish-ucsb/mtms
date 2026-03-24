"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { TelemetryFrame } from "@/lib/types"

interface TelemetryChartProps {
  frames: TelemetryFrame[]
  field: keyof TelemetryFrame
  label: string
  unit: string
  color: string
  warningThreshold?: number
}

export default function TelemetryChart({ frames, field, label, unit, color, warningThreshold }: TelemetryChartProps) {
  const data = frames.slice(-120).map(f => ({
    t: f.t,
    v: typeof f[field] === "number" ? Math.round((f[field] as number) * 10) / 10 : 0,
  }))

  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="mono text-xs text-muted-foreground uppercase tracking-widest mb-2">
        {label} <span className="opacity-50 normal-case">({unit})</span>
      </p>
      <ResponsiveContainer width="100%" height={90}>
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -24 }}>
          <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: "Geist Mono" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 9, fill: "#94a3b8", fontFamily: "Geist Mono" }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11, fontFamily: "Geist Mono", color: "hsl(var(--foreground))" }}
            formatter={(v: number) => [`${v} ${unit}`, label]}
            labelFormatter={(t) => `t = ${t}s`}
          />
          {warningThreshold && (
            <ReferenceLine y={warningThreshold} stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={0.8} />
          )}
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}