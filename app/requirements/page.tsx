"use client"
import { useState, useEffect } from "react"
import Nav from "@/components/Nav"
import { Requirement } from "@/lib/types"
import { useSim, computeReqStatus } from "@/lib/SimContext"
import { Download, CheckCircle, AlertCircle, Clock, X, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

type LiveStatus = "verified" | "partial" | "unverified" | "static"

function statusBadge(status: LiveStatus, passCount?: number, totalCount?: number) {
  switch (status) {
    case "verified":
      return (
        <span className="flex items-center gap-1 text-green-400 text-xs">
          <CheckCircle size={11} />
          Verified {totalCount ? `(${passCount}/${totalCount})` : ""}
        </span>
      )
    case "partial":
      return (
        <span className="flex items-center gap-1 text-yellow-400 text-xs">
          <AlertCircle size={11} />
          Partial {totalCount ? `(${passCount}/${totalCount})` : ""}
        </span>
      )
    case "unverified":
      return (
        <span className="flex items-center gap-1 text-destructive text-xs">
          <X size={11} />
          Failed {totalCount ? `(${passCount}/${totalCount})` : ""}
        </span>
      )
    default:
      return (
        <span className="flex items-center gap-1 text-muted-foreground text-xs">
          <Clock size={11} />
          Not run
        </span>
      )
  }
}

function typePill(type: Requirement["type"]) {
  const cls: Record<string, string> = {
    functional: "bg-blue-950/40 text-blue-400 border-blue-800",
    performance: "bg-purple-950/40 text-purple-400 border-purple-800",
    safety: "bg-red-950/40 text-red-400 border-red-800",
    interface: "bg-teal-950/40 text-teal-400 border-teal-800",
  }
  return (
    <span className={cn("mono text-xs px-1.5 py-0.5 rounded border", cls[type])}>{type}</span>
  )
}

function priorityText(p: Requirement["priority"]) {
  return (
    <span className={cn("mono text-xs font-semibold uppercase", {
      "text-destructive": p === "shall",
      "text-yellow-400": p === "should",
      "text-muted-foreground": p === "may",
    })}>{p}</span>
  )
}

function statusRowColor(status: LiveStatus) {
  switch (status) {
    case "verified": return "border-l-2 border-l-green-600"
    case "partial": return "border-l-2 border-l-yellow-500"
    case "unverified": return "border-l-2 border-l-destructive"
    default: return ""
  }
}

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<Requirement | null>(null)
  const { simData, testState } = useSim()

  // Extract the flat case result map from SimContext
  const caseResultById: Record<string, string> =
    (simData.reqStatuses as any)?._cases ?? {}
  const testsRun = testState === "done"

  useEffect(() => {
    fetch("/api/requirements").then(r => r.json()).then(d => setRequirements(d.requirements))
  }, [])

  // Derive live status for each requirement
  function getLiveStatus(req: Requirement) {
    if (!testsRun) return { status: "static" as LiveStatus, passCount: 0, totalCount: req.test_ids.length }
    const result = computeReqStatus(req, caseResultById)
    return result
  }

  const withStatus = requirements.map(r => ({ ...r, live: getLiveStatus(r) }))

  const filtered = filter === "all"
    ? withStatus
    : withStatus.filter(r => r.live.status === filter)

  const verified = withStatus.filter(r => r.live.status === "verified").length
  const partial = withStatus.filter(r => r.live.status === "partial").length
  const unverified = withStatus.filter(r => r.live.status === "unverified").length
  const coverage = testsRun && requirements.length > 0
    ? Math.round((verified / requirements.length) * 100)
    : null

  const selectedLive = selected ? getLiveStatus(selected) : null

  return (
    <div className="h-screen flex flex-col pt-12">
      <Nav />

      {/* Mobile */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-3">

          {/* Stats */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { l: "Total", v: requirements.length, c: "" },
              { l: "Verified", v: testsRun ? verified : "—", c: testsRun ? "text-green-400" : "" },
              { l: "Coverage", v: coverage !== null ? `${coverage}%` : "—", c: coverage !== null && coverage >= 80 ? "text-green-400" : coverage !== null ? "text-yellow-400" : "" },
            ].map(({ l, v, c }) => (
              <div key={l} className="rounded-md border border-border bg-card px-3 py-2 flex-1 min-w-[80px]">
                <p className="mono text-xs text-muted-foreground">{l}</p>
                <p className={cn("text-lg font-semibold", c)}>{v}</p>
              </div>
            ))}
            <button onClick={() => window.open("/api/requirements?format=reqif", "_blank")}
              className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-card text-xs font-medium hover:bg-secondary transition-all">
              <Download size={12} /> ReqIF
            </button>
          </div>

          {/* No tests banner */}
          {!testsRun && (
            <div className="flex items-start gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground">
              <FlaskConical size={13} className="mt-0.5 flex-shrink-0" />
              <span>Run the validation suite in the Tests tab to see live verification status.</span>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { key: "all", label: "All" },
              { key: "verified", label: "Verified" },
              { key: "partial", label: "Partial" },
              { key: "unverified", label: "Failed" },
              { key: "static", label: "Not run" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={cn("mono text-xs px-3 h-7 rounded-md border transition-all whitespace-nowrap flex-shrink-0",
                  filter === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>{label}</button>
            ))}
          </div>

          {/* Card list */}
          <div className="space-y-1.5">
            {filtered.map(req => (
              <button key={req.id} onClick={() => setSelected(req)}
                className={cn("w-full text-left rounded-md border border-border bg-card px-4 py-3 hover:bg-secondary/40 transition-colors",
                  selected?.id === req.id && "bg-secondary/60",
                  statusRowColor(req.live.status)
                )}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-xs font-semibold text-primary">{req.id}</span>
                  {typePill(req.type)}
                  <span className="ml-auto">{statusBadge(req.live.status, req.live.passCount, req.live.totalCount)}</span>
                </div>
                <p className="text-sm">{req.title}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom sheet detail */}
        {selected && selectedLive && (
          <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-xl shadow-xl max-h-[70vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="mono text-sm font-bold text-primary">{selected.id}</span>
                    {typePill(selected.type)}
                  </div>
                  <h2 className="text-base font-semibold leading-snug">{selected.title}</h2>
                </div>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground ml-2 p-1">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Test cases</p>
                <div className="flex gap-1.5 flex-wrap">
                  {selected.test_ids.map(id => {
                    const result = caseResultById[id]
                    return (
                      <span key={id} className={cn("mono text-xs px-2 py-0.5 rounded border", {
                        "border-green-700 bg-green-950/40 text-green-400": result === "pass",
                        "border-destructive/50 bg-red-950/40 text-red-400": result === "fail",
                        "border-border bg-secondary text-muted-foreground": !result,
                      })}>
                        {id} {result ? `(${result})` : ""}
                      </span>
                    )
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground italic">{selected.source}</p>
              <div className="flex justify-between text-xs border-t border-border pt-3">
                <span className="text-muted-foreground">Priority</span>{priorityText(selected.priority)}
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Verification</span>
                {statusBadge(selectedLive.status, selectedLive.passCount, selectedLive.totalCount)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex flex-1 min-h-0 gap-3 p-3">

        <div className="flex-1 min-w-0 flex flex-col gap-3 min-h-0">

          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <div className="flex gap-2">
              {[
                { l: "Total", v: requirements.length, c: "" },
                { l: "Verified", v: testsRun ? verified : "—", c: testsRun ? "text-green-400" : "" },
                { l: "Partial", v: testsRun ? partial : "—", c: testsRun ? "text-yellow-400" : "" },
                { l: "Failed", v: testsRun ? unverified : "—", c: testsRun && unverified > 0 ? "text-destructive" : "" },
                { l: "Coverage", v: coverage !== null ? `${coverage}%` : "—", c: coverage !== null && coverage >= 80 ? "text-green-400" : coverage !== null ? "text-yellow-400" : "" },
              ].map(({ l, v, c }) => (
                <div key={l} className="rounded-md border border-border bg-card px-3 py-2">
                  <p className="mono text-xs text-muted-foreground uppercase tracking-widest">{l}</p>
                  <p className={cn("text-lg font-semibold", c)}>{v}</p>
                </div>
              ))}
            </div>
            <button onClick={() => window.open("/api/requirements?format=reqif", "_blank")}
              className="flex items-center gap-2 h-9 px-4 rounded-md border border-border bg-card text-sm font-medium hover:bg-secondary transition-all ml-auto">
              <Download size={13} /> ReqIF XML
            </button>
          </div>

          {/* No tests banner */}
          {!testsRun && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground flex-shrink-0">
              <FlaskConical size={13} className="flex-shrink-0" />
              Run the validation suite in the Tests tab to see live verification status against your simulation.
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-1.5 flex-shrink-0">
            {[
              { key: "all", label: "All" },
              { key: "verified", label: "Verified" },
              { key: "partial", label: "Partial" },
              { key: "unverified", label: "Failed" },
              { key: "static", label: "Not run" },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilter(key)}
                className={cn("mono text-xs px-3 h-7 rounded-md border transition-all",
                  filter === key ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}>{label}</button>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-md border border-border overflow-hidden flex flex-col min-h-0">
            <div className="grid grid-cols-[80px_1fr_100px_70px_140px] gap-3 bg-secondary/50 px-4 py-2.5 border-b border-border flex-shrink-0">
              {["ID", "Title", "Type", "Priority", "Status"].map(h => (
                <span key={h} className="mono text-xs text-muted-foreground uppercase tracking-widest">{h}</span>
              ))}
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map(req => (
                <button key={req.id} onClick={() => setSelected(req)}
                  className={cn(
                    "w-full grid grid-cols-[80px_1fr_100px_70px_140px] gap-3 items-center px-4 py-3",
                    "border-b border-border text-left hover:bg-secondary/40 transition-colors last:border-b-0",
                    selected?.id === req.id && "bg-secondary/60",
                    statusRowColor(req.live.status)
                  )}>
                  <span className="mono text-xs font-semibold text-primary">{req.id}</span>
                  <span className="text-sm truncate">{req.title}</span>
                  {typePill(req.type)}
                  {priorityText(req.priority)}
                  {statusBadge(req.live.status, req.live.passCount, req.live.totalCount)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="w-80 flex-shrink-0 overflow-y-auto">
          {selected && selectedLive ? (
            <div className="rounded-md border border-border bg-card p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-sm font-bold text-primary">{selected.id}</span>
                  {typePill(selected.type)}
                </div>
                <h2 className="text-base font-semibold leading-snug">{selected.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1.5">
                  Test cases {testsRun && <span className="normal-case font-normal">(live results)</span>}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {selected.test_ids.map(id => {
                    const result = caseResultById[id]
                    return (
                      <span key={id} className={cn("mono text-xs px-2 py-1 rounded border flex items-center gap-1", {
                        "border-green-700 bg-green-950/40 text-green-400": result === "pass",
                        "border-destructive/50 bg-red-950/40 text-red-400": result === "fail",
                        "border-yellow-700 bg-yellow-950/40 text-yellow-400": result === "warn",
                        "border-border bg-secondary text-muted-foreground": !result,
                      })}>
                        {result === "pass" && <CheckCircle size={10} />}
                        {result === "fail" && <X size={10} />}
                        {result === "warn" && <AlertCircle size={10} />}
                        {!result && <Clock size={10} />}
                        {id}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">JD source</p>
                <p className="text-xs text-muted-foreground italic">{selected.source}</p>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Priority</span>
                  {priorityText(selected.priority)}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Verification</span>
                  {statusBadge(selectedLive.status, selectedLive.passCount, selectedLive.totalCount)}
                </div>
                {testsRun && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Test pass rate</span>
                    <span className="mono font-medium">
                      {selectedLive.totalCount > 0
                        ? `${selectedLive.passCount}/${selectedLive.totalCount}`
                        : "no linked tests"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground h-full flex items-center justify-center">
              Select a requirement to view details
            </div>
          )}
        </div>

      </div>
    </div>
  )
}