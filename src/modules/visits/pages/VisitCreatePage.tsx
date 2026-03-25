import { useNavigate } from "react-router-dom"
import VisitForm from "../components/VisitForm"
import { createVisit } from "../services/visitsApi"
import type { VisitFormValues } from "../types/visit"

const initialValues: VisitFormValues = {
  clientId: "",
  technicianId: "",
  zone: "",
  type: "installation",
  scheduledDate: "",
  scheduledTime: "",
  status: "scheduled",
  notes: "",
}

const VisitCreatePage = () => {
  const navigate = useNavigate()

  const handleSubmit = async (values: VisitFormValues) => {
    await createVisit(values)
    window.alert("Visit scheduled successfully.")
    navigate("/visits")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Schedule Visit</h1>
        <p style={{ color: "#6b7280" }}>Assign a technician and time.</p>
        <button type="button" onClick={() => navigate("/visits")} style={{ width: "fit-content" }}>
          Back to Visits
        </button>
      </header>
      <VisitForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Schedule" />
    </div>
  )
}

export default VisitCreatePage
