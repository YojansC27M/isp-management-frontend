import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import RoutersTable from "../components/RoutersTable"
import { deleteRouter, getRouters, testRouterConnectionById } from "../services/routersApi"
import type { ManagedRouter, RouterStatus } from "../types/router"

const inputId = (field: string) => `routers-list-${field}`

const RoutersListPage = () => {
  const navigate = useNavigate()
  const { notify, confirm } = useUI()
  const canManage = useCan("routers.write")
  const [routers, setRouters] = useState<ManagedRouter[]>([])
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<RouterStatus | "">("")
  const [zone, setZone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadRouters = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getRouters({ search, status, zone })
      setRouters(data)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el inventario de routers."))
    } finally {
      setLoading(false)
    }
  }, [search, status, zone])

  useEffect(() => {
    loadRouters()
  }, [loadRouters])

  const uniqueZones = useMemo(() => {
    return Array.from(new Set(routers.map((router) => router.zone).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  }, [routers])

  const handleDelete = async (id: string) => {
    if (!canManage) return
    const accepted = await confirm({
      title: "Eliminar router",
      description: "Esta accion no se puede deshacer y el router se removera del inventario.",
      confirmLabel: "Eliminar",
    })
    if (!accepted) return
    try {
      await deleteRouter(id)
      notify({ title: "Router eliminado", type: "success" })
      await loadRouters()
    } catch (err) {
      notify({
        title: "No se pudo eliminar el router",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
  }

  const handleConnectionTest = async (id: string) => {
    if (!canManage) return
    try {
      const result = await testRouterConnectionById(id)
      notify({
        title: result.success ? "Conexion exitosa" : "Conexion fallida",
        description: result.latencyMs != null ? `${result.message}. Latencia ${result.latencyMs} ms.` : result.message,
        type: result.success ? "success" : "error",
      })
      await loadRouters()
    } catch (err) {
      notify({
        title: "No se pudo probar conexion",
        description: getErrorMessage(err, "Error de red o credenciales invalidas."),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Inventario de routers"
        description="Gestiona routers MikroTik, valida conexion y monitorea estado operativo."
        actions={
          <Button
            onClick={() => navigate("/routers/new")}
            disabled={!canManage}
            title={!canManage ? "Tu perfil no tiene permiso para crear routers." : undefined}
          >
            Nuevo router
          </Button>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buscar
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder="Nombre, IP o usuario"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </Label>
            <select
              id={inputId("status")}
              value={status}
              onChange={(event) => setStatus(event.target.value as RouterStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todos</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("zone")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Zona
            </Label>
            <select
              id={inputId("zone")}
              value={zone}
              onChange={(event) => setZone(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todas</option>
              {uniqueZones.map((zoneOption) => (
                <option key={zoneOption} value={zoneOption}>
                  {zoneOption}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={() => loadRouters()}>
            Actualizar
          </Button>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title="Cargando routers..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar routers" description={error} />
      ) : routers.length === 0 ? (
        <StateMessage variant="empty" title="No se encontraron routers." />
      ) : (
        <RoutersTable
          routers={routers}
          canManage={canManage}
          onView={(id) => navigate(`/routers/${id}`)}
          onEdit={(id) => navigate(`/routers/${id}`)}
          onDelete={handleDelete}
          onTestConnection={handleConnectionTest}
        />
      )}
    </div>
  )
}

export default RoutersListPage
