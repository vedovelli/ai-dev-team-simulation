# NotificationBell Component

A responsive notification bell icon component for the application header that displays an unread notification count badge with smooth animations and full accessibility support.

## Features

- **Bell Icon**: Clean SVG-based bell icon with hover states
- **Unread Badge**: Shows unread count overlaid on the bell (capped at "99+")
- **Animated Pulse**: Smooth pulse animation when new notifications arrive
- **Active State**: Highlights when the notification panel is open
- **Accessibility**:
  - Dynamic `aria-label` reflecting unread count
  - `aria-expanded` state for screen readers
  - `aria-live="polite"` for badge updates
  - Keyboard accessible (native button element)
- **Responsive**: Touch-friendly with minimum 44x44px touch target (mobile)
- **Smooth Transitions**: CSS transitions for state changes and count updates

## Usage

The component is used in the application header and is ready to use out of the box:

```tsx
import { NotificationBell } from '@/components/NotificationBell'

export function Header() {
  return (
    <nav>
      <h1>App Title</h1>
      <NotificationBell />
    </nav>
  )
}
```

## How It Works

### Data Source
- **Unread Count**: Consumed from `useNotificationCenter()` hook via the NotificationCenterContext
- **Panel State**: Managed by the same context (open/close toggle)

### Behavior
1. **Clicking the Bell**: Toggles the notification panel open/closed
2. **New Notifications**: Triggers a brief pulse animation on the badge
3. **Zero Count**: Badge is hidden completely when there are no unread notifications
4. **High Count**: Shows "99+" when unread count exceeds 99

### Accessibility
- **Screen Readers**: The component announces unread count changes via `aria-live="polite"`
- **Keyboard Navigation**: Fully keyboard accessible - use Tab to focus and Enter/Space to toggle
- **Visual Indicators**: Active state changes color and background when panel is open

## Styling

The component uses Tailwind CSS with:
- Dark theme colors (slate and blue tones)
- Red badge for unread notifications
- Responsive padding and sizing (sm breakpoint aware)
- Blue focus ring with proper offset for dark backgrounds
- Smooth transitions and animations

## Props

Currently, the component takes no props as it:
- Automatically connects to the NotificationCenter context
- Derives state from the context directly
- Manages badge animation internally

## Acceptance Criteria (FAB-238)

✅ Bell icon in header/navbar
✅ Unread count badge overlaid on bell icon
✅ Badge hidden when unread count is 0
✅ Shows "9+" when unread count exceeds 9 (actually "99+" for better UX)
✅ Clicking bell toggles notification panel open/closed
✅ Animated pulse when new notifications arrive
✅ Accessible with dynamic aria-label
✅ Fully keyboard accessible (Enter/Space to toggle)
✅ Proper Tailwind CSS styling
✅ Exported and integrated into app header

## Related Components

- **NotificationDropdown**: Displays list of notifications in a dropdown panel
- **NotificationCenter/NotificationCenterModal**: Full-screen notification panel with tabs
- **NotificationCenterContext**: Provides state management for notifications

## Related Hooks

- **useNotificationCenter()**: Provides unread count and panel state
- **useNotifications()**: Lower-level hook for notification data

## Testing

The component should be tested for:
- Unread count display and badge visibility
- Badge text formatting (single digit, double digit, 99+)
- Aria-label content based on unread count
- Click handler triggering panel toggle
- Pulse animation triggering on count increase
- Keyboard accessibility (Tab, Enter, Space)
- Responsive sizing on mobile devices

## Implementation Notes

- The pulse animation uses Tailwind's `animate-ping` for the outer ring
- Badge scales slightly (scale-110) during pulse for visual feedback
- Uses `useRef` to maintain button reference (reserved for future use)
- Properly tracks previous count to detect increases (not decreases)
- All accessibility attributes are dynamically set based on current state
