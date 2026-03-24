"use client"
import { useState } from "react"
import Nav from "@/components/Nav"
import { useSim } from "@/lib/SimContext"
import { FileBarChart2, Download, Loader2, AlertCircle, CheckCircle } from "lucide-react"

// ── Dark theme palette (hex → jsPDF [r,g,b]) ──────────────────────────────
// bg:        #09090b  = [9,  9,  11]   (zinc-950, app background)
// card:      #18181b  = [24, 24, 27]   (zinc-900, card surface)
// surface2:  #27272a  = [39, 39, 42]   (zinc-800, raised surface)
// border:    #3f3f46  = [63, 63, 70]   (zinc-700)
// muted:     #71717a  = [113,113,122]  (zinc-500)
// text:      #fafafa  = [250,250,250]  (zinc-50)
// text-dim:  #a1a1aa  = [161,161,170]  (zinc-400)
// accent:    #6366f1  = [99, 102,241]  (indigo-500, matches 3D trail)
// green:     #22c55e  = [34, 197, 94]
// red:       #ef4444  = [239, 68,  68]
// amber:     #f59e0b  = [245,158, 11]

const C = {
  bg: [9, 9, 11] as [number, number, number],
  card: [24, 24, 27] as [number, number, number],
  surf2: [39, 39, 42] as [number, number, number],
  border: [63, 63, 70] as [number, number, number],
  muted: [113, 113, 122] as [number, number, number],
  text: [250, 250, 250] as [number, number, number],
  textDim: [161, 161, 170] as [number, number, number],
  accent: [99, 102, 241] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
}

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
    const H = doc.internal.pageSize.getHeight()
    const m = 15
    let y = m

    // Helper: fill whole page background on new pages
    const fillBg = () => {
      doc.setFillColor(...C.bg)
      doc.rect(0, 0, W, H, "F")
    }

    // Section header bar
    const sect = (title: string) => {
      if (y > 255) { doc.addPage(); fillBg(); y = m }
      doc.setFillColor(...C.surf2)
      doc.rect(m, y, W - m * 2, 7, "F")
      // accent left strip
      doc.setFillColor(...C.accent)
      doc.rect(m, y, 2, 7, "F")
      doc.setTextColor(...C.text)
      doc.setFontSize(7.5)
      doc.setFont("helvetica", "bold")
      doc.text(title.toUpperCase(), m + 5, y + 5)
      y += 12
    }

    // Key-value row
    const kv = (label: string, value: string, valueColor = C.text) => {
      doc.setFontSize(8)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(...C.muted)
      doc.text(label, m + 2, y)
      doc.setTextColor(...valueColor)
      doc.text(value, m + 60, y)
      y += 5.5
    }

    // Horizontal rule
    const rule = () => {
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.2)
      doc.line(m, y, W - m, y)
      y += 4
    }

    // ── Cover page ────────────────────────────────────────────────────────
    fillBg()

    // Accent bar top
    doc.setFillColor(...C.accent)
    doc.rect(0, 0, 4, H, "F")

    // Title
    doc.setTextColor(...C.text)
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("MTMS", m + 6, 45)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...C.textDim)
    doc.text("Missile Tracking & Test Management System", m + 6, 55)

    doc.setFontSize(9)
    doc.setTextColor(...C.muted)
    doc.text("Flight Test Report", m + 6, 63)

    // Divider
    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.line(m + 6, 70, W - m, 70)

    // Meta
    doc.setFontSize(8)
    doc.setTextColor(...C.muted)
    doc.text(`Generated:  ${new Date().toISOString()}`, m + 6, 78)
    doc.text(`Frames:     ${frames.length}`, m + 6, 85)
    doc.text(`Duration:   ${summary?.time_of_flight?.toFixed(1)}s`, m + 6, 92)
    doc.text(`Max altitude: ${summary?.max_altitude?.toFixed(0)} m`, m + 6, 99)
    doc.text(`Peak speed:   ${summary?.max_speed?.toFixed(0)} m/s  (Mach ${summary?.max_mach?.toFixed(3)})`, m + 6, 106)

    // Summary stat boxes
    const stats = [
      { l: "Max altitude", v: `${summary?.max_altitude?.toFixed(0)} m` },
      { l: "Peak speed", v: `${summary?.max_speed?.toFixed(0)} m/s` },
      { l: "Range", v: `${summary?.range?.toFixed(0)} m` },
      { l: "Anomalies", v: `${summary?.anomaly_count ?? 0}` },
    ]
    const boxW = (W - m * 2 - 9) / 4
    stats.forEach(({ l, v }, i) => {
      const bx = m + i * (boxW + 3)
      const by = 125
      doc.setFillColor(...C.card)
      doc.roundedRect(bx, by, boxW, 22, 2, 2, "F")
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.2)
      doc.roundedRect(bx, by, boxW, 22, 2, 2, "S")
      doc.setTextColor(...C.muted)
      doc.setFontSize(6.5)
      doc.setFont("helvetica", "normal")
      doc.text(l.toUpperCase(), bx + 3, by + 7)
      doc.setTextColor(...C.text)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(v, bx + 3, by + 16)
    })

    // Footer
    doc.setTextColor(...C.border)
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.text("MTMS — Missile Tracking & Test Management System", m + 6, H - 10)

    // ── Page 2+ ───────────────────────────────────────────────────────────
    doc.addPage(); fillBg(); y = m + 4

    // autoTable dark theme shared styles
    const tableStyles = {
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        fillColor: C.card,
        textColor: C.textDim,
        lineColor: C.border,
        lineWidth: 0.15,
      },
      headStyles: {
        fillColor: C.surf2,
        textColor: C.text,
        fontStyle: "bold" as const,
        fontSize: 7,
        lineColor: C.border,
        lineWidth: 0.15,
      },
      alternateRowStyles: {
        fillColor: [18, 18, 20] as [number, number, number],
      },
      margin: { left: m, right: m },
    }

    // 1. Flight Summary
    sect("1. Flight Summary")
    kv("Max altitude", `${summary?.max_altitude?.toFixed(0) ?? "—"} m`)
    kv("Max speed", `${summary?.max_speed?.toFixed(0) ?? "—"} m/s`)
    kv("Peak Mach", `${summary?.max_mach?.toFixed(3) ?? "—"}`)
    kv("Range", `${summary?.range?.toFixed(0) ?? "—"} m`)
    kv("Time of flight", `${summary?.time_of_flight?.toFixed(1) ?? "—"} s`)
    kv("Apogee time", `${summary?.apogee_time?.toFixed(1) ?? "—"} s`)
    kv("Anomaly count", `${summary?.anomaly_count ?? 0}`,
      (summary?.anomaly_count ?? 0) > 0 ? C.amber : C.green)
    y += 4

    // 2. Anomaly Log
    sect("2. Anomaly Log")
    const af = frames.filter(f => f.anomaly !== null)
    if (!af.length) {
      doc.setFontSize(8)
      doc.setTextColor(...C.green)
      doc.text("No anomalies detected during flight.", m + 2, y)
      y += 10
    } else {
      autoTable(doc, {
        startY: y,
        head: [["Time (s)", "Type", "Severity", "Value", "Message"]],
        body: af.map(f => [
          f.t.toFixed(1),
          f.anomaly!.type.replace(/_/g, " "),
          f.anomaly!.severity,
          f.anomaly!.value.toFixed(1),
          f.anomaly!.message,
        ]),
        ...tableStyles,
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 2) {
            data.cell.styles.textColor =
              data.cell.raw === "critical" ? C.red : C.amber
          }
        },
      })
      y = (doc as any).lastAutoTable.finalY + 8
    }

    // 3. Validation Suite Results
    if (testSuites.length > 0) {
      sect("3. Validation Suite Results")
      for (const suite of testSuites) {
        if (y > 250) { doc.addPage(); fillBg(); y = m + 4 }
        doc.setFontSize(7.5)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(...C.textDim)
        doc.text(suite.name, m + 2, y)
        y += 4
        autoTable(doc, {
          startY: y,
          head: [["ID", "Test case", "Status", "Req", "Notes"]],
          body: suite.cases.map(c => [
            c.id, c.name, c.status.toUpperCase(), c.requirement_id, c.message ?? "",
          ]),
          ...tableStyles,
          didParseCell: (data: any) => {
            if (data.section === "body" && data.column.index === 2) {
              data.cell.styles.textColor =
                data.cell.raw === "PASS" ? C.green : C.red
              data.cell.styles.fontStyle = "bold"
            }
          },
        })
        y = (doc as any).lastAutoTable.finalY + 6
      }
    }

    // 4. Requirements Coverage
    if (y > 220) { doc.addPage(); fillBg(); y = m + 4 }
    sect(`${testSuites.length > 0 ? "4" : "3"}. Requirements Coverage (RTM)`)
    autoTable(doc, {
      startY: y,
      head: [["ID", "Title", "Type", "Priority", "Status"]],
      body: reqs.map((r: any) => [r.id, r.title, r.type, r.priority, r.status]),
      ...tableStyles,
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          data.cell.styles.textColor =
            data.cell.raw === "verified" ? C.green :
              data.cell.raw === "partial" ? C.amber : C.muted
        }
      },
    })

    // Page numbers
    const pageCount = (doc.internal as any).getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFillColor(...C.bg)
      doc.rect(0, H - 8, W, 8, "F")
      doc.setTextColor(...C.border)
      doc.setFontSize(6.5)
      doc.setFont("helvetica", "normal")
      doc.text(`MTMS Flight Test Report`, m, H - 3)
      doc.text(`${i} / ${pageCount}`, W - m, H - 3, { align: "right" })
    }

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
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-3 max-w-5xl">

          <div className="space-y-3">
            <div className="rounded-md border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Data status</p>
              {!hasFrames ? (
                <div className="flex items-start gap-2 text-xs text-yellow-400">
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

            <button
              onClick={generateReport}
              disabled={!hasFrames || genState === "generating"}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {genState === "generating"
                ? <><Loader2 size={13} className="animate-spin" /> Generating…</>
                : genState === "done"
                  ? <><CheckCircle size={13} /> Download again</>
                  : <><Download size={13} /> Generate PDF</>
              }
            </button>

            {genState === "done" && (
              <button
                onClick={() => setGenState("idle")}
                className="w-full h-8 rounded-md border border-border text-muted-foreground text-xs hover:bg-secondary transition-all"
              >
                Reset
              </button>
            )}
          </div>

          <div className="rounded-md border border-border bg-card p-6 flex flex-col items-center justify-center text-center min-h-48">
            <FileBarChart2 size={36} className="text-muted-foreground opacity-40 mb-4" />
            <h2 className="text-base font-semibold mb-1.5">PDF Test Report</h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-5">
              Generates a dark-themed test report from your current simulation.
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