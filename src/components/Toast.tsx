import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Check } from 'lucide-react'

interface Toast {
  id: number
  message: string
}

interface ToastApi {
  show: (message: string) => void
}

const ToastContext = createContext<ToastApi>({ show: () => undefined })

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string) => {
    toastId += 1
    const id = toastId
    setToasts((prev) => [...prev, { id, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 2600)
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            <Check size={16} aria-hidden />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  return useContext(ToastContext)
}
