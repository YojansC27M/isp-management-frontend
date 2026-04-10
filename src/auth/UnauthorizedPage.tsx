import { ArrowLeft, Home, ShieldAlert } from "lucide-react"
import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { getFirstAllowedRoute } from "@/auth/navigation"
import { getUserPermissions } from "@/auth/permissions"
import { getAuthToken } from "@/auth/session"
import { useAuthStore } from "@/store/authStore"

interface UnauthorizedState {
  message?: string
  deniedPath?: string
}

const UnauthorizedPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((state) => state.token) ?? getAuthToken()
  const user = useAuthStore((state) => state.user)
  const permissions = useAuthStore((state) => state.permissions)

  const state = (location.state as UnauthorizedState | null) ?? null
  const message = state?.message ?? "No tienes acceso a esta seccion."
  const deniedPath = state?.deniedPath

  const nextRoute = useMemo(() => {
    const effectivePermissions = permissions.length > 0 ? permissions : getUserPermissions(user)
    return getFirstAllowedRoute(effectivePermissions)
  }, [permissions, user])

  const isAuthenticated = Boolean(token)

  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.14),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(56,189,248,0.14),transparent_45%)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-5xl items-center justify-center px-6 py-10">
        <section className="w-full max-w-2xl rounded-2xl border border-border bg-card/95 p-8 shadow-[0_25px_70px_-30px_rgba(15,23,42,0.5)] backdrop-blur">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Acceso restringido</p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground">No autorizado</h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            {deniedPath && (
              <p className="mt-2 text-xs text-muted-foreground">
                Ruta solicitada: <span className="font-medium text-foreground">{deniedPath}</span>
              </p>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            {isAuthenticated
              ? "Tu sesion sigue activa. Puedes continuar en un modulo habilitado para tu perfil."
              : "Necesitas iniciar sesion para continuar en la plataforma."}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {isAuthenticated ? (
              <Button onClick={() => navigate(nextRoute)}>
                <Home className="h-4 w-4" />
                Ir a mi modulo habilitado
              </Button>
            ) : (
              <Button onClick={() => navigate("/")}>
                <Home className="h-4 w-4" />
                Ir a iniciar sesion
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UnauthorizedPage
