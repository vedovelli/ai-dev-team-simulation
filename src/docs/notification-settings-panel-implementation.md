# Notification Settings Panel Implementation Guide

## Overview

The NotificationSettingsPanel provides a user-friendly UI for managing notification preferences using TanStack Form for state management. It builds on the `useNotificationPreferences` hook from FAB-188.

## Architecture

```
NotificationSettingsPanel (Main Form Component)
    ├── useNotificationPreferences Hook (FAB-188)
    ├── TanStack Form for form state
    └── NotificationTypeRow × 12 (One per notification type)
```

## Component Structure

### NotificationSettingsPanel.tsx

Main form component that:
- Fetches preferences via `useNotificationPreferences`
- Manages form state with TanStack Form
- Tracks dirty state for unsaved changes
- Handles form submission with optimistic updates
- Renders categorized notification types
- Shows summary indicator ("8 of 12 enabled")

**Props**: None (uses hook directly)

**Key Features**:
- TanStack Form integration for state management
- Automatic dirty state tracking
- Optimistic updates with rollback on error
- Loading skeleton during fetch
- Error state with retry button
- Summary count of enabled notifications

### NotificationTypeRow.tsx

Row component for each notification type that renders:
- Master toggle (enabled/disabled)
- Frequency dropdown (instant/daily/off) - shown when enabled
- Channel toggles (in-app/email) - shown when enabled

**Props**:
```typescript
interface NotificationTypeRowProps {
  type: string // Notification type key
  field: FieldApi<...> // TanStack Form field API
}
```

**Label Mapping**:
All notification types have labels and descriptions:
- `task_assigned`: When a task is assigned to you
- `task_unassigned`: When a task is unassigned
- `task_reassigned`: When a task is reassigned
- `sprint_started`: When a sprint starts
- `sprint_completed`: When a sprint is completed
- `sprint_updated`: When sprint details are updated
- `assignment_changed`: When your assignment status changes
- `comment_added`: When comments are added
- `status_changed`: When status changes
- `deadline_approaching`: When a deadline is approaching
- `agent_event`: Agent activity notifications
- `performance_alert`: Performance-related alerts

## Usage

### Basic Integration

```typescript
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel'

export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <NotificationSettingsPanel />
    </div>
  )
}
```

### How It Works

1. **Load Preferences**
   - Component mounts and fetches preferences via `useNotificationPreferences`
   - Shows loading skeleton while fetching
   - Shows error state with retry button if fetch fails

2. **Display Form**
   - TanStack Form initializes with fetched preferences
   - Notifications organized into 3 categories:
     - Task Notifications (3 types)
     - Sprint Notifications (3 types)
     - System & Activity (6 types)

3. **User Interaction**
   - User toggles notifications, changes frequency, or toggles channels
   - Form values update immediately (optimistic)
   - Dirty state tracked to enable/disable save button

4. **Save Changes**
   - User clicks "Save Changes"
   - Form submits only changed fields (partial update)
   - `updatePreferences` mutation runs with optimistic update
   - If successful: UI confirms, dirty state cleared
   - If failed: UI reverts to previous state, error shown

## Form Structure

TanStack Form manages one field per notification type:

```typescript
const formValues = {
  task_assigned: {
    enabled: true,
    frequency: 'instant',
    channels: ['in-app', 'email']
  },
  // ... 11 more notification types
}
```

Each field is a `NotificationTypePreference`:
```typescript
interface NotificationTypePreference {
  enabled: boolean
  frequency: 'instant' | 'daily' | 'off'
  channels: ('in-app' | 'email')[]
}
```

## UI States

### Loading State
Shows skeleton with animated placeholders while preferences are fetching.

### Error State
Shows error message with retry button if fetch fails. Allows user to retry without page reload.

### Normal State
Shows categorized notification rows with:
- Master toggle for each type
- Frequency dropdown (visible when enabled)
- Channel toggles (visible when enabled)
- Summary indicator in header ("8 of 12 enabled")

### Unsaved Changes
- Save button disabled until changes are made
- "Unsaved changes" indicator appears next to save button
- Changes revert to last saved state on error

## Integration with FAB-188

This component uses the `useNotificationPreferences` hook from FAB-188:

```typescript
const {
  preferences,        // Fetched preferences
  isLoading,         // Query loading state
  isError,           // Query error state
  error,             // Error object with message
  isUpdating,        // Mutation loading state
  updatePreferences, // (patch) => void
  refetch,           // () => Promise
} = useNotificationPreferences()
```

The component calls `updatePreferences(patch)` with a partial object:
```typescript
// Only changed fields are sent
updatePreferences({
  task_assigned: { enabled: true, frequency: 'daily', channels: ['email'] },
  sprint_updated: { enabled: false, frequency: 'off', channels: [] }
})
```

The hook handles:
- Optimistic updates
- Rollback on error
- Cache invalidation
- Retry logic

## Styling

All components use Tailwind CSS with:
- Slate color palette for general UI
- Blue for primary actions and focus states
- Green for channel toggles
- Red for error states and dangerous actions

Responsive design supports mobile and desktop layouts.

## Accessibility

- Semantic HTML with proper form elements
- ARIA labels for toggles and interactive elements
- Focus ring indicators on keyboard navigation
- Proper heading hierarchy
- Descriptive text for each notification type

## Example Scenario

User wants to disable task assignment notifications except for email:

1. Navigates to settings page
2. Finds "Task Assigned" row under "Task Notifications"
3. Clicks toggle to disable (enabled → false)
4. Frequency and channel controls hide
5. Clicks "Save Changes"
6. Mutation sends: `{ task_assigned: { enabled: false, frequency: 'off', channels: [] } }`
7. UI updates optimistically
8. Server confirms changes
9. Dirty state clears, "Unsaved changes" indicator disappears

## Testing

### Component Testing

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { NotificationSettingsPanel } from '@/components/NotificationSettingsPanel'

describe('NotificationSettingsPanel', () => {
  it('renders notification types', async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <NotificationSettingsPanel />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Task Assigned')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    // Mock useNotificationPreferences to return error
    render(<NotificationSettingsPanel />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
    })
  })
})
```

## Future Enhancements

- Quiet hours settings (already in type, not UI yet)
- Notification preview/examples
- Bulk operations (enable/disable all)
- Recently changed indicator
- Export/import preferences

## Notes

- All 12 notification types are always displayed
- Categories are UI-only; no database grouping
- Frequency "off" automatically clears channels
- Empty channels array with enabled=true shows no notifications
- Form values update immediately (optimistic UI)
- Save button disabled until unsaved changes exist
