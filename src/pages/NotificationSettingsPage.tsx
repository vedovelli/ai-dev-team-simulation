import { useEffect, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { PreferencesForm } from '../components/NotificationPreferences/PreferencesForm'

/**
 * Notification Settings Page
 * Full-page UI for managing notification preferences
 * Allows users to configure notification types, frequencies, and channels
 */
export function NotificationSettingsPage() {
  const router = useRouter()
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  // Monitor route changes for unsaved changes
  useEffect(() => {
    const unsubscribe = router.subscribe('onBeforeLoad', ({ toLocation }) => {
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to leave?'
        )
        if (!confirmed) {
          return false
        }
      }
    })

    return unsubscribe
  }, [hasUnsavedChanges, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Notification Preferences
          </h1>
          <p className="text-slate-400">
            Manage how and when you receive notifications
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border border-slate-200 p-8 shadow-lg">
          <PreferencesForm
            onUnsavedChangesChange={setHasUnsavedChanges}
          />
        </div>
      </div>
    </div>
  )
}
