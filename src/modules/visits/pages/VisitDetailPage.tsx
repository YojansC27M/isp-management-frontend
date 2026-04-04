import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import VisitDetailsCard from "../components/VisitDetailsCard"
import { getVisitById } from "../services/visitsApi"
import type { Visit } from "../types/visit"

const VisitDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<Visit | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadVisit = async () => {
      if (!id) return
      setLoading(true)
      try {
        const data = await getVisitById(id)
        setVisit(data)
      } finally {
        setLoading(false)
      }
    }

    loadVisit()
  }, [id])

  if (loading) {
    return <p>Cargando visita...</p>
  }

  if (!visit) {
    return <p>Visita no encontrada.</p>
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "grid", gap: 6 }}>
        <h1>Detalle de visita</h1>
        <p style={{ color: "#6b7280" }}>{visit.clientName}</p>
        <button type="button" onClick={() => navigate("/visits")} style={{ width: "fit-content" }}>
          Volver a Visitas
        </button>
      </header>
      <VisitDetailsCard visit={visit} />
    </div>
  )
}

export default VisitDetailPage
