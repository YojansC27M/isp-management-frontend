import type { CSSProperties } from "react"
import type { Router } from "../types/monitoring"

interface RouterCardProps {
  router: Router
  selected: boolean
  onSelect: (id: string) => void
}

const statusStyles: Record<Router["status"], CSSProperties> = {
  online: { backgroundColor: "#dcfce7", color: "#166534" },
  offline: { backgroundColor: "#fee2e2", color: "#991b1b" },
}

const RouterCard = ({ router, selected, onSelect }: RouterCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(router.id)}
      style={{
        textAlign: "left",
        border: selected ? "2px solid #2563eb" : "1px solid #e5e7eb",
        background: "#fff",
        borderRadius: 10,
        padding: 16,
        display: "grid",
        gap: 6,
        cursor: "pointer",
      }}
    >
      <strong>{router.name}</strong>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{router.ip}</span>
      <span style={{ fontSize: 13, color: "#6b7280" }}>{router.location}</span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 600,
          textTransform: "capitalize",
          width: "fit-content",
          ...statusStyles[router.status],
        }}
      >
        {router.status}
      </span>
    </button>
  )
}

export default RouterCard
