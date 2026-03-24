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
    const confirmed = window.confirm("Are you sure you want to delete this plan?")
    if (!confirmed) return
    await deletePlan(id)
    await loadPlans()
    window.alert("Plan deleted successfully.")
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
        <div>
          <h1>Service Plans</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Manage residential and business plans.</p>
        </div>
        <button type="button" onClick={() => navigate("/plans/new")}>
          Create Plan
        </button>
      </header>

      <input
        type="search"
        placeholder="Search by plan name..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        style={{ maxWidth: 360 }}
      />

      {loading ? (
        <p>Loading plans...</p>
      ) : filteredPlans.length === 0 ? (
        <p>No plans found.</p>
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
