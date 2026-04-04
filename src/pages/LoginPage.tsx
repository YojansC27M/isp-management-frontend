import type { FormEvent } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/authStore"
import { rolePermissions } from "@/auth/permissions"

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const message = (location.state as { message?: string } | null)?.message

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "").trim()

    if (import.meta.env.VITE_USE_MOCKS === "true") {
      if (email === "admin@isp.com" && password === "123456") {
        const user = {
          id: "admin-1",
          name: "Admin User",
          email,
          role: "admin" as const,
          permissions: rolePermissions.admin,
        }
        setToken("mock-admin-token")
        setUser(user)
        setPermissions(user.permissions)
        navigate("/dashboard")
        return
      }
      window.alert("Credenciales inválidas.")
      return
    }

    window.alert("Backend no configurado. Conecta tu API para autenticación real.")
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.25),transparent_40%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">ISP Management</p>
            <h1 className="mt-3 text-3xl font-semibold">Centraliza tu operación</h1>
            <p className="mt-2 text-sm text-slate-200/80">
              Controla clientes, servicios y soporte desde un solo lugar.
            </p>
          </div>
          <Card className="border-white/10 bg-white/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.6)] backdrop-blur">
            <CardHeader>
              <CardTitle>Inicia sesión</CardTitle>
              <CardDescription>Ingresa tus credenciales para continuar.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                {message && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {message}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" name="email" type="email" placeholder="admin@isp.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" placeholder="123456" required />
                </div>
                <Button type="submit" className="mt-2 w-full">
                  Ingresar
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <span className="text-xs text-muted-foreground">Acceso seguro con monitoreo en tiempo real.</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
