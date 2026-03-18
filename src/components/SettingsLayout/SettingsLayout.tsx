import { ReactNode } from 'react'
import { Link, useLocation } from '@tanstack/react-router'

type SettingsTab = 'notifications' | 'profile' | 'display'

interface SettingsLayoutProps {
  children?: ReactNode
}

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation()

  const tabs: Array<{
    id: SettingsTab
    label: string
    icon: string
    href: string
  }> = [
    { id: 'notifications', label: 'Notifications', icon: '🔔', href: '/settings/notifications' },
    { id: 'profile', label: 'Profile', icon: '👤', href: '/settings/profile' },
    { id: 'display', label: 'Display', icon: '⚙️', href: '/settings/display' },
  ]

  const getActiveTab = (): SettingsTab | null => {
    const pathname = location.pathname
    if (pathname.includes('notifications')) return 'notifications'
    if (pathname.includes('profile')) return 'profile'
    if (pathname.includes('display')) return 'display'
    return 'notifications'
  }

  const activeTab = getActiveTab()

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
              <Link
                key={tab.id}
                to={tab.href}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-800">
          {children}
        </div>
      </div>
    </div>
  )
}
