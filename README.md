# MTMS — Missile Tracking & Test Management System

A web-based flight instrumentation platform that simulates real-time trajectory analysis, automated test validation, and requirements traceability — the kind of software used at defense range and test facilities.

Live: [mtms-gilt.vercel.app](https://mtms-gilt.vercel.app/)

---

## What it does

**Tracking** — Simulate a missile flight with configurable parameters (launch angle, mass, thrust, burn time). Watch the trajectory animate in a 3D viewer with live telemetry: altitude, speed, Mach number, dynamic pressure, pitch, yaw. Anomalies are detected and flagged in real time.

**Tests** — Run an automated validation suite against the simulation data. 5 test suites, 13 test cases covering data acquisition, trajectory reconstruction, anomaly detection, performance characteristics, and system capabilities. Results feed directly into the requirements matrix.

**Requirements** — A full Software Requirements Specification (IEEE 830) with 10 requirements linked to test cases via a live Requirements Traceability Matrix. After running tests, each requirement shows verified / partial / failed status based on actual results. Export to ReqIF 1.0 XML (compatible with IBM DOORS).

**Report** — Generate a dark-themed PDF containing the flight summary, anomaly log, test suite results, and RTM coverage. Produced entirely client-side via jsPDF.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui |
| 3D viewer | Three.js via React Three Fiber + Drei |
| Charts | Recharts |
| Physics engine | TypeScript — pure function in `lib/engine.ts` |
| PDF generation | jsPDF + jsPDF-AutoTable (client-side) |
| Fonts | Geist Sans, Geist Mono |
| Deploy | Vercel |
| Local dev | Docker Compose |

---

## Architecture

```
Browser — React Context holds all state (no database)
│
├── /tracking     →  GET /api/telemetry   →  lib/engine.ts (6-DOF physics)
├── /tests        →  POST /api/test-run   →  validation suite against frames
├── /requirements →  GET /api/requirements → data/requirements.json + ReqIF export
└── /report       →  client-side jsPDF from React state
```

State is shared across all tabs via `SimContext` — run a simulation in Tracking, switch to Tests, run validation, then go to Requirements to see live RTM status, then generate a PDF in Report. No re-simulation needed between tabs.

---

## Physics engine

`lib/engine.ts` implements 6-DOF (six degrees of freedom) equations of motion in pure TypeScript with no dependencies.

Per-frame computation:
- Position (x, y, z), velocity (vx, vy, vz), acceleration (ax, ay, az)
- Speed, Mach number via ISA altitude-dependent speed of sound
- Dynamic pressure q-bar = ½ρv²
- Body attitude — pitch and yaw from velocity vector
- Anomaly detection — altitude ceiling, speed limit, dynamic pressure, attitude deviation

Derived flight summary:
- Max altitude, peak speed, peak Mach, range, time of flight, apogee time

Pure function: `simulate(config) → frames[]`, `flightSummary(frames) → summary`. No state, no side effects, no external calls.

---

## Requirements traceability

`data/requirements.json` contains 10 requirements in IEEE 830 SRS format. Each requirement has a unique ID (REQ-001 through REQ-010), a type (functional / performance / safety / interface), a priority (shall / should / may), and linked test case IDs.

After running the test suite, the Requirements tab derives live verification status for each requirement based on whether its linked test cases passed. Exports to **ReqIF 1.0 XML** for use in IBM DOORS or Rational Publishing Engine.

---

## Local development

```bash
# Option 1 — Docker
docker-compose up
# Open http://localhost:3000

# Option 2 — Node directly
npm install
npm run dev
# Open http://localhost:3000
```

---

## Deploy

```bash
npm i -g vercel
vercel
```

No environment variables needed. The physics engine runs inside the Next.js API route — no separate server, no external dependencies.

To serve under a subpath (e.g. `yoursite.com/projects/mtms`):

1. Add `basePath: "/projects/mtms"` in `next.config.js`
2. Add a rewrite in your main site's `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/projects/mtms/:path*",
      "destination": "https://your-mtms.vercel.app/projects/mtms/:path*"
    }
  ]
}
```