# Notification Preferences Settings UI Implementation

## Overview

The `NotificationPreferencesPanel` provides a complete settings interface for managing notification preferences, including frequency, channels, and per-type controls. It wraps the `useNotificationPreferences` hook to deliver a user-friendly settings page with optimistic updates, unsaved-changes detection, and reset functionality.

## Architecture

### Files

- `src/components/NotificationPreferences/NotificationPreferencesPanel.tsx` — Main settings panel
- `src/components/NotificationPreferences/NotificationTypeRow.tsx` — Individual notification type control
- `src/components/NotificationPreferences/PreferencesSaveBar.tsx` — Sticky save/cancel/reset bar
- `src/components/NotificationPreferences/PreferencesSkeletonLoader.tsx` — Loading skeleton
- `src/components/NotificationPreferences/index.ts` — Barrel export
- `src/types/notification-preferences.ts` — Type definitions
- `src/hooks/useNotificationPreferences.ts` — Data fetching & mutation hook
- `src/mocks/handlers/notification-preferences.ts` — MSW handlers

## Components

### NotificationPreferencesPanel

Main container that:
- Fetches preferences via `useNotificationPreferences` hook
- Manages local form state with unsaved-changes detection
- Handles save, cancel, and reset operations
- Shows skeleton loader during fetch
- Displays success/error toast feedback
- Warns on navigation with unsaved changes

**Props**: None (uses hooks directly)

**Key Features**:
- Controlled form state synchronized with API data
- Unsaved-changes indicator with visual feedback
- Confirmation dialogs for destructive actions (reset, discard)
- Optimistic updates (via hook) with automatic rollback on error
- Keyboard-accessible fieldset grouping

### NotificationTypeRow

Renders controls for a single notification type:
- Enable/disable toggle (switch control)
- Frequency selector buttons (instant/daily/off)
- Channel toggles (in-app/email)

**Props**:
```typescript
interface NotificationTypeRowProps {
  type: string  // e.g., 'task_assigned'
  preference: NotificationTypePreference
  onChange: (preference: NotificationTypePreference) => void
}
```

**Accessibility**:
- Toggle switches have `aria-checked` and visible labels
- Frequency buttons disabled when toggle is off
- Channel toggles include screen-reader labels
- All controls keyboard accessible

### PreferencesSaveBar

Sticky bottom bar that appears when changes are detected:
- "Reset to Defaults" button
- "Cancel" button (reverts to last saved state)
- "Save" button (applies changes)
- Unsaved-changes indicator (pulsing dot + text)
- Disabled states during save operation

**Props**:
```typescript
interface PreferencesSaveBarProps {
  isVisible: boolean
  isSaving: boolean
  hasUnsavedChanges: boolean
  onSave: () => void
  onCancel: () => void
  onReset: () => void
}
```

### PreferencesSkeletonLoader

12-row skeleton matching the full UI layout with placeholders for:
- Notification type labels
- Toggle switches
- Frequency selector buttons
- Channel toggles

## Supported Notification Types

The panel controls all 12 notification types:

1. **assignment_changed** — User assignment status changed
2. **sprint_updated** — Sprint details or status updated
3. **task_reassigned** — Task reassigned to different agent
4. **deadline_approaching** — Task deadline approaching
5. **task_assigned** — User assigned to a task
6. **task_unassigned** — User unassigned from a task
7. **sprint_started** — Sprint moved to active status
8. **sprint_completed** — Sprint marked as completed
9. **comment_added** — New comment on task/sprint
10. **status_changed** — Task or sprint status changed
11. **agent_event** — General agent activity
12. **performance_alert** — Performance-related alerts

## State Management

### Local vs. API State

- **API state**: Fetched via `useNotificationPreferences` (5min cache, stale-while-revalidate)
- **Local state**: React state that mirrors API data, updated on form interaction
- **Unsaved changes**: Detected by comparing local state to API state
- **Save**: Diff detection sends only changed fields via PATCH

### Mutation Handling

Updates are handled via the `updatePreferences` function from the hook:
- Optimistic updates applied immediately
- Cache invalidated on success (notifications query refetched)
- Automatic rollback on error
- Exponential backoff retry (3 attempts)

### Reset Operation

The `resetPreferences` function calls `POST /api/notification-preferences/reset`:
- Directly updates the query cache with reset data
- Does not go through mutation optimistic update flow
- Clears unsaved-changes indicator

