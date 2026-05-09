import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronRight, Search, X } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/i18n/i18nContext"
import { useAuthStore } from "@/store/authStore"
import { getUserPermissions, hasAnyPermission } from "@/auth/permissions"
import type { Permission } from "@/auth/types"
import type { ServerNavigationModule } from "@/auth/navigationTypes"
import { NAVIGATION_CATALOG, type NavigationItemDefinition, type NavigationModuleDefinition } from "@/auth/navigationCatalog"

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const { t } = useI18n()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)
  const serverNavigation = useAuthStore((state) => state.navigation)
  const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [moduleSearch, setModuleSearch] = useState("")

  const canAccess = (requiredPermissions?: Permission[]) => {
    if (!requiredPermissions || requiredPermissions.length === 0) return true
    return hasAnyPermission(effectivePermissions, requiredPermissions)
  }

  const isPathActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(`${href}/`)

  const serverNavigationMap = useMemo(() => {
    const map = new Map<string, ServerNavigationModule>()
    ;(serverNavigation ?? []).forEach((module) => map.set(module.id, module))
    return map
  }, [serverNavigation])

  const filterItemTree = (
    items: NavigationItemDefinition[],
    serverAllowedIds: Set<string> | null,
  ): NavigationItemDefinition[] => {
    return items
      .map((item) => {
        if (!canAccess(item.requiredPermissions)) return null

        const nested = item.items ? filterItemTree(item.items, serverAllowedIds) : []
        const allowedByServer = !serverAllowedIds || serverAllowedIds.has(item.id)

        if (nested.length > 0) {
          return { ...item, items: nested }
        }

        if (!item.href) return null
        if (!allowedByServer) return null

        return { ...item, items: [] }
      })
      .filter(Boolean) as NavigationItemDefinition[]
  }

  const isItemTreeActive = (items: NavigationItemDefinition[]): boolean =>
    items.some((item) => {
      if (item.href && isPathActive(item.href)) return true
      if (item.items?.length) return isItemTreeActive(item.items)
      return false
    })

  const visibleModules = useMemo(
    () =>
      NAVIGATION_CATALOG
        .map((module) => {
          if (serverNavigation && !serverNavigationMap.has(module.id)) {
            return null
          }

          const serverModule = serverNavigationMap.get(module.id)
          const serverAllowedIds = serverNavigation && serverModule?.items ? new Set(serverModule.items) : null
          const serverAllowedSubItems = filterItemTree(module.items ?? [], serverAllowedIds)
          const canShowModuleLink = module.href ? canAccess(module.requiredPermissions) : false
          const canShowModuleGroup = serverAllowedSubItems.length > 0

          if (!canShowModuleLink && !canShowModuleGroup) {
            return null
          }

          const moduleActive =
            (module.href ? isPathActive(module.href) : false) || isItemTreeActive(serverAllowedSubItems)

          return {
            ...module,
            items: serverAllowedSubItems,
            moduleActive,
          }
        })
        .filter(Boolean) as Array<NavigationModuleDefinition & { items: NavigationItemDefinition[]; moduleActive: boolean }>,
    [location.pathname, serverNavigation, serverNavigationMap, effectivePermissions],
  )

  const activeModuleIds = useMemo(
    () => visibleModules.filter((module) => module.moduleActive && module.items.length > 0).map((module) => module.id),
    [visibleModules]
  )

  const filteredModules = useMemo(() => {
    const normalizedQuery = moduleSearch.trim().toLowerCase()
    if (!normalizedQuery) return visibleModules

    const filterByQuery = (items: NavigationItemDefinition[]): NavigationItemDefinition[] =>
      items
        .map((item) => {
          const itemMatches = t(`nav.${item.id}`).toLowerCase().includes(normalizedQuery)
          const nested = item.items ? filterByQuery(item.items) : []
          if (itemMatches) return { ...item }
          if (nested.length > 0) return { ...item, items: nested }
          return null
        })
        .filter(Boolean) as NavigationItemDefinition[]

    return visibleModules
      .map((module) => {
        const moduleLabel = t(`nav.${module.id}`).toLowerCase()
        const moduleMatches = moduleLabel.includes(normalizedQuery)
        const matchingSubItems = filterByQuery(module.items)

        if (moduleMatches) {
          return { ...module }
        }

        if (matchingSubItems.length > 0) {
          return { ...module, items: matchingSubItems }
        }

        return null
      })
      .filter(Boolean) as Array<NavigationModuleDefinition & { items: NavigationItemDefinition[]; moduleActive: boolean }>
  }, [moduleSearch, t, visibleModules])

  const activeSubItemIds = useMemo(() => {
    const ids: string[] = []
    const collectActiveParents = (items: NavigationItemDefinition[]) => {
      for (const item of items) {
        if (!item.items?.length) continue
        const childActive = isItemTreeActive(item.items)
        if (childActive) ids.push(item.id)
        collectActiveParents(item.items)
      }
    }
    visibleModules.forEach((module) => collectActiveParents(module.items))
    return ids
  }, [visibleModules])

  useEffect(() => {
    if (activeModuleIds.length === 0) return
    setExpandedModules((current) => {
      const next = new Set(current)
      const previousSize = next.size
      activeModuleIds.forEach((id) => next.add(id))
      if (next.size === previousSize) return current
      return Array.from(next)
    })
  }, [activeModuleIds])

  useEffect(() => {
    if (activeSubItemIds.length === 0) return
    setExpandedItems((current) => {
      const next = new Set(current)
      const previousSize = next.size
      activeSubItemIds.forEach((id) => next.add(id))
      if (next.size === previousSize) return current
      return Array.from(next)
    })
  }, [activeSubItemIds])

  const toggleModule = (label: string) => {
    setExpandedModules((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    )
  }

  const toggleItem = (id: string) => {
    setExpandedItems((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
    )
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-card/95 text-foreground backdrop-blur transition-[transform,width] duration-300 lg:sticky lg:top-0 lg:h-screen",
        isOpen ? "translate-x-0 lg:w-64" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-r-0",
      )}
      aria-label={t("sidebar.navigation")}
    >
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            ISP
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">ISP Management</p>
            <p className="text-sm font-semibold text-foreground">{t("sidebar.operations")}</p>
          </div>
        </div>
        <Button variant="outline" size="icon-sm" className="lg:hidden" onClick={onClose} aria-label={t("sidebar.closeMenu")}>
          <X />
        </Button>
      </div>
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
          <Input
            placeholder={t("sidebar.searchPlaceholder")}
            value={moduleSearch}
            onChange={(event) => setModuleSearch(event.target.value)}
            className="h-10 rounded-xl border-border/80 bg-background/70 pl-9 pr-3 shadow-sm backdrop-blur"
            aria-label={t("sidebar.searchAria")}
          />
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {filteredModules.map((module) => (
          <div key={module.id} className="space-y-1.5">
            {module.href ? (
              <NavLink
                to={module.href}
                onClick={onClose}
                className={cn(
                  "flex items-center rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                  module.moduleActive
                    ? "border-primary/70 bg-primary text-primary-foreground shadow-[0_10px_22px_-16px_hsl(var(--primary)/0.9)]"
                    : "border-transparent bg-muted/45 text-foreground/90 hover:bg-muted",
                )}
              >
                {t(`nav.${module.id}`)}
              </NavLink>
            ) : (
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition",
                  module.moduleActive
                    ? "border-primary/45 bg-primary/15 text-primary"
                    : "border-transparent bg-muted/25 text-muted-foreground hover:bg-muted/50",
                )}
                onClick={() => toggleModule(module.id)}
                aria-expanded={expandedModules.includes(module.id)}
                aria-controls={`sidebar-group-${module.id}`}
              >
                <span>{t(`nav.${module.id}`)}</span>
                {expandedModules.includes(module.id) ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {module.items.length > 0 && (moduleSearch.trim() || expandedModules.includes(module.id)) && (
              <div
                id={`sidebar-group-${module.id}`}
                className="ml-2 space-y-1 border-l border-border/80 pl-2"
              >
                {module.items.map((subItem) => {
                  const hasNested = (subItem.items?.length ?? 0) > 0
                  const isNestedActive = hasNested ? isItemTreeActive(subItem.items ?? []) : false
                  const isExpanded = expandedItems.includes(subItem.id)

                  if (hasNested) {
                    return (
                      <div key={subItem.id} className="space-y-1">
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition",
                            isNestedActive
                              ? "border border-primary/35 bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                          )}
                          onClick={() => toggleItem(subItem.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`sidebar-subgroup-${subItem.id}`}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-1.5 w-1.5 rounded-full transition",
                                isNestedActive ? "bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" : "bg-border",
                              )}
                            />
                            {t(`nav.${subItem.id}`)}
                          </span>
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        {(moduleSearch.trim() || isExpanded) && (
                          <div id={`sidebar-subgroup-${subItem.id}`} className="ml-3 space-y-1 border-l border-border/70 pl-2">
                            {(subItem.items ?? []).map((nestedItem) => {
                              if (!nestedItem.href) return null
                              const isActiveNestedItem = isPathActive(nestedItem.href)
                              return (
                                <NavLink
                                  key={nestedItem.id}
                                  to={nestedItem.href}
                                  onClick={onClose}
                                  className={cn(
                                    "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                                    isActiveNestedItem
                                      ? "bg-primary text-primary-foreground shadow-[0_10px_20px_-14px_hsl(var(--primary)/0.9)]"
                                      : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full transition",
                                      isActiveNestedItem ? "bg-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary-foreground)/0.22)]" : "bg-border group-hover:bg-foreground/60",
                                    )}
                                  />
                                  <span>{t(`nav.${nestedItem.id}`)}</span>
                                </NavLink>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (!subItem.href) return null
                  const isActiveSubmodule = isPathActive(subItem.href)
                  return (
                    <NavLink
                      key={subItem.id}
                      to={subItem.href}
                      onClick={onClose}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition",
                        isActiveSubmodule
                          ? "bg-gradient-to-r from-primary/30 via-primary/20 to-transparent text-primary shadow-[0_10px_18px_-14px_hsl(var(--primary)/0.9)] ring-1 ring-primary/30"
                          : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full transition",
                          isActiveSubmodule ? "bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" : "bg-border group-hover:bg-foreground/60",
                        )}
                      />
                      <span>{t(`nav.${subItem.id}`)}</span>
                    </NavLink>
                  )
                })}
              </div>
            )}
          </div>
        ))}
        {filteredModules.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
            {t("sidebar.noResults", { query: moduleSearch })}
          </div>
        )}
      </nav>
      <div className="border-t border-border px-6 py-4">
        <p className="text-xs text-muted-foreground">{t("sidebar.secureAccess")}</p>
      </div>
    </aside>
  )
}

export default AppSidebar
