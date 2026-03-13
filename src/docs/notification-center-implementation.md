# Notification Center Provider & Context Architecture

## Overview

The `NotificationCenterProvider` is a React context that wraps the existing `useNotifications` and `useNotificationPreferences` hooks, providing a clean, centralized interface for all notification state and operations.

## Architecture

### Files

- `src/contexts/NotificationCenterProvider.tsx` — Provider component and context
- `src/hooks/useNotificationCenter.ts` — Consumer hook
- `src/contexts/index.ts` — Barrel export
- `src/types/notification.ts` — Notification types (includes NotificationFilter)
- `src/types/notification-preferences.ts` — Preferences types
- `src/hooks/useNotificationPreferences.ts` — Preferences hook

### Context Shape

\`\`\`typescript
interface NotificationCenterContextValue {
  // Notification data
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: Error | null

  // Filtered views
  filteredNotifications: Notification[]
  activeFilter: NotificationFilter
  setFilter: (filter: NotificationFilter) => void

  // Actions
  markAsRead: (id: string) => void
  markMultipleAsRead: (ids: string[]) => Promise<Notification[]>
  markAllAsRead: () => Promise<Notification[]>
  dismissNotification: (id: string) => Promise<void>

  // Preferences
  preferences: NotificationPreferences | undefined
  updatePreferences: (patch: Record<string, unknown>) => void
  preferencesLoading: boolean

  // UI state
  isPanelOpen: boolean
  togglePanel: () => void
  closePanel: () => void
  openPanel: () => void
}
\`\`\`

## Usage

### Wrapping Your App

\`\`\`typescript
import { NotificationCenterProvider } from '@/contexts'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationCenterProvider>
        <YourApp />
      </NotificationCenterProvider>
    </QueryClientProvider>
  )
}
\`\`\`

### Using the Context

\`\`\`typescript
import { useNotificationCenter } from '@/contexts'

function NotificationBell() {
  const {
    unreadCount,
    isPanelOpen,
    togglePanel,
  } = useNotificationCenter()

  return (
    <button onClick={togglePanel}>
      🔔 {unreadCount > 0 && <span>{unreadCount}</span>}
    </button>
  )
}
\`\`\`

## Filtering

The context supports three filtering modes:

### Filter by All Notifications

\`\`\`typescript
const { filteredNotifications, setFilter } = useNotificationCenter()

// Show all notifications
setFilter('all')
\`\`\`

### Filter by Unread Only

\`\`\`typescript
const { filteredNotifications, setFilter } = useNotificationCenter()

// Show only unread notifications
setFilter('unread')
\`\`\`

### Filter by Type

\`\`\`typescript
const { filteredNotifications, setFilter } = useNotificationCenter()

// Show only assignment_changed notifications
setFilter('assignment_changed')

// Supported types:
// - assignment_changed
// - sprint_updated
// - task_reassigned
// - deadline_approaching
// - task_assigned
// - task_unassigned
// - sprint_started
// - sprint_completed
// - comment_added
// - status_changed
// - agent_event
// - performance_alert
\`\`\`

## Complete Example

\`\`\`typescript
import React from 'react'
import { useNotificationCenter } from '@/contexts'

function NotificationPanel() {
  const {
    filteredNotifications,
    activeFilter,
    setFilter,
    isPanelOpen,
    closePanel,
    markAsRead,
    markAllAsRead,
    unreadCount,
  } = useNotificationCenter()

  if (!isPanelOpen) {
    return null
  }

  return (
    <div className="notification-panel">
      <div className="panel-header">
        <h2>Notifications ({unreadCount})</h2>
        <button onClick={closePanel}>×</button>
      </div>

      <div className="filter-tabs">
        <button
          className={activeFilter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={activeFilter === 'unread' ? 'active' : ''}
          onClick={() => setFilter('unread')}
        >
          Unread
        </button>
      </div>

      {unreadCount > 0 && (
        <button onClick={() => markAllAsRead()}>
          Mark All as Read
        </button>
      )}

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={\`notification-item \${notif.read ? 'read' : 'unread'}\`}
            >
              <p>{notif.message}</p>
              {!notif.read && (
                <button onClick={() => markAsRead(notif.id)}>
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationPanel
\`\`\`

## Testing

The provider includes comprehensive unit tests for:

- Filtering logic (all, unread, by type)
- Panel state management (open/close/toggle)
- \`markAllAsRead\` behavior
- Error handling

Run tests with:

\`\`\`bash
npm test src/contexts/__tests__/NotificationCenterProvider.test.tsx
\`\`\`

## Integration with Existing Hooks

The \`NotificationCenterProvider\` wraps two lower-level hooks:

1. **\`useNotifications\`** — Manages real-time notifications with polling
2. **\`useNotificationPreferences\`** — Manages user notification preferences

These hooks can still be used independently, but using the provider is recommended for centralized state management.

## Performance Considerations

- Filtering is memoized using \`useMemo\` to prevent unnecessary recalculations
- Context consumers only re-render when relevant state changes
- Callbacks are memoized with \`useCallback\` to prevent handler churn
- Preferences are cached with a 5-minute stale time
- Notifications are polled every 30 seconds (configurable)

## Error Handling

The context exposes two error states:

\`\`\`typescript
const { error, preferencesLoading } = useNotificationCenter()

if (error) {
  // Handle notification fetch error
  return <ErrorMessage error={error} />
}

if (preferencesLoading) {
  // Handle preferences loading
  return <Spinner />
}
\`\`\`

Errors from the underlying hooks are propagated to allow UI components to handle them appropriately.

## Type Safety

All context values and functions are fully typed:

\`\`\`typescript
import type { NotificationCenterContextValue } from '@/contexts'
\`\`\`

Use the \`NotificationCenterContextValue\` type when creating custom consumers or extending the context.
