"""
MTMS Trajectory Engine — engine.py
6-DOF equations of motion for missile flight simulation.
"""

from http.server import BaseHTTPRequestHandler
import json
import math


# ── Standard atmosphere model ──────────────────────────────────────────────

def standard_atmosphere(altitude_m: float):
    """Returns (pressure_Pa, density_kg_m3, speed_of_sound_m_s) at altitude."""
    T0, P0 = 288.15, 101325.0
    L, g, R = 0.0065, 9.80665, 287.058

    if altitude_m < 0:
        altitude_m = 0.0

    if altitude_m <= 11000:
        T = T0 - L * altitude_m
        P = P0 * (T / T0) ** (g / (L * R))
    else:
        T = 216.65
        P = 22632.1 * math.exp(-g * (altitude_m - 11000) / (R * T))

    rho = P / (R * T)
    a   = math.sqrt(1.4 * R * T)
    return P, rho, a


# ── Anomaly thresholds ─────────────────────────────────────────────────────

THRESHOLDS = {
    "max_altitude_m":       50000.0,
    "max_speed_ms":         2000.0,
    "max_dynamic_pressure": 400000.0,
    "max_yaw_deg":          15.0,
}


def check_anomalies(frame: dict):
    if frame["z"] > THRESHOLDS["max_altitude_m"]:
        return {
            "type": "altitude_breach", "severity": "warning",
            "value": round(frame["z"], 1),
            "threshold": THRESHOLDS["max_altitude_m"],
            "message": f"Altitude {frame['z']:.0f} m exceeds {THRESHOLDS['max_altitude_m']:.0f} m ceiling",
        }
    if frame["speed"] > THRESHOLDS["max_speed_ms"]:
        return {
            "type": "speed_limit", "severity": "critical",
            "value": round(frame["speed"], 1),
            "threshold": THRESHOLDS["max_speed_ms"],
            "message": f"Speed {frame['speed']:.0f} m/s exceeds {THRESHOLDS['max_speed_ms']:.0f} m/s limit",
        }
    if frame["dynamic_pressure"] > THRESHOLDS["max_dynamic_pressure"]:
        return {
            "type": "dynamic_pressure", "severity": "warning",
            "value": round(frame["dynamic_pressure"], 0),
            "threshold": THRESHOLDS["max_dynamic_pressure"],
            "message": f"Q-bar {frame['dynamic_pressure']:.0f} Pa exceeds structural limit",
        }
    if abs(frame["yaw"]) > THRESHOLDS["max_yaw_deg"]:
        return {
            "type": "attitude_deviation", "severity": "warning",
            "value": round(frame["yaw"], 2),
            "threshold": THRESHOLDS["max_yaw_deg"],
            "message": f"Yaw {frame['yaw']:.1f}° exceeds ±{THRESHOLDS['max_yaw_deg']:.0f}° limit",
        }
    return None


# ── 6-DOF integrator ───────────────────────────────────────────────────────

