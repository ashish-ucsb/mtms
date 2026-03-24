"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import { useSim } from "@/lib/SimContext"
import { TelemetryFrame } from "@/lib/types"
import { FileBarChart2, Download, Loader2, AlertCircle, CheckCircle } from "lucide-react"

export default function ReportPage() {
  const { simData } = useSim()
  const { frames, summary, testSuites } = simData
  const [genState, setGenState] = useState<"idle" | "generating" | "done">("idle")
  const hasFrames = frames.length > 0

  const generateReport = async () => {
    if (!hasFrames) return
    setGenState("generating")
    const reqs = await fetch("/api/requirements").then(r => r.json()).then(d => d.requirements)
    const { jsPDF } = await import("jspdf")
    const autoTable = (await import("jspdf-autotable")).default

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const W = doc.internal.pageSize.getWidth()
    const m = 15
    let y = m

    const sect = (title: string) => {
      if (y > 255) { doc.addPage(); y = m }
      doc.setFillColor(240, 240, 245); doc.rect(m, y, W - m * 2, 7, "F")
      doc.setTextColor(30, 30, 50); doc.setFontSize(8); doc.setFont("helvetica", "bold")
      doc.text(title.toUpperCase(), m + 3, y + 5)
      doc.setTextColor(60, 60, 80); y += 11
    }
    const kv = (l: string, v: string) => {
      doc.setFontSize(8); doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 100, 120); doc.text(l, m + 2, y)
      doc.setTextColor(30, 30, 50); doc.text(v, m + 55, y); y += 5
    }

    // Cover
    doc.setFillColor(248, 250, 252); doc.rect(0, 0, W, 297, "F")
    doc.setTextColor(20, 20, 30); doc.setFontSize(20); doc.setFont("helvetica", "bold")
    doc.text("MTMS", m, 38)
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 100)
    doc.text("Missile Tracking & Test Management System", m, 47)
    doc.text("Flight Test Report", m, 54)
    doc.setFontSize(8); doc.setTextColor(140, 140, 160)
    doc.text(`Generated: ${new Date().toISOString()}`, m, 65)
    doc.text(`Frames: ${frames.length}  ·  Duration: ${summary?.time_of_flight?.toFixed(1)}s`, m, 71)

    doc.addPage(); y = m

    sect("1. Flight Summary")
    kv("Max altitude", `${summary?.max_altitude?.toFixed(0) ?? "—"} m`)
    kv("Max speed", `${summary?.max_speed?.toFixed(0) ?? "—"} m/s`)
    kv("Peak Mach", `${summary?.max_mach?.toFixed(3) ?? "—"}`)
    kv("Range", `${summary?.range?.toFixed(0) ?? "—"} m`)
    kv("Time of flight", `${summary?.time_of_flight?.toFixed(1) ?? "—"} s`)
    kv("Apogee time", `${summary?.apogee_time?.toFixed(1) ?? "—"} s`)
    kv("Anomaly count", `${summary?.anomaly_count ?? 0}`)
    y += 4

    sect("2. Anomaly Log")
    const af = frames.filter(f => f.anomaly !== null)
    if (!af.length) {
      doc.setFontSize(8); doc.setTextColor(120, 120, 140)
      doc.text("No anomalies detected.", m + 2, y); y += 8
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Time (s)", "Type", "Severity", "Value", "Message"]],
        body: af.map(f => [f.t.toFixed(1), f.anomaly!.type.replace(/_/g, " "), f.anomaly!.severity, f.anomaly!.value.toFixed(1), f.anomaly!.message]),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [240, 240, 245], textColor: [30, 30, 50], fontStyle: "bold" },
        margin: { left: m, right: m },
      })
      y = (doc as any).lastAutoTable.finalY + 8
    }

    if (testSuites.length > 0) {
      sect("3. Validation Suite Results")
      for (const suite of testSuites) {
        if (y > 250) { doc.addPage(); y = m }
        doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 80)
        doc.text(suite.name, m + 2, y); y += 4
        autoTable(doc, {
          startY: y,
          head: [["ID", "Test Case", "Status", "Req", "Notes"]],
          body: suite.cases.map(c => [c.id, c.name, c.status.toUpperCase(), c.requirement_id, c.message ?? ""]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [240, 240, 245], textColor: [30, 30, 50], fontStyle: "bold" },
          margin: { left: m, right: m },
        })
        y = (doc as any).lastAutoTable.finalY + 6
      }
    }

    if (y > 220) { doc.addPage(); y = m }
    sect(`${testSuites.length > 0 ? "4" : "3"}. Requirements Coverage (RTM)`)
    autoTable(doc, {
      startY: y,
      head: [["ID", "Title", "Type", "Priority", "Status"]],
      body: reqs.map((r: any) => [r.id, r.title, r.type, r.priority, r.status]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [240, 240, 245], textColor: [30, 30, 50], fontStyle: "bold" },
      margin: { left: m, right: m },
    })

    doc.save(`MTMS_Report_${Date.now()}.pdf`)
    setGenState("done")
  }

  const sections: [string, string][] = [
    ["Section 1", "Flight summary — altitude, speed, Mach, range, TOF"],
    ["Section 2", "Anomaly log with timestamps and severity"],
    ["Section 3", testSuites.length > 0 ? "Validation suite pass/fail ✓" : "Validation suite (run tests first)"],
    [testSuites.length > 0 ? "Section 4" : "Section 3", "Requirements traceability matrix"],
  ]

  return (
    <div className="h-screen flex flex-col pt-12">
      <Nav />

      {/* Scrollable on all screen sizes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 max-w-5xl">

          {/* Sidebar */}
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Data status</p>
              {!hasFrames ? (
                <div className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                  <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                  <span>Run a simulation in the Tracking tab first.</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {[
                    ["Simulation", "✓ ready"],
                    ["Frames", frames.length.toString()],
                    ["Duration", `${summary?.time_of_flight?.toFixed(1)}s`],
                    ["Tests", testSuites.length > 0 ? `✓ ${testSuites.length} suites` : "not run"],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{l}</span>
                      <span className="mono font-medium">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={generateReport} disabled={!hasFrames || genState === "generating"}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50">
              {genState === "generating"
                ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                : genState === "done"
                  ? <><CheckCircle size={13} /> Download again</>
                  : <><Download size={13} /> Generate PDF</>
              }
            </button>

            {genState === "done" && (
              <button onClick={() => setGenState("idle")}
                className="w-full h-8 rounded-md border border-border text-muted-foreground text-xs hover:bg-secondary transition-all">
                Reset
              </button>
            )}
          </div>

          {/* Info panel */}
          <div className="rounded-md border border-border bg-card p-6 flex flex-col items-center justify-center text-center">
            <FileBarChart2 size={36} className="text-muted-foreground opacity-40 mb-4" />
            <h2 className="text-base font-semibold mb-1.5">PDF Test Report</h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-5">
              Generates a defense-grade test report from your current simulation.
              Run tests first to include validation results.
            </p>
            <div className="space-y-1.5 text-left w-full max-w-xs">
              {sections.map(([s, d]) => (
                <div key={s} className="flex gap-2 text-xs">
                  <span className="mono text-muted-foreground w-20 flex-shrink-0">{s}</span>
                  <span className="text-muted-foreground">{d}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}