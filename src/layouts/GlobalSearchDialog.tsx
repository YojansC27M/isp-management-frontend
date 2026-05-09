import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowRight, Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n/i18nContext"
import { getUserPermissions, hasAnyPermission } from "@/auth/permissions"
import { useAuthStore } from "@/store/authStore"
import { NAVIGATION_CATALOG } from "@/auth/navigationCatalog"
import type { Permission } from "@/auth/types"
import { cn } from "@/lib/utils"

interface GlobalSearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SearchResultItem {
  id: string
  label: string
  description: string
  href: string
  section: string
  requiredPermissions?: Permission[]
}

const quickActions: SearchResultItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Ir al panel principal", href: "/dashboard", section: "Quick" },
  { id: "clients-new", label: "Nuevo cliente", description: "Abrir formulario de cliente", href: "/clients/new", section: "Quick", requiredPermissions: ["clients.write"] },
  { id: "tickets-new", label: "Nuevo ticket", description: "Crear caso de soporte", href: "/tickets/new", section: "Quick", requiredPermissions: ["tickets.write"] },
  { id: "payments-new", label: "Ajuste manual", description: "Registrar ajuste manual de pago", href: "/payments/new", section: "Quick", requiredPermissions: ["payments.manual.write"] },
  { id: "visits-new", label: "Nueva visita", description: "Programar visita tecnica", href: "/visits/new", section: "Quick", requiredPermissions: ["visits.write"] },
  { id: "installations", label: "Instalaciones", description: "Ver trabajos de campo", href: "/installations", section: "Quick", requiredPermissions: ["visits.read"] },
]

const GlobalSearchDialog = ({ open, onOpenChange }: GlobalSearchDialogProps) => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    setQuery("")
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onOpenChange, open])

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const flattenItems = (items: typeof NAVIGATION_CATALOG[number]["items"], section: string): SearchResultItem[] => {
      return (items ?? []).flatMap((item) => {
        const current =
          item.href
            ? [{
                id: item.id,
                label: item.label,
                description: t(`nav.${item.id}`),
                href: item.href,
                section,
                requiredPermissions: item.requiredPermissions,
              }]
            : []
        const nested = item.items ? flattenItems(item.items, section) : []
        return [...current, ...nested]
      })
    }

    const navigationItems: SearchResultItem[] = NAVIGATION_CATALOG.flatMap((module) => {
      const moduleItem: SearchResultItem | null = module.href
        ? {
            id: module.id,
            label: module.label,
            description: t(`nav.${module.id}`),
            href: module.href,
            section: "Navigation",
            requiredPermissions: module.requiredPermissions,
          }
        : null

      const subItems = flattenItems(module.items, module.label)

      return [moduleItem, ...subItems].filter(Boolean) as SearchResultItem[]
    })

    const combined = [...quickActions, ...navigationItems].filter((item) => {
      if (item.requiredPermissions && !hasAnyPermission(effectivePermissions, item.requiredPermissions)) return false
      if (!normalized) return true
      return [item.label, item.description, item.section, item.href, item.id].join(" ").toLowerCase().includes(normalized)
    })

    return combined
  }, [effectivePermissions, query, t])

  const groupedResults = useMemo(() => {
    const map = new Map<string, SearchResultItem[]>()
    results.forEach((item) => {
      const current = map.get(item.section) ?? []
      current.push(item)
      map.set(item.section, current)
    })
    return Array.from(map.entries())
  }, [results])

  const handleNavigate = (href: string) => {
    onOpenChange(false)
    navigate(href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] bg-foreground/35 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-[0_24px_70px_-30px_hsl(var(--foreground)/0.8)]">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("header.searchPlaceholder")}
            className="h-11 border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
          />
          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)} aria-label={t("common.close")}>
            <X />
          </Button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("header.searchHint")}</span>
            <span>{t("header.quickActions")}</span>
          </div>
          {groupedResults.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
              {t("header.searchNoResults")}
            </p>
          ) : (
            <div className="grid gap-4">
              {groupedResults.map(([section, items]) => (
                <section key={section} className="grid gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{section}</h3>
                  <div className="grid gap-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5",
                        )}
                        onClick={() => handleNavigate(item.href)}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{item.label}</p>
                          <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GlobalSearchDialog
