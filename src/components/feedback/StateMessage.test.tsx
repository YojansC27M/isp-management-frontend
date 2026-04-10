import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import StateMessage from "./StateMessage"

describe("StateMessage", () => {
  it("renders loading state with status role", () => {
    render(<StateMessage variant="loading" title="Cargando..." description="Un momento" />)
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.getByText("Cargando...")).toBeInTheDocument()
    expect(screen.getByText("Un momento")).toBeInTheDocument()
  })

  it("renders error state with alert role", () => {
    render(<StateMessage variant="error" title="Error" description="No se pudo cargar" />)
    expect(screen.getByRole("alert")).toBeInTheDocument()
    expect(screen.getByText("Error")).toBeInTheDocument()
    expect(screen.getByText("No se pudo cargar")).toBeInTheDocument()
  })
})
