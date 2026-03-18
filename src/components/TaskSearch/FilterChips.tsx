import type { TaskSearchFilters } from '../../types/task-search'

interface FilterChipsProps {
  filters: TaskSearchFilters
  onRemoveFilter: (key: keyof TaskSearchFilters) => void
  agentNames?: Record<string, string>
  sprintNames?: Record<string, string>
}

/**
 * Display active filter chips with click-to-remove functionality
 */
export function FilterChips({
  filters,
  onRemoveFilter,
  agentNames = {},
  sprintNames = {},
}: FilterChipsProps) {
  const chips: Array<{
    key: keyof TaskSearchFilters
    label: string
  }> = []

  if (filters.priority) {
    chips.push({
      key: 'priority',
      label: `Priority: ${filters.priority}`,
    })
  }

  if (filters.status) {
    chips.push({
      key: 'status',
      label: `Status: ${filters.status}`,
    })
  }

  if (filters.assignedAgent) {
    chips.push({
      key: 'assignedAgent',
      label: `Agent: ${agentNames[filters.assignedAgent] || filters.assignedAgent}`,
    })
  }

  if (filters.sprint) {
    chips.push({
      key: 'sprint',
      label: `Sprint: ${sprintNames[filters.sprint] || filters.sprint}`,
    })
  }

  if (filters.deadlineFrom || filters.deadlineTo) {
    const from = filters.deadlineFrom ? new Date(filters.deadlineFrom).toLocaleDateString() : 'any'
    const to = filters.deadlineTo ? new Date(filters.deadlineTo).toLocaleDateString() : 'any'
    chips.push({
      key: 'deadlineFrom',
      label: `Deadline: ${from} - ${to}`,
    })
  }

  if (chips.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 px-1 py-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => onRemoveFilter(chip.key)}
          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded-full text-sm hover:bg-blue-900/50 transition-colors"
          aria-label={`Remove ${chip.label} filter`}
        >
          <span>{chip.label}</span>
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
      ))}
    </div>
  )
}
