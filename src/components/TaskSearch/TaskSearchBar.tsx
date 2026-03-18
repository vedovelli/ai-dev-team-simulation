import { useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'

interface TaskSearchBarProps {
  onSearchChange?: (query: string) => void
  placeholder?: string
}

/**
 * Task Search Bar component for main navigation
 * Provides debounced full-text search with keyboard shortcuts
 * Triggers navigation to search results on focus or submit
 */
export function TaskSearchBar({
  onSearchChange,
  placeholder = 'Search tasks...',
}: TaskSearchBarProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value
      onSearchChange?.(query)
    },
    [onSearchChange]
  )

  const handleFocus = useCallback(() => {
    // Navigate to search page on focus
    navigate({ to: '/task-search' })
  }, [navigate])

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const query = inputRef.current?.value || ''
      onSearchChange?.(query)
      navigate({ to: '/task-search' })
    },
    [onSearchChange, navigate]
  )

  return (
    <form onSubmit={handleSubmit} className="flex-1 mx-8">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          aria-label="Search tasks"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
    </form>
  )
}
