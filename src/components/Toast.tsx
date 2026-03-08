import { createContext, useContext, useState, useRef, useEffect } from 'react'
import React from 'react'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void
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
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setExitingToasts((prev) => new Set(prev))

    // Auto-remove after 5 seconds
    const timeoutId = setTimeout(() => {
      setExitingToasts((prev) => new Set(prev).add(id))
      const removeTimeoutId = setTimeout(() => removeToast(id), 300)
      timeoutRefs.current.set(id, removeTimeoutId)
    }, 5000)
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
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <style>{toastAnimationStyles}</style>
      <div className="fixed bottom-4 right-4 space-y-2 z-50" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => {
          const colorClasses = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            warning: 'bg-amber-500',
            info: 'bg-blue-500',
          }

          return (
            <div
              key={toast.id}
              className={`px-4 py-3 rounded-lg text-white font-medium ${
                colorClasses[toast.type]
              } ${
                exitingToasts.has(toast.id) ? 'toast-exit' : 'toast-enter'
              } transition-all duration-300 cursor-pointer hover:shadow-lg`}
              role="alert"
              onClick={() => removeToast(toast.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  removeToast(toast.id)
                }
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span>{toast.message}</span>
                <span className="text-xs opacity-60">Press Escape to dismiss all</span>
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
  return context
}
