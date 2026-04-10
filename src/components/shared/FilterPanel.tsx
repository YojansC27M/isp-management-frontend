import type { ReactNode } from "react"

interface FilterPanelProps {
  children: ReactNode
  className?: string
}

const FilterPanel = ({ children, className = "" }: FilterPanelProps) => {
  return <section className={`rounded-xl border border-border bg-card p-4 ${className}`.trim()}>{children}</section>
}

export default FilterPanel

