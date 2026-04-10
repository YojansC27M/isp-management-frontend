import { useEffect, useState, type ReactNode } from "react"
import AppHeader from "@/layouts/AppHeader"
import AppSidebar from "@/layouts/AppSidebar"
import PageContainer from "@/layouts/PageContainer"

interface AppLayoutProps {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    const closeSidebarOnDesktop = () => {
      if (window.innerWidth >= 1024) setIsSidebarOpen(false)
    }

    window.addEventListener("resize", closeSidebarOnDesktop)
    return () => window.removeEventListener("resize", closeSidebarOnDesktop)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu lateral"
          className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-0">
        <AppHeader onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
