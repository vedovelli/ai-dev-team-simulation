# NotificationCenter Modal Implementation Guide

## Overview

The `NotificationCenter` is a full-featured notification management modal that provides:

- **Tab-based interface**: All / Unread / Preferences tabs
- **TanStack Table integration**: Sortable, filterable notification list with pagination
- **Bulk actions**: Mark multiple notifications as read simultaneously
- **Individual actions**: Dismiss or mark individual notifications
- **Preference management**: Quick toggles for per-notification-type settings
- **Accessibility**: Keyboard navigation, ARIA labels, focus management
- **Real-time updates**: Optimistic updates with automatic invalidation

## Components

### NotificationCenter (Main Modal)

The main modal component that orchestrates all functionality.

```typescript
interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}
```

**Features:**
- Tab management (all/unread/preferences)
- Selection state management
- Bulk actions toolbar
- Keyboard Escape to close
- Backdrop click to close
- Focus trap (implicit via modal structure)

**Usage:**

```typescript
const [isOpen, setIsOpen] = useState(false)

return (
  <>
    <button onClick={() => setIsOpen(true)}>
      Notifications
    </button>
    <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
  </>
)
```

### NotificationList

Renders notifications using TanStack Table with sorting capabilities.

**Features:**
- Sortable by timestamp (default: descending)
- Select all / deselect all checkbox
- Individual selection per notification
- TanStack Table for state management
- Responsive layout with actions on right

### NotificationItem

Individual notification row component.

**Features:**
- Checkbox for selection
- Type-specific icon
- Message and metadata display
- Relative timestamp (e.g., "2m ago")
- Priority badge for high-priority items
- Action buttons (Read, Dismiss)
- Visual distinction for read/unread state

### NotificationPreferencesPanel

Quick preference toggles for all notification types.

**Features:**
- Per-notification-type enable/disable toggle
- Frequency display (instant/daily/off)
- Channels display (in-app/email)
- Global quiet hours configuration
- Real-time optimistic updates via `useNotificationPreferences`

## Data Flow

### Fetching Notifications

```typescript
const allNotifications = useNotifications({ unreadOnly: false })
const unreadNotifications = useNotifications({ unreadOnly: true })
```

The hook provides:
- `notifications`: Flattened array of all notifications
- `unreadCount`: Number of unread notifications
- `isLoading`, `isError`: Query state
- `markAsRead(id)`: Mark single notification as read
- `markMultipleAsRead(ids)`: Mark multiple as read (used for bulk action)
- `dismissNotification(id)`: Dismiss/delete notification

### Marking as Read

**Single notification:**
```typescript
allNotifications.markAsRead(notificationId)
```

**Multiple notifications (bulk):**
```typescript
await allNotifications.markMultipleAsRead(Array.from(selectedIds))
```

The hook handles:
- Optimistic updates in UI
- Cache invalidation
- Automatic refetch on window focus
- Error handling with rollback

### Preferences Management

```typescript
const preferences = useNotificationPreferences()
preferences.updatePreferences({
  assignment_changed: { enabled: false, ... },
  sprint_updated: { enabled: true, ... },
})
```

The hook handles:
- Optimistic UI updates
- Server synchronization
- Cache invalidation for notifications
- Per-notification-type granular control

## API Endpoints

### GET /api/notifications

Fetch paginated notifications.

**Query Parameters:**
- `limit=10`: Items per page
- `cursor`: Pagination cursor (optional)
- `unread=true`: Filter to unread only (optional)

**Response:**
```json
{
  "items": [Notification[], ...],
  "nextCursor": "string | null",
  "hasMore": boolean,
  "unreadCount": number
}
```

### PATCH /api/notifications/:id/read

Mark a single notification as read.

**Response:** Updated `Notification` object

### PATCH /api/notifications/read-batch

Mark multiple notifications as read.

**Request:**
```json
{
  "ids": ["notif-1", "notif-2", ...]
}
```

**Response:** Array of updated `Notification` objects

### DELETE /api/notifications/:id

Dismiss (delete) a notification.

**Response:** Deleted `Notification` object

### GET /api/notification-preferences

Fetch user's notification preferences.

**Response:** `NotificationPreferences` object

### PATCH /api/notification-preferences

Update notification preferences.

**Request:** Partial `NotificationPreferences` object

**Response:** Updated `NotificationPreferences` object

## Accessibility

The component implements:

- **ARIA:**
  - `role="dialog"` on modal
  - `aria-modal="true"` for modal semantics
  - `aria-labelledby` linking to modal title
  - `aria-label` on action buttons and checkboxes

- **Keyboard Navigation:**
  - `Escape` key closes modal
  - Tab navigation within modal
  - Enter/Space to toggle checkboxes
  - Enter to activate buttons

- **Focus Management:**
  - Modal backdrop prevents interaction with page behind
  - Focus remains within modal (implicit via page structure)
  - Close button always accessible

- **Visual Indicators:**
  - Unread notifications bold with blue background
  - Read notifications gray with standard background
  - Selected notifications maintain checkbox state
  - Loading and empty states with appropriate messaging

## Integration Points

### Adding to Header/Nav

To integrate the NotificationCenter into your app header:

```typescript
import { useState } from 'react'
import { NotificationCenter } from '@/components/NotificationCenter'
import { useNotifications } from '@/hooks/useNotifications'

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useNotifications({ unreadOnly: false })

  return (
    <header>
      {/* ... other header content ... */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-2 hover:bg-gray-100 rounded"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </header>
  )
}
```

## Performance Considerations

- **Polling:** Default 30s interval (configurable via `refetchInterval` option)
- **Pagination:** Infinite scroll using cursor-based pagination
- **Virtualization:** Scroll container limits DOM nodes
- **Memoization:** useCallback for event handlers prevents unnecessary re-renders
- **Stale Time:** 30s stale, 2min garbage collection
- **Retry:** Exponential backoff (3 attempts max)

## Testing

Example test with MSW mocking:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationCenter } from './NotificationCenter'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.get('/api/notifications', () => {
    return HttpResponse.json({
      items: [
        {
          id: '1',
          message: 'Task assigned',
          type: 'assignment_changed',
          read: false,
          timestamp: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
      nextCursor: null,
      hasMore: false,
    })
  }),
  http.patch('/api/notifications/read-batch', async ({ request }) => {
    const body = await request.json() as { ids: string[] }
    return HttpResponse.json(body.ids.map(id => ({
      id,
      read: true,
    })))
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('marks notifications as read', async () => {
  const user = userEvent.setup()
  render(<NotificationCenter isOpen={true} onClose={() => {}} />)

  await screen.findByText('Task assigned')
  const checkbox = screen.getByRole('checkbox', { name: /select notification/i })
  await user.click(checkbox)

  const readButton = screen.getByRole('button', { name: 'Mark as read' })
  await user.click(readButton)

  await screen.findByText(/0 unread/)
})
```

## Type Definitions

See `src/types/notification.ts` and `src/types/notification-preferences.ts` for complete type definitions.

Key types:
- `Notification`: Single notification with id, message, timestamp, etc.
- `NotificationPreferences`: User's preference settings
- `NotificationTypePreference`: Per-type settings (enabled, frequency, channels)
- `NotificationEventType`: Structured event types (assignment_changed, etc.)
