import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { CheckCircle2, Info, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentLocale } from "@/i18n/locale"
import { translateWithLocale } from "@/i18n/translations"

type ToastType = "success" | "error" | "info"

interface ToastPayload {
  title: string
  description?: string
  type?: ToastType
  durationMs?: number
}

interface ToastItem extends Required<Omit<ToastPayload, "durationMs">> {
  id: string
  durationMs: number
}

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

interface ConfirmState extends Required<ConfirmOptions> {
  open: boolean
}

interface UIContextValue {
  notify: (payload: ToastPayload) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const UIContext = createContext<UIContextValue | null>(null)

const toastTypeClasses: Record<ToastType, string> = {
  success: "border-emerald-500/35 bg-emerald-500/10",
  error: "border-rose-500/35 bg-rose-500/10",
  info: "border-sky-500/35 bg-sky-500/10",
}

const toastTypeIcon: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
}

const toastTypeIconClasses: Record<ToastType, string> = {
  success: "text-emerald-500",
  error: "text-rose-500",
  info: "text-sky-500",
}

const initialConfirmState: ConfirmState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: translateWithLocale(getCurrentLocale(), "common.confirm"),
  cancelLabel: translateWithLocale(getCurrentLocale(), "common.cancel"),
}

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState>(initialConfirmState)
  const confirmResolverRef = useRef<((value: boolean) => void) | null>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)

  const notify = useCallback((payload: ToastPayload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const toast: ToastItem = {
      id,
      title: payload.title,
      description: payload.description ?? "",
      type: payload.type ?? "info",
      durationMs: payload.durationMs ?? 3000,
    }

    setToasts((current) => [...current, toast])

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, toast.durationMs)
  }, [])

  const confirm = useCallback((options: ConfirmOptions) => {
    previousFocusedElementRef.current = document.activeElement as HTMLElement | null
    setConfirmState({
      open: true,
      title: options.title,
      description: options.description ?? "",
      confirmLabel: options.confirmLabel ?? translateWithLocale(getCurrentLocale(), "common.confirm"),
      cancelLabel: options.cancelLabel ?? translateWithLocale(getCurrentLocale(), "common.cancel"),
    })

    return new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve
    })
  }, [])

  const closeConfirm = useCallback((result: boolean) => {
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result)
      confirmResolverRef.current = null
    }
    setConfirmState(initialConfirmState)
    window.setTimeout(() => {
      previousFocusedElementRef.current?.focus()
    }, 0)
  }, [])

  useEffect(() => {
    if (!confirmState.open) return

    window.setTimeout(() => {
      const cancelButton = document.getElementById("confirm-dialog-cancel")
      if (cancelButton instanceof HTMLElement) {
        cancelButton.focus()
      }
    }, 0)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeConfirm(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [confirmState.open, closeConfirm])

  const value = useMemo(() => ({ notify, confirm }), [notify, confirm])

  return (
    <UIContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] grid w-[min(24rem,calc(100vw-2rem))] gap-3"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((toast) => {
          const ToastIcon = toastTypeIcon[toast.type]
          return (
            <article
              key={toast.id}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl border p-3 shadow-[0_18px_45px_-24px_hsl(var(--foreground)/0.65)] ring-1 ring-border/50 backdrop-blur-md ${toastTypeClasses[toast.type]} animate-fade-up`}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 ${toastTypeIconClasses[toast.type]}`}>
                  <ToastIcon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{toast.title}</p>
                  {toast.description && <p className="mt-1 text-xs text-muted-foreground">{toast.description}</p>}
                </div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-black/5 dark:bg-white/10">
                <div
                  className={`h-full origin-left animate-toast-progress ${
                    toast.type === "success"
                      ? "bg-emerald-500/80"
                      : toast.type === "error"
                        ? "bg-rose-500/80"
                        : "bg-sky-500/80"
                  }`}
                  style={{ animationDuration: `${toast.durationMs}ms` }}
                />
              </div>
            </article>
          )
        })}
      </div>

      {confirmState.open && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-foreground/35 p-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
          >
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-foreground">{confirmState.title}</h3>
            {confirmState.description && (
              <p id="confirm-dialog-description" className="mt-2 text-sm text-muted-foreground">
                {confirmState.description}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button id="confirm-dialog-cancel" variant="outline" onClick={() => closeConfirm(false)}>
                {confirmState.cancelLabel}
              </Button>
              <Button onClick={() => closeConfirm(true)}>{confirmState.confirmLabel}</Button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error("useUI must be used within UIProvider")
  }
  return context
}
