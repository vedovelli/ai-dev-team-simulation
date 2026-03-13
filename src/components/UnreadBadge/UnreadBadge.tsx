interface UnreadBadgeProps {
  count: number
  showPulse?: boolean
}

export function UnreadBadge({ count, showPulse = true }: UnreadBadgeProps) {
  if (count === 0) {
    return null
  }

  const displayCount = count > 9 ? '9+' : count

  return (
    <span
      className={`
        inline-flex items-center justify-center
        min-w-5 h-5 px-1.5
        bg-red-500 text-white
        rounded-full text-xs font-bold
        ${showPulse ? 'animate-pulse' : ''}
      `}
      role="status"
      aria-label={`${count} unread notifications`}
    >
      {displayCount}
    </span>
  )
}
