import { useState, useMemo, useRef, useEffect } from 'react'
import type { Task } from '../types/task'
import { useTasks } from '../hooks/useTasks'

export interface TaskDependencyWidgetProps {
  task: Task
  selectedDependencies: string[]
  onDependenciesChange: (deps: string[]) => void
  disabled?: boolean
}

export function TaskDependencyWidget({
  task,
  selectedDependencies,
  onDependenciesChange,
  disabled = false,
}: TaskDependencyWidgetProps) {
  const { data: allTasks = [] } = useTasks()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Check for circular dependencies
  const hasCircularDependency = useMemo(() => {
    // A circular dependency would occur if we add a task that depends on the current task
    const currentTaskDependsOn = task.dependsOn || []
    return selectedDependencies.some((depId) => {
      const depTask = allTasks.find((t) => t.id === depId)
      if (!depTask) return false
      return depTask.dependsOn?.includes(task.id) || false
    })
  }, [selectedDependencies, task, allTasks])

  // Filter available tasks to add as dependencies
  const availableTasks = useMemo(() => {
    return allTasks.filter(
      (t) =>
        t.id !== task.id && // Can't depend on itself
        !selectedDependencies.includes(t.id) && // Don't show already selected
        (searchQuery === '' || t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [allTasks, task.id, selectedDependencies, searchQuery])

  const selectedTasksData = useMemo(() => {
    return selectedDependencies
      .map((id) => allTasks.find((t) => t.id === id))
      .filter((t) => t !== undefined) as Task[]
  }, [selectedDependencies, allTasks])

  const handleSelectDependency = (taskId: string) => {
    onDependenciesChange([...selectedDependencies, taskId])
    setSearchQuery('')
    setIsOpen(false)
  }

  const handleRemoveDependency = (taskId: string) => {
    onDependenciesChange(selectedDependencies.filter((id) => id !== taskId))
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">Dependencies</label>

      {/* Circular dependency warning */}
      {hasCircularDependency && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">⚠️ Circular dependency detected. This would create a dependency loop.</p>
        </div>
      )}

      {/* Selected dependencies as removable tags */}
      {selectedTasksData.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-md border border-slate-200">
          {selectedTasksData.map((depTask) => (
            <div
              key={depTask.id}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {depTask.id}: {depTask.title}
              <button
                type="button"
                onClick={() => handleRemoveDependency(depTask.id)}
                disabled={disabled}
                className="ml-1 text-blue-600 hover:text-blue-800 font-bold disabled:opacity-50"
                aria-label={`Remove dependency on ${depTask.id}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Combobox for adding dependencies */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tasks to add as blockers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
          aria-label="Search for tasks to add as dependencies"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />

        {/* Dropdown list */}
        {isOpen && availableTasks.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul className="max-h-64 overflow-y-auto py-1">
              {availableTasks.map((availableTask) => (
                <li key={availableTask.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectDependency(availableTask.id)}
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

        {isOpen && availableTasks.length === 0 && searchQuery && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
            No matching tasks found
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Select tasks that must be completed before this task can proceed. All direct blockers are shown here.
      </p>
    </div>
  )
}
