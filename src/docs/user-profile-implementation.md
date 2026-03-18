# User Profile & Settings Mutations with Conflict Resolution

## Overview

This guide covers the implementation of `useUserProfile` hook for managing user profile data with conflict resolution. The hook handles optimistic updates, 409 Conflict responses when settings change elsewhere, and provides a seamless user experience.

## Key Features

- **Optimistic Updates**: Changes apply immediately on the client while the request is in flight
- **Conflict Resolution**: 409 Conflict responses trigger automatic rollback + user notification
- **Exponential Backoff**: Automatic retry on 5xx errors (not on 409)
- **Last-Write-Loses Strategy**: On conflict, client changes are discarded in favor of server state
- **Toast Notifications**: User sees "Settings changed elsewhere, please refresh"
- **Type Safety**: Full TypeScript support with `SettingsConflict` error type

## Types

### UserProfile

```typescript
interface UserProfile {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  bio?: string
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'auto'
  createdAt: string
  updatedAt: string
  lastModified: string  // For 409 conflict detection
}
```

### UpdateProfilePayload

```typescript
interface UpdateProfilePayload {
  name?: string
  email?: string
  avatar?: string
  bio?: string
  timezone?: string
  language?: string
  theme?: 'light' | 'dark' | 'auto'
}
```

### SettingsConflict

Custom error type thrown when a 409 Conflict occurs:

```typescript
interface SettingsConflict extends Error {
  name: 'SettingsConflict'
  serverData: UserProfile
  lastModified: string
}
```

## Hook API

### Basic Usage

```typescript
import { useUserProfile } from '@/hooks'

function ProfileSettings() {
  const { profile, isUpdating, updateError, updateProfile } = useUserProfile()

  if (!profile) return <div>Loading...</div>

  return (
    <form>
      <input
        value={profile.name}
        onChange={(e) => updateProfile({ name: e.target.value })}
        disabled={isUpdating}
      />
      {updateError && <div className="error">{updateError.message}</div>}
    </form>
  )
}
```

### Hook Return Value

```typescript
{
  // Query state
  data: UserProfile | undefined
  isLoading: boolean
  isError: boolean
  isPending: boolean
  error: Error | null

  // Computed values
  profile: UserProfile | undefined

  // Mutation state
  isUpdating: boolean
  updateError: Error | null

  // Actions
  updateProfile: (patch: UpdateProfilePayload) => void
  updateProfileAsync: (patch: UpdateProfilePayload) => Promise<UserProfile>
  resetProfile: () => Promise<UserProfile>
}
```

## Conflict Handling

When the server detects a conflict (409 response):

1. **Automatic Rollback**: The optimistic update is reverted
2. **Toast Alert**: User sees notification: "Settings changed elsewhere, please refresh"
3. **No Retry**: 409 responses don't trigger automatic retries (last-write-loses)
4. **Server Data**: Hook updates cache with server's current state

### Implementation Detail

The hook uses `lastModified` timestamp from the profile for conflict detection. When sending an update, the client includes its current `lastModified` value. If the server's version is newer, it returns 409.

```typescript
// In useMutation.mutationFn:
const response = await fetch('/api/settings/profile', {
  method: 'PATCH',
  body: JSON.stringify({
    name: 'New Name',
    lastModified: currentData?.lastModified, // Client's version
  }),
})

if (response.status === 409) {
  // Server has a newer version
  const conflictData = await response.json() as ConflictResponse
  throw createConflictError(conflictData)
}
```

## Error Handling Patterns

### Handle Conflict Specifically

```typescript
function ProfileForm() {
  const { updateProfile, updateError } = useUserProfile()
  const toast = useToast()

  const handleUpdate = async () => {
    try {
      await updateProfile({ name: 'New Name' })
    } catch (error) {
      if (error instanceof Error && error.name === 'SettingsConflict') {
        // Specific handling for conflicts
        toast.warning('Your changes were not applied')
      }
    }
  }

  return (...)
}
```

### Retry Failed Updates

```typescript
function ProfileForm() {
  const { updateError, updateProfile } = useUserProfile()

  // Don't show retry button for 409 Conflicts
  const canRetry = updateError && updateError.name !== 'SettingsConflict'

  return (
    <>
      {canRetry && (
        <button onClick={() => updateProfile({ name: 'New Name' })}>
          Retry
        </button>
      )}
    </>
  )
}
```

