# Mock Service Worker (MSW) Testing Patterns

This document outlines the MSW setup and patterns for testing TanStack Query integration with various API scenarios.

## Overview

Mock Service Worker (MSW) provides request mocking at the network level, making it ideal for testing React Query without hitting real APIs. This setup includes:

- **Server Setup**: Node.js server for test environment (`src/mocks/server.ts`)
- **Browser Setup**: Browser worker for development (`src/mocks/browser.ts`)
- **Test Utilities**: Helpers to simplify query testing (`src/test/utils/queryTestUtils.ts`)
- **Test Setup**: Vitest configuration (`src/test/setup.ts`)

## File Structure

```
src/
├── mocks/
│   ├── handlers.ts          # All API endpoint handlers
│   ├── server.ts            # Node.js server for tests (NEW)
│   ├── browser.ts           # Browser worker for dev
│   ├── route-handlers.ts    # Route-specific handlers
│   └── MSW_PATTERNS.md      # This file
├── test/
│   ├── setup.ts             # Vitest setup (NEW)
│   └── utils/
│       └── queryTestUtils.ts # Query testing helpers (NEW)
└── hooks/
    └── queries/
        └── __tests__/
            └── example.test.ts # Example tests (NEW)
```

## Setup

### 1. Vitest Configuration

Ensure your Vitest config includes the test setup file:

```typescript
// vite.config.ts or vitest.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    environment: 'jsdom',
  },
})
```

### 2. MSW Server

The `src/mocks/server.ts` file sets up the test server:

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
import { routeHandlers } from './route-handlers'

export const server = setupServer(...routeHandlers, ...handlers)
```

The test setup automatically:
- Starts the server before tests run
- Resets handlers after each test
- Closes the server after all tests complete

## Adding Mock Handlers

### Basic Pattern: Success Response

Add handlers to `src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/items', () => {
    return HttpResponse.json([
      { id: '1', title: 'Item 1' },
      { id: '2', title: 'Item 2' },
    ])
  }),

  http.get('/api/items/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({ id, title: `Item ${id}` })
  }),

  http.post('/api/items', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json(
      { id: '3', ...body },
      { status: 201 }
    )
  }),
]
```

### Error Handling Pattern

```typescript
http.delete('/api/items/:id', ({ params }) => {
  if (params.id === 'invalid') {
    return HttpResponse.json(
      { error: 'Item not found' },
      { status: 404 }
    )
  }
  return HttpResponse.json({ success: true })
})
```

### Async/Delay Pattern

```typescript
http.get('/api/slow-endpoint', async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))
  return HttpResponse.json({ data: 'delayed response' })
})
```

### Request Body Validation

```typescript
http.post('/api/users', async ({ request }) => {
  const body = await request.json()

  if (!body.email) {
    return HttpResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    )
  }

  return HttpResponse.json({ id: '1', ...body }, { status: 201 })
})
```

## Testing with TanStack Query

### Using Query Test Utils

The `queryTestUtils.ts` file provides helpers for testing queries:

#### 1. Create Test Client

```typescript
import { createTestQueryClient } from '@/test/utils/queryTestUtils'

let queryClient = createTestQueryClient()
```

#### 2. Render Query Hook

```typescript
import { renderQueryHook } from '@/test/utils/queryTestUtils'
import { useItems } from '@/hooks/queries/items'

const { result } = renderQueryHook(() => useItems(), {
  queryClient,
})
```

#### 3. Mock Success Response

```typescript
import { mockSuccessResponse } from '@/test/utils/queryTestUtils'

mockSuccessResponse('GET', '/api/items', [
  { id: '1', title: 'Item 1' },
])

const { result } = renderQueryHook(() => useItems(), {
  queryClient,
})
```

#### 4. Mock Error Response

```typescript
import { mockErrorResponse } from '@/test/utils/queryTestUtils'

mockErrorResponse('GET', '/api/items', { error: 'Server error' }, 500)

const { result } = renderQueryHook(() => useItems(), {
  queryClient,
})

// Test error handling
await waitFor(() => {
  expect(result.current.isError).toBe(true)
})
```

#### 5. Mock Slow Response

```typescript
import { mockSlowResponse } from '@/test/utils/queryTestUtils'

