import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import AccountStatusSummary from "../components/AccountStatusSummary"
import { getAccountStatusByClient } from "../services/paymentsApi"
import type { AccountStatusItem, PaymentStatus } from "../types/payment"

interface LocationState {
  clientName?: string
}

const badgeStyles: Record<PaymentStatus, React.CSSProperties> = {
  pending: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  paid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  overdue: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
}

const AccountStatusPage = () => {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const [items, setItems] = useState<AccountStatusItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadStatus = async () => {
      if (!clientId) return
      setLoading(true)
      try {
        const data = await getAccountStatusByClient(clientId)
        setItems(data)
      } finally {
        setLoading(false)
      }
    }

    loadStatus()
  }, [clientId])

  const summary = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        if (item.status === "pending") acc.totalPending += item.amount
        if (item.status === "paid") acc.totalPaid += item.amount
        if (item.status === "overdue") acc.totalOverdue += item.amount
        return acc
      },
      { totalPending: 0, totalPaid: 0, totalOverdue: 0 },
    )
  }, [items])

  const clientLabel = state?.clientName ? state.clientName : clientId ? `Client ${clientId}` : "Client"

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Account Status</h1>
        <p style={{ color: "#6b7280" }}>{clientLabel}</p>
        <button type="button" onClick={() => navigate("/payments")} style={{ width: "fit-content" }}>
          Back to Payments
        </button>
      </header>

      {loading ? (
        <p>Loading account status...</p>
      ) : items.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <>
          <AccountStatusSummary
            totalPending={summary.totalPending}
            totalPaid={summary.totalPaid}
            totalOverdue={summary.totalOverdue}
          />
          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding={10} style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                  <th>Invoice Number</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td>{item.invoiceNumber}</td>
                    <td>{item.dueDate}</td>
                    <td>${item.amount.toFixed(2)}</td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "capitalize",
                          ...badgeStyles[item.status],
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default AccountStatusPage
