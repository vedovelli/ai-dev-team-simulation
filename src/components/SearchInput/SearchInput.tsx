import React, { useCallback, ChangeEvent } from 'react'

export interface SearchInputProps {
  /**
   * Current search value (can be debounced or raw)
   */
  value: string
  /**
   * Callback when search value changes
   */
  onChange: (value: string) => void
  /**
   * Placeholder text
   */
  placeholder?: string
  /**
   * Additional CSS classes
   */
  className?: string
  /**
   * Whether input is disabled
   */
  disabled?: boolean
  /**
   * Callback to clear search
   */
  onClear?: () => void
  /**
   * Show clear button
   */
  showClear?: boolean
}

/**
 * Debounced search input component
 * Provides immediate visual feedback while debouncing API calls
 *
 * @example
 * ```tsx
 * const { search, setSearch, clearFilter } = useFilters()
 *
 * <SearchInput
 *   value={search}
 *   onChange={setSearch}
 *   onClear={() => clearFilter('search')}
 *   placeholder="Search agents..."
 *   showClear={search.length > 0}
 * />
 * ```
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  disabled = false,
  onClear,
  showClear = false,
}: SearchInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    },
    [onChange]
  )

  const handleClear = useCallback(() => {
    onChange('')
    onClear?.()
  }, [onChange, onClear])

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        aria-label={placeholder}
      />
      {showClear && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Clear search"
          type="button"
        >
          ✕
        </button>
      )}
    </div>
  )
}
