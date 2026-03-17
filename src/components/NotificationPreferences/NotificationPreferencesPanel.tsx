/**
 * Main notification preferences settings panel
 * Displays all notification types with their frequency and channel controls
 * Connects to useNotificationPreferences hook for data fetching and updates
 * Uses TanStack Form for form state management and validation
 */

import { useForm } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences'
import { useToast } from '../Toast'
import { NotificationTypeToggle } from './NotificationTypeToggle'
import type { NotificationPreferences, NotificationTypePreference, UpdatePreferencesRequest } from '../../types/notification-preferences'

const NOTIFICATION_TYPES = [
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

interface PreferencesFormData {
  preferences: Record<string, NotificationTypePreference>
}

export function NotificationPreferencesPanel() {
  const { preferences, isLoading, isError, isUpdating, updatePreferences } = useNotificationPreferences()
  const { showToast } = useToast()
  const [isDirty, setIsDirty] = useState(false)

  const form = useForm<PreferencesFormData>({
    defaultValues: {
      preferences: preferences
        ? {
            assignment_changed: preferences.assignment_changed,
            sprint_updated: preferences.sprint_updated,
            task_reassigned: preferences.task_reassigned,
            deadline_approaching: preferences.deadline_approaching,
            task_assigned: preferences.task_assigned,
            task_unassigned: preferences.task_unassigned,
            sprint_started: preferences.sprint_started,
            sprint_completed: preferences.sprint_completed,
            comment_added: preferences.comment_added,
            status_changed: preferences.status_changed,
            agent_event: preferences.agent_event,
            performance_alert: preferences.performance_alert,
          }
        : {},
    },
    onSubmit: async ({ value }) => {
      try {
        const patch: UpdatePreferencesRequest = {}
        let hasChanges = false

        NOTIFICATION_TYPES.forEach((type) => {
          const orig = preferences?.[type as keyof NotificationPreferences]
          const local = value.preferences[type]

          if (orig && JSON.stringify(orig) !== JSON.stringify(local)) {
            patch[type as keyof UpdatePreferencesRequest] = local
            hasChanges = true
          }
        })

        if (hasChanges) {
          updatePreferences(patch)
          showToast('Preferences saved successfully!', 'success')
          setIsDirty(false)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save preferences'
        showToast(message, 'error')
      }
    },
  })

  // Reset form when preferences change (after successful update)
  useEffect(() => {
    if (preferences && !isUpdating) {
      form.setFieldValue('preferences', {
        assignment_changed: preferences.assignment_changed,
        sprint_updated: preferences.sprint_updated,
        task_reassigned: preferences.task_reassigned,
        deadline_approaching: preferences.deadline_approaching,
        task_assigned: preferences.task_assigned,
        task_unassigned: preferences.task_unassigned,
        sprint_started: preferences.sprint_started,
        sprint_completed: preferences.sprint_completed,
        comment_added: preferences.comment_added,
        status_changed: preferences.status_changed,
        agent_event: preferences.agent_event,
        performance_alert: preferences.performance_alert,
      })
      setIsDirty(false)
    }
  }, [preferences, isUpdating])

  const handlePreferenceChange = (type: string, preference: NotificationTypePreference) => {
    form.setFieldValue('preferences', (prev) => ({
      ...prev,
      [type]: preference,
    }))
    setIsDirty(true)
  }

  const handleCancel = () => {
    if (preferences) {
      form.setFieldValue('preferences', {
        assignment_changed: preferences.assignment_changed,
        sprint_updated: preferences.sprint_updated,
        task_reassigned: preferences.task_reassigned,
        deadline_approaching: preferences.deadline_approaching,
        task_assigned: preferences.task_assigned,
        task_unassigned: preferences.task_unassigned,
        sprint_started: preferences.sprint_started,
        sprint_completed: preferences.sprint_completed,
        comment_added: preferences.comment_added,
        status_changed: preferences.status_changed,
        agent_event: preferences.agent_event,
        performance_alert: preferences.performance_alert,
      })
      setIsDirty(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-slate-200 rounded animate-pulse w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (isError || !preferences) {
    return (
      <div className="rounded-lg bg-red-50 p-4 border border-red-200">
        <p className="text-red-800 text-sm">Failed to load notification preferences. Please try again.</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Notification Preferences</h2>
        <p className="text-slate-600 text-sm">
          Control how and when you receive notifications for each notification type.
        </p>
      </div>

      {/* Settings panel */}
      <fieldset className="border border-slate-200 rounded-lg p-6 space-y-0">
        <legend className="sr-only">Notification Settings</legend>

        {NOTIFICATION_TYPES.map((type) => {
          const typePreference = form.getFieldValue('preferences')[type]
          return (
            <NotificationTypeToggle
              key={type}
              type={type}
              preference={typePreference as NotificationTypePreference}
              onChange={(pref) => handlePreferenceChange(type, pref)}
            />
          )
        })}
      </fieldset>

      {/* Action buttons - shown only if there are unsaved changes */}
      {isDirty && (
        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <form.Subscribe
            selector={(formState) => [formState.isSubmitting]}
            children={([isSubmitting]) => (
              <button
                type="submit"
                disabled={isUpdating || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded hover:bg-blue-700 disabled:bg-slate-400 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isUpdating || isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          />
          <button
            type="button"
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-4 py-2 bg-slate-200 text-slate-900 font-medium text-sm rounded hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <span className="text-xs text-slate-500 ml-auto flex items-center">
            Unsaved changes
          </span>
        </div>
      )}
    </form>
  )
}
