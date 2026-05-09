import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import type { InvoiceAutomationSettings } from "../types/invoice"

interface InvoiceAutomationPanelProps {
  initialSettings: InvoiceAutomationSettings
  onSave: (settings: InvoiceAutomationSettings) => void
  onRunSimulation: (settings: InvoiceAutomationSettings) => void
  canManage: boolean
}

const inputId = (field: string) => `invoice-automation-${field}`

const InvoiceAutomationPanel = ({ initialSettings, onSave, onRunSimulation, canManage }: InvoiceAutomationPanelProps) => {
  const { t } = useI18n()
  const [settings, setSettings] = useState(initialSettings)

  useEffect(() => {
    setSettings(initialSettings)
  }, [initialSettings])

  const previewNumber = useMemo(() => {
    return `${settings.prefix}-${String(settings.nextCorrelative).padStart(6, "0")}`
  }, [settings.nextCorrelative, settings.prefix])

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{t("invoices.automation.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("invoices.automation.description")}</p>
          {!canManage ? <p className="mt-2 text-xs text-muted-foreground">{t("invoices.permissionManageSettings")}</p> : null}
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          {t("invoices.automation.nextInvoice", { number: previewNumber })}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:items-end">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("cutDay")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("invoices.automation.cutDay")}
          </Label>
          <Input
            id={inputId("cutDay")}
            type="number"
            min={1}
            max={28}
            step={1}
            value={settings.cutDay}
            disabled={!canManage}
            onChange={(event) =>
              setSettings((current) => ({ ...current, cutDay: Number(event.target.value || current.cutDay) }))
            }
          />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("prefix")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("invoices.automation.prefix")}
          </Label>
          <Input
            id={inputId("prefix")}
            value={settings.prefix}
            disabled={!canManage}
            onChange={(event) =>
              setSettings((current) => ({ ...current, prefix: event.target.value.toUpperCase().trim() || "INV" }))
            }
          />
        </label>
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("nextCorrelative")} className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("invoices.automation.nextCorrelative")}
          </Label>
          <Input
            id={inputId("nextCorrelative")}
            type="number"
            min={1}
            step={1}
            value={settings.nextCorrelative}
            disabled={!canManage}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                nextCorrelative: Number(event.target.value || current.nextCorrelative),
              }))
            }
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => onRunSimulation(settings)}
          disabled={!canManage}
          title={!canManage ? t("invoices.permissionManageSettings") : undefined}
        >
          {t("invoices.automation.runSimulation")}
        </Button>
        <Button
          type="button"
          onClick={() => onSave(settings)}
          disabled={!canManage}
          title={!canManage ? t("invoices.permissionManageSettings") : undefined}
        >
          {t("invoices.automation.saveSettings")}
        </Button>
      </div>
    </section>
  )
}

export default InvoiceAutomationPanel
