import { useCallback, useEffect, useState } from "react"
import StateMessage from "@/components/feedback/StateMessage"
import PageHeader from "@/components/shared/PageHeader"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import SystemSettingsForm from "../components/SystemSettingsForm"
import { getSystemSettings, updateSystemSettings, uploadSystemLogo } from "../services/systemSettingsApi"
import type { SystemSettingsFormValues } from "../types/systemSettings"

const SystemSettingsPage = () => {
  const canEdit = useCan("system_settings.write")
  const { notify } = useUI()
  const [settings, setSettings] = useState<SystemSettingsFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getSystemSettings()
      setSettings(data)
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar la configuracion del sistema."))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSubmit = async (values: SystemSettingsFormValues) => {
    try {
      const updated = await updateSystemSettings(values)
      setSettings(updated)
      notify({
        title: "Configuracion actualizada",
        description: "Los ajustes generales del ISP se guardaron correctamente.",
        type: "success",
      })
    } catch (err) {
      notify({
        title: "No se pudieron guardar los cambios",
        description: getErrorMessage(err, "Verifica la informacion e intenta nuevamente."),
        type: "error",
      })
    }
  }

  const handleLogoUpload = async (fileName: string) => {
    try {
      const result = await uploadSystemLogo(fileName)
      setSettings((current) => (current ? { ...current, logoUrl: result.logoUrl } : current))
      notify({
        title: "Logo actualizado",
        description: "El nuevo logo se aplico correctamente.",
        type: "success",
      })
    } catch (err) {
      notify({
        title: "No se pudo subir el logo",
        description: getErrorMessage(err, "Intenta nuevamente en unos segundos."),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Configuracion del sistema ISP"
        description="Administra parametros globales de la empresa, facturacion, zona horaria y branding."
      />

      {loading ? (
        <StateMessage variant="loading" title="Cargando configuracion..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar configuracion" description={error} />
      ) : !settings ? (
        <StateMessage variant="empty" title="No hay configuracion disponible." />
      ) : (
        <>
          {!canEdit ? (
            <StateMessage
              variant="empty"
              title="Modo solo lectura"
              description="Tu perfil no tiene permisos para modificar esta configuracion."
            />
          ) : null}
          <SystemSettingsForm
            initialValues={settings}
            onSubmit={handleSubmit}
            onLogoUpload={handleLogoUpload}
            canEdit={canEdit}
          />
        </>
      )}
    </div>
  )
}

export default SystemSettingsPage

