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
import { Button } from "@/components/ui/button"

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
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
}

const initialConfirmState: ConfirmState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "Confirmar",
  cancelLabel: "Cancelar",
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
      confirmLabel: options.confirmLabel ?? "Confirmar",
      cancelLabel: options.cancelLabel ?? "Cancelar",
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

      <div className="pointer-events-none fixed right-4 top-4 z-[60] grid max-w-sm gap-2" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <article
            key={toast.id}
            className={`pointer-events-auto rounded-xl border p-3 shadow-lg ${toastTypeClasses[toast.type]}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.description && <p className="mt-1 text-xs opacity-90">{toast.description}</p>}
          </article>
        ))}
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
