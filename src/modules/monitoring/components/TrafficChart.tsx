const chartContainer: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
}

const barContainer: React.CSSProperties = {
  display: "grid",
  gap: 8,
}

const barRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "80px 1fr",
  alignItems: "center",
  gap: 12,
}

const TrafficChart = () => {
  const data = [
    { label: "08:00", rx: 40, tx: 30 },
    { label: "10:00", rx: 55, tx: 45 },
    { label: "12:00", rx: 70, tx: 60 },
    { label: "14:00", rx: 50, tx: 40 },
    { label: "16:00", rx: 65, tx: 52 },
  ]

  return (
    <div style={chartContainer}>
      <h3 style={{ marginTop: 0 }}>Traffic (RX vs TX)</h3>
      <div style={barContainer}>
        {data.map((point) => (
          <div key={point.label} style={barRow}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>{point.label}</span>
            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "#bfdbfe",
                  width: `${point.rx}%`,
                }}
              />
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: "#a7f3d0",
                  width: `${point.tx}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#6b7280" }}>
        <span>RX</span>
        <span>TX</span>
      </div>
    </div>
  )
}

export default TrafficChart
