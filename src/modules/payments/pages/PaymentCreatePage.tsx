import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
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
    navigate("/payments")
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Registrar pago</h1>
          <p className="mt-1 text-sm text-muted-foreground">Registra pagos manuales y actualiza el estado de cuenta.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/payments")}>
          Volver a Pagos
        </Button>
      </header>
      <PaymentForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Registrar pago" />
    </div>
  )
}

export default PaymentCreatePage
