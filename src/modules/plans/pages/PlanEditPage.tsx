import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import PlanForm from "../components/PlanForm"
import { getPlanById, updatePlan } from "../services/plansApi"
import type { PlanFormValues } from "../types/plan"

const PlanEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [initialValues, setInitialValues] = useState<PlanFormValues | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlan = async () => {
      if (!id) return
      setLoading(true)
      try {
        const plan = await getPlanById(id)
        const { name, downloadSpeed, uploadSpeed, price, type } = plan
        setInitialValues({ name, downloadSpeed, uploadSpeed, price, type })
      } finally {
        setLoading(false)
      }
    }

    loadPlan()
  }, [id])

  const handleSubmit = async (values: PlanFormValues) => {
    if (!id) return
    await updatePlan(id, values)
    window.alert("Plan updated successfully.")
    navigate("/plans")
  }

  if (loading) {
    return <p>Loading plan...</p>
  }

  if (!initialValues) {
    return <p>Plan not found.</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Edit Plan</h1>
        <p style={{ color: "#6b7280" }}>Update plan details.</p>
      </header>
      <PlanForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Update" />
    </div>
  )
}

export default PlanEditPage
