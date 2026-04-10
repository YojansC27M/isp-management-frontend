import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import PlansTable from "../components/PlansTable"
import { deletePlan, getPlans } from "../services/plansApi"
import type { Plan } from "../types/plan"

const PlansListPage = () => {
  const navigate = useNavigate()
  const { confirm, notify } = useUI()
  const [search, setSearch] = useState("")
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const canManagePlans = useCan("plans.write")

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getPlans()
      setPlans(data)
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar los planes."))
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
    if (!canManagePlans) return
    const accepted = await confirm({
      title: "Eliminar plan",
      description: "Se eliminara del catalogo local.",
      confirmLabel: "Eliminar",
    })
    if (!accepted) return
    try {
      await deletePlan(id)
      await loadPlans()
      notify({ title: "Plan eliminado", type: "success" })
    } catch (err) {
      notify({
        title: "No se pudo eliminar el plan",
        description: getErrorMessage(err, "Intenta nuevamente."),
        type: "error",
      })
    }
  }

  const searchInputId = "plans-list-search"

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Planes de servicio"
        description="Administra planes residenciales y empresariales."
        actions={
          <Button
            onClick={() => navigate("/plans/new")}
            disabled={!canManagePlans}
            title={!canManagePlans ? "Tu perfil no tiene permiso para crear planes." : undefined}
          >
            Crear plan
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-1.5 md:max-w-sm">
          <Label htmlFor={searchInputId} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Buscar
          </Label>
          <Input
            id={searchInputId}
            type="search"
            placeholder="Nombre del plan..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title="Cargando planes..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar planes" description={error} />
      ) : filteredPlans.length === 0 ? (
        <StateMessage variant="empty" title="No se encontraron planes." />
      ) : (
        <PlansTable
          plans={filteredPlans}
          onEdit={(id) => navigate(`/plans/${id}/edit`)}
          onDelete={handleDelete}
          canManage={canManagePlans}
        />
      )}
    </div>
  )
}

export default PlansListPage