### Use Async Variant

```typescript
async function saveAndNavigate() {
  const { updateProfileAsync } = useUserProfile()

  try {
    const updated = await updateProfileAsync({ theme: 'dark' })
    navigate(`/profile/${updated.id}`)
  } catch (error) {
    if (error instanceof Error && error.name === 'SettingsConflict') {
      // Handle conflict
    }
  }
}
```

## MSW Handler

The handler is configured to return 409 Conflict in two scenarios:

1. **Random 5% Chance**: Simulates unexpected concurrent updates
2. **Stale Timestamp**: If client's `lastModified` doesn't match server's

```typescript
// src/mocks/handlers/user-profile.ts
http.patch('/api/settings/profile', async ({ request }) => {
  // 5% random conflict
  if (Math.random() < 0.05) {
    return HttpResponse.json(conflictResponse, { status: 409 })
  }

  const payload = await request.json()
  
  // Check if client's lastModified is stale
  if (payload.lastModified !== serverLastModified) {
    return HttpResponse.json(conflictResponse, { status: 409 })
  }

  // Success - update and return
  ...
})
```

## Integration with Notification Preferences

The `useUserProfile` hook is designed to work alongside `useNotificationPreferences` for a unified settings experience. Both hooks:

- Use TanStack Query for data fetching
- Implement optimistic updates
- Handle errors gracefully
- Provide toast notifications

You can use both in the same settings component:

```typescript
function SettingsPanel() {
  const { profile, updateProfile } = useUserProfile()
  const { preferences, updatePreferences } = useNotificationPreferences()

  return (
    <div>
      <ProfileSection profile={profile} onUpdate={updateProfile} />
      <NotificationSection 
        preferences={preferences} 
        onUpdate={updatePreferences} 
      />
    </div>
  )
}
```

## Performance Considerations

### Query Staleness

- **Stale Time**: 5 minutes - profile data is considered fresh for 5 minutes
- **GC Time**: 10 minutes - cached data is garbage collected after 10 minutes
- **Refetch on Focus**: Automatically refetch when window regains focus

### Retry Logic

```typescript
// Exponential backoff on 5xx errors
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
// Attempt 1: 1000ms
// Attempt 2: 2000ms  
// Attempt 3: 4000ms
// Capped at 30 seconds
```

## Testing

### Mock Conflict Scenario

```typescript
import { server } from '@/mocks'
import { HttpResponse, http } from 'msw'

test('handles 409 conflict', async () => {
  server.use(
    http.patch('/api/settings/profile', () => {
      return HttpResponse.json(
        {
          error: 'CONFLICT',
          message: 'Settings changed elsewhere',
          code: 'SETTINGS_CONFLICT',
          serverData: { ...profile, name: 'Server Name' },
          lastModified: new Date().toISOString(),
        },
        { status: 409 }
      )
    })
  )

  const { updateProfile } = renderHook(() => useUserProfile())
  
  expect(() => updateProfile({ name: 'New Name' })).toThrow()
})
```

### Test Optimistic Updates

```typescript
test('applies optimistic update immediately', () => {
  const { profile, updateProfile } = renderHook(() => useUserProfile())
  
  // Profile starts with 'Alice'
  expect(profile?.name).toBe('Alice')
  
  // Update optimistically
  updateProfile({ name: 'Bob' })
  
  // Name changes immediately (before request completes)
  expect(profile?.name).toBe('Bob')
})
```

## Best Practices

1. **Always show loading state** while `isUpdating` is true
2. **Distinguish 409 errors** from other errors in UI
3. **Don't retry on 409** - last-write-loses means server wins
4. **Use async variant** when you need to wait for completion
5. **Invalidate related queries** if updating profile affects other data
6. **Validate before sending** - don't rely on server validation for UX

## v1 Limitations

This implementation uses a simple last-write-loses strategy:

- ❌ No automatic merge of conflicting changes
- ❌ No client-side conflict resolution UI
- ❌ No history of concurrent edits
- ✅ Simple to understand and implement
- ✅ Works well for single-user scenarios

For v2+, consider:
- Operational Transformation (OT) for real-time sync
- CRDT (Conflict-free Replicated Data Type)
- Client-side merge strategies
