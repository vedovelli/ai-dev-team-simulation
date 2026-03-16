# Notification Center Implementation Guide

## Overview

The Notification Center orchestrates real-time notification data (from FAB-179) and user preferences (from FAB-188) into a cohesive user-facing component. It provides:

- Unified interface for notification state + user preferences
- Client-side filtering (by read status and notification type)
- Grouped notification display (by type and date)
- Mark-as-read operations (single and batch) with optimistic updates
- Notification deletion with immediate cache updates
- Accessible keyboard navigation and ARIA live regions

## Architecture

### `useNotificationCenter` Hook

The orchestrating hook that manages:

1. **Data fetching**:
   - Uses `useNotifications` for real-time notification polling
   - Uses `useNotificationPreferences` for user preferences
   - Exposes unread count and total notifications

2. **Filter state** (internal management):
   - `filterStatus`: 'all' | 'unread'
   - `filterType`: NotificationType | null
   - Computed filtered notifications via `useMemo`

3. **Grouping logic**:
   - Groups notifications by type + date
   - Returns `Map<string, Notification[]>` for organized display
   - Preserves notification order within groups

4. **Actions**:
   - `markAsRead(id)`: Mark single notification as read
   - `markAllAsRead()`: Batch mark unread notifications as read
   - `deleteNotification(id)`: Remove notification from store
   - `dismissAllReadNotifications()`: Clear all read notifications

### `NotificationCenter` Component

React component that displays notifications with filtering controls:

1. **Features**:
   - Displays grouped notifications (sticky group headers)
   - Filter controls using TanStack Form
   - Mark-as-read button for unread notifications
   - Delete button for each notification
   - Empty state with contextual messaging
   - Loading and error states
   - Keyboard accessible (ARIA labels, live region)

2. **Sub-components**:
   - `NotificationItem`: Individual notification display
   - `GroupHeader`: Sticky group headers (type + date)
   - `FilterControls`: TanStack Form filter UI

3. **Styling**:
   - Tailwind CSS with semantic HTML
   - Visual indicators for unread (blue background)
   - Priority badges for high-priority notifications
   - Responsive hover states

## Usage

### Basic Setup

```tsx
import { NotificationCenter } from '@/components/NotificationCenter'

export function DashboardPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        {/* Main content */}
      </div>
      <div>
        <NotificationCenter />
      </div>
    </div>
  )
}
```

### Using the Hook Directly

```tsx
import { useNotificationCenter } from '@/hooks'

export function CustomNotificationUI() {
  const {
    notifications,
    unreadCount,
    filterStatus,
    setFilterStatus,
    markAsRead,
    deleteNotification,
  } = useNotificationCenter({
    refetchInterval: 20 * 1000, // 20 seconds instead of default 30s
  })

  return (
    <div>
      <h2>Unread: {unreadCount}</h2>
      <button onClick={() => setFilterStatus('unread')}>
        Show only unread
      </button>
      {notifications.map((notif) => (
        <div key={notif.id}>
          <p>{notif.message}</p>
          <button onClick={() => markAsRead(notif.id)}>Mark read</button>
          <button onClick={() => deleteNotification(notif.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}
```

### Configurable Options

```tsx
import { useNotificationCenter } from '@/hooks'

const center = useNotificationCenter({
  refetchInterval: 20 * 1000,        // Poll every 20s (default: 30s)
  refetchOnWindowFocus: true,         // Refetch when window focused (default: true)
})
```

## MSW Handler

The DELETE endpoint is already implemented in `/src/mocks/handlers/notifications.ts`:

```typescript
http.delete('/api/notifications/:id', async ({ params }) => {
  // Removes notification from in-memory store
  // Returns: { success: true, id }
})

http.delete('/api/notifications/read', async () => {
  // Removes all read notifications
  // Returns: { success: true, deletedCount, remaining }
})
```

## API Integration

### Expected API Endpoints

- `GET /api/notifications` - Fetch notifications with pagination
- `PATCH /api/notifications/:id/read` - Mark single as read
- `PATCH /api/notifications/read-batch` - Mark multiple as read
- `DELETE /api/notifications/:id` - Delete single notification ✅
- `DELETE /api/notifications/read` - Delete all read notifications ✅
- `GET /api/notification-preferences` - Fetch user preferences
- `PATCH /api/notification-preferences` - Update preferences

## Data Flow

