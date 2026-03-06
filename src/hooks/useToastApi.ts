/**
 * Enhanced useToast hook API
 * Provides convenient methods for different toast notification types
 */

import { useToast as useToastContext } from '../components/Toast'

export const useToastApi = () => {
  const { showToast } = useToastContext()

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
    info: (message: string) => showToast(message, 'info'),
  }
}
