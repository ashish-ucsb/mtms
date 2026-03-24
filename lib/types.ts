// Telemetry frame — one tick from the physics engine
export interface TelemetryFrame {
  t: number           // time since launch (seconds)
  x: number           // downrange distance (m)
  y: number           // crossrange distance (m)
  z: number           // altitude (m)
  vx: number          // velocity x (m/s)
  vy: number          // velocity y (m/s)
  vz: number          // velocity z (m/s)
  ax: number          // acceleration x (m/s²)
  ay: number          // acceleration y (m/s²)
  az: number          // acceleration z (m/s²)
  speed: number       // total speed (m/s)
  mach: number        // mach number
  pitch: number       // body pitch angle (deg)
  yaw: number         // body yaw angle (deg)
  roll: number        // body roll angle (deg)
  dynamic_pressure: number  // q-bar (Pa)
  anomaly: AnomalyFlag | null
}

export interface AnomalyFlag {
  type: "altitude_breach" | "speed_limit" | "attitude_deviation" | "dynamic_pressure"
  severity: "warning" | "critical"
  value: number
  threshold: number
  message: string
}

// Simulation config — what the user passes to the engine
export interface SimConfig {
  launch_angle: number       // deg from horizontal
  launch_azimuth: number     // deg from north
  initial_speed: number      // m/s
  mass: number               // kg
  drag_coefficient: number
  reference_area: number     // m²
  burn_time: number          // seconds
  thrust: number             // N
  dt: number                 // simulation timestep (s)
  max_time: number           // seconds
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  launch_angle: 45,
  launch_azimuth: 0,
  initial_speed: 0,
  mass: 500,
  drag_coefficient: 0.3,
  reference_area: 0.05,
  burn_time: 10,
  thrust: 50000,
  dt: 0.1,
  max_time: 120,
}

// Test suite types
export type TestStatus = "pass" | "fail" | "warn" | "pending"

export interface TestCase {
  id: string
  name: string
  description: string
  requirement_id: string    // links to requirements matrix
  threshold?: string
  status: TestStatus
  actual_value?: number
  expected_value?: number
  message?: string
}

export interface TestSuite {
  id: string
  name: string
  description: string
  cases: TestCase[]
  run_at?: string
  duration_ms?: number
}

// Requirements types
export interface Requirement {
  id: string                  // REQ-001
  title: string
  description: string
  type: "functional" | "performance" | "safety" | "interface"
  priority: "shall" | "should" | "may"
  test_ids: string[]          // links to test cases
  status: "verified" | "partial" | "unverified"
  source: string              // which JD section it maps to
}

// Report
export interface ReportData {
  generated_at: string
  sim_config: SimConfig
  flight_summary: {
    max_altitude: number
    max_speed: number
    max_mach: number
    range: number
    time_of_flight: number
    apogee_time: number
    anomaly_count: number
  }
  frames: TelemetryFrame[]
  test_suites: TestSuite[]
  requirements: Requirement[]
}
