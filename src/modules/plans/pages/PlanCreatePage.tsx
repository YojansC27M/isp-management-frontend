import { useNavigate } from "react-router-dom"
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
    window.alert("Plan created successfully.")
    navigate("/plans")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Create Plan</h1>
        <p style={{ color: "#6b7280" }}>Add a new service plan.</p>
      </header>
      <PlanForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Create" />
    </div>
  )
}

export default PlanCreatePage
