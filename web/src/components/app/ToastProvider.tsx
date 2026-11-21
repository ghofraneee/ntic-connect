import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ToastContext, type ToastKind } from './ToastContext'

type ToastMessage = {
  id: number
  message: string
  kind: ToastKind
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const nextId = useRef(0)
  const timeoutId = useRef<number | null>(null)

  const dismissToast = useCallback(() => {
    if (timeoutId.current !== null) {
      window.clearTimeout(timeoutId.current)
      timeoutId.current = null
    }
    setToast(null)
  }, [])

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      if (timeoutId.current !== null) window.clearTimeout(timeoutId.current)
      setToast({ id: ++nextId.current, message, kind })
      timeoutId.current = window.setTimeout(dismissToast, 3500)
    },
    [dismissToast],
  )

  useEffect(
    () => () => {
      if (timeoutId.current !== null) window.clearTimeout(timeoutId.current)
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          className={`app-toast app-toast--${toast.kind}`}
          role={toast.kind === 'error' ? 'alert' : 'status'}
          aria-live={toast.kind === 'error' ? 'assertive' : 'polite'}
          key={toast.id}
        >
          <span>{toast.message}</span>
          <button type="button" onClick={dismissToast} aria-label="Fermer">
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  )
}
