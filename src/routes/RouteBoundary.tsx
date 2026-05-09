import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import StateMessage from "@/components/feedback/StateMessage"

interface RouteBoundaryProps {
  children: ReactNode
}

interface RouteBoundaryState {
  hasError: boolean
}

const isChunkLoadError = (error: unknown) => {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes("failed to fetch dynamically imported module") || message.includes("loading chunk")
}

class RouteBoundary extends Component<RouteBoundaryProps, RouteBoundaryState> {
  state: RouteBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (!isChunkLoadError(error)) {
      void info
      void error
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <StateMessage
            variant="error"
            title="No se pudo cargar el modulo"
            description="La aplicacion detecto un error de carga. Recarga la pagina para continuar."
          />
          <div className="mt-3">
            <Button onClick={this.handleReload}>Recargar</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default RouteBoundary
