import { useCallback } from 'react'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterControlsProps {
  filters: Record<string, string | undefined>
  onFilterChange: (key: string, value: string | undefined) => void
  filterConfigs: Array<{
    key: string
    label: string
    options: FilterOption[]
  }>
  disabled?: boolean
}

/**
 * Dropdown filter controls for table filtering.
 * Supports multiple independent filter dimensions.
 */
export function FilterControls({
  filters,
  onFilterChange,
  filterConfigs,
  disabled = false,
}: FilterControlsProps) {
  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      onFilterChange(key, value === '' ? undefined : value)
    },
    [onFilterChange]
  )

  return (
    <div className="flex flex-wrap gap-3">
      {filterConfigs.map((config) => (
        <select
          key={config.key}
          value={filters[config.key] ?? ''}
          onChange={(e) => handleFilterChange(config.key, e.target.value)}
          disabled={disabled}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={config.label}
        >
          <option value="">{config.label}</option>
          {config.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}
