import { createFileRoute } from '@tanstack/react-router'
import { NotificationPreferencesForm } from '../components/NotificationPreferences'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Settings Navigation Tabs */}
        <div className="mb-8 border-b border-slate-700">
          <nav className="flex gap-8">
            <div className="border-b-2 border-blue-600 pb-4">
              <a href="#" className="text-white font-medium">
                Notifications
              </a>
            </div>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-8">
          <NotificationPreferencesForm />
        </div>
      </div>
    </div>
  )
}
