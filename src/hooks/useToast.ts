import { useToast as useToastComponent } from '../components/Toast'

/**
 * Toast options for customizing toast behavior
 */
export interface ToastOptions {
  /** Duration in milliseconds before auto-dismiss (default: 4000) */
  duration?: number
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Custom hook for showing toast notifications
 *
 * Features:
 * - Simple API: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`
 * - Generic toast method: `toast.toast(message, options)`
 * - Support for action buttons (e.g., 'Undo')
 * - Configurable auto-dismiss duration
 * - Must be used within ToastProvider
 *
 * @example
 * ```tsx
 * const toast = useToast()
 *
 * // Simple usage
 * toast.success('Sprint created successfully!')
 * toast.error('Failed to create sprint')
 *
 * // With action button
 * toast.success('Task updated', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => { /* handle undo */ }
 *   }
 * })
 * ```
 */
export function useToast() {
  return useToastComponent()
}

export type UseToastReturn = ReturnType<typeof useToast>
