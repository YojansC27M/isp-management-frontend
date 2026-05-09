import { useMemo } from "react"
import { Bell, Clock3, TriangleAlert } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { readSecurityAudit } from "@/auth/auditLog"
import { cn } from "@/lib/utils"

interface NotificationCenterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface NotificationItem {
  id: string
  title: string
  description: string
  href?: string
  tone: "info" | "warning" | "success"
}

const NotificationCenterDrawer = ({ open, onOpenChange }: NotificationCenterDrawerProps) => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const auditEntries = useMemo(() => readSecurityAudit().slice(0, 4), [])

  const items: NotificationItem[] = useMemo(
    () => [
      {
        id: "ops-routers",
        title: t("monitoring.summary.onlineRouters"),
        description: t("monitoring.routerList.title"),
        href: "/monitoring",
        tone: "success",
      },
      {
        id: "security-audit",
        title: t("header.notificationsSecurity"),
        description: auditEntries[0]?.details ?? t("header.notificationsEmpty"),
        href: "/security-audit",
        tone: "warning",
      },
      {
        id: "system-settings",
        title: t("systemSettings.title"),
        description: t("systemSettings.description"),
        href: "/settings/system",
        tone: "info",
      },
      ...auditEntries.map((entry) => ({
        id: entry.id,
        title: entry.actorName,
        description: entry.details,
        href: "/security-audit",
        tone: "info" as const,
      })),
    ],
    [auditEntries, t],
  )

  const unreadCount = items.length

  const handleNavigate = (href?: string) => {
    if (!href) return
    onOpenChange(false)
    navigate(href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[78] bg-foreground/30 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-md border-l border-border bg-card shadow-[0_30px_80px_-36px_hsl(var(--foreground)/0.7)]">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{t("header.notificationsTitle")}</p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{t("header.notificationsUnread", { count: unreadCount })}</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </div>

        <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto p-4">
          <div className="grid gap-4">
            <section className="grid gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
                {t("header.notificationsOps")}
              </div>
              {items.slice(0, 2).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition hover:border-primary/40 hover:bg-primary/5",
                    item.tone === "warning"
                      ? "border-amber-200 bg-amber-50/60"
                      : item.tone === "success"
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-border bg-background",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </section>

            <section className="grid gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-sky-500" />
                {t("header.notificationsSecurity")}
              </div>
              {items.slice(2).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.href)}
                  className="rounded-2xl border border-border bg-background p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                >
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </button>
              ))}
            </section>

            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
                <Bell className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium text-foreground">{t("header.notificationsEmpty")}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationCenterDrawer
