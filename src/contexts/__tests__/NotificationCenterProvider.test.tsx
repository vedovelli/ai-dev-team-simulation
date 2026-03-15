import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NotificationCenterProvider } from '../NotificationCenterContext'
import { useNotificationCenter } from '../../hooks/useNotificationCenter'
import type { Notification } from '../../types/notification'

// Mock the hooks
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    markAsRead: vi.fn(),
    markMultipleAsRead: vi.fn(async (ids: string[]) => []),
    dismissNotification: vi.fn(async () => {}),
  })),
}))

vi.mock('../../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: vi.fn(() => ({
    preferences: undefined,
    isLoading: false,
    error: null,
    updatePreferences: vi.fn(),
    resetPreferences: vi.fn(),
  })),
}))

describe('NotificationCenterProvider', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  function renderWithProvider(component: React.ReactNode) {
    return render(
      <QueryClientProvider client={queryClient}>
        <NotificationCenterProvider>
          {component}
        </NotificationCenterProvider>
      </QueryClientProvider>,
    )
  }

  describe('NotificationCenterProvider initialization', () => {
    it('provides context with default values', () => {
      function TestComponent() {
        const context = useNotificationCenter()
        return (
          <div>
            <div data-testid="unread-count">{context.unreadCount}</div>
            <div data-testid="is-loading">{String(context.isLoading)}</div>
            <div data-testid="is-panel-open">{String(context.isPanelOpen)}</div>
            <div data-testid="active-filter">{context.activeFilter}</div>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      expect(screen.getByTestId('unread-count')).toHaveTextContent('0')
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false')
      expect(screen.getByTestId('is-panel-open')).toHaveTextContent('false')
      expect(screen.getByTestId('active-filter')).toHaveTextContent('all')
    })

    it('throws error when used outside provider', () => {
      function TestComponent() {
        useNotificationCenter()
        return <div>Test</div>
      }

      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useNotificationCenter must be used within NotificationCenterProvider')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Filtering logic', () => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'assignment_changed',
        message: 'You were assigned to Task 1',
        timestamp: '2026-03-13T10:00:00Z',
        read: false,
      },
      {
        id: '2',
        type: 'assignment_changed',
        message: 'You were assigned to Task 2',
        timestamp: '2026-03-13T11:00:00Z',
        read: true,
      },
      {
        id: '3',
        type: 'sprint_updated',
        message: 'Sprint 1 has been updated',
        timestamp: '2026-03-13T12:00:00Z',
        read: false,
      },
      {
        id: '4',
        type: 'task_reassigned',
        message: 'Task 1 was reassigned',
        timestamp: '2026-03-13T13:00:00Z',
        read: true,
      },
    ]

    it('filters by "all" - shows all notifications', () => {
      const { useNotifications } = require('../../hooks/useNotifications')
      useNotifications.mockReturnValue({
        notifications: mockNotifications,
        unreadCount: 2,
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markMultipleAsRead: vi.fn(async (ids: string[]) => []),
        dismissNotification: vi.fn(async () => {}),
      })

      function TestComponent() {
        const { filteredNotifications } = useNotificationCenter()
        return (
          <div>
            {filteredNotifications.map((notif) => (
              <div key={notif.id} data-testid={`notif-${notif.id}`}>
                {notif.message}
              </div>
            ))}
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      expect(screen.getByTestId('notif-1')).toBeInTheDocument()
      expect(screen.getByTestId('notif-2')).toBeInTheDocument()
      expect(screen.getByTestId('notif-3')).toBeInTheDocument()
      expect(screen.getByTestId('notif-4')).toBeInTheDocument()
    })

    it('filters by "unread" - shows only unread notifications', () => {
      const { useNotifications } = require('../../hooks/useNotifications')
      useNotifications.mockReturnValue({
        notifications: mockNotifications,
        unreadCount: 2,
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markMultipleAsRead: vi.fn(async (ids: string[]) => []),
        dismissNotification: vi.fn(async () => {}),
      })

      function TestComponent() {
        const { activeFilter, filteredNotifications, setFilter } = useNotificationCenter()

        return (
          <div>
            <button onClick={() => setFilter('unread')}>Filter Unread</button>
            <div data-testid="active-filter">{activeFilter}</div>
            <div data-testid="filtered-count">{filteredNotifications.length}</div>
            {filteredNotifications.map((notif) => (
              <div key={notif.id} data-testid={`notif-${notif.id}`}>
                {notif.message}
              </div>
            ))}
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      fireEvent.click(screen.getByText('Filter Unread'))

      expect(screen.getByTestId('active-filter')).toHaveTextContent('unread')
      expect(screen.getByTestId('filtered-count')).toHaveTextContent('2')
      expect(screen.getByTestId('notif-1')).toBeInTheDocument()
      expect(screen.getByTestId('notif-3')).toBeInTheDocument()
      expect(screen.queryByTestId('notif-2')).not.toBeInTheDocument()
      expect(screen.queryByTestId('notif-4')).not.toBeInTheDocument()
    })

    it('filters by notification type', () => {
      const { useNotifications } = require('../../hooks/useNotifications')
      useNotifications.mockReturnValue({
        notifications: mockNotifications,
        unreadCount: 2,
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markMultipleAsRead: vi.fn(async (ids: string[]) => []),
        dismissNotification: vi.fn(async () => {}),
      })

      function TestComponent() {
        const { filteredNotifications, setFilter } = useNotificationCenter()

        return (
          <div>
            <button onClick={() => setFilter('assignment_changed')}>
              Filter by Type
            </button>
            <div data-testid="filtered-count">{filteredNotifications.length}</div>
            {filteredNotifications.map((notif) => (
              <div key={notif.id} data-testid={`notif-${notif.id}`}>
                {notif.message}
              </div>
            ))}
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      fireEvent.click(screen.getByText('Filter by Type'))

      expect(screen.getByTestId('filtered-count')).toHaveTextContent('2')
      expect(screen.getByTestId('notif-1')).toBeInTheDocument()
      expect(screen.getByTestId('notif-2')).toBeInTheDocument()
      expect(screen.queryByTestId('notif-3')).not.toBeInTheDocument()
      expect(screen.queryByTestId('notif-4')).not.toBeInTheDocument()
    })
  })

  describe('Panel state management', () => {
    it('toggles panel open/closed', () => {
      function TestComponent() {
        const { isPanelOpen, togglePanel } = useNotificationCenter()

        return (
          <div>
            <div data-testid="panel-state">{String(isPanelOpen)}</div>
            <button onClick={togglePanel}>Toggle Panel</button>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      expect(screen.getByTestId('panel-state')).toHaveTextContent('false')

      fireEvent.click(screen.getByText('Toggle Panel'))
      expect(screen.getByTestId('panel-state')).toHaveTextContent('true')

      fireEvent.click(screen.getByText('Toggle Panel'))
      expect(screen.getByTestId('panel-state')).toHaveTextContent('false')
    })

    it('opens panel', () => {
      function TestComponent() {
        const { isPanelOpen, openPanel } = useNotificationCenter()

        return (
          <div>
            <div data-testid="panel-state">{String(isPanelOpen)}</div>
            <button onClick={openPanel}>Open Panel</button>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      expect(screen.getByTestId('panel-state')).toHaveTextContent('false')

      fireEvent.click(screen.getByText('Open Panel'))
      expect(screen.getByTestId('panel-state')).toHaveTextContent('true')
    })

    it('closes panel', () => {
      function TestComponent() {
        const { isPanelOpen, closePanel, openPanel } = useNotificationCenter()

        return (
          <div>
            <div data-testid="panel-state">{String(isPanelOpen)}</div>
            <button onClick={openPanel}>Open</button>
            <button onClick={closePanel}>Close</button>
          </div>
        )
      }

      renderWithProvider(<TestComponent />)

      fireEvent.click(screen.getByText('Open'))
      expect(screen.getByTestId('panel-state')).toHaveTextContent('true')

      fireEvent.click(screen.getByText('Close'))
      expect(screen.getByTestId('panel-state')).toHaveTextContent('false')
    })
  })

  describe('markAllAsRead action', () => {
    it('calls markMultipleAsRead with all unread IDs', async () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'assignment_changed',
          message: 'Notification 1',
          timestamp: '2026-03-13T10:00:00Z',
          read: false,
        },
        {
          id: '2',
          type: 'sprint_updated',
          message: 'Notification 2',
          timestamp: '2026-03-13T11:00:00Z',
          read: false,
        },
        {
          id: '3',
          type: 'task_reassigned',
          message: 'Notification 3',
          timestamp: '2026-03-13T12:00:00Z',
          read: true,
        },
      ]

      const mockMarkMultipleAsRead = vi.fn(async (ids: string[]) => [])

      const { useNotifications } = require('../../hooks/useNotifications')
      useNotifications.mockReturnValue({
        notifications: mockNotifications,
        unreadCount: 2,
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markMultipleAsRead: mockMarkMultipleAsRead,
        dismissNotification: vi.fn(async () => {}),
      })

      function TestComponent() {
        const { markAllAsRead } = useNotificationCenter()

        return (
          <button onClick={() => markAllAsRead()}>Mark All as Read</button>
        )
      }

      renderWithProvider(<TestComponent />)

      fireEvent.click(screen.getByText('Mark All as Read'))

      await waitFor(() => {
        expect(mockMarkMultipleAsRead).toHaveBeenCalledWith(['1', '2'])
      })
    })

    it('does not call markMultipleAsRead if no unread notifications', async () => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'assignment_changed',
          message: 'Notification 1',
          timestamp: '2026-03-13T10:00:00Z',
          read: true,
        },
        {
          id: '2',
          type: 'sprint_updated',
          message: 'Notification 2',
          timestamp: '2026-03-13T11:00:00Z',
          read: true,
        },
      ]

      const mockMarkMultipleAsRead = vi.fn(async (ids: string[]) => [])

      const { useNotifications } = require('../../hooks/useNotifications')
      useNotifications.mockReturnValue({
        notifications: mockNotifications,
        unreadCount: 0,
        isLoading: false,
        error: null,
        markAsRead: vi.fn(),
        markMultipleAsRead: mockMarkMultipleAsRead,
        dismissNotification: vi.fn(async () => {}),
      })

      function TestComponent() {
        const { markAllAsRead } = useNotificationCenter()

        return (
          <button onClick={() => markAllAsRead()}>Mark All as Read</button>
        )
      }

      renderWithProvider(<TestComponent />)

      fireEvent.click(screen.getByText('Mark All as Read'))

      await waitFor(() => {
        expect(mockMarkMultipleAsRead).not.toHaveBeenCalled()
      })
    })
  })
})
