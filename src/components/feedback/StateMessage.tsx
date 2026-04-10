import type { ComponentType } from "react"
import { AlertTriangle, Inbox, Loader2 } from "lucide-react"

type StateVariant = "loading" | "empty" | "error"

interface StateMessageProps {
  variant: StateVariant
  title: string
  description?: string
}

const iconByVariant = {
  loading: Loader2,
  empty: Inbox,
  error: AlertTriangle,
} satisfies Record<StateVariant, ComponentType<{ className?: string }>>

const toneByVariant = {
  loading: "border-sky-200 bg-sky-50 text-sky-800",
  empty: "border-border bg-muted/40 text-muted-foreground",
  error: "border-rose-200 bg-rose-50 text-rose-800",
} satisfies Record<StateVariant, string>

const StateMessage = ({ variant, title, description }: StateMessageProps) => {
  const Icon = iconByVariant[variant]
  const role = variant === "error" ? "alert" : "status"

  return (
    <div
      className={`rounded-xl border p-4 ${toneByVariant[variant]}`}
      role={role}
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-busy={variant === "loading"}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-4 ${variant === "loading" ? "animate-spin" : ""}`} aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="mt-1 text-xs opacity-90">{description}</p>}
        </div>
      </div>
    </div>
  )
}

export default StateMessage
