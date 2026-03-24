import { NextRequest, NextResponse } from "next/server"
import { DEFAULT_SIM_CONFIG } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const config = {
    ...DEFAULT_SIM_CONFIG,
    launch_angle: parseFloat(searchParams.get("launch_angle") ?? "45"),
    launch_azimuth: parseFloat(searchParams.get("launch_azimuth") ?? "0"),
    mass: parseFloat(searchParams.get("mass") ?? "500"),
    thrust: parseFloat(searchParams.get("thrust") ?? "50000"),
    burn_time: parseFloat(searchParams.get("burn_time") ?? "10"),
    drag_coefficient: parseFloat(searchParams.get("drag_coefficient") ?? "0.3"),
    dt: 0.1,
    max_time: 120,
    action: "simulate",
  }

  const engineUrl = process.env.PYTHON_ENGINE_URL ?? "http://localhost:8000"

  try {
    const engineRes = await fetch(engineUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    })

    if (!engineRes.ok) {
      const text = await engineRes.text()
      console.error("Engine error:", engineRes.status, text)
      return NextResponse.json({ error: "Engine error", detail: text }, { status: 502 })
    }

    const data = await engineRes.json()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error("Engine fetch failed:", e?.message)
    return NextResponse.json({ error: "Engine unreachable", detail: e?.message }, { status: 503 })
  }
}