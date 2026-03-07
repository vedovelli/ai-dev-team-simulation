import { useNotificationContext } from '../../contexts/NotificationContext'
import { NotificationBanner } from '../NotificationBanner'
import { NotificationToast } from '../NotificationToast'

interface NotificationContainerProps {
  position?: 'top-right' | 'bottom-right' | 'top-center' | 'bottom-center'
}

export function NotificationContainer({
  position = 'bottom-right',
}: NotificationContainerProps) {
  const { notifications, removeNotification, markAsRead, markAllAsRead } =
    useNotificationContext()

  // Filter toast notifications (those that are typically from toast API)
  const toastNotifications = notifications.filter((n) => !n.category)
  // Filter banner notifications (those with persistent categories)
  const bannerNotifications = notifications.filter((n) => n.category)

  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'top-center': 'fixed top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'fixed bottom-4 left-1/2 -translate-x-1/2',
  }

  return (
    <>
      {/* Toast notifications container */}
      <div className={`${positionClasses[position]} z-50 space-y-2 pointer-events-none max-w-sm`}>
        {toastNotifications.map((notification) => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationToast
              id={notification.id}
              message={notification.message}
              type={notification.type}
              onDismiss={removeNotification}
            />
          </div>
        ))}
      </div>

      {/* Banner notifications (typically shown separately in layout) */}
      {bannerNotifications.length > 0 && (
        <NotificationBanner
          notifications={bannerNotifications}
          onMarkAllAsRead={markAllAsRead}
        />
      )}
    </>
  )
}
