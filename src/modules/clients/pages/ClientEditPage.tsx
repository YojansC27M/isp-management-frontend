import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import ClientForm from "../components/ClientForm"
import { getClientById, updateClient } from "../services/clientsApi"
import type { ClientFormValues } from "../types/client"

const ClientEditPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [initialValues, setInitialValues] = useState<ClientFormValues | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClient = async () => {
      if (!id) return
      setLoading(true)
      try {
        const client = await getClientById(id)
        const { name, document, address, phone, email, plan, ipAddress, status, latitude, longitude } = client
        setInitialValues({ name, document, address, phone, email, plan, ipAddress, status, latitude, longitude })
      } finally {
        setLoading(false)
      }
    }

    loadClient()
  }, [id])

  const handleSubmit = async (values: ClientFormValues) => {
    if (!id) return
    await updateClient(id, values)
    navigate("/clients")
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t("clients.editLoading")}</p>
  if (!initialValues) return <p className="text-sm text-muted-foreground">{t("clients.editNotFound")}</p>

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("clients.editTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("clients.editDescription")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/clients")}>
          {t("clients.backToList")}
        </Button>
      </header>
      <ClientForm initialValues={initialValues} onSubmit={handleSubmit} submitLabel={t("profile.save")} />
    </div>
  )
}

export default ClientEditPage
