# MTMS — Missile Tracking & Test Management System

Real-time trajectory analysis, test suite management, and requirements traceability.
Built to demonstrate defense-grade software engineering for range & test solutions roles.

## Modules

| Module | Route | Description |
|--------|-------|-------------|
| Tracking dashboard | `/tracking` | Live 3D trajectory viewer, SSE telemetry stream, anomaly alerts |
| Test management | `/tests` | Validation suite runner, pass/fail results, threshold config |
| Requirements matrix | `/requirements` | IEEE 830 SRS, RTM traceability, ReqIF XML export (DOORS-compatible) |
| Report generation | `/report` | Client-side PDF: flight summary, anomaly log, test coverage |

## Architecture

```
Browser (React state — no database)
  ↕ SSE stream          ↕ REST POST       static JSON    client-side
  /api/telemetry        /api/test-run     requirements   jsPDF
        ↓                     ↓
        └──────────────────────┘
                  ↓
        api/engine.py (Python, numpy)
        6-DOF trajectory physics — pure function
```

## Stack

- **Frontend**: Next.js 14 (App Router), React, shadcn/ui, Tailwind CSS
- **3D viewer**: Three.js via React Three Fiber + Drei
- **Charts**: Recharts
- **Physics engine**: Python + numpy (Vercel serverless)
- **PDF generation**: jsPDF + jsPDF-AutoTable (client-side)
- **Fonts**: Rajdhani (UI), JetBrains Mono (data)
- **Deploy**: Vercel (zero config)
- **Local dev**: Docker Compose

## Local development

### Option 1 — Docker (recommended)

```bash
docker-compose up
```

Open http://localhost:3000

The Python engine runs at http://localhost:8000 automatically.

### Option 2 — Manual

**Terminal 1 — Python engine:**
```bash
cd api
pip install fastapi uvicorn numpy
uvicorn engine:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Next.js:**
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set environment variable in Vercel dashboard:
```
PYTHON_ENGINE_URL=  (leave empty — Vercel routes /api/py/* automatically via vercel.json)
```

## Physics engine

`api/engine.py` implements:

- **6-DOF equations of motion** — position, velocity, acceleration in x/y/z
- **Standard atmosphere model** — altitude-dependent density, pressure, speed of sound
- **Mach number** — derived from speed-of-sound at altitude
- **Dynamic pressure (q-bar)** — ½ρv²
- **Body attitude** — pitch and yaw from velocity vector
- **Anomaly detection** — altitude breach, speed limit, dynamic pressure, attitude deviation
- **Flight summary** — max altitude, range, time of flight, apogee time, peak Mach

All as a pure function: config in → frames + summary out. No state, no database, no side effects.

## Requirements traceability

Requirements in `data/requirements.json` follow IEEE 830 SRS format and export to
**ReqIF 1.0 XML** — the open standard used by IBM DOORS and Rational Publishing Engine.

Each requirement maps to test cases in the validation suite, forming a complete RTM.

## JD coverage (L3Harris Range & Test Solutions)

| JD requirement | Module |
|---|---|
| Data acquisition & recording | Tracking — SSE telemetry stream |
| Maintenance/status logging | Tracking — anomaly log |
| Client/server architecture | SSE + REST API routes |
| Software requirements documents | Requirements — IEEE 830 SRS |
| DOORS / RPE experience | Requirements — ReqIF XML export |
| Test suite execution | Tests — validation suite |
| Root cause analysis tooling | Tests — threshold config + failure messages |
| Static analysis awareness | Tests — CodeGuard module (see VulnLens) |
| GUI design | All modules — aerospace dark theme |
| SDLC documentation | Report — PDF test report |
| Agile / DevOps | Docker Compose + Vercel CI/CD |
