import { useState } from 'react'
import { UserProfileForm } from '../../components/UserProfileForm'
import { useUserProfile } from '../../hooks/useUserProfile'
import type { UserProfileInput } from '../../types/forms/user'

/**
 * Profile Settings Page
 * Allows users to edit their profile information including name, avatar, bio, and role
 */
export function ProfileSettingsPage() {
  const [conflictError, setConflictError] = useState<string | null>(null)
  const { profile, isLoading: isLoadingProfile, updateProfile, isUpdating } = useUserProfile()

  const handleProfileSubmit = async (data: UserProfileInput) => {
    try {
      setConflictError(null)
      await new Promise<void>((resolve, reject) => {
        updateProfile(data, {
          onError: (error: any) => {
            if (error.status === 409) {
              setConflictError(
                'Your profile was modified by another user. Please refresh and try again.'
              )
            }
            reject(error)
          },
          onSuccess: () => {
            resolve()
          },
        })
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      throw error
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-slate-400">Manage your personal profile information</p>
      </div>

      {/* Conflict Error Alert */}
      {conflictError && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{conflictError}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-red-700 hover:text-red-600 mt-1"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {isLoadingProfile ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-400">Loading profile...</div>
        </div>
      ) : profile ? (
        <UserProfileForm
          initialData={profile}
          onSubmit={handleProfileSubmit}
          isLoading={isUpdating}
        />
      ) : (
        <div className="text-slate-400">Failed to load profile</div>
      )}
    </div>
  )
}
