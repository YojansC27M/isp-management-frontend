import { useNavigate } from "react-router-dom"
import PaymentForm from "../components/PaymentForm"
import { createPayment } from "../services/paymentsApi"
import type { PaymentFormValues } from "../types/payment"

const initialValues: PaymentFormValues = {
  clientId: "",
  invoiceNumber: "",
  amount: 0,
  paymentMethod: "cash",
  paymentDate: "",
  status: "pending",
}

const PaymentCreatePage = () => {
  const navigate = useNavigate()

  const handleSubmit = async (values: PaymentFormValues) => {
    await createPayment(values)
    window.alert("Payment registered successfully.")
    navigate("/payments")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Register Payment</h1>
        <p style={{ color: "#6b7280" }}>Record a new payment.</p>
        <button type="button" onClick={() => navigate("/payments")} style={{ width: "fit-content" }}>
          Back to Payments
        </button>
      </header>
      <PaymentForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Register" />
    </div>
  )
}

export default PaymentCreatePage
