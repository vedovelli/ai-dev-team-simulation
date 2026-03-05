import { useCallback } from 'react'
import { useSearch } from '../hooks/useSearch'

interface SearchInputProps {
  value?: string
  placeholder?: string
  onSearchChange?: (value: string) => void
  isLoading?: boolean
  onClear?: () => void
  debounceDelay?: number
}

export function SearchInput({
  value = '',
  placeholder = 'Search...',
  onSearchChange,
  isLoading = false,
  onClear,
  debounceDelay = 300,
}: SearchInputProps) {
  const { localValue, handleChange } = useSearch(
    value,
    onSearchChange,
    debounceDelay
  )

  const handleClear = useCallback(() => {
    handleChange('')
    onClear?.()
  }, [handleChange, onClear])

  return (
    <div className="relative flex items-center w-full">
      <div className="absolute left-3 text-slate-400">
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
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      />
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute right-3 text-slate-400 hover:text-slate-300 transition-colors"
          aria-label="Clear search"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
      {isLoading && (
        <div className="absolute right-10 text-slate-400">
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </div>
      )}
    </div>
  )
}
