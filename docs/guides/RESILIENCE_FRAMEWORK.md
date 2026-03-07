# Resilience Framework Guide

## Overview

The Resilience Framework provides production-ready error handling and recovery patterns for your application. It includes:

- **Exponential Backoff**: Intelligent retry delays that grow exponentially
- **Circuit Breaker Pattern**: Fail-fast mechanism to prevent cascading failures
- **Configurable Policies**: Per-query retry configuration
- **TypeScript Support**: Full type safety with generics

## useResilientQuery Hook

The `useResilientQuery` hook wraps TanStack Query with resilience patterns.

### Basic Usage

```typescript
import { useResilientQuery } from '@/hooks'

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error, retry } = useResilientQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  if (isLoading) return <Loader />
  if (error) return <Error onRetry={retry} />
  return <Profile user={data} />
}
```

### Configuration

```typescript
const config = {
  // Maximum number of automatic retries (default: 3)
  maxAttempts: 3,

  // Initial retry delay in milliseconds (default: 1000)
  baseDelay: 1000,

  // Maximum delay cap in milliseconds (default: 30000)
  maxDelay: 30000,

  // Consecutive failures before circuit breaker trips (default: 5)
  circuitBreakerThreshold: 5,
}
```

### Exponential Backoff Algorithm

The delay grows exponentially based on attempt number:

```
delay = min(baseDelay * (2 ^ attempt), maxDelay)
```

**Example with baseDelay=1000, maxDelay=10000:**

| Attempt | Calculated Delay | Applied Delay |
|---------|------------------|---------------|
| 1       | 1000             | 1000ms        |
| 2       | 2000             | 2000ms        |
| 3       | 4000             | 4000ms        |
| 4       | 8000             | 8000ms        |
| 5       | 16000            | 10000ms (capped) |

This prevents overwhelming the server when it's recovering.

### Circuit Breaker Pattern

The circuit breaker prevents wasteful retries after repeated failures:

```typescript
const { isCircuitBreakerOpen } = useResilientQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retryConfig: {
    circuitBreakerThreshold: 5, // Trip after 5 failures
  },
})

// When isCircuitBreakerOpen is true, queries fail immediately
// without attempting to retry
```

**States:**

1. **Closed** (normal operation): Retries happen normally
2. **Open** (breaker tripped): Queries fail immediately without retrying
3. **Reset by Manual Retry**: User can manually retry to close the circuit

### Result Object

```typescript
interface ResilientQueryResult<TData, TError> {
  // Actual data from the query
  data: TData | undefined

  // Query is actively fetching
  isLoading: boolean

  // Query encountered an error
  isError: boolean

  // Error object if present
  error: TError | null

  // Circuit breaker is open (fail-fast mode)
  isCircuitBreakerOpen: boolean

  // Current retry attempt number
  retryAttempt: number

  // Manual retry function (resets circuit breaker)
  retry: () => void
}
```

### Callbacks

```typescript
const { data } = useResilientQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id),
  onSuccess: (user) => {
    console.log('User loaded:', user)
    // Update UI, analytics, etc.
  },
  onError: (error) => {
    console.error('Failed:', error)
    // Log to error tracking service
    // Show error notification
  },
})
```

## Common Patterns

### Handling Temporary Failures

```typescript
function DataDisplay() {
  const { data, isLoading, error, isCircuitBreakerOpen, retry } =
    useResilientQuery({
      queryKey: ['data'],
      queryFn: fetchData,
      retryConfig: {
        maxAttempts: 3,
        baseDelay: 1000,
        circuitBreakerThreshold: 5,
      },
    })

  if (isCircuitBreakerOpen) {
    return (
      <div className="error">
        Service is temporarily unavailable.
        <button onClick={retry}>Try Again</button>
      </div>
    )
  }

  if (isLoading) return <Spinner />
  if (error) return <Error message={error.message} onRetry={retry} />
  return <Data items={data} />
}
```

### Per-Query Configuration

Different endpoints may need different retry strategies:

```typescript
// API endpoint with high uptime - fewer retries
const apiData = useResilientQuery({
  queryKey: ['api', 'fast'],
  queryFn: fetchFastAPI,
  retryConfig: {
    maxAttempts: 2,
    baseDelay: 500,
    circuitBreakerThreshold: 10,
  },
})

// External API with variable reliability - more retries
const externalData = useResilientQuery({
  queryKey: ['external', 'slow'],
  queryFn: fetchExternalAPI,
  retryConfig: {
    maxAttempts: 5,
    baseDelay: 2000,
    circuitBreakerThreshold: 3,
  },
})
```

### Combining with Other Hooks

