import { useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/i18nContext"
import ClientAutocompleteField, { type ClientSummary } from "@/modules/clients/components/ClientAutocompleteField"
import { getTicketAssigneeOptions, suggestTicketAssignee, type TicketAssigneeOption } from "@/modules/internal-users/services/ticketAssignee"
import {
  getClientZone,
  getTechnicianAssignmentOptions,
  suggestTechnicianAssignment,
} from "@/modules/internal-users/services/technicianAssignment"
import type { TechnicianAssignmentOption } from "@/modules/internal-users/types/internalUser"
import {
  formatTicketAttachmentSize,
  isAllowedTicketAttachment,
  MAX_TICKET_ATTACHMENT_BYTES,
  MAX_TICKET_ATTACHMENT_COUNT,
  TICKET_ATTACHMENT_ACCEPT,
} from "../lib/attachment"
import type { TicketCategory, TicketFormValues, TicketPriority, TicketStatus } from "../types/ticket"

interface TicketFormProps {
  initialValues: TicketFormValues
  onSubmit: (values: TicketFormValues, attachments?: File[] | null) => void
  submitLabel?: string
  allowAttachment?: boolean
}

type TicketFormState = {
  clientId: string
  assignedUserId: string
  assignedTechnicianId: string
  title: string
  description: string
  category: TicketCategory | ""
  priority: TicketPriority | ""
  status: TicketStatus | ""
}

type FormErrors = Partial<Record<keyof TicketFormState, string>>
type FocusableField = keyof TicketFormState

type ResponsibleOption = {
  id: string
  name: string
  meta: string
}

const categoryOptions: { key: string; value: TicketCategory }[] = [
  { key: "tickets.category.technical", value: "technical" },
  { key: "tickets.category.billing", value: "billing" },
  { key: "tickets.category.installation", value: "installation" },
]

const priorityOptions: { key: string; value: TicketPriority }[] = [
  { key: "tickets.priority.low", value: "low" },
  { key: "tickets.priority.medium", value: "medium" },
  { key: "tickets.priority.high", value: "high" },
]

const statusOptions: { key: string; value: TicketStatus }[] = [
  { key: "tickets.status.open", value: "open" },
  { key: "tickets.status.in_progress", value: "in_progress" },
  { key: "tickets.status.waiting", value: "waiting" },
  { key: "tickets.status.resolved", value: "resolved" },
  { key: "tickets.status.closed", value: "closed" },
]

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-sm text-muted-foreground outline-none focus:border-ring"

const textareaClass =
  "min-h-28 w-full rounded-lg border border-border bg-card px-2.5 py-2 text-sm text-muted-foreground outline-none focus:border-ring"

const inputId = (field: string) => `ticket-form-${field}`
const errorId = (field: string) => `ticket-form-${field}-error`
const attachmentInputId = "ticket-form-attachment"

const isTechnicalCategory = (category: TicketCategory | "") => category === "technical" || category === "installation"

const TicketForm = ({ initialValues, onSubmit, submitLabel = "Guardar", allowAttachment = true }: TicketFormProps) => {
  const { t } = useI18n()
  const [values, setValues] = useState<TicketFormState>({
    clientId: initialValues.clientId,
    assignedUserId: initialValues.assignedUserId,
    assignedTechnicianId: initialValues.assignedTechnicianId,
    title: initialValues.title,
    description: initialValues.description,
    category: initialValues.category,
    priority: initialValues.priority,
    status: initialValues.status,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [assigneeOptions, setAssigneeOptions] = useState<TicketAssigneeOption[]>([])
  const [technicianOptions, setTechnicianOptions] = useState<TechnicianAssignmentOption[]>([])
  const [zone, setZone] = useState("")
  const [loadingResponsible, setLoadingResponsible] = useState(false)
  const [autoAssigningResponsible, setAutoAssigningResponsible] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState("")
  const fieldRefs = useRef<Partial<Record<FocusableField, HTMLElement | null>>>({})

  useEffect(() => {
    setValues({
      clientId: initialValues.clientId,
      assignedUserId: initialValues.assignedUserId,
      assignedTechnicianId: initialValues.assignedTechnicianId,
      title: initialValues.title,
      description: initialValues.description,
      category: initialValues.category,
      priority: initialValues.priority,
      status: initialValues.status,
    })
    setAttachments([])
    setAttachmentError("")
  }, [initialValues])

  useEffect(() => {
    let cancelled = false

    const loadResponsibleOptions = async () => {
      if (!values.category) return

      setLoadingResponsible(true)
      try {
        if (isTechnicalCategory(values.category)) {
          const clientZone = values.clientId.trim() ? await getClientZone(values.clientId) : ""
          const techOptions = await getTechnicianAssignmentOptions({ zone: clientZone })
          if (cancelled) return
          setZone(clientZone)
          setTechnicianOptions(techOptions)
          setAssigneeOptions([])
        } else {
          const internalOptions = await getTicketAssigneeOptions(values.category)
          if (cancelled) return
          setAssigneeOptions(internalOptions)
          setTechnicianOptions([])
        }
      } finally {
        if (!cancelled) setLoadingResponsible(false)
      }
    }

    void loadResponsibleOptions()
    return () => {
      cancelled = true
    }
  }, [values.category, values.clientId])

  const responsibleOptions = useMemo<ResponsibleOption[]>(() => {
    if (!values.category) return []

    if (isTechnicalCategory(values.category)) {
      return technicianOptions.map((option) => ({
        id: option.id,
        name: option.name,
        meta: option.availableForContext
          ? t("tickets.form.assigneeFieldTech", { load: option.currentLoad })
          : t("tickets.form.assigneeFieldTechUnavailable", {
              reason: option.unavailableReason ?? t("tickets.form.notAvailable"),
              load: option.currentLoad,
            }),
      }))
    }

    return assigneeOptions.map((option) => ({
      id: option.id,
      name: option.name,
      meta: `${t(`internalUsers.role.${option.role}`)} · ${t("tickets.form.load", { load: option.currentLoad })}`,
    }))
  }, [assigneeOptions, t, technicianOptions, values.category])

  const selectedResponsibleId = useMemo(() => {
    if (!values.category) return ""
    return isTechnicalCategory(values.category) ? values.assignedTechnicianId : values.assignedUserId
  }, [values.assignedTechnicianId, values.assignedUserId, values.category])

  const selectedResponsibleName = useMemo(() => {
    return responsibleOptions.find((item) => item.id === selectedResponsibleId)?.name ?? t("tickets.unassigned")
  }, [responsibleOptions, selectedResponsibleId, t])

  const handleChange = (field: keyof Omit<TicketFormState, "category" | "priority" | "status">) => {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }))
    }
  }

  const handleClientSelect = (client: ClientSummary | null) => {
    setValues((current) => ({
      ...current,
      clientId: client?.id ?? "",
      assignedUserId: "",
      assignedTechnicianId: "",
    }))
  }

  const handleSelectChange = (field: "category" | "priority" | "status") => {
    return (event: ChangeEvent<HTMLSelectElement>) => {
      const nextValue = event.target.value
      if (field === "category") {
        setValues((current) => ({
          ...current,
          category: nextValue as TicketCategory,
          assignedUserId: "",
          assignedTechnicianId: "",
        }))
        return
      }
      setValues((current) => ({ ...current, [field]: nextValue }))
    }
  }

  const handleResponsibleChange = (responsibleId: string) => {
    setValues((current) => {
      if (!current.category) return current
      if (isTechnicalCategory(current.category)) {
        return { ...current, assignedTechnicianId: responsibleId, assignedUserId: "" }
      }
      return { ...current, assignedUserId: responsibleId, assignedTechnicianId: "" }
    })
  }

  const validate = () => {
    const nextErrors: FormErrors = {}
    if (!values.clientId.trim()) nextErrors.clientId = t("tickets.form.error.clientRequired")
    if (!values.title.trim()) nextErrors.title = t("tickets.form.error.titleRequired")
    if (!values.description.trim()) nextErrors.description = t("tickets.form.error.descriptionRequired")
    if (!values.category) nextErrors.category = t("tickets.form.error.categoryRequired")
    if (!values.priority) nextErrors.priority = t("tickets.form.error.priorityRequired")
    if (!values.status) nextErrors.status = t("tickets.form.error.statusRequired")
    const nextAttachmentError =
      attachments.length > MAX_TICKET_ATTACHMENT_COUNT
        ? t("tickets.form.error.attachmentCount", { count: MAX_TICKET_ATTACHMENT_COUNT })
        : attachments.some((attachment) => !isAllowedTicketAttachment(attachment))
          ? t("tickets.form.error.attachmentType")
          : attachments.some((attachment) => attachment.size > MAX_TICKET_ATTACHMENT_BYTES)
            ? t("tickets.form.error.attachmentSize")
            : ""
    setAttachmentError(nextAttachmentError)
    setErrors(nextErrors)
    return { nextErrors, nextAttachmentError }
  }

  const handleAutoAssignResponsible = async () => {
    if (!values.category) return

    setAutoAssigningResponsible(true)
    try {
      if (isTechnicalCategory(values.category)) {
        const suggestion = await suggestTechnicianAssignment({ zone })
        handleResponsibleChange(suggestion?.id ?? "")
      } else {
        const suggestion = await suggestTicketAssignee(values.category)
        handleResponsibleChange(suggestion?.id ?? "")
      }
    } finally {
      setAutoAssigningResponsible(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { nextErrors, nextAttachmentError } = validate()
    if (Object.keys(nextErrors).length > 0) {
      const order: FocusableField[] = ["clientId", "category", "title", "description", "priority", "status"]
      const first = order.find((field) => nextErrors[field])
      if (first) fieldRefs.current[first]?.focus()
      return
    }

    if (nextAttachmentError) return

    const technical = isTechnicalCategory(values.category)

    onSubmit(
      {
        clientId: values.clientId.trim(),
        assignedUserId: technical ? "" : values.assignedUserId.trim(),
        assignedUserName: technical ? t("tickets.unassigned") : selectedResponsibleName,
        assignedTechnicianId: technical ? values.assignedTechnicianId.trim() : "",
        assignedTechnicianName: technical ? selectedResponsibleName : t("tickets.unassigned"),
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category as TicketCategory,
        priority: values.priority as TicketPriority,
        status: values.status as TicketStatus,
      },
      attachments,
    )
  }

  const describedBy = (field: keyof TicketFormState) => (errors[field] ? errorId(field) : undefined)

  return (
    <form onSubmit={handleSubmit} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5" noValidate>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5">
          <Label htmlFor={inputId("clientId")}>{t("tickets.table.client")}</Label>
          <ClientAutocompleteField
            id={inputId("clientId")}
            name="clientId"
            value={values.clientId}
            onSelect={handleClientSelect}
            ref={(node) => (fieldRefs.current.clientId = node)}
            ariaInvalid={Boolean(errors.clientId)}
            ariaDescribedBy={describedBy("clientId")}
          />
          {errors.clientId && <span id={errorId("clientId")} className="text-xs text-rose-600" role="alert">{errors.clientId}</span>}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("category")}>{t("tickets.table.category")}</Label>
          <select
            id={inputId("category")}
            name="category"
            value={values.category}
            onChange={handleSelectChange("category")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.category = node)}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={describedBy("category")}
          >
            <option value="">{t("tickets.form.selectCategory")}</option>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.category && <span id={errorId("category")} className="text-xs text-rose-600" role="alert">{errors.category}</span>}
        </label>

        {values.category && (
          <div className="grid gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor={inputId("responsible")}>{t("tickets.form.responsible")}</Label>
              <Button
                type="button"
                variant="outline"
                onClick={handleAutoAssignResponsible}
                disabled={loadingResponsible || autoAssigningResponsible}
              >
                {autoAssigningResponsible ? t("tickets.form.assigning") : t("tickets.form.assignAutomatically")}
              </Button>
            </div>

            <select
              id={inputId("responsible")}
              value={selectedResponsibleId}
              onChange={(event) => handleResponsibleChange(event.target.value)}
              className={selectClass}
              disabled={loadingResponsible}
            >
              <option value="">{t("tickets.unassigned")}</option>
              {responsibleOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} - {option.meta}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              {isTechnicalCategory(values.category)
                ? t("tickets.form.techCategoryHint", { zone: zone || t("tickets.form.noZoneDetected") })
                : t("tickets.form.billingCategoryHint")}
            </p>
          </div>
        )}

        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("title")}>{t("tickets.table.title")}</Label>
          <Input
            id={inputId("title")}
            name="title"
            value={values.title}
            onChange={handleChange("title")}
            ref={(node) => (fieldRefs.current.title = node)}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={describedBy("title")}
          />
          {errors.title && <span id={errorId("title")} className="text-xs text-rose-600" role="alert">{errors.title}</span>}
        </label>

        <label className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={inputId("description")}>{t("tickets.form.description")}</Label>
          <textarea
            id={inputId("description")}
            name="description"
            rows={4}
            value={values.description}
            onChange={handleChange("description")}
            className={textareaClass}
            ref={(node) => (fieldRefs.current.description = node)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("description")}
          />
          {errors.description && (
            <span id={errorId("description")} className="text-xs text-rose-600" role="alert">
              {errors.description}
            </span>
          )}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("priority")}>{t("tickets.table.priority")}</Label>
          <select
            id={inputId("priority")}
            name="priority"
            value={values.priority}
            onChange={handleSelectChange("priority")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.priority = node)}
            aria-invalid={Boolean(errors.priority)}
            aria-describedby={describedBy("priority")}
          >
            <option value="">{t("tickets.form.selectPriority")}</option>
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.priority && <span id={errorId("priority")} className="text-xs text-rose-600" role="alert">{errors.priority}</span>}
        </label>

        <label className="grid gap-1.5">
          <Label htmlFor={inputId("status")}>{t("tickets.table.status")}</Label>
          <select
            id={inputId("status")}
            name="status"
            value={values.status}
            onChange={handleSelectChange("status")}
            className={selectClass}
            ref={(node) => (fieldRefs.current.status = node)}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={describedBy("status")}
          >
            <option value="">{t("tickets.form.selectStatus")}</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.key)}
              </option>
            ))}
          </select>
          {errors.status && <span id={errorId("status")} className="text-xs text-rose-600" role="alert">{errors.status}</span>}
        </label>
      </div>

      {allowAttachment && (
        <div className="grid gap-2 rounded-xl border border-border/70 bg-muted/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor={attachmentInputId}>{t("tickets.form.attachment")}</Label>
            <span className="text-xs text-muted-foreground">{t("tickets.form.attachmentHint")}</span>
          </div>
          <Input
            id={attachmentInputId}
            type="file"
            accept={TICKET_ATTACHMENT_ACCEPT}
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? [])
              setAttachments(files)
              if (files.length === 0) {
                setAttachmentError("")
                return
              }
              if (files.length > MAX_TICKET_ATTACHMENT_COUNT) {
                setAttachmentError(t("tickets.form.error.attachmentCount", { count: MAX_TICKET_ATTACHMENT_COUNT }))
                return
              }
              if (files.some((file) => !isAllowedTicketAttachment(file))) {
                setAttachmentError(t("tickets.form.error.attachmentType"))
                return
              }
              if (files.some((file) => file.size > MAX_TICKET_ATTACHMENT_BYTES)) {
                setAttachmentError(t("tickets.form.error.attachmentSize"))
                return
              }
              setAttachmentError("")
            }}
          />
          {attachments.length > 0 ? (
            <ul className="grid gap-1 text-xs text-muted-foreground">
              {attachments.map((file) => (
                <li key={`${file.name}-${file.size}`} className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{file.name}</span>
                  <span>·</span>
                  <span>{formatTicketAttachmentSize(file.size)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {attachmentError ? (
            <p className="text-xs font-medium text-rose-600" role="alert">
              {attachmentError}
            </p>
          ) : null}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2">
        <Button type="submit">{submitLabel === "Guardar" ? t("common.save") : submitLabel}</Button>
      </div>
    </form>
  )
}

export default TicketForm
