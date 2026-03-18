import { NotificationCenterSimple } from './NotificationCenterSimple'

/**
 * Example usage of NotificationCenterSimple component
 *
 * This example shows how to integrate the notification center into your app header.
 *
 * The NotificationCenterSimple component is a self-contained dropdown that:
 * - Uses the useNotifications hook to fetch real-time notifications
 * - Displays a bell button with unread count badge
 * - Opens a dropdown panel on click
 * - Handles mark-as-read for single and multiple notifications
 * - Manages its own open/close state and keyboard interactions
 *
 * No props required - it's ready to use out of the box!
 */
export function NotificationCenterExample() {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <h1 className="text-2xl font-bold">My App</h1>

      {/* Just drop the component in your header! */}
      <NotificationCenterSimple />
    </div>
  )
}

/**
 * Example showing NotificationCenterSimple in a full header context
 */
export function HeaderWithNotifications() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Notification Center */}
          <NotificationCenterSimple />

          {/* Other header items... */}
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            Profile
          </button>
        </div>
      </div>
    </header>
  )
}

/**
 * Notes on using NotificationCenterSimple:
 *
 * 1. Data Source:
 *    - Uses useNotifications hook internally (FAB-179, PR #239)
 *    - Fetches from /api/notifications endpoint with 30s polling
 *    - Auto-refetches on window focus
 *    - Supports infinite scroll for large notification lists
 *
 * 2. Features:
 *    - Single mark-as-read: Click notification to mark as read
 *    - Batch mark-as-read: Click "Mark all as read" button
 *    - Auto-close on outside click or Escape key
 *    - Keyboard accessible (Tab, Enter, Escape)
 *    - Responsive design (works on all screen sizes)
 *
 * 3. Notification Types:
 *    - assignment_changed: Task assignment updates (blue icon)
 *    - sprint_updated: Sprint lifecycle events (green icon)
 *    - deadline_approaching: Time-sensitive alerts (red icon)
 *    - task_assigned/reassigned: Task-related events (purple icon)
 *    - Default fallback icon for other types (gray)
 *
 * 4. Styling:
 *    - Uses Tailwind CSS classes
 *    - Can be customized by modifying className strings
 *    - Bell button has hover and focus states
 *    - Dropdown has max-height and scrolls vertically
 *    - Unread notifications have blue background, read are muted
 *
 * 5. Accessibility:
 *    - ARIA labels on all interactive elements
 *    - role="dialog" on the dropdown panel
 *    - role="article" on individual notifications
 *    - aria-expanded to indicate open/close state
 *    - aria-haspopup to indicate button behavior
 *    - Escape key handling for screen readers
 *    - Focus management (return focus to bell on close)
 *    - Semantic HTML for better assistive technology support
 *
 * 6. Error Handling:
 *    - Loading spinner while fetching notifications
 *    - Empty state message when no notifications exist
 *    - Error state with message display if fetch fails
 *    - All states are fully styled and accessible
 */
