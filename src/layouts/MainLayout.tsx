import { ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="layout">
      <header className="header">
        <h2>ISP Management System</h2>
      </header>
      <main className="content">{children}</main>
    </div>
  )
}

export default MainLayout
