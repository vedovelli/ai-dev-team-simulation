interface DeadlineIndicatorProps {
  createdAt: string
}

export function DeadlineIndicator({ createdAt }: DeadlineIndicatorProps) {
  const now = new Date()
  const deadline = new Date(createdAt)
  const diffMs = deadline.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let bgColor = 'bg-gray-100'
  let textColor = 'text-gray-700'
  let label = 'Upcoming'

  if (diffDays < 0) {
    bgColor = 'bg-red-100'
    textColor = 'text-red-800'
    label = 'Overdue'
  } else if (diffDays <= 3) {
    bgColor = 'bg-yellow-100'
    textColor = 'text-yellow-800'
    label = 'Due Soon'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {label}
    </span>
  )
}
