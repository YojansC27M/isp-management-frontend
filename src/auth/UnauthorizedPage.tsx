import { useLocation, useNavigate } from "react-router-dom"

const UnauthorizedPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const message = (location.state as { message?: string } | null)?.message

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h1>No autorizado</h1>
      <p style={{ color: "#6b7280" }}>{message ?? "No tienes acceso a esta página."}</p>
      <button type="button" onClick={() => navigate("/")}>Ir al inicio</button>
    </div>
  )
}

export default UnauthorizedPage
