"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, FlaskConical, FileText, FileBarChart2, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/tracking", icon: Activity, label: "Tracking" },
  { href: "/tests", icon: FlaskConical, label: "Tests" },
  { href: "/requirements", icon: FileText, label: "Requirements" },
  { href: "/report", icon: FileBarChart2, label: "Report" },
  { href: "/info", icon: Info, label: "Info" },
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center border-b border-border bg-background/95 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center pl-4 pr-3 h-12 flex-shrink-0">
        <span className="font-semibold tracking-tight text-sm">MTMS</span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Nav links */}
      <div className="flex items-center overflow-x-auto flex-1 min-w-0 scrollbar-hide">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 px-3 h-12 text-sm whitespace-nowrap transition-colors flex-shrink-0 border-b-2",
              path === href
                ? "text-foreground font-medium border-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}