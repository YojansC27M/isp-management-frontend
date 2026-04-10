import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface KeyValueSummaryItem {
  label: string
  value: ReactNode
  valueClassName?: string
}

interface KeyValueSummaryGridProps {
  items: KeyValueSummaryItem[]
  className?: string
  gridClassName?: string
  itemClassName?: string
}

const KeyValueSummaryGrid = ({ items, className, gridClassName, itemClassName }: KeyValueSummaryGridProps) => {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className={cn("grid gap-3 sm:grid-cols-2", gridClassName)}>
        {items.map((item) => (
          <article key={item.label} className={cn("rounded-lg border border-border/60 bg-muted/40 p-3", itemClassName)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
            <p className={cn("mt-1 text-sm text-foreground", item.valueClassName)}>{item.value}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default KeyValueSummaryGrid
