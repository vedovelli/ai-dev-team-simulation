import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/settings/notifications')({
  component: NotificationSettingsPage,
})

function NotificationSettingsPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
      <div className="text-slate-400">
        <p>Notification preferences content will be implemented by Ana.</p>
      </div>
    </div>
  )
}
