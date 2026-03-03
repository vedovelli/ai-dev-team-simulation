import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { createTaskRequestSchema } from '../lib/validation'
import { useCreateTask } from '../hooks/useCreateTask'
import { useToast } from './Toast'
import { MutationErrorAlert } from './MutationErrorAlert'
import { MutationStatus } from './MutationStatus'
import { FormField } from './FormField'
import type { CreateTaskInput } from '../types/taskValidation'
import type { TaskStatus, TaskPriority } from '../types/task'

interface FormFields {
  name: string
  status: TaskStatus
  team: string
  sprint: string
  priority: TaskPriority
  estimatedHours?: number
  assignedAgent?: string | null
}

export const CreateTaskForm = () => {
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate, isPending, isError, error, isSuccess, canRetry, retry } = useCreateTask()
  const [validatingName, setValidatingName] = useState(false)

  const form = useForm<FormFields>({
    defaultValues: {
      name: '',
      status: 'backlog',
      team: '',
      sprint: 'sprint-1',
      priority: 'medium',
      estimatedHours: undefined,
      assignedAgent: null,
    },
    onSubmit: async ({ value }) => {
      try {
        // Validate using Zod schema
        const validationResult = createTaskRequestSchema.safeParse({
          name: value.name,
          status: value.status,
          team: value.team,
          sprint: value.sprint,
          priority: value.priority,
          estimatedHours: value.estimatedHours,
          assignedAgent: value.assignedAgent,
        })

        if (!validationResult.success) {
          showToast('Validation failed: ' + validationResult.error.errors[0].message, 'error')
          return
        }

        const data: CreateTaskInput = validationResult.data as unknown as CreateTaskInput

        mutate(data, {
          onSuccess: () => {
            showToast('Task created successfully!', 'success')
            router.navigate({ to: '/' })
          },
          onError: (error) => {
            showToast(error.message || 'Failed to create task', 'error')
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

        <MutationErrorAlert
          error={isError ? error : null}
          isLoading={isPending}
          canRetry={canRetry}
          onRetry={retry}
        />

        <MutationStatus
          isLoading={isPending}
          isSuccess={isSuccess}
          successMessage="Task created successfully!"
        />

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
              <FormField label="Task Name" error={field.state.meta.errors?.[0]}>
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
              </FormField>
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
              <FormField label="Status" error={field.state.meta.errors?.[0]}>
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
              </FormField>
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
              <FormField label="Team" error={field.state.meta.errors?.[0]}>
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
              </FormField>
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
              <FormField label="Sprint" error={field.state.meta.errors?.[0]}>
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
              </FormField>
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
              <FormField label="Priority" error={field.state.meta.errors?.[0]}>
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
              </FormField>
            )}
          </form.Field>

          <form.Field
            name="estimatedHours"
            validators={{
              onBlur: ({ value }) => {
                if (value !== undefined && value !== null) {
                  if (typeof value !== 'number' || value < 0) {
                    return 'Estimated hours must be a positive number'
                  }
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <FormField label="Estimated Hours (Optional)" error={field.state.meta.errors?.[0]}>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  min="0"
                  step="0.5"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const value = e.target.value ? parseFloat(e.target.value) : undefined
                    field.setValue(value)
                  }}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter estimated hours"
                  disabled={isPending}
                />
              </FormField>
            )}
          </form.Field>

          <form.Field
            name="assignedAgent"
            validators={{
              onBlur: ({ value }) => {
                // assignedAgent is optional
                return undefined
              },
            }}
          >
            {(field) => (
              <FormField label="Assign to Agent (Optional)" error={field.state.meta.errors?.[0]}>
                <input
                  id={field.name}
                  name={field.name}
                  type="text"
                  value={field.state.value ?? ''}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value || null)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter agent name or ID"
                  disabled={isPending}
                />
              </FormField>
            )}
          </form.Field>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isPending || validatingName || isError}
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
