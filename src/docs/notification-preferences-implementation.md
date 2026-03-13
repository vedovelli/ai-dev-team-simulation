# Notification Preferences Data Layer Implementation Guide

## Overview

This document describes the notification preferences system, which allows users to control which notifications they receive, how frequently, and via which delivery channels.

## Architecture

The notification preferences system follows the established TanStack Query + MSW pattern used throughout the application:

```
User UI Components
    ↓
useNotificationPreferences() Hook
    ↓
TanStack Query (Query + Mutation)
    ↓
Fetch API
    ↓
MSW Handlers (Development/Testing)
    ↓
API Endpoints (Production)
```

## Components

### Types (`src/types/notification-preferences.ts`)

**NotificationFrequency**
- `'instant'` - Receive notifications immediately
- `'daily'` - Receive a daily digest
- `'off'` - Disable notifications for this type

**NotificationChannel**
- `'in-app'` - Notifications appear in the app notification center
- `'email'` - Notifications sent via email

**NotificationTypePreferences**
Per-notification-type settings:
```typescript
{
  type: NotificationTypePreference
  frequency: NotificationFrequency
  channels: NotificationChannel[]
}
```

**NotificationPreferences**
Complete user preferences object:
```typescript
{
  userId: string
  enabled: boolean            // Global enable/disable
  types: NotificationTypePreferences[]
  updatedAt: string
}
```

### Hook (`src/hooks/useNotificationPreferences.ts`)

**Features**
- Fetch preferences with TanStack Query
- Update mutation with optimistic updates and rollback
- Cache invalidation for notifications query on successful update
- Exponential backoff retry logic
- 5-minute stale time (preferences rarely change)

**API**
```typescript
const {
  // Query state
  data,                    // Raw query data
  isLoading,              // Query loading state
  error,                  // Query error

  // Computed values
  preferences,            // NotificationPreferences object

  // Mutation state
  isUpdating,             // Update mutation loading state
  updateError,            // Update mutation error

  // Actions
  updatePreferences,      // (payload) => void
  resetPreferences,       // () => Promise<NotificationPreferences>
} = useNotificationPreferences()
```

**Partial Update Example**
```typescript
// Update only the enabled flag
updatePreferences({ enabled: false })

// Update preferences for specific notification types
updatePreferences({
  types: [
    { type: 'task_assigned', frequency: 'daily', channels: ['email'] },
    { type: 'sprint_started', frequency: 'off', channels: [] },
  ]
})
```

**Error Handling**
```typescript
const { updateError, isUpdating } = useNotificationPreferences()

if (updateError) {
  console.error('Failed to update preferences:', updateError.message)
}
```

### MSW Handler (`src/mocks/handlers/notification-preferences.ts`)

**Endpoints**

#### GET /api/notification-preferences
Returns the current user's notification preferences.

**Response**
```json
{
  "data": {
    "userId": "user-1",
    "enabled": true,
    "types": [
      { "type": "task_assigned", "frequency": "instant", "channels": ["in-app", "email"] },
      { "type": "sprint_started", "frequency": "instant", "channels": ["in-app", "email"] },
      { "type": "status_changed", "frequency": "instant", "channels": ["in-app"] }
    ],
    "updatedAt": "2026-03-13T10:00:00Z"
  },
  "success": true
}
```

#### PATCH /api/notification-preferences
Update user preferences with optional partial data.

**Request Body**
```json
{
  "enabled": false,
  "types": [
    { "type": "task_assigned", "frequency": "daily", "channels": ["email"] }
  ]
}
```

**Features**
- Merges updates with existing preferences
- Validates notification types
- Simulates 200ms network delay
- Returns updated preferences

**Response**
Same as GET endpoint.

#### POST /api/notification-preferences/reset
Reset preferences to defaults (all types enabled with instant frequency).

**Response**
Same as GET endpoint with reset values.

## Usage Examples

