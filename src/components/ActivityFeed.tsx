import { useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ActivityEvent } from '../types/activity'

interface ActivityFeedProps {
  events: ActivityEvent[]
  isLoading?: boolean
  isError?: boolean
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

function getEventColor(type: ActivityEvent['type']): string {
  switch (type) {
    case 'agent-state-change':
      return 'border-l-blue-500 bg-blue-500/5'
    case 'task-status-change':
      return 'border-l-emerald-500 bg-emerald-500/5'
    case 'message':
      return 'border-l-purple-500 bg-purple-500/5'
    case 'decision':
      return 'border-l-amber-500 bg-amber-500/5'
  }
}

function getEventBadgeColor(type: ActivityEvent['type']): string {
  switch (type) {
    case 'agent-state-change':
      return 'bg-blue-500/20 text-blue-300'
    case 'task-status-change':
      return 'bg-emerald-500/20 text-emerald-300'
    case 'message':
      return 'bg-purple-500/20 text-purple-300'
    case 'decision':
      return 'bg-amber-500/20 text-amber-300'
  }
}

function getEventLabel(type: ActivityEvent['type']): string {
  switch (type) {
    case 'agent-state-change':
      return 'Agent'
    case 'task-status-change':
      return 'Task'
    case 'message':
      return 'Message'
    case 'decision':
      return 'Decision'
  }
}

export function ActivityFeed({ events, isLoading = false, isError = false }: ActivityFeedProps) {
  const parentRef = useMemo(() => ({ current: null as HTMLDivElement | null }), [])

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-2">Error loading activity</h2>
          <p className="text-slate-400">Failed to fetch activity feed</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-400">Loading activity feed...</p>
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-400">No activity yet</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className="w-full h-screen overflow-y-auto bg-slate-950"
    >
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8 text-white">Activity Feed</h1>

        <div
          style={{
            height: `${totalSize}px`,
          }}
          className="relative"
        >
          {virtualItems.map((virtualItem) => {
            const event = events[virtualItem.index]
            return (
              <div
                key={event.id}
                data-index={virtualItem.index}
                className="absolute top-0 left-0 w-full"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  className={`mb-4 border-l-4 rounded-lg p-4 ${getEventColor(event.type)} transition-all hover:shadow-lg`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getEventBadgeColor(event.type)}`}>
                          {getEventLabel(event.type)}
                        </span>
                        <span className="text-slate-400 text-sm">{formatRelativeTime(event.timestamp)}</span>
                      </div>
                      <h3 className="text-slate-200 font-semibold mt-2 break-words">{event.title}</h3>
                      {event.description && (
                        <p className="text-slate-400 text-sm mt-1">{event.description}</p>
                      )}
                      {event.taskId && (
                        <p className="text-slate-500 text-xs mt-2">ID: {event.taskId}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
