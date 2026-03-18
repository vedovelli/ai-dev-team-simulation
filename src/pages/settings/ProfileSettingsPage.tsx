/**
 * Profile Settings Page
 *
 * Allows users to manage their profile information such as:
 * - First and last name
 * - Email address
 * - Avatar/profile picture
 * - Bio and location
 * - Website URL
 */

import { useSettings } from '../../hooks/queries/useSettings'
import type { ProfileSettings } from '../../types/settings'

export function ProfileSettingsPage() {
  const { data: profileSettings, isLoading, error } = useSettings<ProfileSettings>('profile')

  if (isLoading) {
    return (
      <div className="text-slate-400 py-8">
        <p>Loading profile settings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 py-8">
        <p>Error loading profile settings: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>

      <div className="space-y-4">
        <div className="bg-slate-800 rounded p-4">
          <p className="text-slate-300 text-sm mb-2">Current Profile Data:</p>
          {profileSettings && (
            <pre className="text-slate-400 text-sm overflow-auto bg-slate-950 p-3 rounded">
              {JSON.stringify(profileSettings, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-slate-800 rounded p-4 border-l-4 border-blue-500">
          <p className="text-slate-300">
            Profile form UI and mutation logic will be implemented by Ana using the useSettings hook
            and useUpdateSettings mutation.
          </p>
        </div>
      </div>
    </div>
  )
}
