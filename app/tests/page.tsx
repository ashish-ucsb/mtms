"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import { useSim } from "@/lib/SimContext"
import { TestSuite, TestCase } from "@/lib/types"
import { FlaskConical, CheckCircle, XCircle, AlertTriangle, Clock, ChevronDown, ChevronRight, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

function statusIcon(s: TestCase["status"]) {
  switch (s) {
    case "pass": return <CheckCircle size={13} className="text-green-600 dark:text-green-400 flex-shrink-0" />
    case "fail": return <XCircle size={13} className="text-destructive flex-shrink-0" />
    case "warn": return <AlertTriangle size={13} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
    default: return <Clock size={13} className="text-muted-foreground flex-shrink-0" />
  }
}

function statusColor(s: TestCase["status"]) {
  return s === "pass" ? "text-green-600 dark:text-green-400"
    : s === "fail" ? "text-destructive"
      : s === "warn" ? "text-yellow-600 dark:text-yellow-400"
        : "text-muted-foreground"
}

function SuiteCard({ suite }: { suite: TestSuite }) {
  const [open, setOpen] = useState(true)
  const pass = suite.cases.filter(c => c.status === "pass").length
  const fail = suite.cases.filter(c => c.status === "fail").length
  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left">
        {open ? <ChevronDown size={13} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />}
        <span className="text-sm font-medium flex-1 text-left">{suite.name}</span>
        <span className="text-xs text-green-600 dark:text-green-400 mono">{pass}✓</span>
        {fail > 0 && <span className="text-xs text-destructive mono ml-1.5">{fail}✗</span>}
        {suite.duration_ms && <span className="text-xs text-muted-foreground mono ml-2">{suite.duration_ms}ms</span>}
      </button>
      {open && (
        <div className="border-t border-border divide-y divide-border">
          {suite.cases.map(tc => (
            <div key={tc.id} className="px-4 py-3 flex items-start gap-3">
              {statusIcon(tc.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="mono text-xs text-muted-foreground">{tc.id}</span>
                  <span className="text-sm font-medium">{tc.name}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{tc.description}</p>
                {tc.message && (
                  <p className={cn("text-xs mono mt-1", statusColor(tc.status))}>{tc.message}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <span className={cn("mono text-xs font-semibold uppercase", statusColor(tc.status))}>{tc.status}</span>
                {tc.requirement_id && (
                  <p className="mono text-xs text-muted-foreground mt-0.5">↗ {tc.requirement_id}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TestsPage() {
  const { simData, simState, runTests, testState } = useSim()
  const { frames, summary, testSuites, testSummary } = simData
  const hasFrames = frames.length > 0

  return (
    <div className="h-screen flex flex-col pt-12">
      <Nav />

      {/* Mobile: single scrollable column */}
      <div className="md:hidden flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-3">
          {/* Sim status */}
          <div className="rounded-md border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Simulation data</p>
            {!hasFrames ? (
              <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <span>Run a simulation in the Tracking tab first.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[["Frames", frames.length.toString()], ["Duration", `${summary?.time_of_flight?.toFixed(1)}s`]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="mono font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={runTests} disabled={!hasFrames || testState === "running"}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50">
            <FlaskConical size={13} />
            {testState === "running" ? "Running…" : "Run validation suite"}
          </button>

          {testSummary && (
            <div className="rounded-md border border-border bg-card p-3 grid grid-cols-2 gap-x-4 gap-y-1">
              <p className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Run summary</p>
              {[["Total", testSummary.total], ["Passed", testSummary.pass], ["Failed", testSummary.fail], ["Pass rate", `${testSummary.pass_rate}%`]].map(([l, v]) => (
                <div key={l} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <span className="mono font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}

          {testState === "running" && (
            <div className="rounded-md border border-border bg-card p-6 text-center">
              <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Running validation suite…</p>
            </div>
          )}

          {testSuites.map(suite => <SuiteCard key={suite.id} suite={suite} />)}
        </div>
      </div>

      {/* Desktop: sidebar + scrollable results */}
      <div className="hidden md:flex flex-1 min-h-0 gap-3 p-3">

        {/* Sidebar — fixed height, scrollable */}
        <div className="w-60 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          <div className="rounded-md border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Simulation data</p>
            {!hasFrames ? (
              <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                <span>Run a simulation in the Tracking tab first.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                {[
                  ["Frames", frames.length.toString()],
                  ["Duration", `${summary?.time_of_flight?.toFixed(1)}s`],
                  ["Max alt", `${summary?.max_altitude?.toFixed(0)}m`],
                  ["Status", simState],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="mono font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={runTests} disabled={!hasFrames || testState === "running"}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50">
            <FlaskConical size={13} />
            {testState === "running" ? "Running…" : "Run suite"}
          </button>

          {testSummary && (
            <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Summary</p>
              {[
                ["Total", testSummary.total, "text-foreground"],
                ["Passed", testSummary.pass, "text-green-600 dark:text-green-400"],
                ["Failed", testSummary.fail, "text-destructive"],
                ["Pass rate", `${testSummary.pass_rate}%`, "text-foreground"],
              ].map(([l, v, c]) => (
                <div key={String(l)} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{l}</span>
                  <span className={cn("mono font-medium", String(c))}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results — takes remaining space, scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {testState === "idle" && !testSuites.length && (
            <div className="rounded-md border border-border bg-card p-10 text-center h-full flex flex-col items-center justify-center">
              <FlaskConical size={28} className="mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                {hasFrames ? "Click \"Run suite\" to validate the current simulation." : "Run a simulation in the Tracking tab first."}
              </p>
            </div>
          )}
          {testState === "running" && (
            <div className="rounded-md border border-border bg-card p-10 text-center">
              <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Running validation suite…</p>
            </div>
          )}
          <div className="space-y-2 pb-3">
            {testSuites.map(suite => <SuiteCard key={suite.id} suite={suite} />)}
          </div>
        </div>

      </div>
    </div>
  )
}