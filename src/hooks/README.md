# Custom Hooks

A collection of custom React hooks for managing application state and side effects.

## Hooks Overview

### useTable

Client-side table state management with sorting and filtering.

```typescript
import { useTable } from '@/hooks'

const { sortedAndFilteredData, handleSort, handleFilter } = useTable({
  data: users,
  initialSortKey: 'name',
})
```

**Features:**
- Sorting by column (ascending/descending toggle)
- Filtering across all columns
- Type-safe with generics

See [useTable documentation](../components/SimpleTable/README.md)

### useWebSocket

Persistent WebSocket connection management with auto-reconnect.

```typescript
import { useWebSocket } from '@/hooks'

const { isConnected, send, disconnect } = useWebSocket({
  url: 'ws://localhost:8080',
  onMessage: (message) => {
    console.log('Received:', message)
  },
  shouldReconnect: true,
})
```

**Features:**
- Auto-reconnection with exponential backoff
- TanStack Query integration support
- Error handling and cleanup
- Connection state tracking

See [WebSocket Infrastructure Guide](../../docs/guides/WEBSOCKET_INFRASTRUCTURE.md)

### useWebSocketQueryIntegration

Helper hook for syncing WebSocket updates with TanStack Query cache.

```typescript
import { useWebSocketQueryIntegration } from '@/hooks'

const { updateQueryData, invalidateQuery } = useWebSocketQueryIntegration({
  queryKey: ['agents'],
  onMergeData: (existing, incoming) => ({
    ...existing,
    agents: existing.agents.map(a =>
      a.id === incoming.id ? incoming : a
    ),
  }),
})
```

**Features:**
- Smart merge strategies for partial updates
- Cache invalidation and refetch options
- Direct cache access for reads and clears
- Automatic message handling

See [WebSocket Infrastructure Guide](../../docs/guides/WEBSOCKET_INFRASTRUCTURE.md)

### useResilientQuery

Production-ready query hook with exponential backoff and circuit breaker pattern.

```typescript
import { useResilientQuery } from '@/hooks'

const { data, isLoading, error, isCircuitBreakerOpen, retry } = useResilientQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    circuitBreakerThreshold: 5,
  },
  onError: (error) => console.error('Query failed:', error),
})

if (isCircuitBreakerOpen) {
  return <ErrorBoundary message="Service temporarily unavailable" />
}

if (isLoading) return <Loader />
if (error) return <ErrorDisplay error={error} onRetry={retry} />
return <UserProfile user={data} />
```

**Features:**
- Exponential backoff retry logic (delay grows exponentially)
- Circuit breaker pattern (fails fast after threshold)
- Configurable per-query retry policies
- Full TypeScript generic support
- Manual retry capability
- Success/error callbacks

**Configuration:**
- `maxAttempts`: Max retry attempts (default: 3)
- `baseDelay`: Initial retry delay in ms (default: 1000)
- `maxDelay`: Maximum delay cap in ms (default: 30000)
- `circuitBreakerThreshold`: Consecutive failures before breaker trips (default: 5)

See [Resilience Framework Guide](../../docs/guides/RESILIENCE_FRAMEWORK.md)

## Hook Development Guidelines

When creating new hooks:

1. **Type Safety**: Always provide full TypeScript types
2. **Cleanup**: Handle cleanup in useEffect return
3. **Documentation**: Include JSDoc with examples
4. **Testing**: Add comprehensive tests in `__tests__/`
5. **Exports**: Export from `index.ts` for public API

### Template

```typescript
import { useCallback, useEffect, useState } from 'react'

export interface UseMyHookOptions {
  // Options go here
}

export interface UseMyHookReturn {
  // Return type goes here
}

/**
 * Brief description of what the hook does.
 *
 * @template T - Generic type if applicable
 * @param options - Hook configuration
 * @returns Hook state and handlers
 *
 * @example
 * ```tsx
 * const { state, handler } = useMyHook({ option: 'value' })
 * ```
 */
export function useMyHook(options: UseMyHookOptions): UseMyHookReturn {
  const [state, setState] = useState(/* initial */)

  const handler = useCallback(() => {
    // Implementation
  }, [])

  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    }
  }, [])

  return { state, handler }
}
```

## Testing Hooks

Use `renderHook` from `@testing-library/react`:

```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMyHook } from './useMyHook'

describe('useMyHook', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMyHook({ option: 'value' }))
    expect(result.current.state).toBe(/* expected */)
  })

  it('should handle user interactions', async () => {
    const { result } = renderHook(() => useMyHook({ option: 'value' }))

    act(() => {
      result.current.handler()
    })

    await waitFor(() => {
      expect(result.current.state).toBe(/* expected */)
    })
  })
})
```

## See Also

- [React Hooks Documentation](https://react.dev/reference/react/hooks)
- [Custom Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Testing Library Hooks](https://testing-library.com/docs/react-testing-library/api#renderhook)
