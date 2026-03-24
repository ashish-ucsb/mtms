"use client"
import dynamic from "next/dynamic"
import Nav from "@/components/Nav"
import StatCard from "@/components/StatCard"
import AnomalyBanner from "@/components/AnomalyBanner"
import TelemetryChart from "@/components/TelemetryChart"
import SimConfigPanel from "@/components/SimConfigPanel"
import { useSim } from "@/lib/SimContext"
import { Play, RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

const TrajectoryViewer = dynamic(() => import("@/components/TrajectoryViewer"), { ssr: false })

export default function TrackingPage() {
  const { simData, config, setConfig, visibleIdx, simState, error, launch, reset } = useSim()
  const { frames, summary, anomalies } = simData
  const [configOpen, setConfigOpen] = useState(false)

  const visibleFrames = frames.slice(0, visibleIdx + 1)
  const currentFrame = frames[visibleIdx] ?? null
  const fmt = (v?: number | null, d = 0) => (v !== undefined && v !== null) ? v.toFixed(d) : "—"

  const statusLabel =
    simState === "loading" ? "Computing…" :
      simState === "playing" ? "Simulation active" :
        simState === "complete" ? "Mission complete" : "Standby"

  const isRunning = simState === "loading" || simState === "playing"

  return (
    <div className="h-screen flex flex-col pt-12">
      <Nav />

      {/* ── Mobile: single scrollable column ── */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-3">

          {/* Status bar */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${simState === "playing" ? "status-live" :
                simState === "complete" ? "status-warn" :
                  simState === "loading" ? "status-warn" : "bg-muted-foreground/30"}`}
            />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
            {currentFrame && <span className="mono text-xs text-muted-foreground ml-auto">t = {fmt(currentFrame.t, 1)}s</span>}
          </div>

          {/* 3D Viewer */}
          <div className="rounded-md overflow-hidden border border-border" style={{ height: 260 }}>
            <TrajectoryViewer frames={visibleFrames} currentIndex={Math.max(0, visibleFrames.length - 1)} />
          </div>

          {/* Stat cards — 3 col */}
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Alt" value={fmt(currentFrame?.z, 0)} unit="m" status={simState === "playing" ? "live" : "idle"} />
            <StatCard label="Speed" value={fmt(currentFrame?.speed, 0)} unit="m/s" status={simState === "playing" ? "live" : "idle"} />
            <StatCard label="Mach" value={fmt(currentFrame?.mach, 3)} status={simState === "playing" ? "live" : "idle"} />
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button onClick={launch} disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50">
              {simState === "loading"
                ? <><Loader2 size={14} className="animate-spin" /> Computing…</>
                : <><Play size={14} /> Launch</>}
            </button>
            <button onClick={reset} className="h-10 w-10 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <RotateCcw size={14} />
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
              <p className="mono text-xs text-destructive">{error}</p>
            </div>
          )}

          {/* Collapsible config */}
          <button onClick={() => setConfigOpen(o => !o)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-md border border-border bg-card text-sm text-muted-foreground hover:bg-secondary transition-colors">
            <span>Simulation config</span>
            {configOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {configOpen && (
            <div className="rounded-md border border-border bg-card p-4">
              <SimConfigPanel config={config} onChange={setConfig} disabled={isRunning} />
            </div>
          )}

          {/* Anomalies */}
          {anomalies.length > 0 && (
            <div className="space-y-1.5">
              {anomalies.slice().reverse().map((a, i) => (
                <AnomalyBanner key={`${a.type}-${i}`} anomaly={a} />
              ))}
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="rounded-md border border-border bg-card p-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              <p className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Flight summary</p>
              {([
                ["Max altitude", fmt(summary.max_altitude, 0), "m"],
                ["Max speed", fmt(summary.max_speed, 0), "m/s"],
                ["Peak Mach", fmt(summary.max_mach, 3), ""],
                ["Range", fmt(summary.range, 0), "m"],
                ["Time of flight", fmt(summary.time_of_flight, 1), "s"],
                ["Anomalies", String(summary.anomaly_count), ""],
              ] as [string, string, string][]).map(([l, v, u]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="mono font-medium">{v}{u ? ` ${u}` : ""}</span>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <TelemetryChart frames={visibleFrames} field="z" label="Altitude" unit="m" color="#4f46e5" />
          <TelemetryChart frames={visibleFrames} field="speed" label="Speed" unit="m/s" color="#0891b2" />
        </div>
      </div>

      {/* ── Desktop: fixed 3-col, no scroll ── */}
      <div className="hidden md:grid grid-cols-[260px_1fr_260px] gap-3 p-3 flex-1 min-h-0">

        {/* Left: config + summary — scrollable */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          <div className="rounded-md border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-4">Config</p>
            <SimConfigPanel config={config} onChange={setConfig} disabled={isRunning} />
          </div>
          <div className="flex gap-2">
            <button onClick={launch} disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50">
              {simState === "loading"
                ? <><Loader2 size={13} className="animate-spin" /> Computing…</>
                : <><Play size={13} /> Launch</>}
            </button>
            <button onClick={reset} className="h-9 px-3 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
              <RotateCcw size={13} />
            </button>
          </div>
          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
              <p className="mono text-xs text-destructive">{error}</p>
            </div>
          )}
          {summary && (
            <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">Flight summary</p>
              {([
                ["Max altitude", fmt(summary.max_altitude, 0), "m"],
                ["Max speed", fmt(summary.max_speed, 0), "m/s"],
                ["Peak Mach", fmt(summary.max_mach, 3), ""],
                ["Range", fmt(summary.range, 0), "m"],
                ["Time of flight", fmt(summary.time_of_flight, 1), "s"],
                ["Apogee at", fmt(summary.apogee_time, 1), "s"],
                ["Anomalies", String(summary.anomaly_count), ""],
              ] as [string, string, string][]).map(([l, v, u]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="mono font-medium">{v}{u ? ` ${u}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Center: 3D viewer + anomalies */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${simState === "playing" ? "status-live" :
                simState === "complete" ? "status-warn" :
                  simState === "loading" ? "status-warn" : "bg-muted-foreground/30"}`}
            />
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
            {currentFrame && <span className="mono text-xs text-muted-foreground ml-auto">t = {fmt(currentFrame.t, 1)}s</span>}
            {frames.length > 0 && <span className="mono text-xs text-muted-foreground">{visibleIdx + 1}/{frames.length}</span>}
          </div>
          <div className="flex-1 min-h-0">
            <TrajectoryViewer frames={visibleFrames} currentIndex={Math.max(0, visibleFrames.length - 1)} />
          </div>
          {anomalies.length > 0 && (
            <div className="space-y-1.5 max-h-28 overflow-y-auto flex-shrink-0">
              {anomalies.slice().reverse().map((a, i) => (
                <AnomalyBanner key={`${a.type}-${i}`} anomaly={a} />
              ))}
            </div>
          )}
        </div>

        {/* Right: telemetry — scrollable */}
        <div className="flex flex-col gap-3 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label="Altitude" value={fmt(currentFrame?.z, 0)} unit="m"
              status={simState === "playing" ? "live" : "idle"} />
            <StatCard label="Speed" value={fmt(currentFrame?.speed, 0)} unit="m/s"
              status={simState === "playing" ? "live" : "idle"} />
            <StatCard label="Mach" value={fmt(currentFrame?.mach, 3)}
              status={simState === "playing" ? "live" : "idle"} />
            <StatCard label="Q-bar" value={fmt(currentFrame?.dynamic_pressure, 0)} unit="Pa"
              status={currentFrame && simState !== "idle" && currentFrame.dynamic_pressure > 400000 ? "warn" : simState === "playing" ? "live" : "idle"} />
            <StatCard label="Pitch" value={fmt(currentFrame?.pitch, 1)} unit="°" />
            <StatCard label="Yaw" value={fmt(currentFrame?.yaw, 1)} unit="°"
              status={currentFrame && simState !== "idle" && Math.abs(currentFrame.yaw) > 12 ? "warn" : "idle"} />
          </div>
          <TelemetryChart frames={visibleFrames} field="z" label="Altitude" unit="m" color="#4f46e5" />
          <TelemetryChart frames={visibleFrames} field="speed" label="Speed" unit="m/s" color="#0891b2" />
          <TelemetryChart frames={visibleFrames} field="dynamic_pressure" label="Q-bar" unit="Pa" color="#d97706" warningThreshold={400000} />
        </div>
      </div>
    </div>
  )
}