```
┌─────────────────────────────────────────┐
│   NotificationCenter Component          │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   useNotificationCenter Hook      │ │
│  ├───────────────────────────────────┤ │
│  │                                   │ │
│  │  ┌──────────────────┐             │ │
│  │  │ useNotifications │ (polling)   │ │
│  │  └──────────────────┘             │ │
│  │           ↓                        │ │
│  │  ┌──────────────────────────────┐ │ │
│  │  │  Filter & Group Notifications│ │ │
│  │  └──────────────────────────────┘ │ │
│  │           ↓                        │ │
│  │  ┌──────────────────────────────┐ │ │
│  │  │ useNotificationPreferences   │ │ │
│  │  └──────────────────────────────┘ │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  State: notifications, unreadCount,     │
│  filterStatus, filterType, preferences  │
│  Actions: markAsRead, deleteNotification│
│                                         │
└─────────────────────────────────────────┘
```

## Accessibility

- **ARIA Labels**: All buttons have descriptive aria-labels
- **ARIA Live Region**: Panel uses `aria-live="polite"` for new notifications
- **Role Attributes**: `role="region"` on container, `role="article"` on items
- **Keyboard Navigation**:
  - Tab through buttons
  - Space/Enter to activate buttons
  - Escape in filters (handled by TanStack Form)
- **Color Contrast**: All text meets WCAG AA standards
- **Screen Reader**: Notification metadata announced naturally

## Testing

### Test Cases

1. **Rendering**:
   - NotificationCenter renders without errors
   - Empty state shown when no notifications
   - Loading state shown while fetching
   - Error state shown on fetch failure

2. **Filtering**:
   - Filter by "unread" status works
   - Filter by type works (e.g., "assignment_changed")
   - Multiple filters can be combined
   - "Clear filters" resets to default state

3. **Actions**:
   - Mark single as read updates UI optimistically
   - Mark all as read only affects unread notifications
   - Delete notification removes from list and cache
   - Dismiss all read notifications clears them

4. **Grouping**:
   - Notifications grouped by type + date
   - Group headers are sticky on scroll
   - Newest notifications appear first

### Example Test

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { NotificationCenter } from '@/components/NotificationCenter'
import { queryClient } from '@/mocks/setup'

describe('NotificationCenter', () => {
  it('renders notifications grouped by type and date', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <NotificationCenter />
      </QueryClientProvider>
    )

    expect(screen.getByRole('region', { name: /notification center/i })).toBeInTheDocument()
    expect(screen.getByText(/assignment_changed/i)).toBeInTheDocument()
  })

  it('filters notifications by unread status', async () => {
    const { getByDisplayValue } = render(
      <QueryClientProvider client={queryClient}>
        <NotificationCenter />
      </QueryClientProvider>
    )

    const statusSelect = getByDisplayValue('All (20)')
    fireEvent.change(statusSelect, { target: { value: 'unread' } })

    expect(screen.getByText(/unread \(5\)/i)).toBeInTheDocument()
  })
})
```

## Performance Considerations

1. **Polling**: Defaults to 30s refetch interval (configurable)
2. **Caching**: TanStack Query caches with:
   - 30s stale time
   - 2min garbage collection time
3. **Filtering**: Uses `useMemo` to prevent unnecessary recalculations
4. **Grouping**: Also uses `useMemo` for Map generation
5. **No Virtual Scrolling**: Notifications capped at 20 (YAGNI principle)
   - Add TanStack Virtual only if cap increases

## Acceptance Criteria Checklist

- [x] `useNotificationCenter` hook implemented and exported
- [x] NotificationCenter panel component renders grouped notifications
- [x] Mark single/all as read with optimistic update + rollback
- [x] Delete notification with cache update
- [x] Filter by type and unread status works
- [x] DELETE MSW handler added (already existed in FAB-179)
- [x] Component is accessible (ARIA, keyboard)
- [x] Implementation guide / docs added

## Integration with Bell Icon (FAB-260)

The NotificationCenter is designed as a panel/modal component that integrates with a bell icon:

```tsx
import { useState } from 'react'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useNotifications } from '@/hooks'

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false)
  const { unreadCount } = useNotifications()

  return (
    <header>
      <nav>
        {/* Other nav items */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          )}
        </button>
      </nav>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 h-96">
          <NotificationCenter />
        </div>
      )}
    </header>
  )
}
```

## Related Issues

- **FAB-179**: Real-Time Notifications Hook & Data Layer
  - Provides `useNotifications` hook with polling
- **FAB-188**: Notification Preferences & Settings Data Layer
  - Provides `useNotificationPreferences` hook
- **FAB-258**: Sprint Planning (parent epic)
- **FAB-260**: Bell Icon + Notification Dropdown UI
  - Will consume NotificationCenter component

## Files Changed

- `src/hooks/useNotificationCenter.ts` - Main orchestrating hook
- `src/components/NotificationCenter/NotificationCenter.tsx` - UI component
- `src/components/NotificationCenter/index.ts` - Component exports
- `src/hooks/index.ts` - Hook exports
- `docs/notification-center-implementation.md` - This guide
