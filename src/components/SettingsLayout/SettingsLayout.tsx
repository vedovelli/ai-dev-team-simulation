import { useState } from 'react'
import { NotificationPreferencesForm } from '../NotificationPreferencesForm/NotificationPreferencesForm'

type SettingsTab = 'notifications' | 'account' | 'profile'

interface SettingsLayoutProps {
  onTabChange?: (tab: SettingsTab) => void
}

export function SettingsLayout({ onTabChange }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications')

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  const tabs: Array<{
    id: SettingsTab
    label: string
    icon: string
  }> = [
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'account', label: 'Account', icon: '👤' },
    { id: 'profile', label: 'Profile', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your preferences and account settings</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 mb-6">
          <div className="flex gap-0 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
              <NotificationPreferencesForm />
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Account Settings</h2>
              <div className="text-slate-400">
                <p>Account settings coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
              <div className="text-slate-400">
                <p>Profile settings coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
