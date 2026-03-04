# TanStack Query Key Pattern Guide

This document describes the query key factory pattern used throughout the project for predictable cache invalidation and query organization.

## Overview

The query key factory pattern provides a centralized, type-safe way to manage cache keys across your application. This prevents typos, ensures consistency, and makes cache invalidation straightforward.

## Pattern Structure

Each query module exports a `Keys` object (e.g., `userKeys`, `itemKeys`) with the following structure:

```typescript
export const itemKeys = {
  all: ['items'] as const,           // Base key for all item queries
  lists: () => [...itemKeys.all, 'list'] as const,  // Namespace for list queries
  list: (filters?: Record<string, unknown>) =>      // Specific list query
    [...itemKeys.lists(), { ...filters }] as const,
  details: () => [...itemKeys.all, 'detail'] as const,  // Namespace for detail queries
  detail: (id: string) => [...itemKeys.details(), id] as const,  // Specific detail query
}
```

## Usage Examples

### Basic Query

```typescript
import { useItems, itemKeys } from '@/hooks/queries/items'

export function ItemsList() {
  const { data, isLoading } = useItems()

  // Query automatically uses itemKeys.list() as cache key
  return <div>{/* render items */}</div>
}
```

### Invalidating Cache

When mutations complete, invalidate related queries:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { itemKeys } from '@/hooks/queries/items'

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newItem) => {
      const res = await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(newItem),
      })
      return res.json()
    },
    onSuccess: () => {
      // Invalidate all item list queries
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}
```

### Partial Invalidation

```typescript
// Invalidate only a specific page
queryClient.invalidateQueries({
  queryKey: itemKeys.list({ page: 1, pageSize: 10 }),
})

// Invalidate only detail for a specific ID
queryClient.invalidateQueries({
  queryKey: itemKeys.detail('item-123'),
})
```

## Key Hierarchy

Keys are organized hierarchically to support partial invalidation:

```
['items']                              // all items
└── ['items', 'list']                  // all list queries
    └── ['items', 'list', {...filters}]  // specific list with filters
└── ['items', 'detail']                // all detail queries
    └── ['items', 'detail', 'id-1']    // specific item detail
```

This hierarchy allows you to:
- Invalidate all item caches: `itemKeys.all`
- Invalidate all lists: `itemKeys.lists()`
- Invalidate a specific list: `itemKeys.list({ page, pageSize })`
- Invalidate a specific detail: `itemKeys.detail(id)`

## Deduplication

TanStack Query automatically deduplicates requests when the same query key is used across multiple components:

```typescript
export function App() {
  return (
    <>
      <ItemsList />  {/* Makes request for itemKeys.list() */}
      <ItemsList />  {/* Reuses same cache, no duplicate request */}
    </>
  )
}
```

## Stale-While-Revalidate Pattern

Our hooks implement the stale-while-revalidate pattern:

```typescript
staleTime: 1000 * 60 * 5,     // 5 minutes - data is considered fresh
gcTime: 1000 * 60 * 10,       // 10 minutes - data is garbage collected
refetchOnWindowFocus: true,   // Refetch when user returns to window
```

- **Fresh**: Data is immediately used without making a request
- **Stale but usable**: Data is shown while a background refetch happens
- **Garbage collection**: After 10 minutes of inactivity, cached data is removed

## Benefits

1. **Type Safety**: Keys are strongly typed and autocompleted by TypeScript
2. **Consistency**: All queries use the same key structure
3. **Easy Invalidation**: Query invalidation is clear and predictable
4. **Automatic Deduplication**: Multiple components requesting the same data reuse cache
5. **Maintainability**: Centralizing keys makes refactoring easier

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Query Key Best Practices](https://tanstack.com/query/latest/docs/react/important-defaults)
