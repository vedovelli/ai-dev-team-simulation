import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Teams', href: '/teams' },
  { label: 'Kanban Board', href: '/kanban' },
  { label: 'Activity Feed', href: '/feed' },
  { label: 'Create', href: '/create' },
  { label: 'Agents', href: '/agents' },
  { label: 'Sprints', href: '/sprints' },
  { label: 'Workload Dashboard', href: '/dashboard/workload' },
  { label: 'Search & Filters', href: '/search-filters' },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-white lg:hidden hover:bg-slate-700 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo area */}
          <div className="px-6 py-8 border-b border-slate-800">
            <h1 className="text-xl font-bold text-white">AI Dev Team</h1>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-lg transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white font-semibold shadow-lg'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer area */}
          <div className="px-6 py-4 border-t border-slate-800">
            <p className="text-xs text-slate-500">v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
