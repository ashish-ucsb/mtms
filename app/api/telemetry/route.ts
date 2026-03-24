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

  // Priority order for engine URL:
  // 1. PYTHON_ENGINE_URL — set in docker-compose for local dev (http://engine:8000)
  // 2. VERCEL_URL        — auto-set by Vercel for the current deployment
  // 3. Derived from request host — fallback
  let engineBase: string
  if (process.env.PYTHON_ENGINE_URL) {
    engineBase = process.env.PYTHON_ENGINE_URL
  } else if (process.env.VERCEL_URL) {
    engineBase = `https://${process.env.VERCEL_URL}/api/engine`
  } else {
    engineBase = `${req.nextUrl.protocol}//${req.nextUrl.host}/api/engine`
  }

  try {
    const engineRes = await fetch(engineBase, {
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