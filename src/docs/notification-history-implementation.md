# Notification History Implementation Guide

## Overview

The Notification History feature provides a comprehensive view of past notifications with advanced filtering, pagination, and searching capabilities. Built on cursor-based pagination for scalability, this feature integrates seamlessly with the existing notification system while providing a dedicated history view.

## Architecture

### Components

#### 1. **useNotificationHistory Hook** (`src/hooks/useNotificationHistory.ts`)

The core data-fetching hook that manages notification history state and pagination.

**Key Features:**
- Cursor-based pagination for efficient large datasets
- Filtering by: notification type, read status, and date range
- Stale-while-revalidate caching strategy (5min stale, 10min gc)
- Query key factory for consistent cache management
- Exponential backoff retry logic (3 attempts)

**Query Key Structure:**
```typescript
['notifications', 'history', { filters }]
```

**Usage:**
```typescript
import { useNotificationHistory } from '@/hooks'

function MyComponent() {
  const { items, pagination, totalCount, unreadCount, isLoading, error } =
    useNotificationHistory({
      limit: 20,
      filters: {
        type: 'assignment_changed',
        status: 'unread',
        startDate: '2026-03-01T00:00:00Z',
        endDate: '2026-03-18T23:59:59Z',
      },
    })

  // Use items, pagination, etc.
}
```

**Return Value:**
```typescript
{
  // Query state
  data: NotificationHistoryResponse
  isLoading: boolean
  error: Error | null

  // Computed values
  items: NotificationHistoryEntry[]
  pagination: {
    cursor: string | null
    nextCursor: string | null
    hasMore: boolean
    pageSize: number
  }
  totalCount: number
  unreadCount: number

  // Actions
  invalidateHistory: () => Promise<void>
  fetchPage: (cursor: string | null) => Promise<NotificationHistoryResponse>
}
```

#### 2. **MSW Handler** (`src/mocks/handlers/notification-history.ts`)

Mock Service Worker handler for `GET /api/notifications/history` endpoint.

**Features:**
- Generates realistic ~150 historical notifications
- Supports cursor-based pagination (20 items/page default)
- Implements filtering: type, status, date range
- Tracks read/unread status with readAt timestamps
- Simulates aged notifications across 90-day history

**Endpoint:** `GET /api/notifications/history`

**Query Parameters:**
- `cursor` (optional): Cursor token for pagination
- `limit` (optional, default 20, max 100): Items per page
- `type` (optional): Filter by notification type
- `status` (optional): Filter by read status ('read', 'unread', 'all')
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)

**Response:**
```typescript
{
  items: NotificationHistoryEntry[]
  pagination: {
    cursor: string | null
    nextCursor: string | null
    hasMore: boolean
    pageSize: number
  }
  totalCount: number
  unreadCount: number
}
```

#### 3. **NotificationHistoryView Component** (`src/components/NotificationHistory/NotificationHistoryView.tsx`)

Complete UI component for displaying notification history with TanStack Table integration.

**Features:**
- Table with sortable columns (Message, Type, Status, Date)
- Filter panel: type, status, date range pickers
- Cursor-based pagination with next/previous buttons
- Loading and error states
- Empty state with filter reset option
- Responsive design with Tailwind CSS
- Relative timestamps (e.g., "2h ago")

**Props:**
```typescript
interface NotificationHistoryViewProps {
  // Initial filters to apply
  filters?: NotificationHistoryFilters

  // Pagination limit per page
  limit?: number

  // Custom columns for table (optional)
  columns?: ColumnDef<NotificationHistoryEntry, any>[]

  // Additional CSS classes
  className?: string
}
```

**Usage:**
```typescript
import { NotificationHistoryView } from '@/components/NotificationHistory/NotificationHistoryView'

function Page() {
  return (
    <NotificationHistoryView
      filters={{ status: 'unread' }}
      limit={25}
      className="p-6"
    />
  )
}
```

