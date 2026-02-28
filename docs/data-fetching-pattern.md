# Data Fetching Pattern

This document describes the data fetching pattern used throughout the application using React Query and MSW (Mock Service Worker).

## Overview

We use **React Query** for client-side state management and caching of server data, combined with **MSW** for mocking API endpoints in development and testing.

## Creating a New Data Query

### 1. Define the Hook

Create a custom hook in `src/hooks/` that wraps the React Query logic:

```typescript
// src/hooks/useYourData.ts
import { useQuery } from '@tanstack/react-query'

export interface YourData {
  id: string
  name: string
  // ... other fields
}

const YOUR_DATA_QUERY_KEY = ['yourData']

async function fetchYourData(): Promise<YourData[]> {
  const response = await fetch('/api/your-data')
  if (!response.ok) {
    throw new Error('Failed to fetch your data')
  }
  return response.json()
}

export function useYourData() {
  return useQuery({
    queryKey: YOUR_DATA_QUERY_KEY,
    queryFn: fetchYourData,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}
```

### 2. Add MSW Handler

Add the corresponding MSW handler in `src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/your-data', () => {
    return HttpResponse.json([
      { id: '1', name: 'Item 1' },
      // ... mock data
    ])
  }),
]
```

### 3. Use the Hook in Components

```typescript
import { useYourData } from '../hooks/useYourData'

export function YourComponent() {
  const { data, isLoading, error } = useYourData()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {data?.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  )
}
```

## Query Key Convention

Use arrays as query keys with the resource name:
- `['teamMembers']` for team members data
- `['users', userId]` for specific user data
- `['users', userId, 'tasks']` for user-specific tasks

## React Query DevTools

React Query DevTools is automatically enabled in development mode. Open your browser DevTools to see:
- Query cache state
- Query history
- Background refetch behavior
- Stale time management

## Best Practices

1. **Always handle loading and error states** in components
2. **Use descriptive query keys** for easier debugging
3. **Set appropriate `staleTime`** based on data freshness requirements
4. **Mock all endpoints** before implementing real backend calls
5. **Type your data** with TypeScript interfaces
6. **Keep mock data realistic** for better UI testing

## Migration to Real API

When replacing MSW mocks with real API calls:
1. Update the fetch URL if needed (same if using absolute paths)
2. Remove or update the MSW handler
3. Test the hook with actual network requests
4. Verify error handling works with real API errors
