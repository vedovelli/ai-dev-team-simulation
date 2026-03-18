import { DisplaySettingsPanel } from '../../components/DisplaySettingsPanel/DisplaySettingsPanel'

/**
 * Display Settings Page
 * Allows users to manage theme, language, and timezone preferences
 */
export function DisplaySettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Display Settings</h1>
        <p className="text-slate-400">Customize how the application looks and behaves</p>
      </div>

      <DisplaySettingsPanel />
    </div>
  )
}
