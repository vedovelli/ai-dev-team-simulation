# Notification Center & Toast Integration Implementation (FAB-156)

## Overview

This document describes the implementation of the Notification Center UI component with integrated toast notifications. The system provides real-time visual feedback to users about system events, sprint updates, and performance alerts.

## Architecture

### Components

#### NotificationCenter
Main dropdown component displaying notifications with:
- **Badge count indicator** - Shows number of unread notifications
- **Dropdown panel** - Scrollable list of notifications
- **Mark as read actions** - Individual and batch mark-as-read
- **Empty state** - Shows when no notifications exist
- **Loading state** - Displays during data fetch
- **Keyboard navigation** - Escape key closes dropdown
- **Click outside detection** - Closes dropdown when clicking outside

**Location:** `src/components/NotificationCenter/NotificationCenter.tsx`

**Features:**
- 30-second polling interval (configurable)
- 20 notifications per page
- Optimistic UI updates
- Error handling with fallback

#### NotificationItem
Individual notification card component showing:
- **Category icon** - Visual indicator for notification type
- **Category badge** - Agent, Sprint, or Performance label
- **Message** - Truncated to 2 lines
- **Relative timestamp** - "2 minutes ago" format
- **Unread indicator** - Blue dot for unread notifications
- **Mark as read button** - Quick action for individual notifications

**Location:** `src/components/NotificationCenter/NotificationItem.tsx`

**Features:**
- Category-specific colors
- Smart icons for each notification type
- Optimistic UI feedback

#### ToastContainer
Overlay container that displays toast notifications for new unread notifications:
- **Auto-dismiss** - 5 seconds (configurable)
- **Toast variants** - Success, info, warning, error
- **Multiple stacking** - Shows multiple toasts simultaneously
- **Click to dismiss** - Immediate close on click

**Location:** `src/components/NotificationCenter/ToastContainer.tsx`

**Features:**
- Listens to notification cache changes
- Filters for unread notifications only
- Maps notification types to toast types
- Tracks displayed notifications to avoid duplicates

## Hooks

### useNotifications
Server-side notification fetching and management hook.

**Features:**
- 30-second automatic polling
- Refetch on window focus
- Unread count tracking
- Mark as read (single and batch)
- Pagination support
- Error retry logic with exponential backoff

**API Endpoints Used:**
- `GET /api/notifications` - Fetch notifications
- `PATCH /api/notifications/:id/read` - Mark single as read
- `PATCH /api/notifications/read-batch` - Mark multiple as read

**Query Key Structure:**
```typescript
['notifications', { type, unreadOnly, pageIndex, pageSize }]
```

**Stale Time:** 30 seconds  
**GC Time:** 5 minutes  
**Retry:** 3 attempts with exponential backoff

## Data Types

### Notification
```typescript
interface Notification {
  id: string
  type: 'agent_event' | 'sprint_change' | 'performance_alert'
  message: string
  timestamp: string
  read: boolean
  metadata?: Record<string, unknown>
}
```

### NotificationsResponse
```typescript
interface NotificationsResponse {
  data: Notification[]
  total: number
  unreadCount: number
}
```

## Notification Categories

### Agent Event
- **Icon:** User group icon
- **Color:** Blue
- **Examples:** Agent completed task, agent started working, code submitted

### Sprint Change
- **Icon:** Calendar/schedule icon
- **Color:** Purple
- **Examples:** Sprint velocity updated, sprint backlog refinement, sprint completed

### Performance Alert
- **Icon:** Alert circle icon
- **Color:** Orange
- **Examples:** Agent performance metrics, team velocity trending, sprint burndown

## Integration in Root Layout

Components integrated into `src/routes/__root.tsx`:

```typescript
// Imports
import { NotificationCenter, ToastContainer } from '../components/NotificationCenter'

// In navbar right section
<NotificationCenter />

// Below nav, before main outlet
<ToastContainer />
```

## Usage

### NotificationCenter Dropdown
1. Click bell icon to open dropdown
2. View notifications sorted by newest first
3. Unread notifications highlighted in blue
4. Click checkmark to mark individual as read
5. Click "Mark all as read" for batch operation
6. Press Escape or click outside to close

### ToastContainer
Toast notifications appear automatically:
1. New unread notifications trigger toast display
2. Auto-dismiss after 5 seconds
3. Click to dismiss immediately
4. Multiple toasts stack vertically in bottom-right

## Styling

All components use **Tailwind CSS**:

### NotificationCenter
- Dark theme with gray colors
- Blue badge (red-600) for unread count
- 96 width (384px) dropdown
- Scrollable at 600px max height

### NotificationItem
- Category-specific background colors
- Blue unread indicator dot
- Hover effects for interactivity
- Two-line text truncation
- Relative timestamps in gray

### ToastContainer
- Fixed bottom-right position
- Uses NotificationToast styling
- Z-index 40 for layering
- Vertical stacking with gaps

## Accessibility

### ARIA Attributes
- `aria-label` on bell button with unread count
- `aria-expanded` showing dropdown state
- `aria-haspopup="true"` on button
- `role="menu"` on dropdown
- `aria-live="polite"` on toast container
- All buttons have accessible labels

### Keyboard Support
- **Escape** - Close dropdown, dismiss toasts
- **Tab** - Navigate notifications
- **Enter/Space** - Mark as read, dismiss
- **Click outside** - Close dropdown

### Screen Readers
- Bell button announces unread count
- Each notification reads: type, message, timestamp
- Toasts use assertive announcements
- All interactive elements labeled

## Performance

### Query Optimization
- 30-second polling balances freshness vs. load
- 20 notifications per page limits initial data
- Stale-while-revalidate strategy for smooth UX
- Optimistic updates for instant feedback

### Component Rendering
- Dropdown only renders when open
- Toast container renders on demand
- List items keyed by notification ID
- Effect cleanup for event listeners

## Mock Data

MSW handlers in `src/mocks/handlers/notifications.ts` provide:

### GET /api/notifications
- 12 pre-generated notifications
- 4 unread, 8 read
- Realistic messages for each type
- Full pagination support
- Filtering by type and unread status

### PATCH /api/notifications/:id/read
Marks single notification as read.

### PATCH /api/notifications/read-batch
Marks multiple notifications as read.

## Files Created

- `src/components/NotificationCenter/NotificationCenter.tsx`
- `src/components/NotificationCenter/NotificationItem.tsx`
- `src/components/NotificationCenter/ToastContainer.tsx`
- `src/components/NotificationCenter/index.ts`
- `src/lib/utils.ts` (with getRelativeTime utility)

## Files Modified

- `src/routes/__root.tsx` - Added imports and components to layout

## Files Reused

- `src/hooks/useNotifications.ts` - Existing notification hook
- `src/types/notification.ts` - Existing types
- `src/mocks/handlers/notifications.ts` - Existing MSW handlers
- `src/components/Toast.tsx` - Existing toast provider
- `src/components/NotificationToast/NotificationToast.tsx` - Reused in ToastContainer
