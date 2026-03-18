import { useState } from 'react'
import type { Task } from '../../types/task'
import { TaskEditForm } from './TaskEditForm'
import { TaskHistoryTimeline } from './TaskHistoryTimeline'
import { TaskCommentThread } from './TaskCommentThread'
import { BlockingStatusBadge } from '../BlockingStatusBadge/BlockingStatusBadge'
import { TaskDependencyList } from '../TaskDependencyList/TaskDependencyList'
import { useTaskDependencies } from '../../hooks/useTaskDependencies'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'history' | 'comments' | 'dependencies'>('edit')
  const { data: dependenciesData } = useTaskDependencies(task?.id || '')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  if (!isOpen || !task) return null

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Close without saving?')) {
        setHasUnsavedChanges(false)
        onClose()
      }
    } else {
      onClose()
    }
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

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-detail-title"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 id="task-detail-title" className="text-xl font-semibold text-gray-900">
                {task.title}
              </h2>
              <BlockingStatusBadge
                isBlocked={(task.dependsOn || []).length > 0}
                blockingCount={(task.blockedBy || []).length}
              />
            </div>
            <p className="text-sm text-gray-500">ID: {task.id}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b flex gap-8 px-6 bg-gray-50">
          {(['edit', 'dependencies', 'history', 'comments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
              {tab === 'edit' && hasUnsavedChanges && (
                <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'edit' && (
            <TaskEditForm
              task={task}
              onClose={handleClose}
              onUnsavedChangesChange={setHasUnsavedChanges}
            />
          )}
          {activeTab === 'dependencies' && <TaskDependencyList taskId={task.id} />}
          {activeTab === 'history' && <TaskHistoryTimeline taskId={task.id} />}
          {activeTab === 'comments' && <TaskCommentThread taskId={task.id} />}
        </div>
      </div>
    </div>
  )
}
