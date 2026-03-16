import { Outlet } from '@tanstack/react-router'
import { NotificationCenter, NotificationBadge } from '../../components/NotificationCenter'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'

/**
 * DashboardLayout - Main dashboard container with navigation
 *
 * This is the root layout for the sprint management dashboard.
 * It provides the main navigation structure and wraps child routes.
 * Manages notification center state and passes real-time unread count to NotificationBadge.
 */
export function DashboardLayout() {
  const { isOpen, toggleDropdown, closeDropdown, unreadCount, isLoading } = useNotificationCenter()

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Sprint Management Dashboard</h1>
            <p className="text-sm text-slate-400 mt-1">Manage and track sprint progress across teams</p>
          </div>

          {/* Header Actions */}
          <div className="relative">
            <NotificationBadge
              unreadCount={unreadCount}
              onClick={toggleDropdown}
              isOpen={isOpen}
              isLoading={isLoading}
            />
            <NotificationCenter isOpen={isOpen} onClose={closeDropdown} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
