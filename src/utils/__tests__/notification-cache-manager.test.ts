import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { createNotificationCacheManager } from '../notification-cache-manager'
import type { Notification, PaginatedNotificationsResponse } from '../../types/notification'
import type { NotificationPreferences } from '../../types/notification-preferences'

describe('NotificationCacheManager', () => {
  let queryClient: QueryClient
  let manager: ReturnType<typeof createNotificationCacheManager>

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    manager = createNotificationCacheManager(queryClient)
  })

  describe('invalidateOnPreferenceChange', () => {
    it('should invalidate notifications query', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await manager.invalidateOnPreferenceChange()

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['notifications'],
        refetchType: 'active',
      })
    })
  })

  describe('invalidateOnTaskUpdate', () => {
    it('should invalidate both task detail and notifications queries', async () => {
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      await manager.invalidateOnTaskUpdate('task-123')

      expect(invalidateSpy).toHaveBeenCalledTimes(2)
      expect(invalidateSpy).toHaveBeenNthCalledWith(1, {
        queryKey: ['tasks', 'task-123'],
        refetchType: 'active',
      })
      expect(invalidateSpy).toHaveBeenNthCalledWith(2, {
        queryKey: ['notifications'],
        refetchType: 'active',
      })
    })
  })

  describe('filterDisabledNotifications', () => {
    it('should filter out disabled notification types', () => {
      const notifications: Notification[] = [
        { id: '1', type: 'assignment_changed', message: 'msg1', timestamp: '2026-01-01T00:00:00Z', read: false },
        { id: '2', type: 'sprint_updated', message: 'msg2', timestamp: '2026-01-01T00:00:00Z', read: false },
        { id: '3', type: 'task_assigned', message: 'msg3', timestamp: '2026-01-01T00:00:00Z', read: false },
      ]

      const preferences: NotificationPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        assignment_changed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_updated: { enabled: false, frequency: 'instant', channels: ['in-app'] },
        task_assigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_unassigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_reassigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_started: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_completed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        comment_added: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        status_changed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        agent_event: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        performance_alert: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        deadline_approaching: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      }

      const filtered = manager.filterDisabledNotifications(notifications, preferences)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].id).toBe('1')
      expect(filtered[1].id).toBe('3')
    })

    it('should keep all notifications when all types are enabled', () => {
      const notifications: Notification[] = [
        { id: '1', type: 'assignment_changed', message: 'msg1', timestamp: '2026-01-01T00:00:00Z', read: false },
        { id: '2', type: 'sprint_updated', message: 'msg2', timestamp: '2026-01-01T00:00:00Z', read: false },
      ]

      const preferences: NotificationPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        assignment_changed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_updated: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_assigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_unassigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_reassigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_started: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_completed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        comment_added: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        status_changed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        agent_event: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        performance_alert: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        deadline_approaching: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      }

      const filtered = manager.filterDisabledNotifications(notifications, preferences)

      expect(filtered).toHaveLength(2)
    })

    it('should keep notifications with unknown types', () => {
      const notifications: Notification[] = [
        { id: '1', type: 'unknown_type' as any, message: 'msg1', timestamp: '2026-01-01T00:00:00Z', read: false },
      ]

      const preferences: NotificationPreferences = {
        id: 'pref-1',
        userId: 'user-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        assignment_changed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_updated: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_assigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_unassigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        task_reassigned: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_started: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        sprint_completed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        comment_added: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        status_changed: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        agent_event: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        performance_alert: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        deadline_approaching: { enabled: true, frequency: 'instant', channels: ['in-app'] },
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
      }

      const filtered = manager.filterDisabledNotifications(notifications, preferences)

      expect(filtered).toHaveLength(1)
    })
  })

  describe('syncUnreadCount', () => {
    it('should return 0 when no notifications are cached', () => {
      const count = manager.syncUnreadCount()

      expect(count).toBe(0)
    })

    it('should count unread notifications across all pages', () => {
      const mockData = {
        pages: [
          {
            items: [
              { id: '1', type: 'assignment_changed' as const, message: 'msg1', timestamp: '2026-01-01T00:00:00Z', read: false },
              { id: '2', type: 'sprint_updated' as const, message: 'msg2', timestamp: '2026-01-01T00:00:00Z', read: true },
            ],
            nextCursor: 'cursor-1',
            hasMore: true,
            unreadCount: 1,
          } as PaginatedNotificationsResponse,
          {
            items: [
              { id: '3', type: 'task_assigned' as const, message: 'msg3', timestamp: '2026-01-01T00:00:00Z', read: false },
              { id: '4', type: 'deadline_approaching' as const, message: 'msg4', timestamp: '2026-01-01T00:00:00Z', read: false },
            ],
            nextCursor: null,
            hasMore: false,
            unreadCount: 2,
          } as PaginatedNotificationsResponse,
        ],
      }

      queryClient.setQueryData(['notifications', { unreadOnly: false }], mockData)

      const count = manager.syncUnreadCount()

      expect(count).toBe(3)
    })

    it('should handle pages with no unread notifications', () => {
      const mockData = {
        pages: [
          {
            items: [
              { id: '1', type: 'assignment_changed' as const, message: 'msg1', timestamp: '2026-01-01T00:00:00Z', read: true },
              { id: '2', type: 'sprint_updated' as const, message: 'msg2', timestamp: '2026-01-01T00:00:00Z', read: true },
            ],
            nextCursor: null,
            hasMore: false,
            unreadCount: 0,
          } as PaginatedNotificationsResponse,
        ],
      }

      queryClient.setQueryData(['notifications', { unreadOnly: false }], mockData)

      const count = manager.syncUnreadCount()

      expect(count).toBe(0)
    })
  })
})
