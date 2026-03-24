import { AlertTriangle, AlertCircle, X } from "lucide-react"
import { AnomalyFlag } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AnomalyBannerProps {
  anomaly: AnomalyFlag
  onDismiss?: () => void
}

export default function AnomalyBanner({ anomaly, onDismiss }: AnomalyBannerProps) {
  const isCritical = anomaly.severity === "critical"
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm animate-slide-in",
      isCritical
        ? "border-destructive/40 bg-destructive/5 text-destructive"
        : "border-yellow-500/40 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-500/30"
    )}>
      {isCritical
        ? <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
        : <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="mono text-xs font-semibold uppercase tracking-wider mb-0.5">
          {anomaly.severity} — {anomaly.type.replace(/_/g, " ")}
        </p>
        <p className="text-xs opacity-80 leading-snug">{anomaly.message}</p>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-50 hover:opacity-100 transition-opacity mt-0.5">
          <X size={12} />
        </button>
      )}
    </div>
  )
}