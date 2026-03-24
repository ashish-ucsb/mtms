/**
 * Trajectory engine — TypeScript port of api/engine.py
 * Pure function, no dependencies. Runs in Next.js serverless on Vercel.
 */

export interface SimFrame {
    t: number; x: number; y: number; z: number
    vx: number; vy: number; vz: number
    ax: number; ay: number; az: number
    speed: number; mach: number
    pitch: number; yaw: number; roll: number
    dynamic_pressure: number
    anomaly: AnomalyFlag | null
}

export interface AnomalyFlag {
    type: string; severity: string
    value: number; threshold: number; message: string
}

export interface SimConfig {
    launch_angle?: number; launch_azimuth?: number
    mass?: number; drag_coefficient?: number; reference_area?: number
    burn_time?: number; thrust?: number
    dt?: number; max_time?: number; initial_speed?: number
}

export interface FlightSummary {
    max_altitude: number; max_speed: number; max_mach: number
    range: number; time_of_flight: number; apogee_time: number
    anomaly_count: number
}

// Standard atmosphere (ISA)
function atmosphere(alt: number): [number, number, number] {
    if (alt < 0) alt = 0
    const g = 9.80665, R = 287.058
    let T: number, P: number
    if (alt <= 11000) {
        T = 288.15 - 0.0065 * alt
        P = 101325 * (T / 288.15) ** (g / (0.0065 * R))
    } else {
        T = 216.65
        P = 22632.1 * Math.exp(-g * (alt - 11000) / (R * T))
    }
    const rho = P / (R * T)
    const a = Math.sqrt(1.4 * R * T)
    return [P, rho, a]
}

const THRESH = {
    alt: 50000,
    speed: 2000,
    qbar: 400000,
    yaw: 15,
}

function checkAnomaly(f: Partial<SimFrame>): AnomalyFlag | null {
    if ((f.z ?? 0) > THRESH.alt)
        return {
            type: "altitude_breach", severity: "warning",
            value: f.z!, threshold: THRESH.alt,
            message: `Altitude ${f.z!.toFixed(0)} m exceeds ${THRESH.alt.toFixed(0)} m ceiling`
        }
    if ((f.speed ?? 0) > THRESH.speed)
        return {
            type: "speed_limit", severity: "critical",
            value: f.speed!, threshold: THRESH.speed,
            message: `Speed ${f.speed!.toFixed(0)} m/s exceeds ${THRESH.speed} m/s limit`
        }
    if ((f.dynamic_pressure ?? 0) > THRESH.qbar)
        return {
            type: "dynamic_pressure", severity: "warning",
            value: f.dynamic_pressure!, threshold: THRESH.qbar,
            message: `Q-bar ${f.dynamic_pressure!.toFixed(0)} Pa exceeds structural limit`
        }
    if (Math.abs(f.yaw ?? 0) > THRESH.yaw)
        return {
            type: "attitude_deviation", severity: "warning",
            value: f.yaw!, threshold: THRESH.yaw,
            message: `Yaw ${f.yaw!.toFixed(1)}° exceeds ±${THRESH.yaw}° limit`
        }
    return null
}

const r = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d

export function simulate(cfg: SimConfig): SimFrame[] {
    const launchAngle = cfg.launch_angle ?? 45
    const launchAz = cfg.launch_azimuth ?? 0
    const mass = cfg.mass ?? 500
    const Cd = cfg.drag_coefficient ?? 0.3
    const Aref = cfg.reference_area ?? 0.05
    const burnTime = cfg.burn_time ?? 10
    const thrust = cfg.thrust ?? 50000
    const dt = cfg.dt ?? 0.1
    const maxTime = cfg.max_time ?? 120
    const g = 9.80665

    const el = (launchAngle * Math.PI) / 180
    const az = (launchAz * Math.PI) / 180
    const v0 = cfg.initial_speed ?? 0

    let vx = v0 * Math.cos(el) * Math.sin(az)
    let vy = v0 * Math.cos(el) * Math.cos(az)
    let vz = v0 * Math.sin(el)
    let x = 0, y = 0, z = 0, t = 0
    const frames: SimFrame[] = []

    while (t <= maxTime) {
        if (z < 0 && t > 0) break

        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz)
        const [, rho, aSound] = atmosphere(z)
        const mach = aSound > 0 ? speed / aSound : 0
        const qbar = 0.5 * rho * speed * speed
        const Fdrag = Cd * qbar * Aref

        let axd = 0, ayd = 0, azd = 0
        if (speed > 0) {
            axd = -Fdrag * vx / speed / mass
            ayd = -Fdrag * vy / speed / mass
            azd = -Fdrag * vz / speed / mass
        }

        let axt = 0, ayt = 0, azt = 0
        if (t <= burnTime) {
            if (speed === 0) {
                axt = thrust * Math.cos(el) * Math.sin(az) / mass
                ayt = thrust * Math.cos(el) * Math.cos(az) / mass
                azt = thrust * Math.sin(el) / mass
            } else {
                axt = thrust * vx / speed / mass
                ayt = thrust * vy / speed / mass
                azt = thrust * vz / speed / mass
            }
        }

        const ax = axd + axt
        const ay = ayd + ayt
        const azTot = azd + azt - g

        const hSpeed = Math.sqrt(vx * vx + vy * vy)
        const pitch = hSpeed > 0.01 ? (Math.atan2(vz, hSpeed) * 180) / Math.PI : 90
        const yaw = (Math.abs(vx) + Math.abs(vy)) > 0.01
            ? (Math.atan2(vx, vy) * 180) / Math.PI : 0

        const frame: SimFrame = {
            t: r(t), x: r(x), y: r(y), z: r(Math.max(z, 0)),
            vx: r(vx, 3), vy: r(vy, 3), vz: r(vz, 3),
            ax: r(ax, 4), ay: r(ay, 4), az: r(azTot, 4),
            speed: r(speed), mach: r(mach, 4),
            pitch: r(pitch), yaw: r(yaw), roll: 0,
            dynamic_pressure: r(qbar, 1),
            anomaly: null,
        }
        frame.anomaly = t > 2.0 ? checkAnomaly(frame) : null
        frames.push(frame)

        vx += ax * dt; vy += ay * dt; vz += azTot * dt
        x += vx * dt; y += vy * dt; z += vz * dt
        t += dt
    }
    return frames
}

export function flightSummary(frames: SimFrame[]): FlightSummary {
    if (!frames.length) return {
        max_altitude: 0, max_speed: 0, max_mach: 0,
        range: 0, time_of_flight: 0, apogee_time: 0, anomaly_count: 0,
    }
    let maxAlt = 0, maxSpeed = 0, maxMach = 0, apogeeIdx = 0
    for (let i = 0; i < frames.length; i++) {
        const f = frames[i]
        if (f.z > maxAlt) { maxAlt = f.z; apogeeIdx = i }
        if (f.speed > maxSpeed) maxSpeed = f.speed
        if (f.mach > maxMach) maxMach = f.mach
    }
    const last = frames[frames.length - 1]
    const range = Math.sqrt(last.x ** 2 + last.y ** 2)
    return {
        max_altitude: r(maxAlt),
        max_speed: r(maxSpeed),
        max_mach: r(maxMach, 4),
        range: r(range),
        time_of_flight: r(last.t),
        apogee_time: r(frames[apogeeIdx].t),
        anomaly_count: frames.filter(f => f.anomaly !== null).length,
    }
}