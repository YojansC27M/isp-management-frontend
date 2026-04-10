import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface DataTableShellProps {
  children: ReactNode
  className?: string
}

const DataTableShell = ({ children, className }: DataTableShellProps) => {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

export default DataTableShell
