import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useCreateTask } from '../hooks/useCreateTask'
import { useToast } from './Toast'
import type { CreateTaskInput } from '../types/taskValidation'
import type { TaskStatus, TaskPriority } from '../types/task'

interface FormFields {
  name: string
  status: TaskStatus
  team: string
  sprint: string
  priority: TaskPriority
}

export const CreateTaskForm = () => {
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate, isPending } = useCreateTask()
  const [validatingName, setValidatingName] = useState(false)

  const form = useForm<FormFields>({
    defaultValues: {
      name: '',
      status: 'backlog',
      team: '',
      sprint: 'sprint-1',
      priority: 'medium',
    },
    onSubmit: async ({ value }) => {
      try {
        const data: CreateTaskInput = {
          name: value.name,
          status: value.status,
          team: value.team,
          sprint: value.sprint,
          priority: value.priority,
        }

        mutate(data, {
          onSuccess: () => {
            showToast('Task created successfully!', 'success')
            router.navigate({ to: '/' })
          },
          onError: (error) => {
            showToast(
              error.message || 'Failed to create task',
              'error'
            )
          },
        })
      } catch (error) {
        showToast('An error occurred', 'error')
      }
    },
  })

  const validateTaskNameUniqueness = async (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Task name is required'
    }
    if (value.length < 3) {
      return 'Task name must be at least 3 characters'
    }

    setValidatingName(true)
    try {
      const response = await fetch('/api/tasks/validate-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value }),
      })

      const data = await response.json()
      setValidatingName(false)

      if (!data.isUnique) {
        return data.message || 'This task name already exists'
      }
      return undefined
    } catch (error) {
      setValidatingName(false)
      return 'Unable to validate task name'
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Task</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6 bg-slate-800 p-8 rounded-lg"
        >
          <form.Field
            name="name"
            validators={{
              onBlur: ({ value }) => validateTaskNameUniqueness(value),
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium mb-2"
                >
                  Task Name
                </label>
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.setValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                    placeholder="Enter task name"
                    disabled={isPending}
                  />
                  {validatingName && (
                    <div className="absolute right-3 top-2.5">
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="status"
            validators={{
              onBlur: ({ value }) => {
                if (!value) {
                  return 'Status is required'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium mb-2"
                >
                  Status
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value as TaskStatus)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  disabled={isPending}
                >
                  <option value="backlog">Backlog</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="team"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Team is required'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium mb-2"
                >
                  Team
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter team name"
                  disabled={isPending}
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="sprint"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Sprint is required'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium mb-2"
                >
                  Sprint
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter sprint name"
                  disabled={isPending}
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="priority"
            validators={{
              onBlur: ({ value }) => {
                if (!value) {
                  return 'Priority is required'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium mb-2"
                >
                  Priority
                </label>
                <select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  disabled={isPending}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isPending || validatingName}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => router.navigate({ to: '/' })}
              disabled={isPending}
              className="flex-1 px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
