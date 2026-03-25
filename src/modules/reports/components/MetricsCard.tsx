interface MetricsCardProps {
  label: string
  value: string
}

const MetricsCard = ({ label, value }: MetricsCardProps) => {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{label}</p>
      <p style={{ marginTop: 6, fontSize: 20, fontWeight: 600 }}>{value}</p>
    </div>
  )
}

export default MetricsCard
