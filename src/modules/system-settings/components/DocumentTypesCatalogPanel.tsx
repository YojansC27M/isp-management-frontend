import { useCallback, useEffect, useState } from "react"
import { useCan } from "@/auth/usePermission"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import {
  createDocumentType,
  deactivateDocumentType,
  getDocumentTypesPage,
  updateDocumentType,
} from "../services/systemSettingsApi"
import type { DocumentTypeItem, DocumentTypesPageMeta } from "../types/systemSettings"

const inputId = (field: string) => `document-types-${field}`

const DEFAULT_META: DocumentTypesPageMeta = {
  page: 1,
  perPage: 10,
  total: 0,
  totalPages: 1,
}

const DocumentTypesCatalogPanel = () => {
  const { t } = useI18n()
  const { notify } = useUI()
  const canManageDocumentTypes = useCan("document_types.write")
  const [items, setItems] = useState<DocumentTypeItem[]>([])
  const [searchInput, setSearchInput] = useState("")
  const [statusInput, setStatusInput] = useState<"all" | "active" | "inactive">("all")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [appliedStatus, setAppliedStatus] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [meta, setMeta] = useState<DocumentTypesPageMeta>(DEFAULT_META)
  const [documentTypeCode, setDocumentTypeCode] = useState("")
  const [documentTypeName, setDocumentTypeName] = useState("")
  const [editingDocumentTypeId, setEditingDocumentTypeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const loadDocumentTypes = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await getDocumentTypesPage({
        includeInactive: true,
        search: appliedSearch,
        status: appliedStatus,
        page,
        perPage,
      })
      setItems(response.items)
      setMeta(response.meta)
    } catch (err) {
      setError(getErrorMessage(err, t("systemSettings.loadErrorDefault")))
    } finally {
      setLoading(false)
    }
  }, [appliedSearch, appliedStatus, page, perPage, t])

  useEffect(() => {
    loadDocumentTypes()
  }, [loadDocumentTypes])

  const resetDocumentTypeForm = () => {
    setEditingDocumentTypeId(null)
    setDocumentTypeCode("")
    setDocumentTypeName("")
  }

  const applyFilters = () => {
    setAppliedSearch(searchInput)
    setAppliedStatus(statusInput)
    setPage(1)
  }

  const clearFilters = () => {
    setSearchInput("")
    setStatusInput("all")
    setAppliedSearch("")
    setAppliedStatus("all")
    setPage(1)
  }

  const handleSubmitDocumentType = async () => {
    if (!canManageDocumentTypes) return
    const code = documentTypeCode.trim().toUpperCase()
    const name = documentTypeName.trim()
    if (!code || !name) {
      notify({
        title: t("systemSettings.documentTypes.validationTitle"),
        description: t("systemSettings.documentTypes.validationDesc"),
        type: "error",
      })
      return
    }

    setSaving(true)
    try {
      if (editingDocumentTypeId) {
        await updateDocumentType(editingDocumentTypeId, { name })
        notify({ title: t("systemSettings.documentTypes.updatedTitle"), type: "success" })
      } else {
        await createDocumentType({ code, name })
        notify({ title: t("systemSettings.documentTypes.createdTitle"), type: "success" })
      }
      resetDocumentTypeForm()
      await loadDocumentTypes()
    } catch (err) {
      notify({
        title: t("systemSettings.documentTypes.saveErrorTitle"),
        description: getErrorMessage(err, t("systemSettings.documentTypes.saveErrorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateDocumentType = async (id: string) => {
    if (!canManageDocumentTypes) return
    setSaving(true)
    try {
      await deactivateDocumentType(id)
      notify({ title: t("systemSettings.documentTypes.deactivatedTitle"), type: "success" })
      await loadDocumentTypes()
    } catch (err) {
      notify({
        title: t("systemSettings.documentTypes.saveErrorTitle"),
        description: getErrorMessage(err, t("systemSettings.documentTypes.saveErrorDesc")),
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4">
      <FilterPanel>
        <form
          className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto] md:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            applyFilters()
          }}
        >
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("internalUsers.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("systemSettings.documentTypes.searchPlaceholder")}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("systemSettings.documentTypes.status")}
            </Label>
            <select
              id={inputId("status")}
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value as "all" | "active" | "inactive")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="all">{t("internalUsers.all")}</option>
              <option value="active">{t("internalUsers.status.active")}</option>
              <option value="inactive">{t("internalUsers.status.inactive")}</option>
            </select>
          </label>
          <Button type="submit" className="h-8">
            {t("internalUsers.searchButton")}
          </Button>
          <Button type="button" variant="outline" className="h-8" onClick={clearFilters}>
            {t("internalUsers.clearButton")}
          </Button>
        </form>
      </FilterPanel>

      <Card className="border-border bg-card">
        <CardContent className="grid gap-4 p-6">
          <div className="grid gap-3 rounded-xl border border-border bg-muted/25 p-4 md:grid-cols-[160px_1fr_auto_auto] md:items-end">
            <label className="grid gap-1.5">
              <Label htmlFor={inputId("code")}>{t("systemSettings.documentTypes.code")}</Label>
              <Input
                id={inputId("code")}
                value={documentTypeCode}
                onChange={(event) => setDocumentTypeCode(event.target.value.toUpperCase())}
                disabled={!canManageDocumentTypes || Boolean(editingDocumentTypeId)}
                placeholder="CC"
              />
            </label>
            <label className="grid gap-1.5">
              <Label htmlFor={inputId("name")}>{t("systemSettings.documentTypes.name")}</Label>
              <Input
                id={inputId("name")}
                value={documentTypeName}
                onChange={(event) => setDocumentTypeName(event.target.value)}
                disabled={!canManageDocumentTypes}
                placeholder={t("systemSettings.documentTypes.namePlaceholder")}
              />
            </label>
            <Button type="button" disabled={!canManageDocumentTypes || saving} onClick={handleSubmitDocumentType}>
              {editingDocumentTypeId ? t("systemSettings.documentTypes.update") : t("systemSettings.documentTypes.create")}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={resetDocumentTypeForm}>
              {t("systemSettings.documentTypes.clear")}
            </Button>
          </div>

          {loading ? (
            <StateMessage variant="loading" title={t("common.loading")} />
          ) : error ? (
            <StateMessage variant="error" title={t("systemSettings.loadErrorTitle")} description={error} />
          ) : meta.total === 0 ? (
            <StateMessage variant="empty" title={t("systemSettings.documentTypes.emptyTitle")} />
          ) : (
            <div className="grid gap-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">{t("systemSettings.documentTypes.code")}</th>
                      <th className="px-4 py-3 font-semibold">{t("systemSettings.documentTypes.name")}</th>
                      <th className="px-4 py-3 font-semibold">{t("systemSettings.documentTypes.status")}</th>
                      <th className="px-4 py-3 font-semibold">{t("systemSettings.documentTypes.scope")}</th>
                      <th className="px-4 py-3 font-semibold">{t("internalUsers.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-t border-border/70">
                        <td className="px-4 py-3 font-medium text-foreground">{item.code}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.active ? t("internalUsers.status.active") : t("internalUsers.status.inactive")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.isSystem ? t("systemSettings.documentTypes.system") : t("systemSettings.documentTypes.custom")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!canManageDocumentTypes}
                              onClick={() => {
                                setEditingDocumentTypeId(item.id)
                                setDocumentTypeCode(item.code)
                                setDocumentTypeName(item.name)
                              }}
                            >
                              {t("internalUsers.table.edit")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!canManageDocumentTypes || item.isSystem || !item.active}
                              onClick={() => handleDeactivateDocumentType(item.id)}
                            >
                              {t("internalUsers.table.delete")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
                <p className="text-muted-foreground">
                  {t("systemSettings.documentTypes.paginationSummary", {
                    page: meta.page,
                    totalPages: meta.totalPages,
                    total: meta.total,
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-muted-foreground">
                    <span>{t("internalUsers.pagination.perPage")}</span>
                    <select
                      className="h-8 rounded-md border border-border bg-card px-2 text-sm"
                      value={perPage}
                      onChange={(event) => {
                        const next = Number.parseInt(event.target.value, 10)
                        setPerPage(Number.isFinite(next) ? next : 10)
                        setPage(1)
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </label>
                  <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={meta.page <= 1}>
                    {t("internalUsers.pagination.prev")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                    disabled={meta.page >= meta.totalPages}
                  >
                    {t("internalUsers.pagination.next")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DocumentTypesCatalogPanel
