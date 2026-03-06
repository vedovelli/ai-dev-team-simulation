import type { TaskPriority } from '../../types/task'

interface PriorityBadgeProps {
  priority: TaskPriority
}

const priorityConfig: Record<TaskPriority, { label: string; bgColor: string; textColor: string }> = {
  high: { label: 'High', bgColor: 'bg-red-100', textColor: 'text-red-800' },
  medium: { label: 'Medium', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
  low: { label: 'Low', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority]

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.label}
    </span>
  )
}
