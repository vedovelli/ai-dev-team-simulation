import { useCallback, useState } from 'react'
import type { TaskSearchFilters } from '../../types/task-search'

export interface SavedFilter {
  id: string
  name: string
  filters: TaskSearchFilters
  createdAt: string
}

interface SavedFiltersDropdownProps {
  savedFilters: SavedFilter[]
  onSelectFilter: (filters: TaskSearchFilters) => void
  onDeleteFilter?: (id: string) => void
}

/**
 * Dropdown menu to load saved filter sets by name
 */
export function SavedFiltersDropdown({
  savedFilters,
  onSelectFilter,
  onDeleteFilter,
}: SavedFiltersDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelectFilter = useCallback(
    (filters: TaskSearchFilters) => {
      onSelectFilter(filters)
      setIsOpen(false)
    },
    [onSelectFilter]
  )

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      onDeleteFilter?.(id)
    },
    [onDeleteFilter]
  )

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-colors flex items-center gap-2"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Saved filters"
      >
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
            d="M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z"
          />
        </svg>
        Saved Filters
        {savedFilters.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-900 rounded text-xs">
            {savedFilters.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          {savedFilters.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No saved filters yet
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {savedFilters.map((filter) => (
                <li key={filter.id}>
                  <button
                    onClick={() => handleSelectFilter(filter.filters)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-700 transition-colors flex items-center justify-between group"
                    aria-label={`Load ${filter.name} filters`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        {filter.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(filter.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {onDeleteFilter && (
                      <button
                        onClick={(e) => handleDelete(e, filter.id)}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-900/30 rounded transition-opacity"
                        aria-label={`Delete ${filter.name}`}
                      >
                        <svg
                          className="w-4 h-4 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