```typescript
function UserWorkflow() {
  // Main data fetch with resilience
  const user = useResilientQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  })

  // Related data fetch
  const tasks = useResilientQuery({
    queryKey: ['tasks', userId],
    queryFn: () => fetchUserTasks(userId),
    // Only fetch if user loaded successfully
    enabled: !!user.data,
  })

  if (user.isLoading) return <Loader />
  if (user.error) return <Error onRetry={user.retry} />

  return (
    <div>
      <UserCard user={user.data} />
      {tasks.isLoading && <Loader />}
      {tasks.error && <ErrorBoundary />}
      {tasks.data && <TaskList tasks={tasks.data} />}
    </div>
  )
}
```

## Implementation Details

### Circuit Breaker State Management

Circuit breaker state is stored globally per query key:

```typescript
// Different queries have independent circuit breakers
useResilientQuery({ queryKey: ['user', 1], ... })  // Circuit breaker 1
useResilientQuery({ queryKey: ['user', 2], ... })  // Circuit breaker 2
useResilientQuery({ queryKey: ['posts'], ... })     // Circuit breaker 3
```

**Resetting the Circuit Breaker:**

- Automatically resets on successful query
- Manually reset via the `retry()` function
- Resets after a recovery period (future enhancement)

### Integration with TanStack Query

Under the hood, `useResilientQuery`:

1. Wraps your query function with circuit breaker checks
2. Uses TanStack Query's native retry mechanism
3. Configures exponential backoff delays
4. Manages retry counts and state

```typescript
// Internally calls useQuery with:
useQuery({
  queryKey,
  queryFn: wrappedWithCircuitBreaker,
  retry: (failureCount) => {
    // Check circuit breaker
    // Check max attempts
    return shouldRetry
  },
  retryDelay: (attemptIndex) => {
    // Calculate exponential backoff
    return delay
  },
})
```

## Error Tracking

Integrate with error tracking services:

```typescript
import { captureException } from '@sentry/react'

useResilientQuery({
  queryKey: ['critical-data'],
  queryFn: fetchData,
  onError: (error) => {
    // Send to error tracking
    captureException(error, {
      tags: {
        source: 'resilient-query',
        endpoint: 'critical-data',
      },
    })
  },
})
```

## Testing

Test resilient queries with mock failures:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useResilientQuery } from '@/hooks'

describe('useResilientQuery', () => {
  it('should retry on failure and succeed', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValueOnce({ data: 'success' })

    const { result } = renderHook(() =>
      useResilientQuery({
        queryKey: ['test'],
        queryFn: mockFn,
        retryConfig: { maxAttempts: 3, baseDelay: 10 },
      }),
    )

    await waitFor(() => {
      expect(result.current.data).toEqual({ data: 'success' })
    })

    // Verify retry happened
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should open circuit breaker after threshold', async () => {
    const mockFn = jest
      .fn()
      .mockRejectedValue(new Error('Persistent failure'))

    const { result } = renderHook(() =>
      useResilientQuery({
        queryKey: ['test'],
        queryFn: mockFn,
        retryConfig: {
          maxAttempts: 2,
          circuitBreakerThreshold: 3,
          baseDelay: 10,
        },
      }),
    )

    await waitFor(() => {
      expect(result.current.isCircuitBreakerOpen).toBe(true)
    })
  })
})
```

## Performance Considerations

### Avoid Excessive Retries

Configure sensible retry limits:

```typescript
// ❌ Too aggressive
retryConfig: {
  maxAttempts: 10,
  baseDelay: 100,
  maxDelay: 100,
}

// ✅ Reasonable
retryConfig: {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
}
```

### Circuit Breaker Threshold

Set threshold based on traffic patterns:

```typescript
// Low-traffic endpoints: smaller threshold
{ circuitBreakerThreshold: 3 }

// High-traffic endpoints: larger threshold
{ circuitBreakerThreshold: 10 }
```

### Manual Retry Feedback

Always provide user feedback for manual retries:

```typescript
{
  error && !isCircuitBreakerOpen && (
    <button onClick={retry} disabled={isLoading}>
      {isLoading ? 'Retrying...' : 'Try Again'}
    </button>
  )
}
```

## Future Enhancements

Planned additions to the Resilience Framework:

1. **Automatic Circuit Breaker Reset**: After a timeout period
2. **Metrics Collection**: Track retry counts, circuit breaker trips
3. **Adaptive Backoff**: Adjust delays based on response times
4. **Health Checks**: Automatic recovery verification
5. **Bulk Operations**: Retry policies for batch operations

## Related Resources

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [Error Handling Guide](./ERROR_HANDLING.md)
