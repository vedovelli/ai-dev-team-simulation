/**
 * Settings Types
 *
 * Defines the structure for different settings sections (profile, notifications, display)
 */

export type SettingsSection = 'profile' | 'notifications' | 'display'

export interface ProfileSettings {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  website?: string
  updatedAt: string
}

export interface NotificationSettings {
  id: string
  emailNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
  notificationFrequency: 'instant' | 'daily' | 'weekly'
  mutedKeywords: string[]
  unsubscribedCategories: string[]
  updatedAt: string
}

export interface DisplaySettings {
  id: string
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  itemsPerPage: number
  compactMode: boolean
  updatedAt: string
}

export type SettingsData = ProfileSettings | NotificationSettings | DisplaySettings

export interface SettingsQueryKey {
  settings: [queryKey: 'settings', section: SettingsSection]
}
