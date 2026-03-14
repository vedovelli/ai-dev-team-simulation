import { createFileRoute } from '@tanstack/react-router'
import { NotificationCenterModal } from '../components/NotificationCenter'

/* eslint-disable react-refresh/only-export-components */
function NotificationsRoute() {
  return (
    <NotificationCenterModal
      isOpen={true}
      onClose={() => {
        window.history.back()
      }}
    />
  )
}

export const Route = createFileRoute('/notifications')({
  component: NotificationsRoute,
})
