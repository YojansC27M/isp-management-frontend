import type { Router } from "../types/monitoring"

interface RouterCardProps {
  router: Router
  selected: boolean
  onSelect: (id: string) => void
}

const statusClasses: Record<Router["status"], string> = {
  online: "bg-emerald-100 text-emerald-800",
  offline: "bg-rose-100 text-rose-800",
}

const RouterCard = ({ router, selected, onSelect }: RouterCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(router.id)}
      className={`grid gap-1 rounded-xl border bg-card p-4 text-left transition hover:border-border ${
        selected ? "border-sky-500 ring-2 ring-sky-100" : "border-border"
      }`}
    >
      <strong className="text-foreground">{router.name}</strong>
      <span className="text-xs text-muted-foreground">{router.ip}</span>
      <span className="text-xs text-muted-foreground">{router.location}</span>
      <span className={`mt-1 inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[router.status]}`}>
        {router.status}
      </span>
    </button>
  )
}

export default RouterCard
