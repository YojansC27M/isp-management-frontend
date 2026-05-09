import { useLocation, useNavigate } from "react-router-dom"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useUI } from "@/ui/uiContext"
import { getErrorMessage } from "@/lib/errors"
import TicketForm from "../components/TicketForm"
import { createTicket } from "../services/ticketsApi"
import type { TicketFormValues } from "../types/ticket"

const initialValues: TicketFormValues = {
  clientId: "",
  assignedUserId: "",
  assignedUserName: "",
  assignedTechnicianId: "",
  assignedTechnicianName: "",
  title: "",
  description: "",
  category: "technical",
  priority: "medium",
  status: "open",
}

interface TicketCreateLocationState {
  clientId?: string
  clientName?: string
}

const TicketCreatePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()
  const { notify } = useUI()
  const state = location.state as TicketCreateLocationState | null

  const formInitialValues = useMemo<TicketFormValues>(
    () => ({
      ...initialValues,
      clientId: state?.clientId ?? initialValues.clientId,
    }),
    [state?.clientId],
  )

  const handleSubmit = async (values: TicketFormValues, attachments?: File[] | null) => {
    try {
      const created = await createTicket(values, attachments)
      notify({
        title: t("tickets.create.success"),
        description: t("tickets.create.successDesc"),
        type: "success",
      })
      navigate(`/tickets/${created.id}`)
    } catch (err) {
      notify({
        title: t("tickets.create.errorTitle"),
        description: getErrorMessage(err, t("tickets.create.errorDesc")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("tickets.createTitle")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("tickets.createDescription")}</p>
          {state?.clientName ? (
            <p className="mt-2 text-sm font-medium text-primary">{state.clientName}</p>
          ) : null}
        </div>
        <Button variant="outline" onClick={() => navigate("/tickets")}>
          {t("tickets.create.back")}
        </Button>
      </header>
      <TicketForm initialValues={formInitialValues} onSubmit={handleSubmit} submitLabel={t("tickets.create")} />
    </div>
  )
}

export default TicketCreatePage
