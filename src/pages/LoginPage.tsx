import type { FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const LoginPage = () => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.25),transparent_40%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">ISP Management</p>
            <h1 className="mt-3 text-3xl font-semibold">Centraliza tu operacion</h1>
            <p className="mt-2 text-sm text-slate-200/80">
              Controla clientes, servicios y soporte desde un solo lugar.
            </p>
          </div>
          <Card className="border-white/10 bg-white/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.6)] backdrop-blur">
            <CardHeader>
              <CardTitle>Inicia sesion</CardTitle>
              <CardDescription>Ingresa tus credenciales para continuar.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="********" required />
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
