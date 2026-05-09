import type { FormEvent } from "react"
import { useLayoutEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeApiError } from "@/api/apiError"
import { getNavigationConfig } from "@/auth/services/navigationApi"
import { login as loginRequest } from "@/auth/services/authApi"
import { clearAuthToken } from "@/auth/session"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"
import { useTheme } from "@/ui/themeContext"
import { useI18n } from "@/i18n/i18nContext"

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const { t } = useI18n()
  const { notify } = useUI()
  const { setThemeMode } = useTheme()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)
  const setPermissions = useAuthStore((state) => state.setPermissions)
  const setNavigation = useAuthStore((state) => state.setNavigation)
  const message = (location.state as { message?: string } | null)?.message

  useLayoutEffect(() => {
    setThemeMode("system")
  }, [setThemeMode])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading) return

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "").trim()
    setLoading(true)

    try {
      const response = await loginRequest({ email, password })
      setToken(response.accessToken)
      setUser(response.user)
      setPermissions(response.user.permissions)

      try {
        const navigation = await getNavigationConfig()
        setNavigation(navigation.modules)
      } catch {
        setNavigation(null)
      }

      navigate("/dashboard", { replace: true })
    } catch (error) {
      clearAuthToken()
      const apiError = normalizeApiError(error)
      notify({
        title: apiError.code === "network" ? t("login.backendNotConfigured") : t("login.invalidCredentials"),
        description: apiError.code === "network" ? t("login.backendNotConfiguredDesc") : apiError.message,
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.14),transparent_40%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(14,165,233,0.25),transparent_40%)]" />
      <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center text-foreground dark:text-white">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-200">{t("login.brand")}</p>
            <h1 className="mt-3 text-3xl font-semibold">{t("login.heroTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-200/80">
              {t("login.heroDescription")}
            </p>
          </div>
          <Card className="border-border bg-card/95 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
              <CardHeader>
              <CardTitle>{t("login.title")}</CardTitle>
              <CardDescription>{t("login.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                {message && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {message}
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("login.email")}</Label>
                  <Input id="email" name="email" type="email" placeholder={t("login.placeholderEmail")} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t("login.password")}</Label>
                  <Input id="password" name="password" type="password" placeholder={t("login.placeholderPassword")} required />
                </div>
                <Button type="submit" className="mt-2 w-full">
                  {loading ? t("clientPortal.login.signingIn") : t("login.submit")}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="justify-center">
              <span className="text-xs text-muted-foreground">{t("login.secureFooter")}</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
