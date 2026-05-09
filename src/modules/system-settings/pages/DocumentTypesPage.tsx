import { useNavigate } from "react-router-dom"
import { useCan } from "@/auth/usePermission"
import PageHeader from "@/components/shared/PageHeader"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import DocumentTypesCatalogPanel from "../components/DocumentTypesCatalogPanel"

const DocumentTypesPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const canReadSystemSettings = useCan("system_settings.read")

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("systemSettings.documentTypes.title")}
        description={t("systemSettings.documentTypes.description")}
        actions={
          canReadSystemSettings ? (
            <Button type="button" variant="outline" onClick={() => navigate("/settings/system?tab=document-types")}>
              {t("systemSettings.documentTypes.goToSystemSettings")}
            </Button>
          ) : null
        }
      />
      <DocumentTypesCatalogPanel />
    </div>
  )
}

export default DocumentTypesPage
