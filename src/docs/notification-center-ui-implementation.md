# NotificationCenter UI Implementation (FAB-347)

## Overview

The `NotificationCenterSimple` component is a user-facing notification center UI that surfaces the real-time notifications data layer from FAB-179 (PR #239). It provides a clean, accessible dropdown panel for viewing and managing notifications.

## Components

### NotificationCenterSimple
The main notification center component with a bell button and dropdown panel.

**Location**: `src/components/NotificationCenter/NotificationCenterSimple.tsx`

**Features**:
- Bell icon button with animated unread count badge
- Dropdown panel that opens/closes on click
- List of notifications with type-specific icons
- Relative timestamp display (e.g., "5m ago", "2h ago")
- Mark single notification as read on click
- "Mark all as read" button for batch operations
- Empty state when no notifications exist
- Loading spinner while fetching data
- Error state with helpful message
- Keyboard navigation (Escape to close)
- Click outside to close
- Focus management (returns focus to bell on close)

**Export**:
```typescript
export { NotificationCenterSimple } from './NotificationCenter'
```

## Data Layer Integration

The component uses the `useNotifications` hook from FAB-179 (PR #239):

```typescript
const {
  notifications,      // Array of Notification objects
  unreadCount,       // Number of unread notifications
  isLoading,         // Loading state
  isError,           // Error state
  error,             // Error object
  markAsRead,        // (id: string) => void - Mark single notification as read
  markMultipleAsRead,// (ids: string[]) => Promise<Notification[]> - Batch read
} = useNotifications()
```

### Query Configuration
- **Polling**: 30 seconds (configurable)
- **Stale Time**: 30 seconds
- **GC Time**: 2 minutes
- **Refetch on Focus**: Yes
- **Infinite Scroll**: Supported via `fetchNextPage`

## Acceptance Criteria ✅

- [x] NotificationCenter component with dropdown/panel display
- [x] List of notifications with type icons and timestamps
- [x] Mark-as-read on click (single notification)
- [x] Mark-all-as-read button
- [x] Unread count badge on trigger button
- [x] Empty state when no notifications
- [x] Loading and error states
- [x] Accessible (ARIA roles, keyboard navigation)

## Usage

### Basic Usage

Simply drop the component into your header or nav:

```tsx
import { NotificationCenterSimple } from '@/components/NotificationCenter'

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>My App</h1>
      <NotificationCenterSimple />
    </header>
  )
}
```

### In a Layout Component

```tsx
export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-white border-b flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <nav className="flex items-center gap-4">
          <NotificationCenterSimple />
          <UserMenu />
        </nav>
      </header>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

## Notification Types and Icons

The component displays different icons based on notification type:

| Type | Icon | Color | Event |
|------|------|-------|-------|
| `assignment_changed` | ✏️ Pencil | Blue | Task assignment changed |
| `task_assigned` | 📋 Task | Blue | User assigned to task |
| `task_reassigned` | 📋 Task | Blue | Task reassigned |
| `sprint_updated` | 📊 Grid | Green | Sprint lifecycle events |
| `sprint_started` | 📊 Grid | Green | Sprint started |
| `sprint_completed` | 📊 Grid | Green | Sprint completed |
| `deadline_approaching` | ⏰ Clock | Red | Time-sensitive alert |
| Other | 📋 Default | Gray | Generic notification |

## Styling and Customization

All styling uses Tailwind CSS classes. To customize:

1. **Bell button**: Modify `notificationButton` classes in `NotificationCenterSimple`
2. **Dropdown panel**: Modify `panelContent` classes
3. **Notification items**: Modify `NotificationItemSimple` classes
4. **Colors**: Change Tailwind color utilities (e.g., `blue-500` → `indigo-500`)

Example: Dark mode support

```tsx
// Add dark mode classes to panel
<div className="... dark:bg-gray-900 dark:border-gray-700 dark:text-white">
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Toggle dropdown panel |
| `Tab` | Navigate through interactive elements |
| `Escape` | Close dropdown, return focus to bell |
| `Enter` on notification | Mark notification as read (if unread) |

## Accessibility Features

- **ARIA Labels**: All buttons and landmarks have descriptive labels
- **ARIA Roles**: Panel has `role="dialog"`, items have `role="article"`
- **ARIA States**: `aria-expanded` indicates panel state, `aria-label` with unread count
- **Focus Management**: Focus returns to bell button when panel closes (Escape)
- **Semantic HTML**: Uses `<button>`, `<h2>`, semantic structure
- **Screen Reader Support**: Unread count announced, notification content read in context

## Performance Considerations

1. **Virtual Scrolling**: For large lists, consider using `useInfiniteNotifications` (advanced)
2. **Polling**: 30-second interval balances freshness with API load
3. **Memoization**: Component uses `useCallback` for event handlers to prevent re-renders
4. **Relative Timestamps**: Timestamps are computed on render for accuracy

## Error Handling

The component gracefully handles three error scenarios:

1. **Loading State**: Shows spinner while fetching initial notifications
2. **Error State**: Displays error message if fetch fails
3. **Empty State**: Shows helpful message when no notifications exist

## Testing

### Unit Tests

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationCenterSimple } from './NotificationCenterSimple'
import { useNotifications } from '@/hooks'

// Mock useNotifications
jest.mock('@/hooks', () => ({
  useNotifications: jest.fn(),
}))

describe('NotificationCenterSimple', () => {
  beforeEach(() => {
    (useNotifications as jest.Mock).mockReturnValue({
      notifications: [
        {
          id: '1',
          type: 'task_assigned',
          message: 'You were assigned a task',
          timestamp: new Date().toISOString(),
          read: false,
        },
      ],
      unreadCount: 1,
      isLoading: false,
      isError: false,
      error: null,
      markAsRead: jest.fn(),
      markMultipleAsRead: jest.fn(),
    })
  })

  it('renders bell button with unread count', () => {
    render(<NotificationCenterSimple />)
    expect(screen.getByLabelText(/notifications.*1 unread/i)).toBeInTheDocument()
  })

  it('opens panel on bell button click', async () => {
    const user = userEvent.setup()
    render(<NotificationCenterSimple />)

    await user.click(screen.getByLabelText(/notifications/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('marks notification as read on click', async () => {
    const markAsRead = jest.fn()
    ;(useNotifications as jest.Mock).mockReturnValue({
      // ... other properties
      markAsRead,
    })

    const user = userEvent.setup()
    render(<NotificationCenterSimple />)

    await user.click(screen.getByLabelText(/notifications/i))
    await user.click(screen.getByRole('article'))

    expect(markAsRead).toHaveBeenCalledWith('1')
  })

  it('closes panel on Escape key', async () => {
    const user = userEvent.setup()
    render(<NotificationCenterSimple />)

    await user.click(screen.getByLabelText(/notifications/i))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
```

### Integration Tests

Testing with actual notifications data:

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { NotificationCenterSimple } from './NotificationCenterSimple'

describe('NotificationCenterSimple Integration', () => {
  it('fetches and displays notifications', async () => {
    const queryClient = new QueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationCenterSimple />
      </QueryClientProvider>
    )

    const user = userEvent.setup()
    await user.click(screen.getByLabelText(/notifications/i))

    await waitFor(() => {
      expect(screen.getByText(/you were assigned/i)).toBeInTheDocument()
    })
  })
})
```

## Related Components

- **NotificationCenterPanel**: Advanced version with preferences filtering and bulk operations
- **NotificationItem**: Individual notification rendering
- **NotificationEmptyState**: Standalone empty state component
- **NotificationLoadingSkeleton**: Standalone loading skeleton

## Related Hooks

- **`useNotifications`** (FAB-179): Core hook for fetching and managing notifications
- **`useNotificationCenter`**: Higher-level orchestration of notifications + preferences
- **`useNotificationPreferences`** (FAB-188): User notification preferences and settings

## Frequently Asked Questions

### Q: Can I customize the dropdown width?
**A**: Yes, modify the `w-96` class in the panel to your preferred width (e.g., `w-80`, `w-full`).

### Q: How do I disable the automatic polling?
**A**: Pass options to `useNotifications` hook:
```tsx
const { ... } = useNotifications({ refetchInterval: false })
```

### Q: Can I use this with SSR?
**A**: Yes, the component handles SSR correctly. It only renders the dropdown panel on the client after hydration.

### Q: How do I add sound or browser notifications?
**A**: Listen to changes in the `unreadCount` and trigger notifications separately.

### Q: Can I filter by notification type?
**A**: Use `useNotificationCenter` hook instead, which supports type filtering via preferences.

## Migration from Old Notification System

If migrating from the old notification banner system:

1. Replace `<NotificationBanner />` with `<NotificationCenterSimple />`
2. Update any custom styling to use new class structure
3. Test mark-as-read behavior (now click-based instead of auto-dismiss)

## Future Enhancements

Potential features for future iterations:

- [ ] Notification preferences UI (snooze, mute)
- [ ] Search and filter notifications
- [ ] Notification categories/tabs
- [ ] Archive/delete actions
- [ ] Deep linking to notification source
- [ ] Sound/desktop notifications
- [ ] Push notifications via service worker

---

**Version**: 1.0.0
**Last Updated**: 2026-03-18
**Issue**: FAB-347
