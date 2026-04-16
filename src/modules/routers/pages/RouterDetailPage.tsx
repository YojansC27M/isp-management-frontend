import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import StateMessage from "@/components/feedback/StateMessage"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import RouterForm from "../components/RouterForm"
import RouterHealthCard from "../components/RouterHealthCard"
import {
  getRouterById,
  getRouterHealth,
  testRouterConnection,
  testRouterConnectionById,
  updateRouter,
} from "../services/routersApi"
import type { ManagedRouter, RouterFormValues, RouterHealth } from "../types/router"

const mapRouterToFormValues = (router: ManagedRouter): RouterFormValues => ({
  name: router.name,
  ip: router.ip,
  port: router.port,
  username: router.username,
  password: "",
  zone: router.zone,
  location: router.location,
  latitude: router.latitude,
  longitude: router.longitude,
})

const RouterDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { notify } = useUI()
  const canEdit = useCan("routers.write")
  const [router, setRouter] = useState<ManagedRouter | null>(null)
  const [health, setHealth] = useState<RouterHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError("")
    try {
      const [routerData, healthData] = await Promise.all([getRouterById(id), getRouterHealth(id)])
      setRouter(routerData)
      setHealth(healthData)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el detalle del router."))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const initialValues = useMemo<RouterFormValues>(() => {
    if (!router) {
      return {
        name: "",
        ip: "",
        port: 8728,
        username: "",
        password: "",
        zone: "",
        location: "",
        latitude: null,
        longitude: null,
      }
    }
    return mapRouterToFormValues(router)
  }, [router])

  const handleSubmit = async (values: RouterFormValues) => {
    if (!id) return
    try {
      const payload = values.password.trim() ? values : { ...values, password: router?.passwordMasked ?? "******" }
      await updateRouter(id, payload)
      notify({
        title: "Router actualizado",
        description: "Los cambios del router se guardaron correctamente.",
        type: "success",
      })
      await loadData()
    } catch (err) {
      notify({
        title: "No se pudo actualizar el router",
        description: getErrorMessage(err, "Verifica los datos e intenta nuevamente."),
        type: "error",
      })
    }
  }

  const handleQuickConnectionTest = async () => {
    if (!id) return
    try {
      const result = await testRouterConnectionById(id)
      notify({
        title: result.success ? "Conexion exitosa" : "Conexion fallida",
        description: result.latencyMs != null ? `${result.message}. Latencia ${result.latencyMs} ms.` : result.message,
        type: result.success ? "success" : "error",
      })
      await loadData()
    } catch (err) {
      notify({
        title: "No se pudo probar la conexion",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
  }

  if (loading) return <StateMessage variant="loading" title="Cargando detalle del router..." />
  if (error) return <StateMessage variant="error" title="Error al cargar router" description={error} />
  if (!router) return <StateMessage variant="empty" title="Router no encontrado." />

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Router: ${router.name}`}
        description={`Estado ${router.status === "online" ? "online" : "offline"} · Ultimo chequeo ${new Date(router.lastCheckedAt).toLocaleString("es-CO")}`}
        actions={
          <>
            <Button variant="outline" onClick={handleQuickConnectionTest}>
              Probar conexion
            </Button>
            <Button variant="outline" onClick={() => navigate("/routers")}>
              Volver
            </Button>
          </>
        }
      />
      <RouterHealthCard health={health} />
      <RouterForm
        initialValues={initialValues}
        submitLabel="Guardar cambios"
        canEdit={canEdit}
        onSubmit={handleSubmit}
        onTestConnection={testRouterConnection}
      />
    </div>
  )
}

export default RouterDetailPage

