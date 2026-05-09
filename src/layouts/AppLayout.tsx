import { useEffect, useMemo, useState, type ReactNode } from "react"
import AppHeader from "@/layouts/AppHeader"
import GlobalSearchDialog from "@/layouts/GlobalSearchDialog"
import NotificationCenterDrawer from "@/layouts/NotificationCenterDrawer"
import AppSidebar from "@/layouts/AppSidebar"
import PageContainer from "@/layouts/PageContainer"
import { readSecurityAudit } from "@/auth/auditLog"

interface AppLayoutProps {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth >= 1024
  })
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const notificationCount = useMemo(() => {
    return Math.max(3, readSecurityAudit().length)
  }, [])

  useEffect(() => {
    const closeSidebarOnMobile = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false)
    }

    window.addEventListener("resize", closeSidebarOnMobile)
    return () => window.removeEventListener("resize", closeSidebarOnMobile)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isCommandShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"
      if (!isCommandShortcut) return
      event.preventDefault()
      setIsSearchOpen(true)
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleCloseSidebar = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) return
    setIsSidebarOpen(false)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={isSidebarOpen} onClose={handleCloseSidebar} />
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <AppHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          notificationCount={notificationCount}
        />
        <main className="flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
      <GlobalSearchDialog open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      <NotificationCenterDrawer open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} />
    </div>
  )
}

export default AppLayout
