import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import VisitDetailsCard from "../components/VisitDetailsCard"
import { getVisitById } from "../services/visitsApi"
import type { Visit } from "../types/visit"

const VisitDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useI18n()
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

  if (loading) return <StateMessage variant="loading" title={t("visits.detail.loading")} />
  if (!visit) return <StateMessage variant="empty" title={t("visits.detail.notFound")} />

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t("visits.detail.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{visit.clientName}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/visits")}>
          {t("visits.detail.back")}
        </Button>
      </header>
      <VisitDetailsCard visit={visit} />
    </div>
  )
}

export default VisitDetailPage
