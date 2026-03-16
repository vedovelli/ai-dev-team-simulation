import { createPortal } from 'react-dom'
import { useToastContext } from '../../contexts/ToastContext'
import { NotificationToast } from './NotificationToast'

/**
 * Portal-based toast container component
 *
 * Features:
 * - Renders toasts from ToastContext as a portal (outside normal DOM tree)
 * - Positioned bottom-right corner with fixed positioning
 * - Stacks toasts vertically with proper spacing
 * - Accessible with ARIA live region
 * - Max 3 visible toasts (configurable via ToastProvider)
 *
 * Must be used within ToastProvider.
 *
 * @example
 * <ToastProvider maxVisible={3}>
 *   <App />
 *   <ToastContainer />
 * </ToastProvider>
 */
export function ToastContainer() {
  const { toasts, dismissToast } = useToastContext()

  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-50 pointer-events-none"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
      aria-atomic="false"
    >
      <div className="flex flex-col gap-2 pointer-events-auto">
        {toasts.map((toast) => (
          <NotificationToast
            key={toast.id}
            notification={toast.notification}
            onDismiss={() => dismissToast(toast.id)}
            autoDismissMs={6000}
          />
        ))}
      </div>
    </div>,
    document.body
  )
}
