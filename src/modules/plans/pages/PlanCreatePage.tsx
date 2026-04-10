import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import PlanForm from "../components/PlanForm"
import { createPlan } from "../services/plansApi"
import type { PlanFormValues } from "../types/plan"

const initialValues: PlanFormValues = {
  name: "",
  downloadSpeed: 0,
  uploadSpeed: 0,
  price: 0,
  type: "residential",
}

const PlanCreatePage = () => {
  const navigate = useNavigate()

  const handleSubmit = async (values: PlanFormValues) => {
    await createPlan(values)
    navigate("/plans")
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Crear plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">Define velocidad, precio y tipo de servicio.</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/plans")}>
          Volver a Planes
        </Button>
      </header>
      <PlanForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Crear plan" />
    </div>
  )
}

export default PlanCreatePage
