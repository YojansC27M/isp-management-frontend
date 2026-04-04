import type { ReactNode } from "react"
import AppHeader from "@/layouts/AppHeader"
import AppSidebar from "@/layouts/AppSidebar"
import PageContainer from "@/layouts/PageContainer"

interface AppLayoutProps {
  children: ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex-1">
          <PageContainer>{children}</PageContainer>
        </main>
      </div>
    </div>
  )
}

export default AppLayout

