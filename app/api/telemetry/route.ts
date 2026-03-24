import { NextRequest, NextResponse } from "next/server"
import { simulate, flightSummary } from "@/lib/engine"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const config = {
    launch_angle: parseFloat(searchParams.get("launch_angle") ?? "45"),
    launch_azimuth: parseFloat(searchParams.get("launch_azimuth") ?? "0"),
    mass: parseFloat(searchParams.get("mass") ?? "500"),
    thrust: parseFloat(searchParams.get("thrust") ?? "50000"),
    burn_time: parseFloat(searchParams.get("burn_time") ?? "10"),
    drag_coefficient: parseFloat(searchParams.get("drag_coefficient") ?? "0.3"),
    dt: 0.1,
    max_time: 120,
  }

  try {
    const frames = simulate(config)
    const summary = flightSummary(frames)
    return NextResponse.json({ frames, summary })
  } catch (e: any) {
    console.error("Engine error:", e?.message)
    return NextResponse.json({ error: "Engine error", detail: e?.message }, { status: 500 })
  }
}