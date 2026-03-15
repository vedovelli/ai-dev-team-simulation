# NotificationDrawer Component

A slide-out drawer for displaying notifications grouped by type with quick-action buttons (mark as read, mark all as read).

## Features

- **Slide-in animation** from the right with smooth CSS transitions
- **Grouped notifications** by type (assignment_changed, sprint_updated, task_reassigned, deadline_approaching)
- **Notification items** showing icon, message, relative timestamp, and unread indicator
- **Quick actions**:
  - Mark individual notification as read
  - Mark all as read button in drawer header
- **States**:
  - Loading skeleton while fetching
  - Error state with retry button
  - Empty state with friendly message
- **Accessibility**:
  - Focus trap when open
  - Escape key to close
  - Keyboard navigation (Tab to cycle through focusable elements)
  - ARIA labels and semantic roles
  - Proper role="dialog" with aria-label
- **Responsive design**:
  - Full-screen width on mobile devices
  - Fixed 384px (md:w-96) width on desktop
  - Mobile backdrop overlay

## Usage

```tsx
import { NotificationDrawer } from './components/NotificationDrawer'
import { useState } from 'react'

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Notifications
      </button>

      <NotificationDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
```

## Data Source

The component uses `useNotificationCenter()` hook from `../../hooks/useNotificationCenter` which provides:

- `notifications` - Full list of notifications
- `unreadCount` - Count of unread notifications
- `isLoading` - Loading state
- `error` - Error state
- `groupedByType` - Notifications pre-grouped by type (Map)
- `markAsRead(id: string)` - Mark single notification as read
- `markAllAsRead()` - Mark all notifications as read

## Component Structure

### NotificationDrawer (Parent)
- Handles drawer open/close animation
- Manages keyboard navigation and focus trap
- Displays header with close button and unread count
- Shows action bar with "Mark all as read" button
- Renders loading/error/empty states
- Delegates notification rendering to NotificationGroup

### NotificationGroup
- Displays a collapsible group of notifications by type
- Shows group title and unread count badge
- Toggles expanded/collapsed state
- Delegates individual notification rendering to NotificationItem

### NotificationItem
- Renders a single notification
- Shows icon, message, timestamp, and unread indicator
- Handles click to mark as read
- Supports keyboard navigation (Enter/Space to mark as read)

## Styling

Uses Tailwind CSS with consistent styling:
- Light background with proper contrast
- Subtle hover effects
- Smooth transitions
- Icon colors vary by notification type:
  - Amber/Orange for deadline_approaching
  - Emerald/Green for sprint events
  - Blue for task/assignment events
  - Gray for default

## Accessibility Considerations

1. **Focus Management**:
   - Close button receives focus when drawer opens
   - Tab order is preserved within drawer
   - Focus trap prevents tabbing outside drawer when open

2. **Keyboard Support**:
   - Escape key closes drawer
   - Enter/Space marks notification as read
   - Tab/Shift+Tab navigate through focusable elements

3. **ARIA**:
   - Dialog role with proper labeling
   - aria-modal="true" on drawer
   - aria-expanded on group toggles
   - aria-label on buttons
   - Proper role="menuitem" on notification items

4. **Screen Reader**:
   - Unread count announced
   - Group titles announced
   - Notification content and timestamps read
   - Loading/error/empty states clearly communicated
