import { createFileRoute } from '@tanstack/react-router'
import { NotificationSettingsPage } from '../pages/NotificationSettingsPage'

export const Route = createFileRoute('/notification-settings')({
  component: NotificationSettingsPage,
})
