"use client"
import Nav from "@/components/Nav"
import { Activity, FlaskConical, FileText, FileBarChart2, Cpu, Globe, GitBranch, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const sections = [
    {
        id: "overview",
        icon: Globe,
        title: "What is MTMS?",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    MTMS (Missile Tracking &amp; Test Management System) is a web-based simulation of the kind of range instrumentation software used at defense test facilities — specifically mirroring systems like <strong className="text-foreground">TAOS</strong> (Trajectory Analysis and Operations Software) used at ranges like Vandenberg and White Sands.
                </p>
                <p>
                    Real TAOS software computes position, velocity, acceleration, and body attitude as a function of time — determining performance characteristics such as range, speed, time of flight, and altitude. This project does exactly that, as a live web application.
                </p>
                <p>
                    It demonstrates defense-grade software engineering for range &amp; test instrumentation — the kind of software that runs at test facilities to record, validate, and report on flight vehicle performance.
                </p>
            </div>
        ),
    },
    {
        id: "tracking",
        icon: Activity,
        title: "Tracking dashboard",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    The tracking dashboard runs a 6-DOF physics simulation entirely in the browser-side API route. It shows a real-time 3D trajectory arc, live stat cards, and time-series charts for altitude, speed, and dynamic pressure.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">How to use</p>
                    <ol className="space-y-1.5 text-xs list-decimal list-inside">
                        <li>Adjust simulation parameters — launch angle, mass, thrust, burn time</li>
                        <li>Click <strong className="text-foreground">Launch</strong> — trajectory computes in ~1 second</li>
                        <li>Watch the arc animate in the 3D viewer with live telemetry</li>
                        <li>Drag to rotate · scroll to zoom · right-drag to pan</li>
                        <li>Green = launch · Red = impact · Indigo = current position</li>
                    </ol>
                </div>
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Anomaly detection</p>
                    <p className="text-xs">Monitors altitude ceiling (50,000 m), speed limit (2,000 m/s), dynamic pressure (400,000 Pa ≈ Mach 2.4), and attitude deviation (yaw &gt; 15°). Anomalies are flagged per-frame after t = 2s.</p>
                </div>
            </div>
        ),
    },
    {
        id: "tests",
        icon: FlaskConical,
        title: "Test management",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    The test suite runs automated validation against the simulation data from the Tracking tab — no re-simulation needed. The same flight data drives both real-time display and post-flight analysis.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">How to use</p>
                    <ol className="space-y-1.5 text-xs list-decimal list-inside">
                        <li>Run a simulation in the Tracking tab first</li>
                        <li>Switch to Tests and click <strong className="text-foreground">Run validation suite</strong></li>
                        <li>Results appear instantly — no extra simulation time</li>
                        <li>Each test case links back to a requirement ID (e.g. REQ-001)</li>
                    </ol>
                </div>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Test suites</p>
                    <div className="space-y-2 text-xs">
                        {[
                            ["TS-001", "Data acquisition & recording", "Frame rate compliance, state vector completeness"],
                            ["TS-002", "Trajectory reconstruction", "3D position continuity, apogee detection, range"],
                            ["TS-003", "Anomaly detection", "Altitude ceiling, dynamic pressure, Mach number"],
                            ["TS-004", "Performance characteristics", "Speed computation, time of flight"],
                            ["TS-005", "System capabilities", "Test execution, RTM, ReqIF export, report generation"],
                        ].map(([id, name, desc]) => (
                            <div key={id} className="rounded border border-border bg-background px-2.5 py-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="mono text-xs font-semibold text-foreground">{id}</span>
                                    <span className="text-xs font-medium text-foreground">{name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
    },
    {
        id: "requirements",
        icon: FileText,
        title: "Requirements matrix",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    The requirements matrix implements a full <strong className="text-foreground">Software Requirements Specification (SRS)</strong> in IEEE 830 format. Each requirement has a unique ID, priority (shall / should / may), type (functional, performance, safety, interface), and linked test cases — forming a complete <strong className="text-foreground">Requirements Traceability Matrix (RTM)</strong>.
                </p>
                <p>
                    The export button generates a <strong className="text-foreground">ReqIF 1.0 XML</strong> file — the open standard used by IBM DOORS and Rational Publishing Engine. Directly importable into a DOORS database.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">How to use</p>
                    <ol className="space-y-1.5 text-xs list-decimal list-inside">
                        <li>Click any row to see full requirement details</li>
                        <li>Filter by status: verified, partial, or unverified</li>
                        <li>Click <strong className="text-foreground">ReqIF XML</strong> to download the DOORS-compatible export</li>
                        <li>Run tests first — statuses update live based on test results</li>
                    </ol>
                </div>
            </div>
        ),
    },
    {
        id: "report",
        icon: FileBarChart2,
        title: "Report generation",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    Generates a dark-themed PDF entirely in the browser using <strong className="text-foreground">jsPDF</strong> — no server call. Pulls from shared simulation state so it always reflects the current run.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Report sections</p>
                    <div className="space-y-2 text-xs">
                        {[
                            ["Section 1", "Flight summary", "Max altitude, speed, Mach, range, TOF, apogee time"],
                            ["Section 2", "Anomaly log", "Each flagged event with timestamp, type, severity, value"],
                            ["Section 3", "Validation suite results", "Pass/fail per test case, linked to requirement IDs"],
                            ["Section 4", "Requirements coverage", "Full RTM — all 10 requirements with verification status"],
                        ].map(([s, t, d]) => (
                            <div key={s} className="rounded border border-border bg-background px-2.5 py-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="mono text-xs font-semibold text-foreground">{s}</span>
                                    <span className="text-xs font-medium text-foreground">{t}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{d}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs rounded-md border border-border bg-card px-3 py-2">
                    <strong className="text-foreground">Tip:</strong> run a simulation → run tests → generate report for the most complete PDF with all 4 sections.
                </p>
            </div>
        ),
    },
    {
        id: "physics",
        icon: Cpu,
        title: "Physics engine",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    <code className="mono text-xs bg-secondary px-1 py-0.5 rounded">lib/engine.ts</code> implements 6-DOF equations of motion in pure TypeScript — no dependencies, no external calls. Pure function: config in, frames out. Runs inside the Next.js API route on Vercel.
                </p>

                {/* Per-frame values — stacked on mobile, 2-col on wider screens */}
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">What it computes per frame</p>
                    <div className="space-y-1.5 text-xs">
                        {[
                            ["Position", "x, y, z (m)"],
                            ["Velocity", "vx, vy, vz (m/s)"],
                            ["Acceleration", "ax, ay, az (m/s²)"],
                            ["Speed", "total speed (m/s)"],
                            ["Mach number", "speed ÷ speed-of-sound(altitude)"],
                            ["Dynamic pressure", "½ρv² (Pa)"],
                            ["Pitch / Yaw", "body attitude in degrees"],
                            ["Anomaly flag", "threshold breach if any"],
                        ].map(([k, v]) => (
                            <div key={k} className="flex gap-2 border-b border-border last:border-0 pb-1.5 last:pb-0">
                                <span className="text-foreground font-medium min-w-[120px] flex-shrink-0">{k}</span>
                                <span className="text-muted-foreground">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Standard atmosphere model</p>
                    <p className="text-xs">ISA troposphere model up to 11 km, then stratosphere above. Gives altitude-dependent density, pressure, and speed of sound — making Mach number and dynamic pressure physically accurate.</p>
                </div>
            </div>
        ),
    },
    {
        id: "architecture",
        icon: GitBranch,
        title: "Architecture",
        content: (
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                    Runs entirely on <strong className="text-foreground">Vercel</strong> — no external database, no separate backend process. Simulation state lives in a React Context wrapping all pages so switching tabs never loses data.
                </p>

                {/* Architecture — cards instead of ASCII art */}
                <div className="space-y-1.5">
                    {[
                        {
                            layer: "Browser",
                            desc: "React Context holds all state — frames, test results, requirements",
                            color: "border-indigo-500/30 bg-indigo-500/5",
                        },
                        {
                            layer: "GET /api/telemetry",
                            desc: "Calls lib/engine.ts directly — returns all frames as JSON",
                            color: "border-border bg-card",
                        },
                        {
                            layer: "POST /api/test-run",
                            desc: "Receives frames, runs 5 validation suites, returns pass/fail JSON",
                            color: "border-border bg-card",
                        },
                        {
                            layer: "GET /api/requirements",
                            desc: "Serves data/requirements.json — or exports as ReqIF XML",
                            color: "border-border bg-card",
                        },
                        {
                            layer: "lib/engine.ts",
                            desc: "6-DOF physics — pure TypeScript function, no dependencies, no DB",
                            color: "border-indigo-500/30 bg-indigo-500/5",
                        },
                        {
                            layer: "Report (client-side)",
                            desc: "jsPDF reads React state and generates PDF entirely in the browser",
                            color: "border-border bg-card",
                        },
                    ].map(({ layer, desc, color }) => (
                        <div key={layer} className={`rounded-md border px-3 py-2 text-xs ${color}`}>
                            <p className="mono font-semibold text-foreground mb-0.5">{layer}</p>
                            <p className="text-muted-foreground">{desc}</p>
                        </div>
                    ))}
                </div>

                {/* Tech stack grid */}
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Stack</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                        {[
                            ["Frontend", "Next.js 14, React, Tailwind CSS, shadcn/ui"],
                            ["3D viewer", "Three.js via React Three Fiber"],
                            ["Charts", "Recharts"],
                            ["Physics", "TypeScript — lib/engine.ts"],
                            ["PDF", "jsPDF + jsPDF-AutoTable"],
                            ["Deploy", "Vercel"],
                            ["Local dev", "Docker Compose"],
                            ["Requirements", "ReqIF 1.0 XML (DOORS-compatible)"],
                        ].map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                                <span className="text-foreground font-medium w-24 flex-shrink-0">{k}</span>
                                <span>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ),
    },
]

export default function InfoPage() {
    const [active, setActive] = useState("overview")
    const current = sections.find(s => s.id === active) ?? sections[0]

    return (
        <div className="h-screen flex flex-col pt-12">
            <Nav />

            {/* Mobile: accordion */}
            <div className="md:hidden flex-1 overflow-y-auto">
                <div className="p-3 space-y-2">
                    {sections.map(({ id, icon: Icon, title, content }) => {
                        const isOpen = active === id
                        return (
                            <div key={id} className="rounded-md border border-border bg-card overflow-hidden">
                                <button
                                    onClick={() => setActive(isOpen ? "" : id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                                >
                                    <Icon size={15} className={cn("flex-shrink-0", isOpen ? "text-foreground" : "text-muted-foreground")} />
                                    <span className={cn("text-sm font-medium flex-1", isOpen ? "text-foreground" : "text-muted-foreground")}>{title}</span>
                                    <ChevronRight size={13} className={cn("text-muted-foreground transition-transform flex-shrink-0", isOpen && "rotate-90")} />
                                </button>
                                {isOpen && (
                                    <div className="px-4 pb-4 border-t border-border pt-3">
                                        {content}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Desktop: sidebar + content */}
            <div className="hidden md:flex flex-1 min-h-0">

                <div className="w-56 flex-shrink-0 border-r border-border overflow-y-auto">
                    <div className="p-2 space-y-0.5">
                        {sections.map(({ id, icon: Icon, title }) => (
                            <button
                                key={id}
                                onClick={() => setActive(id)}
                                className={cn(
                                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-left transition-colors",
                                    active === id
                                        ? "bg-secondary text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                )}
                            >
                                <Icon size={14} className="flex-shrink-0" />
                                {title}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <current.icon size={20} className="text-foreground flex-shrink-0" />
                            <h1 className="text-lg font-semibold">{current.title}</h1>
                        </div>
                        {current.content}
                    </div>
                </div>

            </div>
        </div>
    )
}