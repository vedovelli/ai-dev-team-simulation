import { useState, useMemo, useRef, useEffect } from 'react'
import type { Task } from '../../types/task'
import { useTasks } from '../../hooks/useTasks'
import { useUpdateTaskDependencies } from '../../hooks/useUpdateTaskDependencies'

interface AddDependencyModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
}

export function AddDependencyModal({ task, isOpen, onClose }: AddDependencyModalProps) {
  const { data: allTasks = [] } = useTasks()
  const updateDependenciesMutation = useUpdateTaskDependencies()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get current dependencies (dependsOn field)
  const currentDependencies = useMemo(() => {
    return task.dependsOn || []
  }, [task.dependsOn])

  // Check if adding this task would create a circular dependency
  const hasCircularDependency = useMemo(() => {
    if (!selectedTask) return false
    // If selected task depends on current task, it's circular
    return selectedTask.dependsOn?.includes(task.id) || false
  }, [selectedTask, task.id])

  // Filter available tasks
  const availableTasks = useMemo(() => {
    return allTasks.filter(
      (t) =>
        t.id !== task.id && // Can't depend on itself
        !currentDependencies.includes(t.id) && // Don't show already dependencies
        (searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [allTasks, task.id, currentDependencies, searchQuery])

  const handleSelectDependency = async (selectedTaskId: string) => {
    try {
      const newDependencies = [...currentDependencies, selectedTaskId]
      await updateDependenciesMutation.mutateAsync({
        id: task.id,
        dependsOn: newDependencies,
      })
      setSearchQuery('')
      setSelectedTask(null)
      setShowDropdown(false)
    } catch (error) {
      console.error('Failed to add dependency:', error)
    }
  }

  const handleConfirm = () => {
    if (selectedTask && !hasCircularDependency) {
      handleSelectDependency(selectedTask.id)
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setShowDropdown(false)
    }
  }

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-dependency-title"
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-lg w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="add-dependency-title" className="text-lg font-semibold text-gray-900">
            Add Dependency
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Select a task that must be completed before <strong>{task.title}</strong> can proceed.
        </p>

        {/* Circular dependency warning */}
        {hasCircularDependency && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-sm text-red-700">⚠️ This would create a circular dependency. Please select a different task.</p>
          </div>
        )}

        {/* Search input */}
        <div className="relative mb-4">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search for a task..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            aria-label="Search for tasks"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
          />

          {/* Dropdown list */}
          {showDropdown && availableTasks.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
              <ul className="max-h-64 overflow-y-auto py-1">
                {availableTasks.map((availableTask) => (
                  <li key={availableTask.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(availableTask)
                        setSearchQuery(availableTask.title)
                        setShowDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none text-sm"
                      aria-label={`Select ${availableTask.id} as a dependency`}
                    >
                      <div className="font-medium text-gray-900">{availableTask.id}</div>
                      <div className="text-sm text-gray-600">{availableTask.title}</div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showDropdown && availableTasks.length === 0 && searchQuery && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
              No matching tasks found
            </div>
          )}
        </div>

        {/* Selected task preview */}
        {selectedTask && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Selected:</strong> {selectedTask.id} - {selectedTask.title}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTask || hasCircularDependency || updateDependenciesMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateDependenciesMutation.isPending ? 'Adding...' : 'Add Dependency'}
          </button>
        </div>

        {updateDependenciesMutation.isError && (
          <p className="mt-3 text-sm text-red-600">Failed to add dependency. Please try again.</p>
        )}
      </div>
    </div>
  )
}
