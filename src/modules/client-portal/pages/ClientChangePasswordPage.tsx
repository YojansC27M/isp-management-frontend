import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clearClientToken } from "@/auth/session"
import { useI18n } from "@/i18n/i18nContext"
import { getErrorMessage } from "@/lib/errors"
import { changePortalPassword } from "../services/clientPortalApi"

const ClientChangePasswordPage = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!currentPassword.trim()) {
      setError(t("clientPortal.changePassword.error.currentRequired"))
      return
    }
    if (!newPassword.trim() || newPassword.length < 8) {
      setError(t("clientPortal.changePassword.error.newInvalid"))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t("clientPortal.changePassword.error.mismatch"))
      return
    }

    setLoading(true)
    try {
      await changePortalPassword(currentPassword, newPassword)
      clearClientToken()
      navigate("/client/login?passwordChanged=1")
    } catch (err) {
      setError(getErrorMessage(err, t("clientPortal.changePassword.error.failed")))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{t("clientPortal.changePassword.title")}</CardTitle>
          <CardDescription>{t("clientPortal.changePassword.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <label className="grid gap-1.5">
              <Label htmlFor="portal-current-password">{t("clientPortal.changePassword.current")}</Label>
              <Input
                id="portal-current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5">
              <Label htmlFor="portal-new-password">{t("clientPortal.changePassword.new")}</Label>
              <Input
                id="portal-new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <label className="grid gap-1.5">
              <Label htmlFor="portal-confirm-password">{t("clientPortal.changePassword.confirm")}</Label>
              <Input
                id="portal-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            {error ? <p className="text-xs font-medium text-rose-600">{error}</p> : null}
            <Button type="submit" disabled={loading}>
              {loading ? t("clientPortal.changePassword.saving") : t("clientPortal.changePassword.submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClientChangePasswordPage
