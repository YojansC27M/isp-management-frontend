interface AccountStatusSummaryProps {
  totalPending: number
  totalPaid: number
  totalOverdue: number
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff",
}

const AccountStatusSummary = ({ totalPending, totalPaid, totalOverdue }: AccountStatusSummaryProps) => {
  return (
    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
      <div style={cardStyle}>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Total Pending</p>
        <p style={{ fontSize: 20, fontWeight: 600 }}>${totalPending.toFixed(2)}</p>
      </div>
      <div style={cardStyle}>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Total Paid</p>
        <p style={{ fontSize: 20, fontWeight: 600 }}>${totalPaid.toFixed(2)}</p>
      </div>
      <div style={cardStyle}>
        <p style={{ fontSize: 12, color: "#6b7280" }}>Total Overdue</p>
        <p style={{ fontSize: 20, fontWeight: 600 }}>${totalOverdue.toFixed(2)}</p>
      </div>
    </div>
  )
}

export default AccountStatusSummary
