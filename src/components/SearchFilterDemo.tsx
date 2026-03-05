import { useMemo, useState, useCallback } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { SearchInput } from './SearchInput'
import { FilterPanel } from './FilterPanel'

interface FilterSearch {
  search?: string
  status?: string
  priority?: string
  team?: string
  dateFrom?: string
  dateTo?: string
}

export function SearchFilterDemo() {
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '__root__' }) as FilterSearch
  const [isSearching, setIsSearching] = useState(false)

  const handleSearchChange = useCallback(
    (value: string) => {
      setIsSearching(true)
      setTimeout(() => setIsSearching(false), 300)
      navigate({
        search: {
          ...searchParams,
          search: value || undefined,
        },
      })
    },
    [navigate, searchParams]
  )

  const handleFilterChange = useCallback(
    (key: keyof FilterSearch, value: string | null) => {
      navigate({
        search: {
          ...searchParams,
          [key]: value || undefined,
        },
      })
    },
    [navigate, searchParams]
  )

  const handleClearAll = useCallback(() => {
    navigate({
      search: {} as FilterSearch,
    })
  }, [navigate])

  const statusOptions = [
    { value: 'backlog', label: 'Backlog' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'in-review', label: 'In Review' },
    { value: 'done', label: 'Done' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ]

  const teamOptions = [
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'devops', label: 'DevOps' },
    { value: 'design', label: 'Design' },
  ]

  const filters = useMemo(
    () => [
      {
        id: 'status',
        label: 'Status',
        type: 'select' as const,
        options: statusOptions,
        value: searchParams.status || '',
        onChange: (value: string | string[] | { from?: string; to?: string } | null) =>
          handleFilterChange('status', value as string | null),
      },
      {
        id: 'priority',
        label: 'Priority',
        type: 'select' as const,
        options: priorityOptions,
        value: searchParams.priority || '',
        onChange: (value: string | string[] | { from?: string; to?: string } | null) =>
          handleFilterChange('priority', value as string | null),
      },
      {
        id: 'team',
        label: 'Team',
        type: 'checkbox-group' as const,
        options: teamOptions,
        value: searchParams.team
          ? searchParams.team.split(',').filter(Boolean)
          : [],
        onChange: (value: string | string[] | { from?: string; to?: string } | null) => {
          const teams = Array.isArray(value) ? value.join(',') : ''
          handleFilterChange('team', teams || null)
        },
      },
      {
        id: 'date-range',
        label: 'Date Range',
        type: 'date-range' as const,
        value: {
          from: searchParams.dateFrom,
          to: searchParams.dateTo,
        },
        onChange: (value: string | string[] | { from?: string; to?: string } | null) => {
          const dateRange = value as { from?: string; to?: string } | null
          if (dateRange?.from) {
            handleFilterChange('dateFrom', dateRange.from)
          } else {
            handleFilterChange('dateFrom', null)
          }
          if (dateRange?.to) {
            handleFilterChange('dateTo', dateRange.to)
          } else {
            handleFilterChange('dateTo', null)
          }
        },
      },
    ],
    [searchParams, handleFilterChange]
  )

  const activeFilterCount = Object.values(searchParams).filter(Boolean).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Search & Filter UI Demo
        </h1>
        <p className="text-slate-400">
          Built with TanStack Router v1 URL state synchronization
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Search
          </label>
          <SearchInput
            value={searchParams.search || ''}
            placeholder="Search by title, description..."
            onSearchChange={handleSearchChange}
            isLoading={isSearching}
            onClear={() => handleSearchChange('')}
            debounceDelay={300}
          />
        </div>

        <FilterPanel
          filters={filters}
          onClearAll={handleClearAll}
          isCompact={false}
        />
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Current State
        </h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-300 mb-2">
              URL Search Params:
            </p>
            <pre className="bg-slate-900 rounded p-3 text-sm text-slate-300 overflow-auto">
              {JSON.stringify(searchParams, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">
              Active Filters: {activeFilterCount}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mt-4">
              💡 Tip: Try sharing the URL with filters applied. The state will
              persist when the link is opened in another tab!
            </p>
          </div>
        </div>
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <p className="text-sm text-blue-200">
          <span className="font-semibold">✨ Features:</span>
          <ul className="mt-2 space-y-1 ml-4">
            <li>• Debounced search input with visual feedback</li>
            <li>• Multi-type filters (select, checkboxes, date range)</li>
            <li>• URL state synchronization</li>
            <li>• Shareable filter URLs</li>
            <li>• Persistent filter state on navigation</li>
            <li>• Clear visual indicators for active filters</li>
          </ul>
        </p>
      </div>
    </div>
  )
}
