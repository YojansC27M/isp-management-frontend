import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import PaymentsTable from "../components/PaymentsTable"
import { getPayments } from "../services/paymentsApi"
import type { Payment, PaymentStatus } from "../types/payment"

const statusOptions: { label: string; value: PaymentStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
]

const PaymentsListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "">("")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)

  const loadPayments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPayments()
      setPayments(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPayments()
  }, [loadPayments])

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase()
    return payments.filter((payment) => {
      const matchesSearch = [payment.clientName, payment.invoiceNumber]
        .join(" ")
        .toLowerCase()
        .includes(term)
      const matchesStatus = statusFilter ? payment.status === statusFilter : true
      return matchesSearch && matchesStatus
    })
  }, [payments, search, statusFilter])

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1>Payments</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Track payments and client status.</p>
        </div>
        <button type="button" onClick={() => navigate("/payments/new")}>
          Register Payment
        </button>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search by client or invoice..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{ maxWidth: 360 }}
        />
        <label style={{ display: "grid", gap: 4, fontSize: 12 }}>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as PaymentStatus | "")}>
            <option value="">All</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p>Loading payments...</p>
      ) : filteredPayments.length === 0 ? (
        <p>No payments found.</p>
      ) : (
        <PaymentsTable
          payments={filteredPayments}
          onViewStatus={(clientId, clientName) =>
            navigate(`/payments/account-status/${clientId}`, { state: { clientName } })
          }
        />
      )}
    </div>
  )
}

export default PaymentsListPage
