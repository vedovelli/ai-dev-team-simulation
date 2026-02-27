import { Outlet } from '@tanstack/react-router'
import { Navigation } from './Navigation'

export function RootLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">AI Dev Team</h1>
        </div>
        <Navigation />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
