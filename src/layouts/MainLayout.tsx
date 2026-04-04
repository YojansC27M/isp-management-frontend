import type { ReactNode } from "react"
import AppLayout from "@/layouts/AppLayout"

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return <AppLayout>{children}</AppLayout>
}

export default MainLayout
