# NotificationBadge Component Implementation Guide

## Overview

The `NotificationBadge` component displays a real-time notification bell icon with an unread count badge in the app header. It serves as the entry point to open the Notification Center panel and provides visual feedback for incoming notifications.

## Component API

### Props

```typescript
interface NotificationBadgeProps {
  /** Number of unread notifications */
  unreadCount: number
  /** Callback when bell icon is clicked */
  onClick: () => void
  /** Whether the notification dropdown panel is open (default: false) */
  isOpen?: boolean
  /** Whether notifications are loading (default: false) */
  isLoading?: boolean
  /** Optional CSS class name for styling (default: '') */
  className?: string
}
```

## Features

✅ **Presentational Component**: Receives all state as props (dumb component pattern)
- Parent manages notification state via `useNotificationCenter` hook
- No internal state management
- Reusable across different contexts

✅ **Real-Time Updates**: Unread count updates automatically
- Counts polled every 30 seconds via `useNotifications` hook
- Updates instantly when `unreadCount` prop changes

✅ **Visual Feedback**:
- Bell icon with red badge when `unreadCount > 0`
- Badge caps at "99+" for counts exceeding 99
- Animated pulse dot that triggers when new notifications arrive
- Active state styling when panel is open

✅ **Accessibility**:
- Dynamic `aria-label` with unread count
- `aria-pressed` for button state
- `aria-expanded` for dropdown state
- Keyboard accessible: Enter/Space to trigger

✅ **Loading State**:
- Disabled button with opacity reduction during fetch
- Subtle skeleton animation while loading

## Usage Example

### Basic Integration in Header

```typescript
import { NotificationBadge } from '../components/NotificationCenter'
import { useNotificationCenter } from '../hooks/useNotificationCenter'

export function AppHeader() {
  const { isOpen, toggleDropdown, closeDropdown, unreadCount, isLoading } = useNotificationCenter()

  return (
    <header>
      <NotificationBadge
        unreadCount={unreadCount}
        onClick={toggleDropdown}
        isOpen={isOpen}
        isLoading={isLoading}
      />
      {/* NotificationCenter modal/panel would go here */}
    </header>
  )
}
```

### With Custom Styling

```typescript
<NotificationBadge
  unreadCount={unreadCount}
  onClick={toggleDropdown}
  isOpen={isOpen}
  className="mr-2"
/>
```

## Parent State Management

The parent component using `NotificationBadge` must manage:

1. **Notification State** via `useNotificationCenter`:
   - `unreadCount` - computed from notifications
   - `isOpen` - panel open/close state
   - `isLoading` - data fetch status
   - `toggleDropdown` - callback to toggle panel

2. **Provider Requirement**:
   - Parent must be wrapped in `NotificationCenterProvider` or have access to `useNotifications` hook
   - For dashboard apps: DashboardLayout or root layout provides context

## Pulse Animation

The component includes a pulse animation that triggers when `unreadCount` increases:

```typescript
// Animation detected via useRef to compare previous count
const prevCountRef = useRef(unreadCount)
const [showPulse, setShowPulse] = useState(false)

useEffect(() => {
  if (unreadCount > prevCountRef.current) {
    setShowPulse(true)
    const timer = setTimeout(() => setShowPulse(false), 2000)
    return () => clearTimeout(timer)
  }
  prevCountRef.current = unreadCount
}, [unreadCount])
```

The pulse dot:
- Appears for 2 seconds when new notifications arrive
- Uses Tailwind's `animate-pulse` class
- Provides visual alert without JavaScript timers

## Badge Display Logic

- **0 unread**: Badge hidden completely
- **1-99 unread**: Shows count number
- **100+ unread**: Shows "99+" cap

```typescript
const displayCount = unreadCount > 99 ? '99+' : String(unreadCount)
const showBadge = unreadCount > 0
```

## Integration Points

### DashboardLayout
Location: `src/pages/dashboard/DashboardLayout.tsx`
- Integrated in header next to breadcrumbs
- Uses `useNotificationCenter` hook
- Connected to `NotificationCenter` modal

### Root Layout
Location: `src/routes/__root.tsx`
- Part of main application navbar
- Should use context-based state management
- Connects to NotificationCenterModal

## Related Hooks

### `useNotificationCenter()`
Orchestrates notification center state and actions
- Returns: `isOpen, toggleDropdown, closeDropdown, unreadCount, isLoading, ...`
- Manages both notifications and preferences

### `useNotifications()`
Low-level hook for notification data
- Returns: `notifications, unreadCount, isLoading, markAsRead, ...`
- Handles polling and cache management

## Styling

Uses Tailwind CSS classes with dark theme:
- Background: `bg-slate-700` (active) / `hover:bg-slate-800` (hover)
- Text: `text-slate-400` / `text-slate-200` (hover)
- Badge: `bg-red-500`
- Focus ring: `focus:ring-blue-500`
- Animations: `animate-pulse`

## Accessibility Checklist

- ✅ `aria-label` dynamically updates with unread count
- ✅ `aria-pressed` reflects button state
- ✅ `aria-expanded` reflects panel state
- ✅ `type="button"` explicit type
- ✅ Keyboard accessible (Enter/Space)
- ✅ Focus ring visible for keyboard navigation
- ✅ `aria-hidden` on decorative elements (pulse dot)

## Testing

Key test scenarios:
1. Badge hidden when `unreadCount = 0`
2. Badge displays count for `1-99`
3. Badge shows "99+" when count > 99
4. Pulse animation triggers when count increases
5. Loading state disables button and shows skeleton
6. ARIA labels update correctly
7. Click callback fires on button click
8. Active state styling when `isOpen = true`

## Performance Considerations

- ✅ No internal hooks causing re-renders
- ✅ Stable prop changes from `useNotificationCenter`
- ✅ Pulse animation uses CSS, not JavaScript timers in render
- ✅ Memoization via `useRef` for animation detection
- ✅ All updates from parent prop changes

## Migration Notes

If replacing an older badge implementation:
1. Update parent to call `useNotificationCenter` hook
2. Change `unreadCount` from computed internally to passed as prop
3. Add `isLoading` prop if loading state wasn't implemented
4. Update imports to use correct component path
5. Verify Notification Center panel is properly wired
