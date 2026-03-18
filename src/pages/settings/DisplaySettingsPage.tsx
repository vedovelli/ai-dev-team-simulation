/**
 * Display Settings Page
 *
 * Allows users to customize display preferences such as:
 * - Theme (light, dark, auto)
 * - Language
 * - Timezone
 * - Date and time format
 * - Items per page
 * - Compact mode
 */

import { useSettings } from '../../hooks/queries/useSettings'
import type { DisplaySettings } from '../../types/settings'

export function DisplaySettingsPage() {
  const { data: displaySettings, isLoading, error } = useSettings<DisplaySettings>('display')

  if (isLoading) {
    return (
      <div className="text-slate-400 py-8">
        <p>Loading display settings...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 py-8">
        <p>Error loading display settings: {error.message}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-6">Display Settings</h2>

      <div className="space-y-4">
        <div className="bg-slate-800 rounded p-4">
          <p className="text-slate-300 text-sm mb-2">Current Display Settings:</p>
          {displaySettings && (
            <pre className="text-slate-400 text-sm overflow-auto bg-slate-950 p-3 rounded">
              {JSON.stringify(displaySettings, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-slate-800 rounded p-4 border-l-4 border-blue-500">
          <p className="text-slate-300">
            Display settings form UI and mutation logic will be implemented by Ana using the useSettings
            hook and useUpdateSettings mutation.
          </p>
        </div>
      </div>
    </div>
  )
}
