import { ReactNode } from "react"

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="text-lg font-semibold">ISP</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">ISP Management</p>
              <p className="text-xs text-muted-foreground">Operations Dashboard</p>
            </div>
          </div>
          <span className="rounded-full border border-border/60 bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
            Modern UI
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}

export default MainLayout
