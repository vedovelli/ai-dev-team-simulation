# Query Hooks Documentation

This directory contains TanStack Query hooks for data fetching with standardized error handling and retry logic.

## Core Concepts

### Query Client Configuration

The `QueryClient` is configured in `src/lib/queryClient.ts` with:
- **Stale-While-Revalidate**: Data is considered fresh for 5 minutes
- **Garbage Collection**: Unused data is kept for 10 minutes before cleanup
- **Retry Logic**: Automatic retry with exponential backoff for retriable errors
- **Window Focus**: Refetch is disabled when user returns to window

### Base Utilities

#### `useBaseQuery`

Base hook for all query operations with built-in retry logic and error handling.

**Features:**
- Exponential backoff retry strategy
- Smart error detection (network errors, timeouts, 5xx responses)
- Manual retry capability
- Recovery status tracking

**Usage:**
```tsx
import { useBaseQuery } from '@/hooks/queries/useBaseQuery'

function MyComponent() {
  const { data, error, isLoading, retry, isRecoverable } = useBaseQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
      {isRecoverable && <button onClick={retry}>Retry</button>}
    </div>
  )
}
```

## Creating New Query Hooks

### Pattern: Domain-Specific Query Hooks

Create hooks for specific data domains (users, tasks, projects) that leverage `useBaseQuery` and `useQueryCache`.

**Example: `useUsers` hook**

```tsx
import { useBaseQuery } from './useBaseQuery'
import { useQueryCache } from './useQueryCache'
import { queryKeys } from '@/lib/queryKeys'

export function useUsers(filters?: { role?: string }) {
  const { invalidateQueries } = useQueryCache()

  return useBaseQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters)
      const res = await fetch(`/api/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
    retryConfig: {
      maxRetries: 3,
      initialDelayMs: 500,
    }
  })
}

export function useUser(id: string | number) {
  return useBaseQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/users/${id}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      return res.json()
    },
  })
}
```

### Cache Invalidation Pattern

Use `useQueryCache` to invalidate queries after mutations:

```tsx
import { useMutation } from '@tanstack/react-query'
import { useQueryCache } from './useQueryCache'
import { queryKeys } from '@/lib/queryKeys'

export function useCreateUser() {
  const { invalidateQueries } = useQueryCache()

  return useMutation({
    mutationFn: async (newUser: NewUser) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      })
      if (!res.ok) throw new Error('Failed to create user')
      return res.json()
    },
    onSuccess: () => {
      // Invalidate the users list to refetch fresh data
      invalidateQueries(queryKeys.users.lists())
    },
  })
}
```

## Query Keys

Query keys are centrally managed in `src/lib/queryKeys.ts` following the **Factory Pattern**.

**Structure:**
```ts
export const queryKeys = {
  // Feature domain
  users: {
    all: ['users'],                              // All user queries
    lists: () => [...users.all, 'list'],         // All user list queries
    list: (filters) => [...lists(), { filters }], // Specific filtered list
    details: () => [...users.all, 'detail'],     // All user detail queries
    detail: (id) => [...details(), id],          // Specific user detail
  }
}
```

**Usage:**
```tsx
// In hooks
const { data } = useQuery({
  queryKey: queryKeys.users.list(),
  queryFn: fetchUsers,
})

// In cache invalidation
queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
```

## Error Handling

### Retry Configuration

Control retry behavior per query with `retryConfig`:

```tsx
useBaseQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retryConfig: {
    maxRetries: 5,                    // Max retry attempts
    initialDelayMs: 1000,             // Starting delay
    maxDelayMs: 60000,                // Cap delay at 1 minute
    backoffMultiplier: 2,             // Double delay each attempt
    shouldRetry: (error, attempt) => { // Custom retry logic
      return error.code !== 'NOT_FOUND'
    }
  }
})
```

### Error Boundaries

Wrap query-using components with error boundaries for graceful error handling:

```tsx
<ErrorBoundary>
  <UserProfile userId={id} />
</ErrorBoundary>
```

## Testing Query Hooks

Use `@tanstack/react-query` testing utilities:

```tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { useUser } from './users'

it('fetches user data', async () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  const { result } = renderHook(() => useUser('1'), { wrapper })

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  expect(result.current.data).toEqual({ id: '1', name: 'John' })
})
```

## Best Practices

1. **Always define query keys in `queryKeys.ts`** - Ensures consistency and enables predictable cache invalidation
2. **Use `useQueryCache` for mutations** - Automatically invalidate related queries after success
3. **Configure retry sensibly** - Not all errors are retriable (400s usually aren't)
4. **Type your query responses** - Always return typed data from query functions
5. **Test with QueryClient wrapper** - Queries need the provider in test environment
6. **Leverage stale-while-revalidate** - Balance freshness with responsiveness

## Existing Query Hooks

- `useQueryWithRetry` - Advanced retry strategies
- `useQueryCache` - Cache invalidation utilities
- `usePaginatedQuery` - Pagination support
- `useOptimisticUpdate` - Optimistic updates for mutations
- Domain-specific hooks: `useUsers`, `useTaskTable`, `useAgents`
