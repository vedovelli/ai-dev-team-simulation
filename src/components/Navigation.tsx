import { useLocation } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'

const navItems = [
  { label: 'Agents', href: '/agents' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Sprint Board', href: '/sprint-board' },
  { label: 'Live Feed', href: '/live-feed' },
]

export function Navigation() {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <nav className="flex flex-col gap-2 py-4">
      {navItems.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPath === item.href
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
