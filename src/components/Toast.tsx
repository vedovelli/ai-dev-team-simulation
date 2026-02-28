import { createContext, useContext, useState } from 'react'

interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastContextType {
  toasts: ToastMessage[]
  showToast: (message: string, type: 'success' | 'error') => void
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = `toast-${Date.now()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setExitingToasts((prev) => new Set(prev))

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setExitingToasts((prev) => new Set(prev).add(id))
      setTimeout(() => removeToast(id), 300)
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
    setExitingToasts((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <style>{toastAnimationStyles}</style>
      <div className="fixed bottom-4 right-4 space-y-2 z-50" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg text-white font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-500'
                : 'bg-red-500'
            } ${
              exitingToasts.has(toast.id) ? 'toast-exit' : 'toast-enter'
            } transition-all duration-300`}
            role="alert"
          >
            {toast.message}
          </div>
        ))}
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
