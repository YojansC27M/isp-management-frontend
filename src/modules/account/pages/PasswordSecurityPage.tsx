import { FormEvent, useEffect, useMemo, useState } from "react"
import { BadgeCheck, LockKeyhole, MailCheck, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageHeader from "@/components/shared/PageHeader"
import StateMessage from "@/components/feedback/StateMessage"
import { useI18n } from "@/i18n/i18nContext"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"

const RECOVERY_COOLDOWN_SECONDS = 30
const PASSWORD_MIN_LENGTH = 12

const PasswordSecurityPage = () => {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const { notify } = useUI()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [recoveryEmail, setRecoveryEmail] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSendingRecovery, setIsSendingRecovery] = useState(false)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  useEffect(() => {
    if (!user) return
    setRecoveryEmail(user.email)
  }, [user])

  useEffect(() => {
    if (cooldownSeconds <= 0) return
    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearTimeout(timeoutId)
  }, [cooldownSeconds])

  const passwordChecks = useMemo(
    () => ({
      minLength: newPassword.length >= PASSWORD_MIN_LENGTH,
      hasLower: /[a-z]/.test(newPassword),
      hasUpper: /[A-Z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSymbol: /[^A-Za-z0-9]/.test(newPassword),
      noSpaces: !/\s/.test(newPassword),
      differsFromCurrent: newPassword.length > 0 && newPassword !== currentPassword,
      matchesConfirmation: newPassword.length > 0 && newPassword === confirmPassword,
    }),
    [confirmPassword, currentPassword, newPassword]
  )

  if (!user) {
    return (
      <StateMessage
        variant="error"
        title={t("security.noSessionTitle")}
        description={t("security.noSessionDescription")}
      />
    )
  }

  const allPasswordChecksPassed =
    passwordChecks.minLength &&
    passwordChecks.hasLower &&
    passwordChecks.hasUpper &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSymbol &&
    passwordChecks.noSpaces &&
    passwordChecks.differsFromCurrent &&
    passwordChecks.matchesConfirmation

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!currentPassword.trim()) {
      notify({
        title: t("security.requireCurrentTitle"),
        description: t("security.requireCurrentDesc"),
        type: "error",
      })
      return
    }

    if (!allPasswordChecksPassed) {
      notify({
        title: t("security.invalidPasswordTitle"),
        description: t("security.invalidPasswordDesc"),
        type: "error",
      })
      return
    }

    setIsChangingPassword(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      notify({
        title: t("security.updatedTitle"),
        description: t("security.updatedDesc"),
        type: "success",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleRecoveryRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!recoveryEmail.trim()) {
      notify({
        title: t("security.emailRequiredTitle"),
        description: t("security.emailRequiredDesc"),
        type: "error",
      })
      return
    }

    setIsSendingRecovery(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 700))
      setCooldownSeconds(RECOVERY_COOLDOWN_SECONDS)
      notify({
        title: t("security.requestProcessedTitle"),
        description: t("security.requestProcessedDesc"),
        type: "info",
      })
    } finally {
      setIsSendingRecovery(false)
    }
  }

  const renderCheck = (isValid: boolean, label: string) => (
    <li className={`flex items-start gap-2 ${isValid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{label}</span>
    </li>
  )

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("security.title")}
        description={t("security.description")}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-sky-500" />
              {t("security.changePassword")}
            </CardTitle>
            <CardDescription>{t("security.changePasswordDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleChangePassword}>
              <div className="grid gap-2">
                <Label htmlFor="current-password">{t("security.currentPassword")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">{t("security.newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{t("security.confirmPassword")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              <ul className="grid gap-1 rounded-xl border border-border/70 bg-muted/25 p-3 text-xs">
                {renderCheck(passwordChecks.minLength, t("password.check.minLength", { length: PASSWORD_MIN_LENGTH }))}
                {renderCheck(passwordChecks.hasLower, t("password.check.lower"))}
                {renderCheck(passwordChecks.hasUpper, t("password.check.upper"))}
                {renderCheck(passwordChecks.hasNumber, t("password.check.number"))}
                {renderCheck(passwordChecks.hasSymbol, t("password.check.symbol"))}
                {renderCheck(passwordChecks.noSpaces, t("password.check.noSpaces"))}
                {renderCheck(passwordChecks.differsFromCurrent, t("password.check.different"))}
                {renderCheck(passwordChecks.matchesConfirmation, t("password.check.match"))}
              </ul>

              <Button type="submit" disabled={isChangingPassword || !allPasswordChecksPassed}>
                {isChangingPassword ? t("security.updatingPassword") : t("security.updatePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MailCheck className="h-4 w-4 text-amber-500" />
                {t("security.recoveryCardTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" onSubmit={handleRecoveryRequest}>
                <div className="grid gap-2">
                  <Label htmlFor="recovery-email">{t("security.recoveryEmail")}</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <Button type="submit" disabled={isSendingRecovery || cooldownSeconds > 0}>
                  {isSendingRecovery
                    ? t("security.sendingRecovery")
                    : cooldownSeconds > 0
                      ? t("security.retryIn", { seconds: cooldownSeconds })
                      : t("security.sendRecovery")}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {t("security.neutralMessage")}
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-sky-500" />
                {t("security.recommendedControls")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t("security.control1")}</p>
              <p>{t("security.control2")}</p>
              <p>{t("security.control3")}</p>
              <p>{t("security.control4")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PasswordSecurityPage
