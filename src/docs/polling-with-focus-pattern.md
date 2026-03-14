# Polling with Focus Pattern

## Overview

The `usePollingWithFocus` hook is a reusable utility that wraps TanStack Query's `refetchInterval` to automatically pause polling when the browser window is not in focus (tab is hidden). This reduces unnecessary API requests and improves performance when users switch tabs.

## Motivation

By default, TanStack Query continues polling even when the user's browser tab is hidden. This wastes bandwidth and server resources. The `usePollingWithFocus` hook solves this by:

1. Listening to the `visibilitychange` event
2. Pausing polling when the document is hidden
3. Resuming polling when the document becomes visible again
4. Cleaning up event listeners automatically

## API

### `usePollingWithFocus(options)`

```typescript
import { usePollingWithFocus } from '@/hooks'

const polling = usePollingWithFocus({
  interval: 30000,  // Poll every 30 seconds
  enabled: true     // Can be disabled dynamically
})
```

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `interval` | `number \| false` | `false` | Polling interval in milliseconds, or `false` to disable |
| `enabled` | `boolean` | `true` | Whether polling is enabled (can be disabled dynamically) |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `refetchInterval` | `number \| false` | The polling interval (number when visible and enabled, `false` otherwise) |

## Usage Examples

### Basic Usage with `useQuery`

```typescript
import { useQuery } from '@tanstack/react-query'
import { usePollingWithFocus } from '@/hooks'

function MyComponent() {
  const polling = usePollingWithFocus({
    interval: 30000  // Poll every 30 seconds
  })

  const query = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    ...polling  // Spread the polling configuration
  })

  return (
    <div>
      {query.data && <p>Data: {query.data}</p>}
    </div>
  )
}
```

### With `useInfiniteQuery`

The hook works seamlessly with infinite queries too:

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'
import { usePollingWithFocus } from '@/hooks'

function NotificationsList() {
  const polling = usePollingWithFocus({
    interval: 30000
  })

  const query = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const response = await fetch(`/api/notifications?cursor=${pageParam}`)
      return response.json()
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    refetchInterval: (query) => {
      // Poll only the first page
      const isFirstPage = !query.state.variables?.pageParam
      return isFirstPage ? polling.refetchInterval : false
    }
  })

  return (
    // ...
  )
}
```

### Conditional Polling

Polling can be enabled/disabled dynamically:

```typescript
function MyComponent({ shouldPoll }: { shouldPoll: boolean }) {
  const polling = usePollingWithFocus({
    interval: 30000,
    enabled: shouldPoll  // Polling disabled if shouldPoll is false
  })

  const query = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    ...polling
  })

  return (
    // ...
  )
}
```

## Implementation Details

### Event Listener

The hook uses the standard `visibilitychange` event to detect when the document becomes hidden or visible:

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Pause polling
  } else {
    // Resume polling
  }
})
```

### State Management

The hook tracks visibility state with `useState`, which triggers a re-render when visibility changes. TanStack Query's `useQuery` updates its polling behavior based on the new `refetchInterval` value.

### Cleanup

Event listeners are properly cleaned up in the effect return function:

```typescript
return () => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
}
```

### SSR Safety

The hook checks for `typeof document` before accessing browser APIs, making it safe for server-side rendering:

```typescript
const [isVisible, setIsVisible] = useState(
  typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
)
```

## Real-World Examples

### Sprint Metrics Dashboard

```typescript
function SprintMetricsPanel() {
  const polling = usePollingWithFocus({
    interval: 30000  // Update metrics every 30s, paused when tab is hidden
  })

  const metricsQuery = useQuery({
    queryKey: ['sprint-metrics'],
    queryFn: fetchMetrics,
    ...polling,
    staleTime: 30000,
    gcTime: 5 * 60000
  })

  return (
    <div className="metrics-grid">
      {/* Render metrics with real-time updates */}
    </div>
  )
}
```

### Notifications Center

```typescript
function NotificationsCenter() {
  const polling = usePollingWithFocus({
    interval: 30000  // Check for new notifications every 30s
  })

  const notificationsQuery = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: (query) => {
      const isFirstPage = !query.state.variables?.pageParam
      return isFirstPage ? polling.refetchInterval : false
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  })

  return (
    // Render notifications with infinite scroll
  )
}
```

## Testing

The hook is testable thanks to its pure nature. When testing:

1. Use `jsdom` or similar to mock the `document` object
2. Dispatch `visibilitychange` events to simulate focus changes
3. Verify that `refetchInterval` is `false` when hidden and the configured interval when visible

Example test:

```typescript
import { renderHook } from '@testing-library/react'
import { usePollingWithFocus } from '@/hooks'

describe('usePollingWithFocus', () => {
  it('pauses polling when document is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    })

    const { result } = renderHook(() => usePollingWithFocus({ interval: 5000 }))

    expect(result.current.refetchInterval).toBe(false)
  })

  it('resumes polling when document becomes visible', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    })

    const { result } = renderHook(() => usePollingWithFocus({ interval: 5000 }))

    expect(result.current.refetchInterval).toBe(5000)
  })
})
```

## Performance Considerations

- **Reduced API Calls**: Polling pauses when the tab is hidden, reducing server load
- **Battery Life**: On mobile devices, this helps preserve battery by not making unnecessary requests
- **Network Efficiency**: Useful in low-bandwidth scenarios where each request matters
- **User Experience**: Users won't see stale data when switching back to the tab because TanStack Query refetches on window focus

## Browser Compatibility

The `visibilitychange` event is supported in all modern browsers:
- Chrome 13+
- Firefox 10+
- Safari 7+
- Edge (all versions)
- Mobile browsers (iOS Safari 7+, Chrome on Android)

See [MDN: visibilitychange](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event) for details.

## Related

- [TanStack Query Polling](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults#stale-time-and-garbage-collection)
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [Document.visibilityState](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)
