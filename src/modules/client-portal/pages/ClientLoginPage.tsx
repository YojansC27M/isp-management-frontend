import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      setError("El correo es obligatorio")
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("El correo no es válido")
      return
    }

    if (!password.trim()) {
      setError("La contraseña es obligatoria")
      return
    }

    setLoading(true)
    try {
      const response = await login(email.trim(), password)
      localStorage.setItem("client_token", response.token)
      setToken(response.token)
      navigate("/client/dashboard")
    } catch {
      setError("Inicio de sesión fallido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0b1020] text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_15%_20%,rgba(59,130,246,0.22),transparent_60%),radial-gradient(700px_circle_at_85%_0%,rgba(14,165,233,0.2),transparent_55%),radial-gradient(600px_circle_at_50%_85%,rgba(15,23,42,0.7),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(148,163,184,0.08),rgba(15,23,42,0.0))]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/5 to-transparent" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hidden flex-col justify-between gap-10 lg:flex">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-900/70">
                  <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-sky-400/30 to-blue-700/30 blur" />
                  <img src="/brand-mark.svg" alt="Corma Networks" className="relative h-10" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Portal Empresarial</p>
                  <p className="text-lg font-semibold text-white">Corma Networks</p>
                </div>
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white">
                Acceso seguro para clientes con controles de nivel empresarial.
              </h1>
              <p className="max-w-lg text-sm leading-relaxed text-slate-400">
                Supervisa facturación, estado del servicio y soporte en un entorno controlado para clientes premium.
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Seguridad</p>
                  <p className="text-sm font-medium text-slate-200">Aislamiento multi-tenant</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                  MFA habilitado
                </span>
              </div>
              <div className="grid gap-3 text-sm text-slate-300">
                {[
                  "Visibilidad centralizada de cuentas",
                  "Trazabilidad para auditoría",
                  "Acceso basado en roles",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {["ISO 27001", "SOC 2", "PCI DSS"].map((item) => (
                  <span key={item} className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-slate-500">
              <span>Soporte: +1 (800) 555-0199</span>
              <span>seguridad@corma.net</span>
            </div>
          </div>

          <Card className="relative overflow-hidden border-slate-800/70 bg-slate-900/85 text-slate-100 shadow-2xl shadow-slate-900/50">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/10 to-transparent" />
            <CardHeader className="gap-2 border-b border-slate-800/60 pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">Ingreso al portal de clientes</CardTitle>
                <span className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  Verificado
                </span>
              </div>
              <CardDescription className="text-slate-400">
                Usa tus credenciales corporativas para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="client-email" className="text-slate-300">
                    Correo
                  </Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@isp.com"
                    className="h-11 border-slate-700/70 bg-slate-950/60 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client-password" className="text-slate-300">
                    Contraseña
                  </Label>
                  <Input
                    id="client-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••"
                    className="h-11 border-slate-700/70 bg-slate-950/60 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
                {error && <span className="text-xs font-medium text-rose-400">{error}</span>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500"
                >
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
              <div className="mt-6 grid gap-3 rounded-xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Último acceso</span>
                  <span className="text-slate-200">21 Ago, 09:45</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ubicación</span>
                  <span className="text-slate-200">Bogotá, CO</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 border-t border-slate-800/60 text-xs text-slate-400">
              <span>Protegido con cifrado de nivel empresarial.</span>
              <span>¿Necesitas acceso? Contacta a tu gestor de cuenta.</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ClientLoginPage
