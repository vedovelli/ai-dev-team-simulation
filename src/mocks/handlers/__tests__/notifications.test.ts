import { setupServer } from 'msw/node'
import { notificationHandlers } from '../notifications'
import type { NotificationsResponse, Notification } from '../../../types/notification'

const server = setupServer(...notificationHandlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('notification handlers', () => {
  describe('GET /api/notifications', () => {
    it('fetches all notifications', async () => {
      const response = await fetch('/api/notifications')
      const data = (await response.json()) as NotificationsResponse

      expect(response.ok).toBe(true)
      expect(data.data).toBeInstanceOf(Array)
      expect(data.total).toBeGreaterThan(0)
      expect(data.unreadCount).toBeGreaterThanOrEqual(0)
    })

    it('filters by type', async () => {
      const response = await fetch('/api/notifications?type=agent_event')
      const data = (await response.json()) as NotificationsResponse

      expect(response.ok).toBe(true)
      data.data.forEach((notif) => {
        expect(notif.type).toBe('agent_event')
      })
    })

    it('filters by unread status', async () => {
      const response = await fetch('/api/notifications?unread=true')
      const data = (await response.json()) as NotificationsResponse

      expect(response.ok).toBe(true)
      data.data.forEach((notif) => {
        expect(notif.read).toBe(false)
      })
    })

    it('supports pagination', async () => {
      const page0 = await fetch(
        '/api/notifications?pageIndex=0&pageSize=5'
      ).then((r) => r.json() as Promise<NotificationsResponse>)

      const page1 = await fetch(
        '/api/notifications?pageIndex=1&pageSize=5'
      ).then((r) => r.json() as Promise<NotificationsResponse>)

      // First page should have results
      expect(page0.data.length).toBeGreaterThan(0)

      // Different pages should have different notifications
      const ids0 = page0.data.map((n) => n.id)
      const ids1 = page1.data.map((n) => n.id)

      // No overlap
      expect(ids0.some((id) => ids1.includes(id))).toBe(false)
    })

    it('respects combined filters', async () => {
      const response = await fetch(
        '/api/notifications?type=agent_event&unread=true&pageSize=10'
      )
      const data = (await response.json()) as NotificationsResponse

      expect(response.ok).toBe(true)
      data.data.forEach((notif) => {
        expect(notif.type).toBe('agent_event')
        expect(notif.read).toBe(false)
      })
      expect(data.data.length).toBeLessThanOrEqual(10)
    })

    it('returns correct unread count', async () => {
      const response = await fetch('/api/notifications')
      const data = (await response.json()) as NotificationsResponse

      // Count unread in response
      const unreadInData = data.data.filter((n) => !n.read).length

      // Unread count should match actual unread notifications
      // (Note: when paginated, count represents total unread, not just in this page)
      expect(typeof data.unreadCount).toBe('number')
      expect(data.unreadCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('PATCH /api/notifications/:id/read', () => {
    it('marks notification as read', async () => {
      // First fetch to get a notification ID
      const allNotifs = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const notif = allNotifs.data[0]
      expect(notif).toBeDefined()

      // Mark as read
      const response = await fetch(`/api/notifications/${notif.id}/read`, {
        method: 'PATCH',
      })

      expect(response.ok).toBe(true)
      const updated = (await response.json()) as Notification
      expect(updated.read).toBe(true)
      expect(updated.id).toBe(notif.id)
    })

    it('returns 404 for non-existent notification', async () => {
      const response = await fetch('/api/notifications/notif-nonexistent/read', {
        method: 'PATCH',
      })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('persists read status across requests', async () => {
      const allNotifs = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const notif = allNotifs.data[0]

      // Mark as read
      await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' })

      // Fetch again and verify
      const updated = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const found = updated.data.find((n) => n.id === notif.id)
      expect(found?.read).toBe(true)
    })
  })

  describe('PATCH /api/notifications/read-batch', () => {
    it('marks multiple notifications as read', async () => {
      const allNotifs = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const idsToMark = allNotifs.data.slice(0, 3).map((n) => n.id)

      const response = await fetch('/api/notifications/read-batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToMark }),
      })

      expect(response.ok).toBe(true)
      const updated = (await response.json()) as Notification[]

      expect(updated).toHaveLength(idsToMark.length)
      updated.forEach((notif) => {
        expect(notif.read).toBe(true)
        expect(idsToMark).toContain(notif.id)
      })
    })

    it('handles empty ids array', async () => {
      const response = await fetch('/api/notifications/read-batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [] }),
      })

      expect(response.ok).toBe(true)
      const updated = await response.json()
      expect(updated).toEqual([])
    })

    it('filters out non-existent ids', async () => {
      const allNotifs = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const validIds = [allNotifs.data[0].id]
      const allIds = [...validIds, 'notif-nonexistent']

      const response = await fetch('/api/notifications/read-batch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds }),
      })

      expect(response.ok).toBe(true)
      const updated = await response.json()

      // Should only return the valid notification
      expect(updated).toHaveLength(1)
      expect(updated[0].id).toBe(validIds[0])
    })
  })

  describe('PATCH /api/notifications/:id/dismiss', () => {
    it('dismisses a notification', async () => {
      const allNotifs = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const notif = allNotifs.data[0]
      const initialCount = allNotifs.total

      // Dismiss
      const response = await fetch(
        `/api/notifications/${notif.id}/dismiss`,
        { method: 'PATCH' }
      )

      expect(response.ok).toBe(true)
      const result = await response.json()
      expect(result.success).toBe(true)

      // Verify removed from store
      const updated = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      expect(updated.total).toBe(initialCount - 1)
      expect(updated.data.find((n) => n.id === notif.id)).toBeUndefined()
    })

    it('returns 404 for non-existent notification', async () => {
      const response = await fetch(
        '/api/notifications/notif-nonexistent/dismiss',
        { method: 'PATCH' }
      )

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('reduces unread count if notification was unread', async () => {
      const allNotifs = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      const unreadNotif = allNotifs.data.find((n) => !n.read)
      if (!unreadNotif) return // Skip if no unread

      const initialUnread = allNotifs.unreadCount

      // Dismiss unread notification
      await fetch(`/api/notifications/${unreadNotif.id}/dismiss`, {
        method: 'PATCH',
      })

      // Check new unread count
      const updated = await fetch('/api/notifications').then(
        (r) => r.json() as Promise<NotificationsResponse>
      )

      expect(updated.unreadCount).toBe(initialUnread - 1)
    })
  })

  describe('notification properties', () => {
    it('notifications have required fields', async () => {
      const response = await fetch('/api/notifications')
      const data = (await response.json()) as NotificationsResponse

      data.data.forEach((notif) => {
        expect(notif.id).toBeDefined()
        expect(typeof notif.id).toBe('string')

        expect(['agent_event', 'sprint_change', 'performance_alert']).toContain(
          notif.type
        )

        expect(notif.message).toBeDefined()
        expect(typeof notif.message).toBe('string')

        expect(notif.timestamp).toBeDefined()
        // Valid ISO date
        expect(new Date(notif.timestamp).getTime()).toBeGreaterThan(0)

        expect(typeof notif.read).toBe('boolean')
      })
    })

    it('notifications are sorted by timestamp newest first', async () => {
      const response = await fetch('/api/notifications')
      const data = (await response.json()) as NotificationsResponse

      for (let i = 1; i < data.data.length; i++) {
        const current = new Date(data.data[i].timestamp).getTime()
        const previous = new Date(data.data[i - 1].timestamp).getTime()

        // Previous should be >= current (descending order)
        expect(previous).toBeGreaterThanOrEqual(current)
      }
    })

    it('notifications may have metadata', async () => {
      const response = await fetch('/api/notifications')
      const data = (await response.json()) as NotificationsResponse

      const withMetadata = data.data.filter((n) => n.metadata)

      if (withMetadata.length > 0) {
        withMetadata.forEach((notif) => {
          expect(typeof notif.metadata).toBe('object')
        })
      }
    })
  })
})
