import { useCallback, useEffect, useMemo, useState } from "react"
import { Building2, Clock3, KeyRound, ShieldCheck } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import KpiCard from "@/components/shared/KpiCard"
import PageHeader from "@/components/shared/PageHeader"
import { Card, CardContent } from "@/components/ui/card"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { cn } from "@/lib/utils"
import { useUI } from "@/ui/uiContext"
import DocumentTypesCatalogPanel from "../components/DocumentTypesCatalogPanel"
import SystemSettingsForm from "../components/SystemSettingsForm"
import { getSystemSettings, updateSystemSettings, uploadSystemLogo } from "../services/systemSettingsApi"
import type { SystemSettingsFormValues } from "../types/systemSettings"

type SettingsTab = "general" | "document-types"

const tabClass = (active: boolean) =>
  cn(
    "inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors",
    active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted/40",
  )

const SystemSettingsPage = () => {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()
  const canEdit = useCan("system_settings.write")
  const canReadDocumentTypes = useCan("document_types.read")
  const { notify } = useUI()
  const [settings, setSettings] = useState<SystemSettingsFormValues | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const activeTab = useMemo<SettingsTab>(() => {
    const value = searchParams.get("tab")
    return value === "document-types" ? "document-types" : "general"
  }, [searchParams])

  const setTab = (tab: SettingsTab) => {
    const next = new URLSearchParams(searchParams)
    if (tab === "general") {
      next.delete("tab")
    } else {
      next.set("tab", tab)
    }
    setSearchParams(next, { replace: true })
  }

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const settingsData = await getSystemSettings()
      setSettings(settingsData)
    } catch (err) {
      setError(getErrorMessage(err, t("systemSettings.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (activeTab !== "general") return
    loadSettings()
  }, [activeTab, loadSettings])

  const handleSubmit = async (values: SystemSettingsFormValues) => {
    try {
      const updated = await updateSystemSettings(values)
      setSettings(updated)
      notify({
        title: t("systemSettings.updatedTitle"),
        description: t("systemSettings.updatedDesc"),
        type: "success",
      })
    } catch (err) {
      notify({
        title: t("systemSettings.saveErrorTitle"),
        description: getErrorMessage(err, t("systemSettings.saveErrorDesc")),
        type: "error",
      })
    }
  }

  const handleLogoUpload = async (payload: { fileName: string; dataUrl: string }) => {
    try {
      const result = await uploadSystemLogo(payload)
      setSettings((current) => (current ? { ...current, logoUrl: result.logoUrl } : current))
      notify({
        title: t("systemSettings.logoUpdatedTitle"),
        description: t("systemSettings.logoUpdatedDesc"),
        type: "success",
      })
    } catch (err) {
      notify({
        title: t("systemSettings.logoUploadErrorTitle"),
        description: getErrorMessage(err, t("systemSettings.logoUploadErrorDesc")),
        type: "error",
      })
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader title={t("systemSettings.title")} description={t("systemSettings.description")} />

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2">
        <button type="button" className={tabClass(activeTab === "general")} onClick={() => setTab("general")}>
          {t("systemSettings.tabs.general")}
        </button>
        {canReadDocumentTypes ? (
          <button type="button" className={tabClass(activeTab === "document-types")} onClick={() => setTab("document-types")}>
            {t("systemSettings.tabs.documentTypes")}
          </button>
        ) : null}
      </div>

      {activeTab === "document-types" ? (
        canReadDocumentTypes ? (
          <DocumentTypesCatalogPanel />
        ) : (
          <StateMessage variant="error" title={t("systemSettings.readOnlyTitle")} description={t("systemSettings.readOnlyDesc")} />
        )
      ) : loading ? (
        <StateMessage variant="loading" title={t("systemSettings.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("systemSettings.loadErrorTitle")} description={error} />
      ) : !settings ? (
        <StateMessage variant="empty" title={t("systemSettings.emptyTitle")} />
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label={t("systemSettings.summary.company")} value={settings.companyName || "-"} className="border-sky-200/70 bg-sky-50/70" />
            <KpiCard label={t("systemSettings.summary.currency")} value={settings.currency || "-"} className="border-emerald-200/70 bg-emerald-50/70" />
            <KpiCard label={t("systemSettings.summary.timezone")} value={settings.timezone || "-"} className="border-cyan-200/70 bg-cyan-50/70" />
            <KpiCard label={t("systemSettings.summary.prefix")} value={settings.invoicePrefix || "-"} className="border-amber-200/70 bg-amber-50/70" />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
            <Card className="border-border bg-card">
              <CardContent className="grid gap-4 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("systemSettings.hubTitle")}</p>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">{t("systemSettings.title")}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("systemSettings.description")}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {settings.tradeName || settings.companyName}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {settings.timezone}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2.5 py-1">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {canEdit ? t("systemSettings.editingEnabled") : t("systemSettings.readOnlyTitle")}
                    </span>
                  </div>
                </div>

                {!canEdit ? (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <span>
                      <strong>{t("systemSettings.readOnlyTitle")}:</strong> {t("systemSettings.readOnlyDesc")}
                    </span>
                  </div>
                ) : null}

                <SystemSettingsForm initialValues={settings} onSubmit={handleSubmit} onLogoUpload={handleLogoUpload} canEdit={canEdit} />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="grid gap-4 p-6">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("systemSettings.hubTitle")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("systemSettings.description")}</p>
                </div>
                <div className="grid gap-3 rounded-xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{t("systemSettings.sideNote.branding")}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                    <span>{t("systemSettings.sideNote.timezone")}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <span>{t("systemSettings.sideNote.company")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </div>
  )
}

export default SystemSettingsPage
