import { useAdvancedTableFilters } from '../../hooks/useAdvancedTableFilters'
import { FilterField } from './FilterField'
import { FilterBuilderWithFields } from './FilterBuilder'
import type { FilterFieldDefinition, FilterPreset } from '../../types/filters'

// Example filter field definitions
const TASK_FILTER_FIELDS: FilterFieldDefinition[] = [
  {
    name: 'search',
    label: 'Search',
    type: 'text',
    defaultValue: '',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'multiselect',
    options: [
      { value: 'backlog', label: 'Backlog' },
      { value: 'in-progress', label: 'In Progress' },
      { value: 'in-review', label: 'In Review' },
      { value: 'done', label: 'Done' },
    ],
  },
  {
    name: 'priority',
    label: 'Priority',
    type: 'multiselect',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  },
  {
    name: 'team',
    label: 'Team',
    type: 'select',
    options: [
      { value: 'frontend', label: 'Frontend' },
      { value: 'backend', label: 'Backend' },
      { value: 'devops', label: 'DevOps' },
    ],
  },
  {
    name: 'assignee',
    label: 'Assignee',
    type: 'select',
    options: [
      { value: 'alice', label: 'Alice' },
      { value: 'bob', label: 'Bob' },
      { value: 'charlie', label: 'Charlie' },
    ],
  },
  {
    name: 'createdAt',
    label: 'Created Date',
    type: 'daterange',
  },
]

// Example filter presets
const TASK_FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'my-tasks',
    label: 'My Tasks',
    filters: {
      status: ['in-progress', 'in-review'],
    },
  },
  {
    name: 'urgent-items',
    label: 'Urgent Items',
    filters: {
      priority: ['high'],
      status: ['backlog', 'in-progress'],
    },
  },
  {
    name: 'completed-this-week',
    label: 'Completed This Week',
    filters: {
      status: ['done'],
      createdAt: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
    },
  },
]

/**
 * Example component demonstrating FilterBuilder with filter presets
 * This shows how to compose the filter system for a task list
 */
export function FilterBuilderExample() {
  const filters = useAdvancedTableFilters({
    fields: TASK_FILTER_FIELDS,
    presets: TASK_FILTER_PRESETS,
  })

  return (
    <div className="space-y-4">
      {/* Presets bar */}
      {TASK_FILTER_PRESETS.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</h3>
          <div className="flex flex-wrap gap-2">
            {TASK_FILTER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => filters.applyPreset(preset.name)}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter builder with dynamic fields */}
      <FilterBuilderWithFields filters={filters} expandable={true}>
        {TASK_FILTER_FIELDS.map((field) => (
          <FilterField
            key={field.name}
            field={field}
            value={filters.filters[field.name]}
            onChange={filters.updateFilter}
          />
        ))}
      </FilterBuilderWithFields>

      {/* Debug: Show active filters */}
      {filters.hasActiveFilters && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Active Filters</h4>
          <pre className="text-xs text-blue-800 overflow-auto">
            {JSON.stringify(filters.filters, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
