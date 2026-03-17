/**
 * Notification settings panel UI using TanStack Form
 * Displays all notification types with toggles, frequency, and channel controls
 */

import { useForm } from '@tanstack/react-form'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { NotificationTypeRow } from './NotificationTypeRow'
import type { NotificationPreferences, NotificationTypePreference } from '../../types/notification-preferences'
import { useCallback, useEffect, useMemo } from 'react'

/**
 * Notification types grouped by category for UI organization
 */
const NOTIFICATION_CATEGORIES = {
  'Task Notifications': [
    'task_assigned',
    'task_unassigned',
    'task_reassigned',
  ] as const,
  'Sprint Notifications': [
    'sprint_started',
    'sprint_completed',
    'sprint_updated',
  ] as const,
  'System & Activity': [
    'comment_added',
    'status_changed',
    'assignment_changed',
    'deadline_approaching',
    'agent_event',
    'performance_alert',
  ] as const,
}

const ALL_NOTIFICATION_TYPES = [
  'assignment_changed',
  'sprint_updated',
  'task_reassigned',
  'deadline_approaching',
  'task_assigned',
  'task_unassigned',
  'sprint_started',
  'sprint_completed',
  'comment_added',
  'status_changed',
  'agent_event',
  'performance_alert',
] as const

/**
 * Calculate count of enabled notification types
 */
function getEnabledCount(preferences: Partial<NotificationPreferences>): number {
  return ALL_NOTIFICATION_TYPES.filter(
    (type) => {
      const pref = preferences[type as keyof NotificationPreferences] as NotificationTypePreference
      return pref?.enabled ?? true
    }
  ).length
}

export function NotificationSettingsPanel() {
  const { preferences, isLoading, isError, error, isUpdating, updatePreferences, refetch } = useNotificationPreferences()

  const form = useForm<Partial<NotificationPreferences>>({
    defaultValues: preferences ? Object.fromEntries(
      ALL_NOTIFICATION_TYPES.map((type) => [
        type,
        preferences[type as keyof NotificationPreferences] || {
          enabled: true,
          frequency: 'instant',
          channels: ['in-app'],
        },
      ])
    ) : {},
    onSubmit: async ({ value }) => {
      // Build patch object with only changed fields
      const patch: Record<string, NotificationTypePreference> = {}

      ALL_NOTIFICATION_TYPES.forEach((type) => {
        const key = type as keyof NotificationPreferences
        if (value[key] && preferences && JSON.stringify(value[key]) !== JSON.stringify(preferences[key])) {
          patch[type] = value[key] as NotificationTypePreference
        }
      })

      if (Object.keys(patch).length > 0) {
        updatePreferences(patch)
      }
    },
  })

  const handleRetry = useCallback(() => {
    refetch()
  }, [refetch])

  // Sync form with preferences when they change (e.g., after refetch on error recovery)
  useEffect(() => {
    if (preferences) {
      const formValues = Object.fromEntries(
        ALL_NOTIFICATION_TYPES.map((type) => [
          type,
          preferences[type as keyof NotificationPreferences] || {
            enabled: true,
            frequency: 'instant' as const,
            channels: ['in-app'] as const,
          },
        ])
      )
      form.reset(formValues)
    }
  }, [preferences, form])

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-2/3" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <fieldset key={i} className="space-y-3">
              <div className="h-6 bg-slate-200 rounded animate-pulse w-1/4" />
              <div className="bg-white rounded border border-slate-200 space-y-4 p-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-12 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    )
  }

  // Error state with retry
  if (isError || !preferences) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-red-800 text-sm font-medium">Failed to load notification preferences</p>
        <p className="text-red-700 text-sm mt-1">{error?.message || 'Please try again.'}</p>
        <button
          onClick={handleRetry}
          disabled={isLoading}
          className="mt-3 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white text-sm font-medium rounded transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const enabledCount = useMemo(
    () => getEnabledCount(form.values as Partial<NotificationPreferences>),
    [form.values]
  )
  const totalCount = ALL_NOTIFICATION_TYPES.length

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Header with summary */}
      <div>
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold text-slate-900">Notification Settings</h2>
          <div className="text-sm text-slate-600">
            <span className="font-medium">{enabledCount}</span> of <span className="font-medium">{totalCount}</span> enabled
          </div>
        </div>
        <p className="text-slate-600 text-sm">
          Control how and when you receive notifications for each notification type.
        </p>
      </div>

      {/* Settings by category */}
      {Object.entries(NOTIFICATION_CATEGORIES).map(([category, notificationTypes]) => (
        <fieldset key={category} className="space-y-3">
          <legend className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
            {category}
          </legend>
          <div className="bg-white rounded border border-slate-200">
            {notificationTypes.map((type) => (
              <form.Field
                key={type}
                name={type as keyof NotificationPreferences}
                defaultValue={preferences[type as keyof NotificationPreferences] as NotificationTypePreference}
              >
                {(field) => (
                  <NotificationTypeRow
                    type={type}
                    field={field}
                  />
                )}
              </form.Field>
            ))}
          </div>
        </fieldset>
      ))}

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={isUpdating}
          className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 disabled:bg-slate-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
        {form.isDirty && (
          <span className="text-xs text-slate-500">Unsaved changes</span>
        )}
      </div>
    </form>
  )
}
