import { Link, useLocation } from '@tanstack/react-router'
import { ReactNode } from 'react'

interface SettingsLayoutProps {
  children?: ReactNode
}

/**
 * Settings Layout Component
 * Provides a shared layout with sidebar navigation for all settings pages
 * Routes to /settings/profile, /settings/notifications, /settings/display
 */
export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation()

  const navItems = [
    { label: 'Profile', icon: '👤', href: '/settings/profile' },
    { label: 'Notifications', icon: '🔔', href: '/settings/notifications' },
    { label: 'Display', icon: '⚙️', href: '/settings/display' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your preferences and account settings</p>
        </div>

        {/* Main Content with Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="md:col-span-1">
            <nav className="bg-slate-900 rounded-lg p-6 border border-slate-800 sticky top-8">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive(item.href)
                          ? 'bg-blue-500/10 border border-blue-500 text-blue-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="md:col-span-3">
            <div className="bg-slate-900 rounded-lg p-8 border border-slate-800">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
