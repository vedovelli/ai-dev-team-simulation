import { http, HttpResponse } from 'msw'
import type { UserProfile, UpdateProfilePayload, ConflictResponse } from '../../types/user-profile'

/**
 * Generate default user profile
 */
function generateDefaultProfile(): UserProfile {
  return {
    id: 'profile-1',
    userId: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: undefined,
    bio: 'Software engineer passionate about clean code',
    timezone: 'UTC',
    language: 'en',
    theme: 'auto',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  }
}

/**
 * In-memory store for user profile
 * In production, this would be persisted in a database
 */
let profileStore = generateDefaultProfile()

/**
 * Track the "stale" timestamp for conflict simulation
 * When a PATCH comes in with an older lastModified, we return 409
 */
let serverLastModified = profileStore.lastModified

export const userProfileHandlers = [
  /**
   * GET /api/settings/profile
   * Fetch current user's profile
   */
  http.get('/api/settings/profile', () => {
    return HttpResponse.json({
      data: profileStore,
    })
  }),

  /**
   * PATCH /api/settings/profile
   * Update user's profile
   * 
   * Features:
   * - Optimistic updates on client
   * - 5% chance of returning 409 Conflict with stale timestamp
   * - Server data returned on conflict for reconciliation
   * - Exponential backoff retry on 5xx errors (not on 409)
   * 
   * The handler checks if the incoming lastModified matches server's.
   * If stale, returns 409 to simulate concurrent updates.
   */
  http.patch('/api/settings/profile', async ({ request }) => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 150))

    const payload = (await request.json()) as UpdateProfilePayload & { lastModified?: string }

    // 5% chance of conflict to test error handling
    if (Math.random() < 0.05) {
      const response: ConflictResponse = {
        error: 'CONFLICT',
        message: 'Settings changed elsewhere, please refresh',
        code: 'SETTINGS_CONFLICT',
        serverData: profileStore,
        lastModified: serverLastModified,
      }
      
      return HttpResponse.json(response, { status: 409 })
    }

    // Check if client's lastModified matches server's (basic conflict detection)
    // In a real app, this would use row versioning or ETags
    if (payload.lastModified && payload.lastModified !== serverLastModified) {
      const response: ConflictResponse = {
        error: 'CONFLICT',
        message: 'Settings changed elsewhere, please refresh',
        code: 'SETTINGS_CONFLICT',
        serverData: profileStore,
        lastModified: serverLastModified,
      }
      
      return HttpResponse.json(response, { status: 409 })
    }

    // Apply updates
    const updated: UserProfile = {
      ...profileStore,
      ...payload,
      id: profileStore.id,
      userId: profileStore.userId,
      updatedAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    }

    // Update store and server timestamp
    profileStore = updated
    serverLastModified = updated.lastModified

    return HttpResponse.json({
      data: updated,
    })
  }),

  /**
   * POST /api/settings/profile/reset
   * Reset profile to default
   */
  http.post('/api/settings/profile/reset', () => {
    profileStore = generateDefaultProfile()
    serverLastModified = profileStore.lastModified

    return HttpResponse.json({
      data: profileStore,
    })
  }),
]