### Types

**NotificationHistoryEntry:**
```typescript
interface NotificationHistoryEntry extends Notification {
  createdAt: string     // When notification was created
  readAt?: string      // When notification was read (if read)
}
```

**NotificationHistoryFilters:**
```typescript
interface NotificationHistoryFilters {
  type?: NotificationType              // Filter by type
  status?: 'read' | 'unread' | 'all'  // Filter by read status
  startDate?: string                   // Start date (ISO 8601)
  endDate?: string                     // End date (ISO 8601)
}
```

**NotificationHistoryResponse:**
```typescript
interface NotificationHistoryResponse {
  items: NotificationHistoryEntry[]
  pagination: NotificationHistoryPaginationMeta
  totalCount: number
  unreadCount: number
}
```

## Integration Points

### Cache Coordination

The notification history system coordinates with existing notification queries:

```typescript
// History uses isolated query key
['notifications', 'history', { filters }]

// Separate from live notifications
['notifications', { unreadOnly: false }]
```

This separation allows:
- Independent caching and refresh strategies
- Efficient pagination without affecting live notifications
- Flexible filter combinations without polluting live cache

### Filter Composition

Filters can be combined flexibly:

```typescript
// Unread deadline alerts from last 7 days
{
  type: 'deadline_approaching',
  status: 'unread',
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
}

// All assignment changes in specific sprint period
{
  type: 'assignment_changed',
  status: 'all',
  startDate: '2026-03-01T00:00:00Z',
  endDate: '2026-03-31T23:59:59Z',
}
```

### Error Handling

The hook implements exponential backoff retry:
- 3 retry attempts
- Delay: 1s, 2s, 4s, capped at 30s
- Network failures automatically retried

Example error handling:
```typescript
const { items, error, isLoading } = useNotificationHistory()

if (error) {
  return <ErrorMessage error={error} />
}

if (isLoading && !items.length) {
  return <LoadingState />
}
```

## Performance Considerations

### Pagination Strategy

Uses cursor-based pagination for efficiency:
- Base64-encoded cursor token: `timestamp:id`
- Stateless pagination (no offset calculation)
- Scales well with large datasets
- Supports concurrent requests

### Caching Strategy

- **Stale Time:** 5 minutes (reasonable for historical data)
- **GC Time:** 10 minutes (balance memory vs. performance)
- **Refetch on Focus:** Configurable per use case
- **Background Refetch:** Inactive queries don't refetch

### Data Generation (MSW)

The mock handler generates realistic data:
- 150 total notifications across 90 days
- ~70% read rate for recent (< 7 days)
- ~90% read rate for older (7-30 days)
- 100% read for very old (30+ days)
- Mixed event types and priorities

## Usage Examples

### Basic History View

```typescript
import { NotificationHistoryView } from '@/components'

export function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold">Notification History</h1>
      <NotificationHistoryView limit={25} />
    </div>
  )
}
```

### With Initial Filters

```typescript
export function UnreadDeadlinesPage() {
  return (
    <NotificationHistoryView
      filters={{
        type: 'deadline_approaching',
        status: 'unread',
      }}
      limit={15}
    />
  )
}
```

### Custom Columns

```typescript
import { createColumnHelper } from '@tanstack/react-table'
import type { NotificationHistoryEntry } from '@/hooks'

const columnHelper = createColumnHelper<NotificationHistoryEntry>()

const customColumns = [
  columnHelper.accessor('message', {
    header: 'Notification',
    cell: (info) => <div className="font-medium">{info.getValue()}</div>,
  }),
  columnHelper.accessor('priority', {
    header: 'Priority',
    cell: (info) => (
      <span className={`badge ${info.getValue() === 'high' ? 'badge-red' : 'badge-gray'}`}>
        {info.getValue()}
      </span>
    ),
  }),
]

export function CustomHistoryPage() {
  return <NotificationHistoryView columns={customColumns} />
}
```

