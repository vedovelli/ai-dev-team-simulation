import { Link, useLocation } from '@tanstack/react-router'

interface NavItem {
  label: string
  href: string
  icon: string
}

const navItems: NavItem[] = [
  { label: 'Agents', href: '/agents', icon: '👥' },
  { label: 'Tasks', href: '/tasks', icon: '✓' },
  { label: 'Sprint Board', href: '/sprint-board', icon: '📋' },
  { label: 'Live Feed', href: '/live-feed', icon: '📡' },
]

export function Navigation() {
  const location = useLocation()

  return (
    <nav className="w-64 bg-slate-800 border-r border-slate-700 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-white">AI Dev Team</h1>
      </div>

      <div className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="p-4 border-t border-slate-700 text-xs text-slate-400">
        <p>v1.0.0</p>
      </div>
    </nav>
  )
}
