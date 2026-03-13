import { createFileRoute } from '@tanstack/react-router'
import { NotificationPreferencesForm } from '../components/NotificationPreferences'

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Manage your notification preferences and settings</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-6 text-lg font-semibold text-gray-900">Notification Preferences</h2>
        <NotificationPreferencesForm />
      </div>
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})
