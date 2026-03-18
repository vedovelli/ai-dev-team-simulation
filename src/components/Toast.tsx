import { createContext, useContext, useState, useRef, useEffect } from 'react'
import React from 'react'

interface ToastAction {
  label: string
  onClick: () => void
}

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  action?: ToastAction
  duration?: number
}

interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: ToastAction
}

interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
  toast: (message: string, options?: ToastOptions) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const toastAnimationStyles = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideOutDown {
    from {
      opacity: 1;
      transform: translateY(0);
    }
    to {
      opacity: 0;
      transform: translateY(16px);
    }
  }

  .toast-enter {
    animation: slideInUp 0.3s ease-out;
  }

  .toast-exit {
    animation: slideOutDown 0.3s ease-in;
  }
`

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [exitingToasts, setExitingToasts] = useState<Set<string>>(new Set())
  const timeoutRefs = React.useRef<Map<string, NodeJS.Timeout>>(new Map())

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    toast(message, { type })
  }

  const toast = (message: string, options?: ToastOptions) => {
    const {
      type = 'success',
      duration = 4000,
      action,
    } = options || {}

    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type, action, duration }])
    setExitingToasts((prev) => new Set(prev))

    // Auto-remove after specified duration
    const timeoutId = setTimeout(() => {
      setExitingToasts((prev) => new Set(prev).add(id))
      const removeTimeoutId = setTimeout(() => removeToast(id), 300)
      timeoutRefs.current.set(id, removeTimeoutId)
    }, duration)
    timeoutRefs.current.set(id, timeoutId)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    setExitingToasts((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    const timeout = timeoutRefs.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      timeoutRefs.current.delete(id)
    }
  }

  // Handle Escape key to dismiss all toasts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && toasts.length > 0) {
        // Dismiss all toasts
        toasts.forEach((toast) => {
          setExitingToasts((prev) => new Set(prev).add(toast.id))
        })
        setTimeout(() => {
          setToasts([])
          timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
          timeoutRefs.current.clear()
        }, 300)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toasts])

  return (
    <ToastContext.Provider value={{ toasts, showToast, toast, removeToast }}>
      {children}
      <style>{toastAnimationStyles}</style>
      <div className="fixed bottom-4 right-4 space-y-2 z-50" role="region" aria-live="polite" aria-atomic="false" aria-label="Notifications">
        {toasts.map((toastItem) => {
          const colorClasses = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-amber-500',
            info: 'bg-blue-500',
          }

          return (
            <div
              key={toastItem.id}
              className={`px-4 py-3 rounded-lg text-white font-medium ${
                colorClasses[toastItem.type]
              } ${
                exitingToasts.has(toastItem.id) ? 'toast-exit' : 'toast-enter'
              } transition-all duration-300 hover:shadow-lg`}
              role="alert"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  removeToast(toastItem.id)
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{toastItem.message}</span>
                <div className="flex items-center gap-2">
                  {toastItem.action && (
                    <button
                      onClick={toastItem.action.onClick}
                      className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                      type="button"
                    >
                      {toastItem.action.label}
                    </button>
                  )}
                  <button
                    onClick={() => removeToast(toastItem.id)}
                    className="text-lg leading-none hover:opacity-70 transition-opacity cursor-pointer"
                    type="button"
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return {
    success: (message: string, action?: ToastAction) =>
      context.toast(message, { type: 'success', action }),
    error: (message: string, action?: ToastAction) =>
      context.toast(message, { type: 'error', action }),
    warning: (message: string, action?: ToastAction) =>
      context.toast(message, { type: 'warning', action }),
    info: (message: string, action?: ToastAction) =>
      context.toast(message, { type: 'info', action }),
    toast: context.toast,
  }
}
