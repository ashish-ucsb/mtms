"use client"
import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react"
import { TelemetryFrame, AnomalyFlag, SimConfig, DEFAULT_SIM_CONFIG, TestSuite, Requirement } from "@/lib/types"

// Derived per-requirement status based on linked test case results
export type DerivedStatus = "verified" | "partial" | "unverified" | "static"

export interface RequirementStatus {
    id: string
    status: DerivedStatus
    passCount: number
    totalCount: number
}

interface SimData {
    frames: TelemetryFrame[]
    summary: Record<string, number> | null
    anomalies: AnomalyFlag[]
    testSuites: TestSuite[]
    testSummary: Record<string, number> | null
    // Live RTM: derived from test results, keyed by requirement ID
    reqStatuses: Record<string, RequirementStatus>
}

interface SimContextValue {
    simData: SimData
    config: SimConfig
    setConfig: (c: SimConfig) => void
    visibleIdx: number
    simState: "idle" | "loading" | "playing" | "complete"
    error: string | null
    launch: () => Promise<void>
    reset: () => void
    runTests: () => Promise<void>
    testState: "idle" | "running" | "done"
}

const SimContext = createContext<SimContextValue | null>(null)

// Build req status map from completed test suites
function deriveReqStatuses(suites: TestSuite[]): Record<string, RequirementStatus> {
    if (suites.length === 0) return {}

    // Flatten all test cases, keyed by test case ID
    const caseResultById: Record<string, "pass" | "fail" | "warn" | "pending"> = {}
    for (const suite of suites) {
        for (const tc of suite.cases) {
            caseResultById[tc.id] = tc.status
        }
    }

    // For each requirement, check its linked test_ids
    // We need the requirements list — load it from the static data
    // (this runs client-side so we import it directly)
    const statuses: Record<string, RequirementStatus> = {}

    // We'll populate this when we have requirements — the Requirements page
    // will call deriveStatus(req) using this map
    return { _cases: caseResultById as any }
}

export function computeReqStatus(
    req: Requirement,
    caseResultById: Record<string, string>
): RequirementStatus {
    const linked = req.test_ids
    if (linked.length === 0) {
        return { id: req.id, status: "static", passCount: 0, totalCount: 0 }
    }

    const results = linked.map(id => caseResultById[id])
    const known = results.filter(r => r !== undefined)

    if (known.length === 0) {
        // Tests haven't been run yet — show static JSON value
        return { id: req.id, status: "static", passCount: 0, totalCount: linked.length }
    }

    const passCount = known.filter(r => r === "pass").length
    const totalCount = known.length

    let status: DerivedStatus
    if (passCount === totalCount) status = "verified"
    else if (passCount > 0) status = "partial"
    else status = "unverified"

    return { id: req.id, status, passCount, totalCount }
}

export function SimProvider({ children }: { children: ReactNode }) {
    const [simData, setSimData] = useState<SimData>({
        frames: [], summary: null, anomalies: [],
        testSuites: [], testSummary: null, reqStatuses: {},
    })
    const [config, setConfig] = useState<SimConfig>(DEFAULT_SIM_CONFIG)
    const [visibleIdx, setVisibleIdx] = useState(0)
    const [simState, setSimState] = useState<"idle" | "loading" | "playing" | "complete">("idle")
    const [testState, setTestState] = useState<"idle" | "running" | "done">("idle")
    const [error, setError] = useState<string | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }, [])

    const startPlayback = useCallback((frames: TelemetryFrame[]) => {
        stopTimer()
        setVisibleIdx(0)
        setSimState("playing")
        let idx = 0
        const STEP = Math.max(1, Math.ceil(frames.length / 125))
        timerRef.current = setInterval(() => {
            idx += STEP
            if (idx >= frames.length) {
                stopTimer()
                setVisibleIdx(frames.length - 1)
                setSimState("complete")
                return
            }
            setVisibleIdx(idx)
            const anomaly = frames[idx].anomaly
            if (anomaly) {
                setSimData(prev => {
                    if (prev.anomalies.find(a => a.type === anomaly.type)) return prev
                    return { ...prev, anomalies: [...prev.anomalies.slice(-4), anomaly] }
                })
            }
        }, 80)
    }, [stopTimer])

    const launch = useCallback(async () => {
        if (simState === "loading" || simState === "playing") return
        stopTimer()
        setSimState("loading")
        setSimData({ frames: [], summary: null, anomalies: [], testSuites: [], testSummary: null, reqStatuses: {} })
        setVisibleIdx(0)
        setError(null)
        setTestState("idle")

        const params = new URLSearchParams({
            launch_angle: String(config.launch_angle),
            launch_azimuth: String(config.launch_azimuth),
            mass: String(config.mass),
            thrust: String(config.thrust),
            burn_time: String(config.burn_time),
            drag_coefficient: String(config.drag_coefficient),
        })

        try {
            const res = await fetch(`/api/telemetry?${params}`)
            const data = await res.json()
            if (!res.ok || data.error) { setError(data.error ?? `HTTP ${res.status}`); setSimState("idle"); return }
            const frames: TelemetryFrame[] = data.frames ?? []
            if (frames.length === 0) { setError("Engine returned 0 frames"); setSimState("idle"); return }
            setSimData(prev => ({ ...prev, frames, summary: data.summary ?? null }))
            startPlayback(frames)
        } catch (e: any) {
            setError(e?.message ?? "Fetch failed")
            setSimState("idle")
        }
    }, [config, simState, stopTimer, startPlayback])

    const reset = useCallback(() => {
        stopTimer()
        setSimData({ frames: [], summary: null, anomalies: [], testSuites: [], testSummary: null, reqStatuses: {} })
        setVisibleIdx(0)
        setSimState("idle")
        setTestState("idle")
        setError(null)
    }, [stopTimer])

    const runTests = useCallback(async () => {
        if (simData.frames.length === 0 || testState === "running") return
        setTestState("running")
        setSimData(prev => ({ ...prev, testSuites: [], testSummary: null, reqStatuses: {} }))

        try {
            const res = await fetch("/api/test-run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frames: simData.frames, summary: simData.summary }),
            })
            const { suites, summary: sm } = await res.json()

            // Build a flat map of test case ID → result
            const caseResultById: Record<string, string> = {}
            for (const suite of suites as TestSuite[]) {
                for (const tc of suite.cases) {
                    caseResultById[tc.id] = tc.status
                }
            }

            setSimData(prev => ({
                ...prev,
                testSuites: suites,
                testSummary: sm,
                // Store the flat case map so Requirements page can derive statuses
                reqStatuses: { _cases: caseResultById as any },
            }))
            setTestState("done")
        } catch {
            setTestState("idle")
        }
    }, [simData.frames, simData.summary, testState])

    return (
        <SimContext.Provider value={{
            simData, config, setConfig,
            visibleIdx, simState, error,
            launch, reset, runTests, testState,
        }}>
            {children}
        </SimContext.Provider>
    )
}

export function useSim() {
    const ctx = useContext(SimContext)
    if (!ctx) throw new Error("useSim must be used inside SimProvider")
    return ctx
}