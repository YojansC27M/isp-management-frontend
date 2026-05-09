import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, IdCard, KeyRound, Languages, LogOut, Menu, Moon, Search, Sun, UserRound } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/i18n/i18nContext"
import { useTheme } from "@/ui/themeContext"
import { useAuthStore } from "@/store/authStore"

interface AppHeaderProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onOpenSearch: () => void
  onOpenNotifications: () => void
  notificationCount: number
}

const AppHeader = ({ isSidebarOpen, onToggleSidebar, onOpenSearch, onOpenNotifications, notificationCount }: AppHeaderProps) => {
  const navigate = useNavigate()
  const { locale, toggleLocale, t } = useI18n()
  const { resolvedTheme, cycleThemeMode } = useTheme()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const userName = user?.name ?? ""

  const themeLabel = resolvedTheme === "light" ? t("header.theme.light") : t("header.theme.dark")
  const ThemeIcon = resolvedTheme === "light" ? Sun : Moon
  const userInitials = useMemo(() => {
    if (!userName) return "US"
    const parts = userName.trim().split(/\s+/).filter(Boolean)
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
  }, [userName])

  useEffect(() => {
    if (!isProfileMenuOpen) return

    const handleOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) return
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false)
      }
    }

    window.addEventListener("mousedown", handleOutsideClick)
    window.addEventListener("keydown", handleEscape)
    return () => {
      window.removeEventListener("mousedown", handleOutsideClick)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isProfileMenuOpen])

  const handleLogout = () => {
    logout()
    setIsProfileMenuOpen(false)
    navigate("/", {
      replace: true,
        state: {
          toast: {
            title: t("header.logoutToastTitle"),
            description: t("header.logoutToastDescription"),
            type: "success" as const,
          },
        },
    })
  }

  const handleProfileInfo = () => {
    setIsProfileMenuOpen(false)
    navigate("/account/profile")
  }

  const handlePasswordRecovery = () => {
    setIsProfileMenuOpen(false)
    navigate("/account/security")
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" onClick={onToggleSidebar} aria-label={t("header.openMenu")} aria-pressed={isSidebarOpen}>
            <Menu />
          </Button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">{t("header.networkConsole")}</p>
            <h1 className="text-lg font-semibold text-foreground">{t("header.operationsSummary")}</h1>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-soft-pulse" />
              {t("header.activeSync")}
            </p>
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Button
            variant="outline"
            className="hidden shrink-0 gap-2 sm:inline-flex"
            onClick={onOpenSearch}
            aria-label={t("header.openSearch")}
            title={t("header.openSearch")}
          >
            <Search className="h-4 w-4" />
            <span className="text-xs font-semibold">{t("header.openSearch")}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Ctrl K</span>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="relative shrink-0"
            onClick={onOpenNotifications}
            aria-label={t("header.openNotifications")}
            title={t("header.openNotifications")}
          >
            <Bell />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            ) : null}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            onClick={toggleLocale}
            aria-label={t("header.languageToggle")}
            title={`${t("header.languageToggle")} (${locale.toUpperCase()})`}
          >
            <Languages />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0"
            onClick={cycleThemeMode}
            aria-label={t("header.changeTheme", { mode: themeLabel })}
            title={t("header.themeTitle", { mode: themeLabel })}
          >
            <ThemeIcon />
          </Button>
          {user && (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl border border-border bg-card/80 px-2 py-1 pr-3 shadow-sm transition hover:bg-muted/40"
                onClick={() => setIsProfileMenuOpen((current) => !current)}
                aria-expanded={isProfileMenuOpen}
                aria-haspopup="menu"
                aria-label={t("header.openProfileMenu")}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
                  {userInitials}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block text-xs font-semibold text-foreground">{user.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{user.email}</span>
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-[0_18px_45px_-24px_hsl(var(--foreground)/0.6)]"
                  role="menu"
                  aria-label={t("header.openProfileMenu")}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    onClick={handleProfileInfo}
                    role="menuitem"
                  >
                    <UserRound className="h-4 w-4 text-sky-500" />
                    <span>
                      <span className="block font-medium">{t("header.profileInfo")}</span>
                      <span className="block text-xs text-muted-foreground">{t("header.profileInfoDesc")}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                    onClick={handlePasswordRecovery}
                    role="menuitem"
                  >
                    <KeyRound className="h-4 w-4 text-amber-500" />
                    <span>
                      <span className="block font-medium">{t("header.recoverPassword")}</span>
                      <span className="block text-xs text-muted-foreground">{t("header.recoverPasswordDesc")}</span>
                    </span>
                  </button>
                  <div className="my-2 border-t border-border" />
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>
                      <span className="block font-medium">{t("header.logout")}</span>
                      <span className="block text-xs text-rose-500/90">{t("header.logoutDesc")}</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
          {!user && (
            <Button variant="outline" className="shrink-0" onClick={() => navigate("/", { replace: true })}>
              <IdCard className="mr-1 h-4 w-4" />
              {t("header.login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader
