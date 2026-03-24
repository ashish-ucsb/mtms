import type { Metadata } from "next"
import "./globals.css"
import { SimProvider } from "@/lib/SimContext"

export const metadata: Metadata = {
  title: "MTMS — Missile Tracking & Test Management System",
  description: "Real-time trajectory analysis, test suite management, and requirements traceability",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <SimProvider>{children}</SimProvider>
      </body>
    </html>
  )
}