## Usage

### Basic Usage

```typescript
import { NotificationPreferencesPanel } from '@/components/NotificationPreferences'

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <NotificationPreferencesPanel />
    </div>
  )
}
```

### Integrate with Router

```typescript
// routes/settings.preferences.tsx
import { NotificationPreferencesPanel } from '@/components/NotificationPreferences'

export const Route = createFileRoute('/settings/preferences')({
  component: SettingsPreferencesPage,
})

function SettingsPreferencesPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Notification Settings</h2>
      <NotificationPreferencesPanel />
    </div>
  )
}
```

## Accessibility Features

### Keyboard Navigation

- All buttons accessible via Tab and Enter/Space
- Toggle switches use `role="switch"` and `aria-checked`
- Frequency buttons have descriptive `aria-label` attributes
- Channel toggles labeled with notification type and channel name
- Escape key dismisses any open confirmation dialogs (handled by browser)

### Screen Reader Support

- Fieldset with legend groups all notification controls
- Unsaved-changes indicator announces status via `role="status"` and `aria-live="polite"` (inherited from Toast)
- Toggle switches clearly labeled with notification type and purpose
- Form state changes announced via `aria-label` on buttons
- Confirmation dialogs use `window.confirm()` for native accessibility

### Visual Feedback

- Toggle states clearly indicated (color change + thumb position)
- Disabled states shown via opacity and cursor change
- Save button disabled when no unsaved changes
- Unsaved-changes indicator pulses (animation)
- Loading spinner in save button during operation

## Error Handling

### Fetch Errors

If loading fails:
- Skeleton shown briefly, then error message
- User can try again (manual page reload)
- Toast notification on mutation errors

### Save Errors

On failed save:
- Optimistic update rolled back automatically
- Error toast shown with error message
- Local form state preserved for retry
- Save bar remains visible

### Reset Errors

On failed reset:
- Cache not updated
- Error toast shown
- User prompted to try again

## Type Safety

Full TypeScript support with types exported from:
- `NotificationPreferences` — Complete preferences object
- `NotificationTypePreference` — Single type's preferences
- `NotificationFrequency` — 'instant' | 'daily' | 'off'
- `NotificationChannel` — 'in-app' | 'email'
- `UpdatePreferencesRequest` — Partial update payload

## Testing

### MSW Handlers

The hook uses MSW handlers that:
- `GET /api/notification-preferences` — Returns default preferences
- `PATCH /api/notification-preferences` — Updates and returns merged result (200ms delay)
- `POST /api/notification-preferences/reset` — Resets and returns defaults (200ms delay)

### Test Pattern

```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { NotificationPreferencesPanel } from '@/components/NotificationPreferences'
import { queryClient } from '@/lib/react-query'

test('toggles notification type', async () => {
  render(
    <QueryClientProvider client={queryClient}>
      <NotificationPreferencesPanel />
    </QueryClientProvider>
  )

  // Wait for load
  await screen.findByText('Notification Preferences')

  // Toggle a notification type
  const toggle = screen.getByLabelText(/toggle task assigned/i)
  await userEvent.click(toggle)

  // Unsaved changes indicator should appear
  expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
})
```

## Styling

Uses Tailwind CSS classes for:
- Toggle switches (blue when enabled, gray when disabled)
- Frequency buttons (blue background when selected)
- Channel toggles (green when enabled)
- Save bar (white background, shadow, z-40 layering)
- Responsive grid (1 col on mobile, 2 cols on tablet, 3 cols on desktop)
- Focus rings for keyboard navigation
- Disabled state opacity (50%)

## Performance Considerations

- Skeleton loader shown during fetch (prevents layout shift)
- Optimistic updates provide snappy UI feedback
- Local state prevents refetch on every keystroke
- Diff detection sends only changed fields (PATCH vs PUT)
- Debounce: none (form state updates immediately, save batches changes)

## Limitations & Future Enhancements

1. **No form validation** — All inputs are valid by design (toggles, predefined options)
2. **Single user** — No multi-device sync handling yet
3. **Quiet hours** — Global quiet hours in preferences type but not surfaced in UI (future feature)
4. **Batch operations** — Reset affects all types; per-category reset not supported yet
5. **Audit log** — No history of preference changes (future enhancement)

