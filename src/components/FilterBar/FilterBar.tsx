import React, { useCallback } from 'react'
import { SearchInput } from '../SearchInput/SearchInput'
import type { FilterState } from '../../hooks/useFilters'

export interface FilterOption {
  label: string
  value: string
}

export interface FilterBarConfig {
  /**
   * Display label for the filter
   */
  label: string
  /**
   * Filter key (matches filterState key)
   */
  key: string
  /**
   * Type of filter
   */
  type: 'select' | 'search'
  /**
   * Options for select filters
   */
  options?: FilterOption[]
  /**
   * Placeholder text
   */
  placeholder?: string
}

export interface FilterBarProps {
  /**
   * Current filter state
   */
  filters: FilterState
  /**
   * Raw search input value (for immediate UI feedback)
   */
  rawSearch?: string
  /**
   * Filter configurations
   */
  config: FilterBarConfig[]
  /**
   * Callback to update single filter
   */
  onFilterChange: <K extends string>(key: K, value: unknown) => void
  /**
   * Callback to update search
   */
  onSearchChange?: (value: string) => void
  /**
   * Callback to clear filters
   */
  onClearFilters?: () => void
  /**
   * Whether filters are active
   */
  hasActiveFilters?: boolean
}

/**
 * Reusable filter bar component
 * Supports multiple filter types: search, select, multiselect
 *
 * @example
 * ```tsx
 * const agentFilterConfig: FilterBarConfig[] = [
 *   {
 *     label: 'Status',
 *     key: 'status',
 *     type: 'select',
 *     options: [
 *       { label: 'Active', value: 'active' },
 *       { label: 'Idle', value: 'idle' },
 *     ],
 *   },
 *   {
 *     label: 'Search',
 *     key: 'search',
 *     type: 'search',
 *     placeholder: 'Search agents...',
 *   },
 * ]
 *
 * <FilterBar
 *   filters={filters}
 *   rawSearch={rawSearch}
 *   config={agentFilterConfig}
 *   onFilterChange={setFilter}
 *   onSearchChange={setSearch}
 *   onClearFilters={clearFilters}
 *   hasActiveFilters={hasActiveFilters}
 * />
 * ```
 */
export function FilterBar({
  filters,
  rawSearch = '',
  config,
  onFilterChange,
  onSearchChange,
  onClearFilters,
  hasActiveFilters = false,
}: FilterBarProps) {
  const handleSelectChange = useCallback(
    (key: string, value: string) => {
      onFilterChange(key, value || null)
    },
    [onFilterChange]
  )

  const handleClearSearch = useCallback(() => {
    onSearchChange?.('')
    onFilterChange('search', null)
  }, [onFilterChange, onSearchChange])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
        {config.map((filterConfig) => {
          if (filterConfig.type === 'search') {
            return (
              <div key={filterConfig.key} className="flex-1 min-w-0">
                <SearchInput
                  value={rawSearch}
                  onChange={onSearchChange || (() => {})}
                  placeholder={filterConfig.placeholder || 'Search...'}
                  showClear={rawSearch.length > 0}
                  onClear={handleClearSearch}
                />
              </div>
            )
          }

          if (filterConfig.type === 'select') {
            const currentValue = filters[filterConfig.key] as string | undefined
            return (
              <div key={filterConfig.key} className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filterConfig.label}
                </label>
                <select
                  value={currentValue || ''}
                  onChange={(e) => handleSelectChange(filterConfig.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={filterConfig.label}
                >
                  <option value="">All {filterConfig.label}</option>
                  {filterConfig.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )
          }

          return null
        })}

        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
