import { useEffect } from 'react'

export interface BulkOperationConfirmDialogProps {
  taskCount: number
  onConfirm: () => void
  onCancel: () => void
  isPending?: boolean
}

/**
 * Dialog component for confirming bulk task operations
 *
 * Shows a warning about bulk updates and requires explicit confirmation
 * to prevent accidental bulk changes.
 */
export function BulkOperationConfirmDialog({
  taskCount,
  onConfirm,
  onCancel,
  isPending = false,
}: BulkOperationConfirmDialogProps) {
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
          <h2 className="text-lg font-semibold text-white">Confirm Bulk Update</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <p className="text-slate-300">
            You are about to update <span className="font-semibold text-white">{taskCount}</span>{' '}
            task{taskCount !== 1 ? 's' : ''}. This action cannot be easily undone.
          </p>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded px-3 py-2">
            <p className="text-sm text-yellow-200">
              Please review your changes before confirming. Some tasks may fail to update.
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {isPending ? 'Updating...' : 'Confirm Update'}
          </button>
        </div>
      </div>
    </div>
  )
}
