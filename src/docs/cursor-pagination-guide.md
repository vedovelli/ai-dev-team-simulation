# Cursor-Based Pagination Guide

## Overview

This guide explains cursor-based pagination and when to use it versus offset-based pagination. The notifications API in this project uses cursor-based pagination to support infinite scroll with bounded memory usage.

## Cursor vs Offset Pagination

### Offset-Based Pagination

**How it works:**
- Client requests page by specifying `pageIndex` and `pageSize`
- Server skips N records and returns the next M records
- Example: `GET /api/notifications?pageIndex=2&pageSize=10` returns items 20-29

**Pros:**
- Simple to understand and implement
- Easy to jump to arbitrary pages
- Works well for small datasets

**Cons:**
- ❌ **Inefficient for large datasets**: Requires counting/skipping many records
- ❌ **Data consistency issues**: If items are inserted/deleted, offsets shift (user sees duplicates or missing items)
- ❌ **Unbounded queries**: Cannot cap memory usage; server processes entire result set

### Cursor-Based Pagination

**How it works:**
- Client requests items and receives a `nextCursor` for the next page
- Cursor is an opaque token (e.g., base64-encoded `timestamp:id`)
- Example: `GET /api/notifications?cursor=abc123&limit=10` returns items after cursor
- First request has no cursor (or `cursor=null`)

**Pros:**
- ✅ **Efficient for large datasets**: Server can index on cursor position directly
- ✅ **Stable pagination**: Insertions/deletions don't affect other pages
- ✅ **Bounded queries**: Server processes exactly `limit` items regardless of dataset size
- ✅ **Natural for infinite scroll**: Cursor represents state, not position

**Cons:**
- Cannot jump to arbitrary pages (client must walk from beginning)
- Cursor format is opaque to client (server decides structure)

## When to Use Each

### Use **Offset-Based Pagination** for:
- Small, bounded datasets (< 1000 items)
- Traditional pagination UI (numbered buttons, "go to page" input)
- Admin dashboards where users jump between pages
- Real-time data is not important

### Use **Cursor-Based Pagination** for:
- Large, unbounded datasets (notifications, feeds, messages)
- Infinite scroll UI
- Real-time updates (new items at top)
- Memory-efficient processing
- Mobile apps with limited bandwidth
- **This project's notifications API** ✅

## Implementation Details

### MSW Handler: `GET /api/notifications`

```typescript
// Request
GET /api/notifications?cursor=base64&limit=10&unread=true

// Response
{
  items: Notification[],           // Page of notifications
  nextCursor: "base64" | null,     // Cursor for next page, or null if done
  hasMore: boolean,                // Whether more pages exist
  unreadCount: number              // Total unread across all notifications
}
```

**Key behaviors:**
- First request: no `cursor` parameter (or `cursor=null`)
- Each page: exactly `limit` items (server-side cap at 100)
- New notifications: Added at top of list between polls (first page only)
- Polling: Only applies to first page (keep notifications fresh at top)

### Hook: `useNotifications`

```typescript
const {
  // Notifications from all fetched pages (flattened)
  notifications,

  // Unread count (computed from first page, same across all pages)
  unreadCount,

  // Total notifications fetched so far
  total,

  // Infinite scroll methods
  fetchNextPage,      // () => Promise<void> - load next page
  hasNextPage,        // boolean - whether more pages exist
  isFetchingNextPage, // boolean - currently loading next page

  // Mutations
  markAsRead,
  markMultipleAsRead,
  dismissNotification,
  dismissAllReadNotifications,
} = useNotifications({ unreadOnly: false })
```

### Usage Example

```typescript
import { useNotifications } from '@/hooks/useNotifications'

export function NotificationsList() {
  const {
    notifications,
    unreadCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    markAsRead,
  } = useNotifications()

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>

      <div className="notification-list">
        {notifications.map((notif) => (
          <div key={notif.id} className={notif.read ? 'read' : 'unread'}>
            <p>{notif.message}</p>
            {!notif.read && (
              <button onClick={() => markAsRead(notif.id)}>
                Mark as read
              </button>
            )}
          </div>
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  )
}
```

### Cursor Token Format

Cursors in this implementation are base64-encoded `timestamp:id` pairs:

```
Raw: "2026-03-14T10:30:45.123Z:notif-456"
Encoded: "MjAyNi0wMy0xNFQxMDozMDo0NS4xMjNaOm5vdGlmLTQ1Ng=="
```

**Why this format:**
- Timestamp ensures chronological ordering
- ID uniquely identifies the notification
- Base64 is opaque to client (can change format without breaking API)
- Efficient server-side lookup by timestamp

## Cache Invalidation

### Polling (First Page Only)

The hook automatically refetches the first page every 30 seconds to catch new notifications. Subsequent pages are cached and not refetched unless explicitly invalidated.

```typescript
// Polling behavior
const {
  data: {
    pages: [
      { items: [fresh, notifications], nextCursor, ... },  // ← Refetched every 30s
      { items: [older, notifications], nextCursor, ... },  // ← Cached, no refetch
      { items: [oldest, notifications], nextCursor, null },
    ]
  }
} = useNotifications()
```

### Mark as Read

When marking a notification as read, the mutation invalidates the first page to recalculate `unreadCount`. Subsequent pages are not refetched:

```typescript
const { markAsRead } = useNotifications()

markAsRead('notif-123')  // Optimistic update → Invalidate first page → Refetch
```

## Performance Considerations

### Memory Usage

- **Old approach (offset)**: Stored all 20+ notifications in cache
- **New approach (cursor)**: Stores exactly `limit` items per page
- Total memory: `pages * limit` (e.g., 5 pages × 10 items = 50 notifications max)

### Network Efficiency

- **First page**: Polls every 30s for fresh notifications
- **Later pages**: Cached (stale for 30s, garbage collected at 2min)
- **Browser focus**: Refetches first page when window regains focus

## Migration from Offset-Based

If you have code using the old endpoint response shape:

```typescript
// Old (offset-based)
const response = await fetch('/api/notifications?pageIndex=0&pageSize=20')
const { notifications, total, unreadCount } = await response.json()

// New (cursor-based)
const response = await fetch('/api/notifications?cursor=null&limit=10')
const { items, nextCursor, hasMore, unreadCount } = await response.json()

// Hook handles conversion automatically
const { notifications } = useNotifications()  // Already flattened
```

The `useNotifications` hook handles cursor pagination internally. Components using the hook require no changes.

## Troubleshooting

### "Cursor not found" or skipped items

**Cause:** Cursor may be stale if many notifications were inserted at the top between requests.

**Solution:** This is expected behavior. Request a fresh first page if consistency is critical:

```typescript
queryClient.invalidateQueries({
  queryKey: ['notifications'],
  exact: false,
})
```

### High unread count not reflecting in UI

**Cause:** Unread count is computed from the first page only, but you're viewing a cached later page.

**Solution:** The hook returns `unreadCount` from the first page, which is always fresh (polled every 30s). Use this value, not manual counting.

### Infinite scroll not triggering

**Cause:** `hasNextPage` is false, or `fetchNextPage` not being called.

**Solution:** Check that `hasNextPage` is true before rendering the "load more" button. Ensure intersection observer or scroll handler is wired up.
