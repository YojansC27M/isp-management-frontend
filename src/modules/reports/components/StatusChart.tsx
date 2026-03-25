import type { StatusDistribution } from "../types/report"

interface StatusChartProps {
  data: StatusDistribution[]
}

const StatusChart = ({ data }: StatusChartProps) => {
  if (data.length === 0) {
    return <p>No status distribution available.</p>
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Invoice Status Distribution</h3>
      <div style={{ display: "grid", gap: 10 }}>
        {data.map((item) => (
          <div key={item.status} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 12 }}>
            <span style={{ fontSize: 12, textTransform: "capitalize", color: "#6b7280" }}>{item.status}</span>
            <div style={{ height: 8, borderRadius: 999, background: "#fde68a", width: `${Math.min(item.count * 10, 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatusChart
