import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'
import { useCreateSprint, type CreateSprintInput, type Task } from '../hooks/useCreateSprint'
import { useToast } from './Toast'
import { useCallback } from 'react'

interface FormFields {
  name: string
  goals: string
  tasks: Task[]
  estimatedPoints: string
}

const MAX_TASKS = 15

export const SprintPlanningForm = () => {
  const router = useRouter()
  const { showToast } = useToast()
  const { mutate, isPending } = useCreateSprint()

  const form = useForm<FormFields>({
    defaultValues: {
      name: '',
      goals: '',
      tasks: [{ title: '', assignee: '', storyPoints: 0 }],
      estimatedPoints: '',
    },
    onSubmit: async ({ value }) => {
      try {
        const data: CreateSprintInput = {
          name: value.name,
          goals: value.goals,
          tasks: value.tasks.filter((task) => task.title.trim().length > 0),
          estimatedPoints: parseInt(value.estimatedPoints, 10),
        }

        mutate(data, {
          onSuccess: () => {
            showToast('Sprint created successfully!', 'success')
            router.navigate({ to: '/sprints' })
          },
          onError: () => {
            showToast('Failed to create sprint', 'error')
          },
        })
      } catch (error) {
        showToast('An error occurred', 'error')
      }
    },
  })

  const taskFieldInfo = form.useStore((state) => ({
    values: state.values.tasks,
  }))

  const addTask = useCallback(() => {
    if (taskFieldInfo.values.length < MAX_TASKS) {
      form.pushFieldValue('tasks', { title: '', assignee: '', storyPoints: 0 })
    }
  }, [form, taskFieldInfo.values.length])

  const removeTask = useCallback(
    (index: number) => {
      if (taskFieldInfo.values.length > 1) {
        form.removeFieldValue('tasks', index)
      }
    },
    [form, taskFieldInfo.values.length],
  )

  const isAtMaxTasks = taskFieldInfo.values.length >= MAX_TASKS

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Plan New Sprint</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="space-y-6 bg-slate-800 p-8 rounded-lg"
        >
          {/* Sprint Name */}
          <form.Field
            name="name"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Sprint name is required'
                }
                if (value.length < 2) {
                  return 'Sprint name must be at least 2 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium mb-2">
                  Sprint Name
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="e.g., Sprint 1 - Q1 Goals"
                  disabled={isPending}
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Sprint Goals */}
          <form.Field
            name="goals"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Sprint goals are required'
                }
                if (value.length < 5) {
                  return 'Sprint goals must be at least 5 characters'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium mb-2">
                  Sprint Goals
                </label>
                <textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Describe the goals for this sprint"
                  rows={3}
                  disabled={isPending}
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Tasks Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Tasks</h2>
              {isAtMaxTasks && (
                <p className="text-yellow-400 text-sm">Maximum 15 tasks reached</p>
              )}
            </div>

            <div className="space-y-3">
              <form.Field name="tasks">
                {(field) => (
                  <>
                    {field.state.value.map((_, index) => (
                      <div key={index} className="flex gap-3">
                        {/* Task Title */}
                        <form.Field
                          name={`tasks.${index}.title`}
                          validators={{
                            onBlur: ({ value }) => {
                              if (value && value.trim().length < 2) {
                                return 'Task title must be at least 2 characters'
                              }
                              return undefined
                            },
                          }}
                        >
                          {(titleField) => (
                            <div className="flex-1">
                              <input
                                name={titleField.name}
                                value={titleField.state.value}
                                onBlur={titleField.handleBlur}
                                onChange={(e) => titleField.setValue(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                                placeholder="Task title"
                                disabled={isPending}
                              />
                              {titleField.state.meta.errors &&
                                titleField.state.meta.errors.length > 0 && (
                                  <p className="text-red-400 text-xs mt-1">
                                    {titleField.state.meta.errors[0]}
                                  </p>
                                )}
                            </div>
                          )}
                        </form.Field>

                        {/* Assignee */}
                        <form.Field name={`tasks.${index}.assignee`}>
                          {(assigneeField) => (
                            <div className="w-32">
                              <input
                                name={assigneeField.name}
                                value={assigneeField.state.value}
                                onChange={(e) => assigneeField.setValue(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                                placeholder="Assignee"
                                disabled={isPending}
                              />
                            </div>
                          )}
                        </form.Field>

                        {/* Story Points */}
                        <form.Field
                          name={`tasks.${index}.storyPoints`}
                          validators={{
                            onBlur: ({ value }) => {
                              if (typeof value === 'number') {
                                if (value < 0) {
                                  return 'Story points must be positive'
                                }
                                if (value > 100) {
                                  return 'Story points cannot exceed 100'
                                }
                              }
                              return undefined
                            },
                          }}
                        >
                          {(pointsField) => (
                            <div className="w-24">
                              <input
                                name={pointsField.name}
                                type="number"
                                value={pointsField.state.value}
                                onBlur={pointsField.handleBlur}
                                onChange={(e) =>
                                  pointsField.setValue(parseInt(e.target.value, 10) || 0)
                                }
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white text-sm"
                                placeholder="Points"
                                min="0"
                                max="100"
                                disabled={isPending}
                              />
                              {pointsField.state.meta.errors &&
                                pointsField.state.meta.errors.length > 0 && (
                                  <p className="text-red-400 text-xs mt-1">
                                    {pointsField.state.meta.errors[0]}
                                  </p>
                                )}
                            </div>
                          )}
                        </form.Field>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          disabled={isPending || field.state.value.length === 1}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 rounded-lg text-sm transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </form.Field>
            </div>

            {/* Add Task Button */}
            <button
              type="button"
              onClick={addTask}
              disabled={isPending || isAtMaxTasks}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              + Add Task
            </button>
          </div>

          {/* Estimated Points */}
          <form.Field
            name="estimatedPoints"
            validators={{
              onBlur: ({ value }) => {
                if (!value || value.trim().length === 0) {
                  return 'Estimated points is required'
                }
                const num = parseInt(value, 10)
                if (isNaN(num)) {
                  return 'Estimated points must be a number'
                }
                if (num < 0) {
                  return 'Estimated points must be positive'
                }
                if (num > 10000) {
                  return 'Estimated points cannot exceed 10,000'
                }
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className="block text-sm font-medium mb-2">
                  Estimated Total Points
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                  placeholder="Enter estimated total points"
                  min="0"
                  max="10000"
                  disabled={isPending}
                />
                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                  <p className="text-red-400 text-sm mt-1">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Sprint'}
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
