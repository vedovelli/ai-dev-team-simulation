/**
 * User profile and settings types
 */

/**
 * User profile data
 */
export interface UserProfile {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  bio?: string
  timezone: string
  language: string
  theme: 'light' | 'dark' | 'auto'
  
  // Metadata for conflict detection
  createdAt: string
  updatedAt: string
  lastModified: string  // For 409 conflict detection
}

/**
 * Payload for updating user profile
 * All fields are optional for partial updates
 */
export interface UpdateProfilePayload {
  name?: string
  email?: string
  avatar?: string
  bio?: string
  timezone?: string
  language?: string
  theme?: 'light' | 'dark' | 'auto'
}

/**
 * API response for fetching profile
 */
export interface ProfileResponse {
  data: UserProfile
}

/**
 * Error response for conflict (409)
 * Contains server's version of the data so client can reconcile
 */
export interface ConflictResponse {
  error: string
  message: string
  code: 'SETTINGS_CONFLICT'
  serverData: UserProfile
  lastModified: string  // Server's last_modified timestamp
}

/**
 * Settings conflict error with server state
 */
export interface SettingsConflict extends Error {
  name: 'SettingsConflict'
  serverData: UserProfile
  lastModified: string
}
