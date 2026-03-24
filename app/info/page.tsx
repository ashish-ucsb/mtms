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
                    Real TAOS software computes position, velocity, acceleration, and body attitude as a function of time — determining performance characteristics such as range, speed, time of flight, and altitude. This project does exactly that, but as a live web application anyone can visit.
                </p>
                <p>
                    It was built to demonstrate defense-grade software engineering for range &amp; test instrumentation roles — the kind of software that runs at test facilities to record, validate, and report on flight vehicle performance.
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
                    The tracking dashboard streams live telemetry from a 6-DOF (six degrees of freedom) physics simulation running in Python. It shows a real-time 3D trajectory arc, live stat cards, and time-series charts for altitude, speed, and dynamic pressure.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">How to use</p>
                    <ol className="space-y-1.5 text-xs list-decimal list-inside">
                        <li>Adjust the simulation parameters in the config panel (launch angle, mass, thrust, etc.)</li>
                        <li>Click <strong className="text-foreground">Launch</strong> — the engine computes the full trajectory (~1–2 seconds)</li>
                        <li>Watch the missile arc play back in the 3D viewer with live telemetry updating</li>
                        <li>Drag to rotate the view, scroll to zoom, right-drag to pan</li>
                        <li>Green dot = launch point, Red dot = impact point, Indigo dot = current position</li>
                    </ol>
                </div>
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Anomaly detection</p>
                    <p className="text-xs">The engine monitors for: altitude ceiling breach (50,000m), speed limit violation (2,000 m/s), excessive dynamic pressure (400,000 Pa ≈ Mach 2.4 at sea level), and attitude deviation (yaw &gt; 15°). Anomalies are flagged inline on each telemetry frame after t=2s.</p>
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
                    The test suite runs automated validation against the simulation data you already ran in the Tracking tab — no re-simulation needed. This mirrors how defense test software works: the same flight data is used for both real-time display and post-flight analysis.
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
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Test suites</p>
                    <div className="space-y-1 text-xs">
                        {[
                            ["TS-001", "Data acquisition & recording", "Frame rate compliance, state vector completeness"],
                            ["TS-002", "Trajectory reconstruction", "3D position continuity, apogee detection, range"],
                            ["TS-003", "Anomaly detection", "Altitude ceiling, dynamic pressure, Mach number"],
                            ["TS-004", "Performance characteristics", "Speed computation, time of flight"],
                        ].map(([id, name, desc]) => (
                            <div key={id} className="flex gap-2">
                                <span className="mono text-foreground w-14 flex-shrink-0">{id}</span>
                                <span className="flex-1"><strong className="text-foreground">{name}</strong> — {desc}</span>
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
                    The requirements matrix implements a full <strong className="text-foreground">Software Requirements Specification (SRS)</strong> in IEEE 830 format. Each requirement is written with a unique ID, priority level (shall / should / may), type (functional, performance, safety, interface), and linked test cases — forming a complete <strong className="text-foreground">Requirements Traceability Matrix (RTM)</strong>.
                </p>
                <p>
                    The export button generates a <strong className="text-foreground">ReqIF 1.0 XML</strong> file — the open standard used by IBM DOORS and Rational Publishing Engine (RPE). This is directly importable into a DOORS database, which is the industry-standard requirements management tool in defense programs.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-2">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">How to use</p>
                    <ol className="space-y-1.5 text-xs list-decimal list-inside">
                        <li>Click any row to see full requirement details in the side panel</li>
                        <li>Filter by status: verified, partial, or unverified</li>
                        <li>Click <strong className="text-foreground">ReqIF XML</strong> to download the DOORS-compatible export</li>
                        <li>Each requirement shows its source category — the engineering discipline it addresses</li>
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
                    The report tab generates a PDF test report entirely in the browser using <strong className="text-foreground">jsPDF</strong> — no server call needed. It pulls from the shared simulation state, so it always reflects the current run. If you've run the test suite, validation results are included automatically.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Report sections</p>
                    <div className="space-y-1 text-xs">
                        {[
                            ["Section 1", "Flight summary", "Max altitude, speed, Mach, range, TOF, apogee time"],
                            ["Section 2", "Anomaly log", "Each flagged event with timestamp, type, severity, value"],
                            ["Section 3", "Validation suite results", "Pass/fail per test case, linked to requirement IDs"],
                            ["Section 4", "Requirements coverage", "Full RTM — all 10 requirements with verification status"],
                        ].map(([s, t, d]) => (
                            <div key={s} className="flex gap-2">
                                <span className="mono text-foreground w-20 flex-shrink-0">{s}</span>
                                <span><strong className="text-foreground">{t}</strong> — {d}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <p className="text-xs">
                    Tip: run a simulation, then run the test suite, then generate the report — this gives you the most complete PDF with all 4 sections populated.
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
                    The trajectory engine (<code className="mono text-xs bg-secondary px-1 py-0.5 rounded">lib/engine.ts</code>) implements 6-DOF equations of motion in pure TypeScript — no dependencies, no external calls. It's a pure function: config in, frames out, with no state and no side effects. It runs directly inside the Next.js API route on Vercel.
                </p>
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">What it computes per frame</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {[
                            ["Position", "x, y, z (m)"],
                            ["Velocity", "vx, vy, vz (m/s)"],
                            ["Acceleration", "ax, ay, az (m/s²)"],
                            ["Speed", "total speed (m/s)"],
                            ["Mach number", "speed / speed-of-sound(alt)"],
                            ["Dynamic pressure", "½ρv² (Pa)"],
                            ["Pitch / Yaw", "body attitude (degrees)"],
                            ["Anomaly flag", "threshold breach if any"],
                        ].map(([k, v]) => (
                            <div key={k} className="flex gap-1">
                                <span className="text-foreground font-medium w-28 flex-shrink-0">{k}</span>
                                <span>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="rounded-md border border-border bg-card p-3 space-y-1.5">
                    <p className="text-xs font-medium text-foreground uppercase tracking-widest">Standard atmosphere model</p>
                    <p className="text-xs">Altitude-dependent density, pressure, and speed of sound using the ISA (International Standard Atmosphere) troposphere model up to 11km, then stratosphere above. This makes Mach number and dynamic pressure physically accurate at altitude.</p>
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
                    The entire application runs on <strong className="text-foreground">Vercel</strong> with no external database. Simulation state lives in a React Context that wraps all pages — switching tabs never loses your data mid-run.
                </p>
                <div className="rounded-md border border-border bg-secondary p-3 font-mono text-xs space-y-1 leading-relaxed">
                    <p className="text-foreground">Browser (React state — no database)</p>
                    <p className="pl-4 text-muted-foreground">↕ REST (JSON)     ↕ REST (JSON)     static     client-side</p>
                    <p className="pl-4 text-muted-foreground">/api/telemetry   /api/test-run    reqs.json  jsPDF</p>
                    <p className="pl-8 text-muted-foreground">↓                      ↓</p>
                    <p className="pl-4 text-foreground">lib/engine.ts — 6-DOF physics (pure TypeScript)</p>
                    <p className="pl-8 text-muted-foreground">pure function · no DB · runs inside Next.js API route</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                        ["Frontend", "Next.js 14, React, Tailwind, shadcn/ui"],
                        ["3D viewer", "Three.js via React Three Fiber"],
                        ["Charts", "Recharts"],
                        ["Physics", "TypeScript — pure function in lib/engine.ts"],
                        ["PDF", "jsPDF + jsPDF-AutoTable (client-side)"],
                        ["Deploy", "Vercel (zero config)"],
                        ["Local dev", "Docker Compose (Next.js + Python)"],
                        ["Requirements", "ReqIF 1.0 XML (DOORS-compatible)"],
                    ].map(([k, v]) => (
                        <div key={k} className="flex gap-2 border border-border rounded-md px-3 py-2 bg-card">
                            <span className="text-foreground font-medium w-24 flex-shrink-0">{k}</span>
                            <span>{v}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
    }
]

export default function InfoPage() {
    const [active, setActive] = useState("overview")
    const current = sections.find(s => s.id === active) ?? sections[0]

    return (
        <div className="h-screen flex flex-col pt-12">
            <Nav />

            {/* Mobile: stacked accordion */}
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
            <div className="hidden md:flex flex-1 min-h-0 gap-0">

                {/* Sidebar */}
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

                {/* Content */}
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