### Basic Usage
```typescript
import { useNotificationPreferences } from '@/hooks'

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, error, updatePreferences } = useNotificationPreferences()

  if (isLoading) return <div>Loading preferences...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Notification Preferences</h2>
      <label>
        <input
          type="checkbox"
          checked={preferences?.enabled ?? true}
          onChange={(e) => updatePreferences({ enabled: e.target.checked })}
        />
        Enable notifications
      </label>
    </div>
  )
}
```

### Per-Type Preferences
```typescript
function NotificationTypeSettings() {
  const { preferences, updatePreferences } = useNotificationPreferences()

  const handleFrequencyChange = (type, frequency) => {
    const updated = preferences?.types.map((t) =>
      t.type === type ? { ...t, frequency } : t
    )
    updatePreferences({ types: updated })
  }

  return (
    <div>
      {preferences?.types.map((typePrefs) => (
        <div key={typePrefs.type}>
          <label>{typePrefs.type}</label>
          <select
            value={typePrefs.frequency}
            onChange={(e) => handleFrequencyChange(typePrefs.type, e.target.value)}
          >
            <option value="instant">Instant</option>
            <option value="daily">Daily Digest</option>
            <option value="off">Off</option>
          </select>
        </div>
      ))}
    </div>
  )
}
```

### Optimistic Updates
The `useNotificationPreferences` hook automatically handles optimistic updates:

1. User submits form
2. UI updates immediately with new preferences
3. Request sent to server
4. If request succeeds: cache updated with server data
5. If request fails: UI reverts to previous state

```typescript
const { updatePreferences, isUpdating } = useNotificationPreferences()

// UI shows optimistic update immediately
<button
  onClick={() => updatePreferences({ enabled: false })}
  disabled={isUpdating}
>
  {isUpdating ? 'Saving...' : 'Disable All'}
</button>
```

## Cache Strategy

**Query Key**
```typescript
['notification-preferences']
```

**Cache Timing**
- Stale time: 5 minutes (preferences rarely change)
- GC time: 30 minutes (keep in cache for quick re-access)

**Invalidation**
The `notifications` query cache is invalidated on successful preference update to ensure any filtering/display logic responds to preference changes.

```typescript
// On successful update, invalidates notifications query
queryClient.invalidateQueries({ queryKey: ['notifications'] })
```

## Design Rationale

### Why Stale-While-Revalidate?
Preferences change infrequently, so keeping them cached for 5 minutes reduces server requests. If a user makes changes, the optimistic update ensures instant feedback.

### Partial Updates
The API accepts partial payloads to allow granular updates without requiring the full preferences object. The server merges incoming data with existing preferences.

### Channel Arrays
Notification types can have multiple delivery channels simultaneously (e.g., both in-app and email). This supports use cases like:
- Important notifications via both channels
- Urgent items only in-app
- Digest emails for less critical items

### Type Safety
All notification types are enumerated and validated:
```typescript
type NotificationTypePreference =
  | 'task_assigned'
  | 'task_unassigned'
  | 'sprint_started'
  // ... (full list in types file)
```

This prevents typos and provides autocomplete in IDEs.

## Future Extensions

This pattern is designed to be reusable for other user settings:

```typescript
// Theme preferences
type ThemePreference = 'light' | 'dark' | 'auto'

// Language preferences
type LanguagePreference = 'en' | 'es' | 'fr'

// Generic settings hook
useUserPreferences<T>(key: string)
```

## Testing

### Unit Tests
Test the hook with MSW handlers in a testing environment:

```typescript
import { render, screen } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { setupServer } from 'msw/node'
import { notificationPreferencesHandlers } from '@/mocks/handlers/notification-preferences'

const server = setupServer(...notificationPreferencesHandlers)

describe('useNotificationPreferences', () => {
  test('fetches and displays preferences', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <NotificationPreferencesPanel />
      </QueryClientProvider>
    )

    expect(await screen.findByText('Notification Preferences')).toBeInTheDocument()
  })
})
```

### Integration Tests
Test the full flow with components and user interactions.

## Notes

- The in-memory MSW store resets on every page reload (development only)
- Production implementation would use a database for persistence
- User ID is hardcoded to 'user-1' in MSW handler; production would use actual session context
- All timestamps are ISO 8601 format for consistency
