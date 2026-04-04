import type { RevenueData } from "../types/report"

interface RevenueChartProps {
  data: RevenueData[]
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  if (data.length === 0) {
    return <p>No hay datos de ingresos.</p>
  }

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Ingresos en el tiempo</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {data.map((point) => (
          <div key={point.date} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 12 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{point.date}</span>
            <div style={{ height: 8, borderRadius: 999, background: "#bfdbfe", width: `${Math.min(point.amount, 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default RevenueChart
