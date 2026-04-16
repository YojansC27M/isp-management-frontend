import { forwardRef, useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n/i18nContext"
import { useDebouncedValue } from "@/lib/useDebouncedValue"
import { cn } from "@/lib/utils"
import { getClientById, searchClients } from "../services/clientsApi"
import type { Client } from "../types/client"

type ClientSummary = Pick<Client, "id" | "name" | "document" | "phone" | "plan" | "status">

const statusClassName: Record<Client["status"], string> = {
  active: "text-emerald-700 bg-emerald-100",
  suspended: "text-amber-700 bg-amber-100",
  inactive: "text-zinc-700 bg-zinc-200",
}

const formatClientLabel = (client: ClientSummary) => `${client.name} - ${client.document}`

interface ClientAutocompleteFieldProps {
  id: string
  name?: string
  value: string
  disabled?: boolean
  placeholder?: string
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  className?: string
  limit?: number
  onSelect: (client: ClientSummary | null) => void
}

const ClientAutocompleteField = forwardRef<HTMLInputElement, ClientAutocompleteFieldProps>(
  (
    {
      id,
      name,
      value,
      disabled = false,
      placeholder,
      ariaDescribedBy,
      ariaInvalid,
      className,
      limit = 20,
      onSelect,
    },
    ref,
  ) => {
    const { t } = useI18n()
    const [query, setQuery] = useState("")
    const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null)
    const [options, setOptions] = useState<ClientSummary[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const cacheRef = useRef<Map<string, ClientSummary[]>>(new Map())
    const closeTimeoutRef = useRef<number | null>(null)

    const normalizedQuery = query.trim()
    const debouncedQuery = useDebouncedValue(normalizedQuery, 300)
    const shouldSearch = debouncedQuery.length >= 2

    useEffect(() => {
      if (!value) {
        setSelectedClient(null)
        setQuery("")
        return
      }
      if (selectedClient?.id === value) return

      let cancelled = false

      const loadSelectedClient = async () => {
        try {
          const client = await getClientById(value)
          if (cancelled) return
          const summary: ClientSummary = {
            id: client.id,
            name: client.name,
            document: client.document,
            phone: client.phone,
            plan: client.plan,
            status: client.status,
          }
          setSelectedClient(summary)
          setQuery(formatClientLabel(summary))
        } catch {
          if (cancelled) return
          setSelectedClient(null)
          setQuery("")
        }
      }

      void loadSelectedClient()
      return () => {
        cancelled = true
      }
    }, [selectedClient?.id, value])

    useEffect(() => {
      if (!shouldSearch) {
        setOptions([])
        setHighlightedIndex(-1)
        return
      }

      const cacheKey = `${debouncedQuery.toLowerCase()}::${limit}`
      const cached = cacheRef.current.get(cacheKey)
      if (cached) {
        setOptions(cached)
        setHighlightedIndex(cached.length > 0 ? 0 : -1)
        return
      }

      let cancelled = false
      setLoading(true)

      const runSearch = async () => {
        try {
          const results = await searchClients(debouncedQuery, limit)
          if (cancelled) return
          const summaries: ClientSummary[] = results.map((client) => ({
            id: client.id,
            name: client.name,
            document: client.document,
            phone: client.phone,
            plan: client.plan,
            status: client.status,
          }))
          cacheRef.current.set(cacheKey, summaries)
          setOptions(summaries)
          setHighlightedIndex(summaries.length > 0 ? 0 : -1)
        } finally {
          if (!cancelled) setLoading(false)
        }
      }

      void runSearch()
      return () => {
        cancelled = true
      }
    }, [debouncedQuery, limit, shouldSearch])

    useEffect(() => {
      return () => {
        if (closeTimeoutRef.current) {
          window.clearTimeout(closeTimeoutRef.current)
        }
      }
    }, [])

    const visibleOptions = useMemo(() => {
      if (!normalizedQuery || shouldSearch) return options
      return []
    }, [normalizedQuery, options, shouldSearch])

    const commitSelection = (client: ClientSummary | null) => {
      setSelectedClient(client)
      setQuery(client ? formatClientLabel(client) : "")
      onSelect(client)
      setIsOpen(false)
      setOptions([])
      setHighlightedIndex(-1)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || visibleOptions.length === 0) return

      if (event.key === "ArrowDown") {
        event.preventDefault()
        setHighlightedIndex((current) => Math.min(current + 1, visibleOptions.length - 1))
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        setHighlightedIndex((current) => Math.max(current - 1, 0))
        return
      }

      if (event.key === "Enter" && highlightedIndex >= 0) {
        event.preventDefault()
        commitSelection(visibleOptions[highlightedIndex])
      }
    }

    return (
      <div className={cn("relative", className)}>
        <div className="relative">
          <Input
            id={id}
            name={name}
            ref={ref}
            disabled={disabled}
            value={query}
            placeholder={placeholder ?? t("clients.form.autocomplete.placeholder")}
            autoComplete="off"
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            role="combobox"
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              closeTimeoutRef.current = window.setTimeout(() => setIsOpen(false), 120)
            }}
            onChange={(event) => {
              const nextQuery = event.target.value
              setQuery(nextQuery)
              setIsOpen(true)

              if (selectedClient && nextQuery !== formatClientLabel(selectedClient)) {
                setSelectedClient(null)
                onSelect(null)
              }
            }}
          />
          {selectedClient && !disabled && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => commitSelection(null)}
              aria-label={t("clients.form.autocomplete.clearAria")}
            >
              {t("common.cancel")}
            </button>
          )}
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-20 mt-1.5 w-full rounded-lg border border-border bg-card p-1.5 shadow-lg">
            <div className="max-h-56 space-y-1 overflow-auto pr-1">
              {!shouldSearch && <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("clients.form.autocomplete.minChars")}</p>}
              {shouldSearch && loading && <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("clients.form.autocomplete.searching")}</p>}
              {shouldSearch && !loading && visibleOptions.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">{t("clients.form.autocomplete.empty")}</p>
              )}

              {visibleOptions.map((client, index) => (
                <button
                  key={client.id}
                  type="button"
                  className={cn(
                    "w-full rounded-md border border-transparent px-2 py-2 text-left transition hover:border-border hover:bg-muted/30",
                    index === highlightedIndex && "border-border bg-muted/30",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commitSelection(client)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-foreground">{client.name}</strong>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", statusClassName[client.status])}>
                      {t(`clients.status.${client.status}`)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {client.document} - {client.phone} - {client.plan}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  },
)

ClientAutocompleteField.displayName = "ClientAutocompleteField"

export type { ClientSummary }
export default ClientAutocompleteField
