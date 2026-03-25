import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { login } from "../services/clientPortalApi"

const ClientLoginPage = () => {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!email.trim()) {
      setError("Email is required")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email is invalid")
      return
    }

    if (!password.trim()) {
      setError("Password is required")
      return
    }

    setLoading(true)
    try {
      const response = await login(email.trim(), password)
      localStorage.setItem("client_token", response.token)
      setToken(response.token)
      navigate("/client/dashboard")
    } catch {
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 360 }}>
      <header>
        <h1>Client Portal Login</h1>
        <p style={{ color: "#6b7280", marginTop: 4 }}>Access your account information.</p>
      </header>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          Password
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <span style={{ color: "#dc2626", fontSize: 12 }}>{error}</span>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  )
}

export default ClientLoginPage
