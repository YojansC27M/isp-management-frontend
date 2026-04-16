import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import StateMessage from "@/components/feedback/StateMessage"
import FilterPanel from "@/components/shared/FilterPanel"
import PageHeader from "@/components/shared/PageHeader"
import { useCan } from "@/auth/usePermission"
import { getErrorMessage } from "@/lib/errors"
import { useUI } from "@/ui/uiContext"
import { useI18n } from "@/i18n/i18nContext"
import ClientsTable from "../components/ClientsTable"
import { createClient, deleteClient, getClients } from "../services/clientsApi"
import type { Client, ClientFormValues, ClientStatus } from "../types/client"

const inputId = (field: string) => `clients-list-${field}`

const ClientsListPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { notify, confirm } = useUI()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "">("")
  const [planFilter, setPlanFilter] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState("")
  const canManageClients = useCan("clients.write")
  const statusOptions: { label: string; value: ClientStatus }[] = [
    { label: t("clients.status.active"), value: "active" },
    { label: t("clients.status.suspended"), value: "suspended" },
    { label: t("clients.status.inactive"), value: "inactive" },
  ]

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getClients()
      setClients(data)
    } catch (err) {
      setError(getErrorMessage(err, t("clients.loadErrorTitle")))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const plans = useMemo(() => {
    const uniquePlans = new Set(clients.map((client) => client.plan).filter(Boolean))
    return Array.from(uniquePlans)
  }, [clients])

  const filteredClients = useMemo(() => {
    const term = search.toLowerCase()
    return clients.filter((client) => {
      const matchesSearch = [client.name, client.document, client.ipAddress].join(" ").toLowerCase().includes(term)
      const matchesStatus = statusFilter ? client.status === statusFilter : true
      const matchesPlan = planFilter ? client.plan === planFilter : true
      return matchesSearch && matchesStatus && matchesPlan
    })
  }, [clients, planFilter, search, statusFilter])

  const handleDelete = async (id: string) => {
    if (!canManageClients) return
    const accepted = await confirm({
      title: t("clients.deleteTitle"),
      description: t("clients.deleteDescription"),
      confirmLabel: t("clients.deleteConfirm"),
    })
    if (!accepted) return
    try {
      await deleteClient(id)
      await loadClients()
      notify({ title: t("clients.deleted"), type: "success" })
    } catch (err) {
      notify({
        title: t("clients.deleteErrorTitle"),
        description: getErrorMessage(err, t("clients.deleteErrorDesc")),
        type: "error",
      })
    }
  }

  const clearFilters = () => {
    setSearch("")
    setStatusFilter("")
    setPlanFilter("")
  }

  const parseCsvLine = (line: string) => line.split(",").map((value) => value.trim())

  const importFromCsv = async (file: File) => {
    if (!canManageClients) return
    setImporting(true)
    try {
      const content = await file.text()
      const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

      if (lines.length < 2) {
        notify({ title: t("clients.importNoRows"), type: "error" })
        return
      }

      const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase())
      const required = ["name", "document", "phone", "email", "ipaddress", "status"]
      const missing = required.filter((key) => !headers.includes(key))
      if (missing.length > 0) {
        notify({
          title: t("clients.importInvalid"),
          description: t("clients.importMissingColumns", { columns: missing.join(", ") }),
          type: "error",
        })
        return
      }

      const getValue = (row: string[], key: string) => {
        const index = headers.indexOf(key)
        return index >= 0 ? row[index] ?? "" : ""
      }

      const records: ClientFormValues[] = lines.slice(1).map((line) => {
        const row = parseCsvLine(line)
        return {
          name: getValue(row, "name"),
          document: getValue(row, "document"),
          address: getValue(row, "address"),
          phone: getValue(row, "phone"),
          email: getValue(row, "email"),
          plan: getValue(row, "plan"),
          ipAddress: getValue(row, "ipaddress"),
          status: (getValue(row, "status") || "active") as ClientStatus,
          latitude: Number(getValue(row, "latitude")) || null,
          longitude: Number(getValue(row, "longitude")) || null,
        }
      })

      try {
        await Promise.all(records.map((record) => createClient(record)))
        await loadClients()
        notify({
          title: t("clients.importDone"),
          description: t("clients.importDoneDescription", { count: records.length }),
          type: "success",
        })
      } catch (err) {
        notify({
          title: t("clients.importFail"),
          description: getErrorMessage(err, t("clients.importFailDesc")),
          type: "error",
        })
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("clients.title")}
        description={t("clients.description")}
        actions={
          <>
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm font-medium ${
                importing
                  ? "cursor-wait border-border bg-muted text-muted-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {importing ? t("clients.importing") : t("clients.importCsv")}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                title={!canManageClients ? t("clients.permissionImport") : undefined}
                disabled={importing || !canManageClients}
                aria-label={t("clients.importAria")}
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  await importFromCsv(file)
                  event.currentTarget.value = ""
                }}
              />
            </label>
            <Button
              onClick={() => navigate("/clients/new")}
              disabled={!canManageClients}
              title={!canManageClients ? t("clients.permissionCreate") : undefined}
            >
              {t("clients.create")}
            </Button>
          </>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("clients.search")}
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder={t("clients.searchPlaceholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("clients.status")}
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ClientStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("clients.all")}</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("plan")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("clients.plan")}
            </Label>
            <select
              id={inputId("plan")}
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">{t("clients.all")}</option>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={clearFilters}>
            {t("clients.clear")}
          </Button>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title={t("clients.loading")} />
      ) : error ? (
        <StateMessage variant="error" title={t("clients.loadErrorTitle")} description={error} />
      ) : filteredClients.length === 0 ? (
        <StateMessage variant="empty" title={t("clients.emptyTitle")} description={t("clients.emptyDescription")} />
      ) : (
        <ClientsTable
          clients={filteredClients}
          onEdit={(id) => navigate(`/clients/${id}/edit`)}
          onDelete={handleDelete}
          canManage={canManageClients}
        />
      )}
    </div>
  )
}

export default ClientsListPage