mockSlowResponse('GET', '/api/items', [...], 300)

const { result } = renderQueryHook(() => useItems(), {
  queryClient,
})

// Test loading state
expect(result.current.isPending).toBe(true)

await waitFor(() => {
  expect(result.current.isPending).toBe(false)
})
```

## Complete Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { waitFor } from '@testing-library/react'
import { QueryClient } from '@tanstack/react-query'
import {
  createTestQueryClient,
  renderQueryHook,
  mockSuccessResponse,
  mockErrorResponse,
} from '@/test/utils/queryTestUtils'
import { useItems } from '@/hooks/queries/items'

describe('useItems', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = createTestQueryClient()
  })

  it('should fetch items successfully', async () => {
    mockSuccessResponse('GET', '/api/items', [
      { id: '1', title: 'Item 1' },
    ])

    const { result } = renderQueryHook(() => useItems(), {
      queryClient,
    })

    expect(result.current.isPending).toBe(true)

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(1)
  })

  it('should handle errors', async () => {
    mockErrorResponse('GET', '/api/items', { error: 'Failed' }, 500)

    const { result } = renderQueryHook(() => useItems(), {
      queryClient,
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
```

## Key Patterns

### Pattern 1: Success, Error, and Loading States

Test the three main states of a query:

```typescript
// Test loading
expect(result.current.isPending).toBe(true)

// Test success
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})
expect(result.current.data).toBeDefined()

// Test error (in separate test)
mockErrorResponse(...)
expect(result.current.isError).toBe(true)
```

### Pattern 2: Cache Testing

Test TanStack Query's cache behavior:

```typescript
// First fetch
const { result: result1 } = renderQueryHook(() => useItems(), {
  queryClient,
})

await waitFor(() => {
  expect(result1.current.isSuccess).toBe(true)
})

// Verify cache
const cached = queryClient.getQueryData(itemKeys.list())
expect(cached).toEqual(result1.current.data)
```

### Pattern 3: Invalidation and Refetch

Test cache invalidation:

```typescript
// Initial fetch
await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})

// Invalidate cache
await queryClient.invalidateQueries({
  queryKey: itemKeys.list(),
})

// Should refetch
await waitFor(() => {
  expect(result.current.data).toBeDefined()
})
```

### Pattern 4: Mutation Testing

For mutations, override handlers as needed:

```typescript
import { mockSuccessResponse } from '@/test/utils/queryTestUtils'

// Mock the POST endpoint
mockSuccessResponse('POST', '/api/items', { id: '3', title: 'New' }, 201)

const { result } = renderHook(() => useCreateItem(), {
  wrapper: createQueryClientWrapper(queryClient),
})

// Trigger mutation
result.current.mutate({ title: 'New Item' })

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true)
})
```

## Best Practices

1. **Reset Handlers**: Always reset handlers after each test (done automatically in `setup.ts`)
2. **Use Test QueryClient**: Create fresh clients per test to avoid cross-test pollution
3. **Mock at API Level**: Only mock what you're testing; use real handlers for dependencies
4. **Test Error Cases**: Always test 404, 500, and timeout scenarios
5. **Use Query Keys**: Leverage query key factories (like `userKeys` in `users.ts`)
6. **Document Patterns**: Add comments explaining the mock setup for future maintainers

## Troubleshooting

### Handler Not Matching

```typescript
// ❌ Won't match POST
http.get('/api/items')

// ✅ Will match
http.post('/api/items')
```

### Query Not Using Fresh Handler

```typescript
// ❌ Stale cache from previous test
// The beforeEach creates a new queryClient, so this shouldn't happen

// ✅ Always create fresh queryClient in beforeEach
beforeEach(() => {
  queryClient = createTestQueryClient()
})
```

### Request Body Not Accessible

```typescript
// ❌ Body not properly extracted
const body = await request.text() // Wrong for JSON

// ✅ Use correct method
const body = await request.json()
```

## References

- [MSW Documentation](https://mswjs.io/)
- [TanStack Query Testing Guide](https://tanstack.com/query/latest/docs/react/testing)
- [Vitest Setup Files](https://vitest.dev/config/#setupfiles)
