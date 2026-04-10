import type { ReactNode } from "react"

interface PageContainerProps {
  children: ReactNode
}

const PageContainer = ({ children }: PageContainerProps) => {
  return <div className="mx-auto w-full max-w-6xl px-6 py-8 motion-safe:animate-in motion-safe:fade-in-50">{children}</div>
}

export default PageContainer