def simulate(config: dict) -> list:
    launch_angle  = float(config.get("launch_angle",     45))
    launch_az     = float(config.get("launch_azimuth",    0))
    mass          = float(config.get("mass",             500))
    Cd            = float(config.get("drag_coefficient", 0.3))
    A_ref         = float(config.get("reference_area",  0.05))
    burn_time     = float(config.get("burn_time",         10))
    thrust        = float(config.get("thrust",         50000))
    dt            = float(config.get("dt",               0.1))
    max_time      = float(config.get("max_time",         120))

    g  = 9.80665
    el = math.radians(launch_angle)
    az = math.radians(launch_az)

    v0 = float(config.get("initial_speed", 0))
    vx = v0 * math.cos(el) * math.sin(az)
    vy = v0 * math.cos(el) * math.cos(az)
    vz = v0 * math.sin(el)

    x, y, z, t = 0.0, 0.0, 0.0, 0.0
    frames = []

    while t <= max_time:
        if z < 0 and t > 0:
            break

        speed = math.sqrt(vx*vx + vy*vy + vz*vz)
        _, rho, a_sound = standard_atmosphere(z)

        mach  = speed / a_sound if a_sound > 0 else 0.0
        q_bar = 0.5 * rho * speed * speed

        F_drag = Cd * q_bar * A_ref
        if speed > 0:
            ax_drag = -F_drag * vx / speed / mass
            ay_drag = -F_drag * vy / speed / mass
            az_drag = -F_drag * vz / speed / mass
        else:
            ax_drag = ay_drag = az_drag = 0.0

        if t <= burn_time and speed == 0:
            ax_t = thrust * math.cos(el) * math.sin(az) / mass
            ay_t = thrust * math.cos(el) * math.cos(az) / mass
            az_t = thrust * math.sin(el) / mass
        elif t <= burn_time:
            ax_t = thrust * vx / speed / mass
            ay_t = thrust * vy / speed / mass
            az_t = thrust * vz / speed / mass
        else:
            ax_t = ay_t = az_t = 0.0

        ax       = ax_drag + ax_t
        ay       = ay_drag + ay_t
        az_total = az_drag + az_t - g

        h_speed = math.sqrt(vx*vx + vy*vy)
        pitch = math.degrees(math.atan2(vz, h_speed)) if h_speed > 0.01 else 90.0
        yaw   = math.degrees(math.atan2(vx, vy))      if (abs(vx)+abs(vy)) > 0.01 else 0.0

        frame = {
            "t":                round(t, 2),
            "x":                round(x, 2),
            "y":                round(y, 2),
            "z":                round(max(z, 0), 2),
            "vx":               round(vx, 3),
            "vy":               round(vy, 3),
            "vz":               round(vz, 3),
            "ax":               round(ax, 4),
            "ay":               round(ay, 4),
            "az":               round(az_total, 4),
            "speed":            round(speed, 2),
            "mach":             round(mach, 4),
            "pitch":            round(pitch, 2),
            "yaw":              round(yaw, 2),
            "roll":             0.0,
            "dynamic_pressure": round(q_bar, 1),
            "anomaly":          None,
        }
        frame["anomaly"] = check_anomalies(frame) if t > 2.0 else None
        frames.append(frame)

        vx += ax       * dt
        vy += ay       * dt
        vz += az_total * dt
        x  += vx * dt
        y  += vy * dt
        z  += vz * dt
        t  += dt

    return frames


def flight_summary(frames: list) -> dict:
    if not frames:
        return {}

    max_alt   = max(f["z"]     for f in frames)
    max_speed = max(f["speed"] for f in frames)
    max_mach  = max(f["mach"]  for f in frames)

    apogee_idx = max(range(len(frames)), key=lambda i: frames[i]["z"])
    last = frames[-1]
    range_m = math.sqrt(last["x"]**2 + last["y"]**2)

    return {
        "max_altitude":   round(max_alt, 1),
        "max_speed":      round(max_speed, 1),
        "max_mach":       round(max_mach, 4),
        "range":          round(range_m, 1),
        "time_of_flight": round(last["t"], 2),
        "apogee_time":    round(frames[apogee_idx]["t"], 2),
        "anomaly_count":  sum(1 for f in frames if f["anomaly"] is not None),
    }


# ── FastAPI app — Docker / local dev ──────────────────────────────────────

try:
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    import logging

    logging.getLogger("uvicorn.access").addFilter(
        type("HealthFilter", (logging.Filter,), {
            "filter": lambda self, r: "/health" not in r.getMessage()
        })()
    )

    app = FastAPI()
    app.add_middleware(
        CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
    )

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/")
    async def run(request: Request):
        config = await request.json()
        action = config.pop("action", "simulate")
        if action == "simulate":
            frames  = simulate(config)
            summary = flight_summary(frames)
            return JSONResponse({"frames": frames, "summary": summary})
        elif action == "summary_only":
            return JSONResponse({"summary": flight_summary(simulate(config))})
        return JSONResponse({"error": f"Unknown action: {action}"}, status_code=400)

except ImportError:
    app = None


# ── Vercel serverless handler ──────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)
        try:
            config = json.loads(body) if body else {}
        except json.JSONDecodeError:
            config = {}

        action = config.pop("action", "simulate")
        if action == "simulate":
            frames  = simulate(config)
            result  = {"frames": frames, "summary": flight_summary(frames)}
        elif action == "summary_only":
            result  = {"summary": flight_summary(simulate(config))}
        else:
            result  = {"error": f"Unknown action: {action}"}

        out = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(out)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(out)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, *args):
        pass