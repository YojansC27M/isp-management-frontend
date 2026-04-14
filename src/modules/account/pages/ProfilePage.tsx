import { FormEvent, useEffect, useMemo, useState } from "react"
import { BadgeCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import PageHeader from "@/components/shared/PageHeader"
import StateMessage from "@/components/feedback/StateMessage"
import { roleLabels } from "@/auth/permissions"
import { useI18n } from "@/i18n/i18nContext"
import { useAuthStore } from "@/store/authStore"
import { useUI } from "@/ui/uiContext"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ProfilePage = () => {
  const { t } = useI18n()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const { notify } = useUI()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name)
    setEmail(user.email)
  }, [user])

  const isDirty = useMemo(() => {
    if (!user) return false
    return name.trim() !== user.name || email.trim().toLowerCase() !== user.email.toLowerCase()
  }, [email, name, user])

  if (!user) {
    return (
      <StateMessage
        variant="error"
        title={t("profile.noSessionTitle")}
        description={t("profile.noSessionDescription")}
      />
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sanitizedName = name.trim().replace(/\s+/g, " ")
    const sanitizedEmail = email.trim().toLowerCase()

    if (sanitizedName.length < 3) {
      notify({
        title: t("profile.invalidName"),
        description: t("profile.invalidNameDesc"),
        type: "error",
      })
      return
    }

    if (sanitizedName.length > 80) {
      notify({
        title: t("profile.longName"),
        description: t("profile.longNameDesc"),
        type: "error",
      })
      return
    }

    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      notify({
        title: t("profile.invalidEmail"),
        description: t("profile.invalidEmailDesc"),
        type: "error",
      })
      return
    }

    setIsSaving(true)
    try {
      setUser({ ...user, name: sanitizedName, email: sanitizedEmail })
      notify({
        title: t("profile.updatedTitle"),
        description: t("profile.updatedDesc"),
        type: "success",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setName(user.name)
    setEmail(user.email)
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t("profile.title")}
        description={t("profile.description")}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle>{t("profile.dataCardTitle")}</CardTitle>
            <CardDescription>{t("profile.dataCardDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="profile-name">{t("profile.name")}</Label>
                <Input
                  id="profile-name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-email">{t("profile.email")}</Label>
                <Input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="profile-role">{t("profile.role")}</Label>
                <Input id="profile-role" value={roleLabels[user.role]} disabled />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="submit" disabled={!isDirty || isSaving}>
                  {isSaving ? t("common.saving") : t("profile.save")}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset} disabled={!isDirty || isSaving}>
                  {t("profile.discard")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              {t("profile.bestPractices")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              {t("profile.tip1")}
            </p>
            <p className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              {t("profile.tip2")}
            </p>
            <p className="flex items-start gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
              {t("profile.tip3")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage
