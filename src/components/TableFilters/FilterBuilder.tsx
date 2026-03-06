import { useState } from 'react'
import { FilterField } from './FilterField'
import type { FilterState, UseTableFiltersReturn } from '../../types/filters'

interface FilterBuilderProps {
  filters: UseTableFiltersReturn
  expandable?: boolean
  showPresets?: boolean
}

export function FilterBuilder({
  filters,
  expandable = true,
  showPresets = true,
}: FilterBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(!expandable)

  return (
    <div className="space-y-4">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
        >
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {expandable && (
            <span className="text-gray-400 text-lg">{isExpanded ? '−' : '+'}</span>
          )}
        </button>

        <div className="flex items-center gap-3">
          {filters.hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {filters.activeFilterCount} active
            </span>
          )}
          {filters.hasActiveFilters && (
            <button
              onClick={() => filters.clearFilters()}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
          {/* Presets section - if available and showPresets enabled */}
          {/* Presets would be rendered here if passed via filters context */}

          {/* Filter fields grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Note: Fields would be rendered dynamically based on the fields passed to useAdvancedTableFilters */}
            {/* This component is meant to be used with fields from the hook */}
          </div>

          {/* Individual filter field example structure */}
          {/* Filters would render here based on options.fields */}
        </div>
      )}
    </div>
  )
}

interface FilterBuilderWithFieldsProps extends FilterBuilderProps {
  children?: React.ReactNode
}

/**
 * FilterBuilder wrapper that accepts filter field components as children
 * This allows flexible composition of filter fields
 */
export function FilterBuilderWithFields({
  filters,
  expandable = true,
  showPresets = true,
  children,
}: FilterBuilderWithFieldsProps) {
  const [isExpanded, setIsExpanded] = useState(!expandable)

  return (
    <div className="space-y-4">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
        >
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          {expandable && (
            <span className="text-gray-400 text-lg">{isExpanded ? '−' : '+'}</span>
          )}
        </button>

        <div className="flex items-center gap-3">
          {filters.hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              {filters.activeFilterCount} active
            </span>
          )}
          {filters.hasActiveFilters && (
            <button
              onClick={() => filters.clearFilters()}
              className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter content */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
          {/* Render children (FilterField components) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}
