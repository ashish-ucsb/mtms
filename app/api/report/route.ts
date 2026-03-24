// Report generation is handled entirely client-side via jsPDF in app/report/page.tsx
// This route is a placeholder for any server-side report utilities if needed in the future.
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Report generation is client-side. See /report page." })
}
