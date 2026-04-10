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
import ClientsTable from "../components/ClientsTable"
import { createClient, deleteClient, getClients } from "../services/clientsApi"
import type { Client, ClientFormValues, ClientStatus } from "../types/client"

const statusOptions: { label: string; value: ClientStatus }[] = [
  { label: "Activo", value: "active" },
  { label: "Suspendido", value: "suspended" },
  { label: "Inactivo", value: "inactive" },
]

const inputId = (field: string) => `clients-list-${field}`

const ClientsListPage = () => {
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

  const loadClients = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getClients()
      setClients(data)
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar clientes."))
    } finally {
      setLoading(false)
    }
  }, [])

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
      title: "Eliminar cliente",
      description: "Esta accion no se puede deshacer.",
      confirmLabel: "Eliminar",
    })
    if (!accepted) return
    try {
      await deleteClient(id)
      await loadClients()
      notify({ title: "Cliente eliminado", type: "success" })
    } catch (err) {
      notify({
        title: "No se pudo eliminar el cliente",
        description: getErrorMessage(err, "Intenta nuevamente."),
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
        notify({ title: "El CSV no tiene filas para importar.", type: "error" })
        return
      }

      const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase())
      const required = ["name", "document", "phone", "email", "ipaddress", "status"]
      const missing = required.filter((key) => !headers.includes(key))
      if (missing.length > 0) {
        notify({
          title: "CSV invalido",
          description: `Faltan columnas: ${missing.join(", ")}`,
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
          title: "Importacion completada",
          description: `${records.length} clientes creados.`,
          type: "success",
        })
      } catch (err) {
        notify({
          title: "No se pudo completar la importacion",
          description: getErrorMessage(err, "Verifica el archivo e intenta nuevamente."),
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
        title="Clientes"
        description="Administra clientes, estado de servicio y planes."
        actions={
          <>
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm font-medium ${
                importing
                  ? "cursor-wait border-border bg-muted text-muted-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {importing ? "Importando..." : "Importar CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                title={!canManageClients ? "Tu perfil no tiene permiso para importar clientes." : undefined}
                disabled={importing || !canManageClients}
                aria-label="Seleccionar archivo CSV para importar clientes"
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
              title={!canManageClients ? "Tu perfil no tiene permiso para crear clientes." : undefined}
            >
              Crear cliente
            </Button>
          </>
        }
      />

      <FilterPanel>
        <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label htmlFor={inputId("search")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Buscar
            </Label>
            <Input
              id={inputId("search")}
              type="search"
              placeholder="Nombre, documento o IP..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("status")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Estado
            </Label>
            <select
              id={inputId("status")}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ClientStatus | "")}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5">
            <Label htmlFor={inputId("plan")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Plan
            </Label>
            <select
              id={inputId("plan")}
              value={planFilter}
              onChange={(event) => setPlanFilter(event.target.value)}
              className="h-8 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground"
            >
              <option value="">Todos</option>
              {plans.map((plan) => (
                <option key={plan} value={plan}>
                  {plan}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" onClick={clearFilters}>
            Limpiar
          </Button>
        </div>
      </FilterPanel>

      {loading ? (
        <StateMessage variant="loading" title="Cargando clientes..." />
      ) : error ? (
        <StateMessage variant="error" title="Error al cargar clientes" description={error} />
      ) : filteredClients.length === 0 ? (
        <StateMessage variant="empty" title="No se encontraron clientes." description="Prueba ajustando los filtros." />
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
