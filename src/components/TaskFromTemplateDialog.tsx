import { useState } from 'react'
import { useTemplates } from '../hooks/useTemplates'
import { useCreateTaskFromTemplate } from '../hooks/useCreateTaskFromTemplate'
import { useCreateTask } from '../hooks/useCreateTask'
import type { TaskTemplate } from '../types/template'

interface TaskFromTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function TaskFromTemplateDialog({
  isOpen,
  onClose,
}: TaskFromTemplateDialogProps) {
  const { data: templates, isLoading } = useTemplates()
  const { mutate: createFromTemplate, isPending: isCreatingFromTemplate } =
    useCreateTaskFromTemplate()
  const { mutate: createDirectly, isPending: isCreatingDirectly } =
    useCreateTask()

  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(
    null
  )
  const [taskName, setTaskName] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)

  const isPending = isCreatingFromTemplate || isCreatingDirectly

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!selectedTemplate) {
      setApiError('Please select a template')
      return
    }

    if (!taskName.trim()) {
      setApiError('Please enter a task name')
      return
    }

    const templateFields = selectedTemplate.defaultFields

    createFromTemplate(
      {
        templateFields,
        overrides: {
          name: taskName,
        },
      },
      {
        onSuccess: () => {
          setTaskName('')
          setSelectedTemplate(null)
          onClose()
        },
        onError: (error) => {
          setApiError(error.message)
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Create Task from Template
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {apiError}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading templates...</p>
            </div>
          ) : !templates || templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                No templates available. Create one first!
              </p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Template Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select a Template *
                </label>
                <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedTemplate(template)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">
                        {template.name}
                      </h4>
                      {template.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                      )}
                      {/* Show preview of default fields */}
                      <div className="mt-2 text-xs text-gray-500 space-y-1">
                        {template.defaultFields.title && (
                          <p>
                            • Title: <span className="font-mono">{template.defaultFields.title}</span>
                          </p>
                        )}
                        {template.defaultFields.status && (
                          <p>
                            • Status:{' '}
                            <span className="font-mono">
                              {template.defaultFields.status}
                            </span>
                          </p>
                        )}
                        {template.defaultFields.priority && (
                          <p>
                            • Priority:{' '}
                            <span className="font-mono">
                              {template.defaultFields.priority}
                            </span>
                          </p>
                        )}
                        {template.defaultFields.estimatedHours && (
                          <p>
                            • Est. Hours:{' '}
                            <span className="font-mono">
                              {template.defaultFields.estimatedHours}h
                            </span>
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Task Name */}
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Task Name *
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="Enter the specific task name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}

              {/* Preview of what will be created */}
              {selectedTemplate && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
                  <div className="text-sm space-y-1 text-gray-700">
                    <p>
                      <span className="font-medium">Title:</span>{' '}
                      {taskName || selectedTemplate.defaultFields.title || '(from input)'}
                    </p>
                    {selectedTemplate.defaultFields.description && (
                      <p>
                        <span className="font-medium">Description:</span>{' '}
                        {selectedTemplate.defaultFields.description}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Status:</span>{' '}
                      {selectedTemplate.defaultFields.status || 'backlog'}
                    </p>
                    <p>
                      <span className="font-medium">Priority:</span>{' '}
                      {selectedTemplate.defaultFields.priority || 'medium'}
                    </p>
                    {selectedTemplate.defaultFields.estimatedHours && (
                      <p>
                        <span className="font-medium">Est. Hours:</span>{' '}
                        {selectedTemplate.defaultFields.estimatedHours}h
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedTemplate || !taskName.trim() || isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPending && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Create Task
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
