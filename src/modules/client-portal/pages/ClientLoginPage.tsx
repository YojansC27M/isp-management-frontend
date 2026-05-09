import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { setClientToken } from "@/auth/session"
import { useI18n } from "@/i18n/i18nContext"
import { login } from "../services/clientPortalApi"

const COMPLIANCE_BADGES = ["ISO 27001", "SOC 2", "PCI DSS"]

const ClientLoginPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const passwordChanged = searchParams.get("passwordChanged") === "1"

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!email.trim()) {
      setError(t("clientPortal.login.error.emailRequired"))
      return
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t("clientPortal.login.error.emailInvalid"))
      return
    }

    if (!password.trim()) {
      setError(t("clientPortal.login.error.passwordRequired"))
      return
    }

    setLoading(true)
    try {
      const response = await login(email.trim(), password)
      setClientToken(response.token)
      navigate(response.mustChangePassword ? "/client/change-password" : "/client/dashboard")
    } catch {
      setError(t("clientPortal.login.error.failed"))
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    t("clientPortal.login.benefitVisibility"),
    t("clientPortal.login.benefitTraceability"),
    t("clientPortal.login.benefitRoleAccess"),
  ]

  return (
    <div className="relative min-h-screen bg-background text-foreground dark:bg-[#0b1020] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(900px_circle_at_15%_20%,rgba(59,130,246,0.12),transparent_60%),radial-gradient(700px_circle_at_85%_0%,rgba(14,165,233,0.1),transparent_55%),radial-gradient(600px_circle_at_50%_85%,rgba(15,23,42,0.08),transparent_60%)] dark:bg-[radial-gradient(900px_circle_at_15%_20%,rgba(59,130,246,0.22),transparent_60%),radial-gradient(700px_circle_at_85%_0%,rgba(14,165,233,0.2),transparent_55%),radial-gradient(600px_circle_at_50%_85%,rgba(15,23,42,0.7),transparent_60%)]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,rgba(148,163,184,0.05),rgba(15,23,42,0.0))] dark:bg-[linear-gradient(120deg,rgba(148,163,184,0.08),rgba(15,23,42,0.0))]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 to-transparent dark:from-white/5" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="hidden flex-col justify-between gap-10 lg:flex">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/70 dark:border-slate-800/70 dark:bg-slate-900/70">
                  <span className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-sky-400/30 to-blue-700/30 blur" />
                  <img src="/brand-mark.svg" alt={t("clientPortal.login.brandName")} className="relative h-10" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">{t("clientPortal.login.brandPortal")}</p>
                  <p className="text-lg font-semibold text-foreground dark:text-white">{t("clientPortal.login.brandName")}</p>
                </div>
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-foreground dark:text-white">{t("clientPortal.login.heroTitle")}</h1>
              <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{t("clientPortal.login.heroDescription")}</p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-border bg-card/70 p-6 shadow-lg shadow-foreground/10 dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-slate-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">{t("clientPortal.login.securityTitle")}</p>
                  <p className="text-sm font-medium text-foreground dark:text-slate-200">{t("clientPortal.login.securitySubtitle")}</p>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">{t("clientPortal.login.securityBadge")}</span>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground dark:text-slate-300">
                {benefits.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {COMPLIANCE_BADGES.map((item) => (
                  <span key={item} className="rounded-full border border-border bg-background/70 px-3 py-1 dark:border-slate-700/70 dark:bg-slate-950/60">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span>{t("clientPortal.login.supportPhone")}</span>
              <span>{t("clientPortal.login.supportEmail")}</span>
            </div>
          </div>

          <Card className="relative overflow-hidden border-border bg-card/90 text-foreground shadow-2xl shadow-foreground/10 dark:border-slate-800/70 dark:bg-slate-900/85 dark:text-slate-100 dark:shadow-slate-900/50">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/10 to-transparent" />
            <CardHeader className="gap-2 border-b border-border pb-6 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-foreground dark:text-white">{t("clientPortal.login.cardTitle")}</CardTitle>
                <span className="rounded-full border border-border bg-background/70 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground dark:border-slate-700/70 dark:bg-slate-950/60">
                  {t("clientPortal.login.verified")}
                </span>
              </div>
              <CardDescription className="text-muted-foreground">{t("clientPortal.login.cardDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {passwordChanged ? (
                <div className="mb-4 rounded-xl border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  {t("clientPortal.login.passwordChangedNotice")}
                </div>
              ) : null}
              <form onSubmit={handleSubmit} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="client-email" className="text-foreground dark:text-slate-300">
                    {t("clientPortal.login.emailLabel")}
                  </Label>
                  <Input
                    id="client-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@isp.com"
                    className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="client-password" className="text-foreground dark:text-slate-300">
                    {t("clientPortal.login.passwordLabel")}
                  </Label>
                  <Input
                    id="client-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="******"
                    className="h-11 border-border bg-background text-foreground placeholder:text-muted-foreground dark:border-slate-700/70 dark:bg-slate-950/60 dark:text-slate-100"
                  />
                </div>
                {error && <span className="text-xs font-medium text-rose-400">{error}</span>}
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-blue-500"
                >
                  {loading ? t("clientPortal.login.signingIn") : t("clientPortal.login.signIn")}
                </Button>
              </form>
              <div className="mt-6 grid gap-3 rounded-xl border border-border bg-muted/30 p-4 text-xs text-muted-foreground dark:border-slate-800/70 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span>{t("clientPortal.login.lastAccess")}</span>
                  <span className="text-foreground dark:text-slate-200">{t("clientPortal.login.lastAccessValue")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t("clientPortal.login.location")}</span>
                  <span className="text-foreground dark:text-slate-200">{t("clientPortal.login.locationValue")}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2 border-t border-border text-xs text-muted-foreground dark:border-slate-800/60">
              <span>{t("clientPortal.login.footerSecure")}</span>
              <span>{t("clientPortal.login.footerContact")}</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ClientLoginPage
