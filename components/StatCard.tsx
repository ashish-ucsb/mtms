import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  status?: "live" | "warn" | "alert" | "idle"
  className?: string
}

export default function StatCard({ label, value, unit, status = "idle", className }: StatCardProps) {
  return (
    <div className={cn("relative rounded-md border border-border bg-card p-3", className)}>
      <p className="mono text-xs text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-semibold tracking-tight">{value}</span>
        {unit && <span className="mono text-xs text-muted-foreground mb-0.5">{unit}</span>}
        {status !== "idle" && (
          <div className={cn("w-2 h-2 rounded-full mb-1.5 ml-auto flex-shrink-0", {
            "status-live": status === "live",
            "status-warn": status === "warn",
            "status-alert": status === "alert",
          })} />
        )}
      </div>
    </div>
  )
}