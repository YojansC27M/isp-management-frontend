import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useUI } from "@/ui/uiContext"
import RouterForm from "../components/RouterForm"
import { createRouter, testRouterConnection } from "../services/routersApi"
import type { RouterFormValues } from "../types/router"

const initialValues: RouterFormValues = {
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

const RouterCreatePage = () => {
  const navigate = useNavigate()
  const { notify } = useUI()

  const handleSubmit = async (values: RouterFormValues) => {
    try {
      await createRouter(values)
      notify({
        title: "Router creado",
        description: "El router se agrego correctamente al inventario.",
        type: "success",
      })
      navigate("/routers")
    } catch {
      notify({
        title: "No se pudo crear el router",
        description: "Revisa los datos e intenta nuevamente.",
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Nuevo router</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra un nuevo equipo MikroTik y valida conectividad antes de guardar.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/routers")}>
          Volver a routers
        </Button>
      </header>
      <RouterForm
        initialValues={initialValues}
        submitLabel="Crear router"
        canEdit={true}
        onSubmit={handleSubmit}
        onTestConnection={testRouterConnection}
      />
    </div>
  )
}

export default RouterCreatePage

