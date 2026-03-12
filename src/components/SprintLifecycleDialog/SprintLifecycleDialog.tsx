import { useState } from 'react'
import type { Sprint } from '../../types/sprint'
import { SprintArchivePanel } from './SprintArchivePanel'
import { ArchivedSprintsList } from './ArchivedSprintsList'
import { SprintHistoryTimeline } from './SprintHistoryTimeline'

interface SprintLifecycleDialogProps {
  sprint: Sprint | null
  isOpen: boolean
  onClose: () => void
  onArchiveSuccess?: () => void
  onRestoreSuccess?: () => void
}

export function SprintLifecycleDialog({
  sprint,
  isOpen,
  onClose,
  onArchiveSuccess,
  onRestoreSuccess,
}: SprintLifecycleDialogProps) {
  const [activeTab, setActiveTab] = useState<'current' | 'archived' | 'history'>(
    'current'
  )

  if (!isOpen || !sprint) return null

  const handleClose = () => {
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  const handleArchiveSuccess = () => {
    onArchiveSuccess?.()
    setActiveTab('archived')
  }

  const handleRestoreSuccess = () => {
    onRestoreSuccess?.()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sprint-lifecycle-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2
              id="sprint-lifecycle-title"
              className="text-xl font-semibold text-gray-900"
            >
              Sprint Lifecycle: {sprint.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">ID: {sprint.id}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-8 px-6 bg-gray-50">
          {(['current', 'archived', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'current' && 'Archive'}
              {tab === 'archived' && 'Archived Sprints'}
              {tab === 'history' && 'History Timeline'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'current' && (
            <SprintArchivePanel
              sprint={sprint}
              onArchiveSuccess={handleArchiveSuccess}
              onClose={handleClose}
            />
          )}
          {activeTab === 'archived' && (
            <ArchivedSprintsList
              onRestoreSuccess={handleRestoreSuccess}
            />
          )}
          {activeTab === 'history' && (
            <SprintHistoryTimeline sprintId={sprint.id} />
          )}
        </div>
      </div>
    </div>
  )
}