### Programmatic Access

```typescript
const { fetchPage, pagination } = useNotificationHistory()

// Fetch specific page
const nextPage = await fetchPage(pagination.nextCursor)

// Update UI or state with nextPage data
```

## API Endpoint Reference

### GET /api/notifications/history

Fetch paginated notification history with optional filtering.

**Request:**
```
GET /api/notifications/history?limit=20&type=assignment_changed&status=unread
```

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| cursor | string | - | Pagination cursor token |
| limit | number | 20 | Items per page (max 100) |
| type | string | - | Notification type filter |
| status | string | all | 'read', 'unread', or 'all' |
| startDate | string | - | ISO 8601 start date |
| endDate | string | - | ISO 8601 end date |

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "notif-123",
      "type": "assignment_changed",
      "message": "Task assigned to you",
      "timestamp": "2026-03-18T10:30:00Z",
      "createdAt": "2026-03-18T10:30:00Z",
      "read": false,
      "priority": "normal",
      "metadata": { }
    }
  ],
  "pagination": {
    "cursor": "...",
    "nextCursor": "...",
    "hasMore": true,
    "pageSize": 20
  },
  "totalCount": 245,
  "unreadCount": 12
}
```

**Error Responses:**
- 400: Invalid parameters
- 500: Server error (retried with exponential backoff)

## Testing

### Mock Scenarios

The MSW handler supports generating realistic test data:

```typescript
// Testing pagination
const { items, pagination } = useNotificationHistory()
expect(items).toHaveLength(20)
expect(pagination.nextCursor).toBeDefined()
expect(pagination.hasMore).toBe(true)

// Testing filters
const { unreadCount } = useNotificationHistory({
  filters: { status: 'unread' }
})
expect(unreadCount).toBeGreaterThan(0)

// Testing date range
const { totalCount } = useNotificationHistory({
  filters: {
    startDate: '2026-03-10T00:00:00Z',
    endDate: '2026-03-18T23:59:59Z',
  }
})
expect(totalCount).toBeLessThan(150)
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { NotificationHistoryView } from '@/components'

describe('NotificationHistoryView', () => {
  it('renders history with filters', () => {
    render(<NotificationHistoryView />)
    expect(screen.getByText('Notification History')).toBeInTheDocument()
  })

  it('handles pagination', async () => {
    render(<NotificationHistoryView />)
    const nextButton = screen.getByRole('button', { name: /next/i })
    await userEvent.click(nextButton)
  })
})
```

## Limitations & Future Improvements

### Current Limitations

1. **No Real-time Sync:** History doesn't update in real-time (uses polling)
2. **Single Page Cursor Persistence:** Cursor state not preserved on page reload
3. **Filter Persistence:** Filters reset on component unmount

### Future Enhancements

1. **URL Persistence:** Store filters and cursor in URL query params
2. **Export Functionality:** CSV/JSON export of filtered history
3. **Advanced Search:** Full-text search across notification messages
4. **Analytics:** Charts showing notification trends
5. **Bulk Actions:** Select and perform bulk operations on history items
6. **Custom Retention:** User-configurable notification retention period

## Related Features

- **useNotifications:** Real-time notification polling and management
- **useNotificationPreferences:** User notification settings
- **useNotificationActionMutations:** Batch notification operations
- **NotificationCenter:** Real-time notification UI component

## Troubleshooting

**Issue:** History not loading
```typescript
// Check network in DevTools
// Verify limit parameter is <= 100
// Check date filter format (ISO 8601)
```

**Issue:** Pagination not working
```typescript
// Verify cursor format (check console)
// Ensure fetchPage is called with valid cursor
// Check that hasMore is true before fetching next page
```

**Issue:** Filters not applied
```typescript
// Ensure filter values match expected types
// Check NotificationHistoryFilters type definition
// Verify status is one of: 'read', 'unread', 'all'
```
