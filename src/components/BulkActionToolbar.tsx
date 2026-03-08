import { useState, useCallback } from 'react'
import { useForm } from '@tanstack/react-form'
import type { UpdateTaskInput, TaskStatus, TaskPriority } from '../types/task'
import { useBulkUpdateTasks } from '../hooks/mutations/useBulkUpdateTasks'
import { BulkOperationConfirmDialog } from './BulkOperationConfirmDialog'

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-review', label: 'In Review' },
  { value: 'done', label: 'Done' },
]

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

// Mock user/assignee list - in real app, fetch from API
const ASSIGNEE_OPTIONS = [
  { value: 'agent-1', label: 'Agent 1' },
  { value: 'agent-2', label: 'Agent 2' },
  { value: 'agent-3', label: 'Agent 3' },
]

export interface BulkActionToolbarProps {
  selectedTaskIds: Set<string>
  onComplete?: () => void
  onCancel?: () => void
}

export function BulkActionToolbar({ selectedTaskIds, onComplete, onCancel }: BulkActionToolbarProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const { mutate: bulkUpdate, isPending, error } = useBulkUpdateTasks()

  const form = useForm({
    defaultValues: {
      status: '' as TaskStatus | '',
      assignee: '' as string,
      priority: '' as TaskPriority | '',
    },
    onSubmit: async ({ value }) => {
      // Show confirmation dialog before submitting
      setShowConfirmDialog(true)
    },
  })

  const handleConfirmBulkUpdate = useCallback(() => {
    const values = form.getFieldValue('status') ||
      form.getFieldValue('assignee') ||
      form.getFieldValue('priority')

    if (!values) {
      return
    }

    const updates: UpdateTaskInput = {}
    if (form.getFieldValue('status')) {
      updates.status = form.getFieldValue('status') as TaskStatus
    }
    if (form.getFieldValue('assignee')) {
      updates.assignee = form.getFieldValue('assignee')
    }
    if (form.getFieldValue('priority')) {
      updates.priority = form.getFieldValue('priority') as TaskPriority
    }

    bulkUpdate(
      {
        taskIds: Array.from(selectedTaskIds),
        updates,
      },
      {
        onSuccess: (result) => {
          setShowConfirmDialog(false)
          form.reset()
          onComplete?.()
        },
        onError: (err) => {
          // Error is shown in UI, dialog stays open for retry
        },
      }
    )
  }, [form, selectedTaskIds, bulkUpdate, onComplete])

  const hasUpdates = !!(
    form.getFieldValue('status') ||
    form.getFieldValue('assignee') ||
    form.getFieldValue('priority')
  )

  return (
    <div className="border-t border-slate-700 bg-slate-900/50 p-4">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-300 mb-3">
            Update {selectedTaskIds.size} selected task{selectedTaskIds.size !== 1 ? 's' : ''}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Status Field */}
              <form.Field
                name="status"
                children={(field) => (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as TaskStatus | '')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No change</option>
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {/* Assignee Field */}
              <form.Field
                name="assignee"
                children={(field) => (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Assignee</label>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No change</option>
                      {ASSIGNEE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />

              {/* Priority Field */}
              <form.Field
                name="priority"
                children={(field) => (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                    <select
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value as TaskPriority | '')}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="">No change</option>
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
                {error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!hasUpdates || isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                {isPending ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isPending}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <BulkOperationConfirmDialog
          taskCount={selectedTaskIds.size}
          onConfirm={handleConfirmBulkUpdate}
          onCancel={() => setShowConfirmDialog(false)}
          isPending={isPending}
        />
      )}
    </div>
  )
}
