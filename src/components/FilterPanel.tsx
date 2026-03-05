import { useMemo } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  id: string
  label: string
  type: 'select' | 'checkbox-group' | 'date-range'
  options?: FilterOption[]
  value?: string | string[] | { from?: string; to?: string }
  onChange: (value: string | string[] | { from?: string; to?: string } | null) => void
}

interface FilterPanelProps {
  filters: FilterConfig[]
  onClearAll?: () => void
  isCompact?: boolean
}

export function FilterPanel({
  filters,
  onClearAll,
  isCompact = false,
}: FilterPanelProps) {
  const activeFilterCount = useMemo(() => {
    return filters.filter((filter) => {
      const value = filter.value
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) {
        return value.from || value.to
      }
      return !!value
    }).length
  }, [filters])

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className={`bg-slate-800 rounded-lg border border-slate-700 ${isCompact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-300">
              {activeFilterCount} active
            </span>
          )}
          {hasActiveFilters && onClearAll && (
            <button
              onClick={onClearAll}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div
        className={`grid gap-4 ${isCompact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}
      >
        {filters.map((filter) => (
          <div key={filter.id}>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {filter.label}
            </label>

            {filter.type === 'select' && (
              <select
                value={filter.value as string}
                onChange={(e) =>
                  filter.onChange(e.target.value || null)
                }
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="">All</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {filter.type === 'checkbox-group' && (
              <div className="space-y-2">
                {filter.options?.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        Array.isArray(filter.value)
                          ? filter.value.includes(opt.value)
                          : false
                      }
                      onChange={(e) => {
                        const current = Array.isArray(filter.value)
                          ? filter.value
                          : []
                        const updated = e.target.checked
                          ? [...current, opt.value]
                          : current.filter((v) => v !== opt.value)
                        filter.onChange(updated.length > 0 ? updated : null)
                      }}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-1 cursor-pointer"
                    />
                    <span className="text-sm text-slate-300 cursor-pointer">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            )}

            {filter.type === 'date-range' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={
                    typeof filter.value === 'object' && filter.value
                      ? filter.value.from || ''
                      : ''
                  }
                  onChange={(e) => {
                    const current =
                      typeof filter.value === 'object' && filter.value
                        ? filter.value
                        : {}
                    const updated = {
                      ...current,
                      from: e.target.value || undefined,
                    }
                    filter.onChange(
                      updated.from || updated.to ? updated : null
                    )
                  }}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="From"
                />
                <input
                  type="date"
                  value={
                    typeof filter.value === 'object' && filter.value
                      ? filter.value.to || ''
                      : ''
                  }
                  onChange={(e) => {
                    const current =
                      typeof filter.value === 'object' && filter.value
                        ? filter.value
                        : {}
                    const updated = {
                      ...current,
                      to: e.target.value || undefined,
                    }
                    filter.onChange(
                      updated.from || updated.to ? updated : null
                    )
                  }}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="To"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
