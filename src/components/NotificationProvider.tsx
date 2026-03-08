import { ToastProvider } from './Toast'

/**
 * Notification System Provider
 *
 * Wraps the application with the Toast provider for transient notifications.
 * This provider enables all components to show success/error/warning/info messages.
 *
 * Usage:
 * Wrap your app root with this provider:
 *
 * ```tsx
 * <NotificationProvider>
 *   <App />
 * </NotificationProvider>
 * ```
 *
 * Then use the useNotification hook in any component:
 *
 * ```tsx
 * import { useNotification } from '@/hooks'
 *
 * function MyComponent() {
 *   const { success, error } = useNotification()
 *
 *   return <button onClick={() => success('Done!')}>Click me</button>
 * }
 * ```
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
