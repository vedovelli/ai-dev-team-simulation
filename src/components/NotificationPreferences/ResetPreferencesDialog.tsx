import { useEffect } from 'react'

interface ResetPreferencesDialogProps {
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
}

/**
 * Confirmation dialog for resetting notification preferences to defaults
 */
export function ResetPreferencesDialog({
  onConfirm,
  onCancel,
  isPending = false,
}: ResetPreferencesDialogProps) {
  // Handle Escape key to close dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel, isPending])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Reset to Defaults?</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-slate-300">
            This will reset all notification preferences to their default values. All notification types will be enabled with instant frequency.
          </p>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">
            <p className="text-sm text-amber-200">
              This action cannot be undone. Your current preferences will be lost.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {isPending ? 'Resetting...' : 'Reset Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}
