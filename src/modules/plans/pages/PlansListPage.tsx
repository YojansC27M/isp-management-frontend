import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import PlansTable from "../components/PlansTable"
import { deletePlan, getPlans } from "../services/plansApi"
import type { Plan } from "../types/plan"

const PlansListPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlans()
      setPlans(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  const filteredPlans = useMemo(() => {
    const term = search.trim().toLowerCase()
    return plans.filter((plan) => plan.name.toLowerCase().includes(term))
  }, [plans, search])

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Estás seguro de eliminar este plan?")
    if (!confirmed) return
    await deletePlan(id)
    await loadPlans()
    window.alert("Plan eliminado correctamente.")
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1>Planes de servicio</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Administra planes residenciales y empresariales.</p>
        </div>
        <button type="button" onClick={() => navigate("/plans/new")}>
          Crear plan
        </button>
      </header>

      <input
        type="search"
        placeholder="Buscar por nombre del plan..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ maxWidth: 360 }}
      />

      {loading ? (
        <p>Cargando planes...</p>
      ) : filteredPlans.length === 0 ? (
        <p>No se encontraron planes.</p>
      ) : (
        <PlansTable
          plans={filteredPlans}
          onEdit={(id) => navigate(`/plans/${id}/edit`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

export default PlansListPage
