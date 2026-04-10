import type { FormEvent } from "react"
import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { appRoles, getRolePermissions, getRoleStatusMap, isRoleEnabled, roleLabels } from "@/auth/permissions"
import type { Role } from "@/auth/types"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedRole, setSelectedRole] = useState<Role>("admin")
  const { notify } = useUI()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const message = (location.state as { message?: string } | null)?.message
  const roleStatusMap = getRoleStatusMap()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "").trim()

    if (import.meta.env.VITE_USE_MOCKS === "true") {
      if (email === "admin@isp.com" && password === "123456") {
        if (!isRoleEnabled(selectedRole)) {
          notify({
            title: "Perfil inactivo",
            description: `El perfil ${roleLabels[selectedRole]} esta inactivo y no puede iniciar sesion.`,
            type: "error",
          })
          return
        }

        const user = {
          id: "admin-1",
          name: `Usuario ${selectedRole}`,
          email,
          role: selectedRole,
          permissions: getRolePermissions(selectedRole),
        }
        setToken("mock-admin-token")
        setUser(user)
        setPermissions(user.permissions)
        navigate("/dashboard")
        return
      }
      notify({ title: "Credenciales invalidas", type: "error" })
      return
    }

    notify({
      title: "Backend no configurado",
      description: "Conecta tu API para autenticacion real.",
      type: "info",
    })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.14),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.25),transparent_40%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-foreground dark:text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">ISP Management</p>
            <h1 className="mt-3 text-3xl font-semibold">Centraliza tu operacion</h1>
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-200/80">
              Controla clientes, servicios y soporte desde un solo lugar.
            </p>
          </div>
          <Card className="border-border bg-card/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader>
              <CardTitle>Inicia sesion</CardTitle>
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
                  <Label htmlFor="password">Contrasena</Label>
                  <Input id="password" name="password" type="password" placeholder="123456" required />
                </div>
                {import.meta.env.VITE_USE_MOCKS === "true" && (
                  <div className="grid gap-2">
                    <Label htmlFor="role">Rol local</Label>
                    <select
                      id="role"
                      value={selectedRole}
                      onChange={(event) => setSelectedRole(event.target.value as Role)}
                      className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {appRoles
                        .filter((role) => role !== "client")
                        .map((role) => (
                          <option key={role} value={role} disabled={!roleStatusMap[role]}>
                            {roleLabels[role]} {!roleStatusMap[role] ? "(Inactivo)" : ""}
                          </option>
                        ))}
                    </select>
                    {!roleStatusMap[selectedRole] && (
                      <p className="text-xs text-rose-600">
                        Este perfil esta inactivo. Activalo en Perfiles y permisos para permitir el acceso.
                      </p>
                    )}
                  </div>
                )}
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
