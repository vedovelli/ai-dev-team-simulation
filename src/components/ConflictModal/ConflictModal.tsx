import { useEffect, useRef, useCallback } from 'react'

export interface ConflictState {
  hasConflict: boolean
  localVersion: Record<string, unknown>
  serverVersion: Record<string, unknown>
  conflictingFields?: string[]
}

interface ConflictModalProps {
  isOpen: boolean
  conflictState: ConflictState
  onResolve: (resolution: 'reload' | 'override') => void
  onCancel: () => void
  entityType?: 'task' | 'sprint'
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getConflictingFields(local: Record<string, unknown>, server: Record<string, unknown>): string[] {
  const fieldsToCheck = new Set<string>([...Object.keys(local), ...Object.keys(server)])
  const conflicting: string[] = []

  fieldsToCheck.forEach((field) => {
    const localVal = local[field]
    const serverVal = server[field]
    if (JSON.stringify(localVal) !== JSON.stringify(serverVal)) {
      conflicting.push(field)
    }
  })

  return conflicting
}

export function ConflictModal({
  isOpen,
  conflictState,
  onResolve,
  onCancel,
  entityType = 'task',
}: ConflictModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const firstButtonRef = useRef<HTMLButtonElement>(null)
  const lastButtonRef = useRef<HTMLButtonElement>(null)

  const conflictingFields = getConflictingFields(conflictState.localVersion, conflictState.serverVersion)

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onCancel()
        return
      }

      // Tab focus trap
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstButtonRef.current) {
          e.preventDefault()
          lastButtonRef.current?.focus()
        } else if (!e.shiftKey && document.activeElement === lastButtonRef.current) {
          e.preventDefault()
          firstButtonRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  // Focus first button on open
  useEffect(() => {
    if (isOpen && firstButtonRef.current) {
      firstButtonRef.current.focus()
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="conflict-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 id="conflict-modal-title" className="text-lg font-semibold text-gray-900">
            ⚠️ Conflict Detected
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            This {entityType} was updated by someone else while you were editing. Choose how to resolve:
          </p>
        </div>

        {/* Content - Diff View */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Local Version */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Your Changes</h3>
              <div className="space-y-3">
                {conflictingFields.map((field) => {
                  const localValue = conflictState.localVersion[field]
                  return (
                    <div
                      key={field}
                      className="p-3 border-2 border-blue-300 bg-blue-50 rounded-md"
                    >
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        {field}
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatValue(localValue)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Server Version */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Server Version</h3>
              <div className="space-y-3">
                {conflictingFields.map((field) => {
                  const serverValue = conflictState.serverVersion[field]
                  return (
                    <div
                      key={field}
                      className="p-3 border-2 border-orange-300 bg-orange-50 rounded-md"
                    >
                      <p className="text-xs font-semibold text-gray-700 uppercase">
                        {field}
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {formatValue(serverValue)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Warning for Keep My Changes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> If you keep your changes, they may overwrite recent updates
              made by your teammate.
            </p>
          </div>
        </div>

        {/* Footer - Action Buttons */}
        <div className="flex gap-3 justify-end p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            ref={firstButtonRef}
            onClick={() => onResolve('reload')}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Use Server Version
          </button>
          <button
            ref={lastButtonRef}
            onClick={() => onResolve('override')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Keep My Changes
          </button>
        </div>
      </div>
    </div>
  )
}
