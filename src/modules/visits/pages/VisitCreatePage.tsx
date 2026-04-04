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
    window.alert("Visita programada correctamente.")
    navigate("/visits")
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Programar visita</h1>
        <p style={{ color: "#6b7280" }}>Asigna un técnico y un horario.</p>
        <button type="button" onClick={() => navigate("/visits")} style={{ width: "fit-content" }}>
          Volver a Visitas
        </button>
      </header>
      <VisitForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel="Programar" />
    </div>
  )
}

export default VisitCreatePage
