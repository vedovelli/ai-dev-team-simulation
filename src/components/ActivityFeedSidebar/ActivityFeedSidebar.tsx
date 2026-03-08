import { useState, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useActivityFeed } from '../../hooks/useActivityFeed'
import { useAddReaction } from '../../hooks/useAddReaction'
import type { ActivityEvent, ReactionEmoji } from '../../types/activity'

function getEventIcon(type: ActivityEvent['type']): string {
  switch (type) {
    case 'task_created':
      return '✨'
    case 'task_completed':
      return '✅'
    case 'task_assigned':
      return '👤'
    case 'agent_status_change':
      return '🤖'
  }
}

function getEventLabel(type: ActivityEvent['type']): string {
  switch (type) {
    case 'task_created':
      return 'Task created'
    case 'task_completed':
      return 'Task completed'
    case 'task_assigned':
      return 'Task assigned'
    case 'agent_status_change':
      return 'Agent status'
  }
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

interface ReactionButtonProps {
  eventId: string
  emoji: ReactionEmoji
  count: number
}

function ReactionButton({ eventId, emoji, count }: ReactionButtonProps) {
  const { mutate: addReaction, isPending } = useAddReaction({ eventId })

  return (
    <button
      onClick={() => addReaction(emoji)}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-slate-700/50 hover:bg-slate-600 transition-colors disabled:opacity-50"
      aria-label={`React with ${emoji}`}
    >
      <span>{emoji}</span>
      {count > 0 && <span className="text-slate-300">{count}</span>}
    </button>
  )
}

function ActivityEventRow({ event }: { event: ActivityEvent }) {
  return (
    <div className="border-l-2 border-slate-700 p-3 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{getEventIcon(event.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-300">
              {getEventLabel(event.type)}
            </span>
            <span className="text-xs text-slate-500">{formatRelativeTime(event.timestamp)}</span>
          </div>
          {event.metadata?.title && (
            <p className="text-sm text-slate-400 mt-1 truncate">{event.metadata.title}</p>
          )}
          {event.actor && (
            <p className="text-xs text-slate-500 mt-1">by {event.actor}</p>
          )}

          {/* Reactions */}
          {event.reactions && Object.keys(event.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(Object.entries(event.reactions) as [ReactionEmoji, number][]).map(
                ([emoji, count]) => (
                  <ReactionButton
                    key={emoji}
                    eventId={event.id}
                    emoji={emoji}
                    count={count}
                  />
                ),
              )}
            </div>
          )}

          {/* Add reaction buttons for events without reactions */}
          {(!event.reactions || Object.keys(event.reactions).length === 0) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(['👍', '❤️', '🚀'] as const).map((emoji) => (
                <ReactionButton
                  key={emoji}
                  eventId={event.id}
                  emoji={emoji}
                  count={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ActivityFeedSidebarProps {
  isOpen?: boolean
  onToggle?: (open: boolean) => void
}

export function ActivityFeedSidebar({ isOpen = true, onToggle }: ActivityFeedSidebarProps) {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return isOpen
    return localStorage.getItem('activity-feed-open') !== 'false' && isOpen
  })

  const handleToggle = (newOpen: boolean) => {
    setOpen(newOpen)
    localStorage.setItem('activity-feed-open', newOpen.toString())
    onToggle?.(newOpen)
  }

  const { data: events = [], isLoading, isError } = useActivityFeed({ limit: 50 })

  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: events.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  if (!open) {
    return (
      <button
        onClick={() => handleToggle(true)}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-40"
        aria-label="Open activity feed"
      >
        📋
      </button>
    )
  }

  return (
    <aside
      className="fixed right-0 top-0 bottom-0 w-80 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl z-40"
      role="complementary"
      aria-label="Activity feed"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white">Activity</h2>
        <button
          onClick={() => handleToggle(false)}
          className="p-1 hover:bg-slate-700 rounded transition-colors"
          aria-label="Close activity feed"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isError && (
          <div className="p-4 text-center text-red-400 text-sm">
            <p>Failed to load activity feed</p>
          </div>
        )}

        {isLoading && events.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-xs text-slate-400">Loading...</p>
            </div>
          </div>
        )}

        {events.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500">No activity yet</p>
          </div>
        )}

        {events.length > 0 && (
          <div
            ref={parentRef}
            className="h-full overflow-y-auto"
            role="log"
            aria-live="polite"
            aria-label="Activity events"
          >
            <div style={{ height: `${totalSize}px`, position: 'relative' }}>
              {virtualItems.map((virtualItem) => {
                const event = events[virtualItem.index]
                return (
                  <div
                    key={event.id}
                    data-index={virtualItem.index}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <ActivityEventRow event={event} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
