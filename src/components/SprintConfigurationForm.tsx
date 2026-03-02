import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

interface SprintConfigurationFormData {
  name: string
  duration: number
  startDate: string
  endDate: string
  maxPoints: number
  includeBufferDay: boolean
  goals: string
  retrospectiveDate?: string
}

interface SprintConfigurationFormProps {
  initialData?: Partial<SprintConfigurationFormData>
  onSubmit: (data: SprintConfigurationFormData) => Promise<void> | void
  isLoading?: boolean
}

export const SprintConfigurationForm = ({
  initialData,
  onSubmit,
  isLoading = false,
}: SprintConfigurationFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SprintConfigurationFormData>({
    defaultValues: {
      name: initialData?.name ?? '',
      duration: initialData?.duration ?? 14,
      startDate: initialData?.startDate ?? new Date().toISOString().split('T')[0],
      endDate: initialData?.endDate ?? '',
      maxPoints: initialData?.maxPoints ?? 40,
      includeBufferDay: initialData?.includeBufferDay ?? true,
      goals: initialData?.goals ?? '',
      retrospectiveDate: initialData?.retrospectiveDate ?? '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)
      try {
        await onSubmit(value)
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to submit form'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const validateSprintName = (name: string): string | undefined => {
    if (!name || name.trim().length === 0) {
      return 'Sprint name is required'
    }
    if (name.length < 3) {
      return 'Sprint name must be at least 3 characters'
    }
    if (name.length > 100) {
      return 'Sprint name must not exceed 100 characters'
    }
    if (!/^[a-zA-Z0-9\s\-]+$/.test(name)) {
      return 'Sprint name can only contain letters, numbers, spaces, and hyphens'
    }
    return undefined
  }

  const validateDuration = (duration: number): string | undefined => {
    if (duration < 1) {
      return 'Duration must be at least 1 day'
    }
    if (duration > 56) {
      return 'Duration must not exceed 56 days'
    }
    return undefined
  }

  const validateDates = (
    startDate: string,
    endDate: string,
    duration: number
  ): { start?: string; end?: string } => {
    const errors: { start?: string; end?: string } = {}

    if (!startDate) {
      errors.start = 'Start date is required'
    } else {
      const start = new Date(startDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (start < today) {
        errors.start = 'Start date cannot be in the past'
      }
    }

    if (!endDate) {
      errors.end = 'End date is required'
    } else if (startDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end.getTime() - start.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (end <= start) {
        errors.end = 'End date must be after start date'
      } else if (diffDays + 1 !== duration) {
        errors.end = `End date must be ${duration - 1} days after start date`
      }
    }

    return errors
  }

  const validateMaxPoints = (points: number): string | undefined => {
    if (points < 10) {
      return 'Max points must be at least 10'
    }
    if (points > 200) {
      return 'Max points must not exceed 200'
    }
    return undefined
  }

  const validateGoals = (goals: string): string | undefined => {
    if (goals && goals.length > 1000) {
      return 'Goals must not exceed 1000 characters'
    }
    return undefined
  }

  const startDate = form.getFieldValue('startDate')
  const endDate = form.getFieldValue('endDate')
  const duration = form.getFieldValue('duration')
  const dateErrors = validateDates(startDate, endDate, duration)

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-6 bg-slate-800 p-8 rounded-lg"
      >
        {submitError && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}

        {/* Sprint Name Field */}
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) => validateSprintName(value),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Sprint Name
              </label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="e.g., Sprint 8 - Core Features"
                disabled={isLoading || isSubmitting}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Duration Field */}
        <form.Field
          name="duration"
          validators={{
            onBlur: ({ value }) => validateDuration(value),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Sprint Duration (days)
              </label>
              <input
                id={field.name}
                name={field.name}
                type="number"
                min="1"
                max="56"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              />
              <p className="text-xs text-slate-400 mt-1">
                Typical sprints are 7, 14, or 21 days
              </p>
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Start Date Field */}
        <form.Field
          name="startDate"
          validators={{
            onBlur: ({ value }) => {
              if (!value) {
                return 'Start date is required'
              }
              const errors = validateDates(value, endDate, duration)
              return errors.start
            },
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Start Date
              </label>
              <input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
              {dateErrors.start && (
                <p className="text-red-400 text-sm mt-1">{dateErrors.start}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* End Date Field */}
        <form.Field
          name="endDate"
          validators={{
            onBlur: ({ value }) => {
              if (!value) {
                return 'End date is required'
              }
              const errors = validateDates(startDate, value, duration)
              return errors.end
            },
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                End Date
              </label>
              <input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
              {dateErrors.end && (
                <p className="text-red-400 text-sm mt-1">{dateErrors.end}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Max Points Field */}
        <form.Field
          name="maxPoints"
          validators={{
            onBlur: ({ value }) => validateMaxPoints(value),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Max Story Points
              </label>
              <input
                id={field.name}
                name={field.name}
                type="number"
                min="10"
                max="200"
                step="5"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              />
              <p className="text-xs text-slate-400 mt-1">
                Target points to complete during this sprint
              </p>
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Goals Textarea Field */}
        <form.Field
          name="goals"
          validators={{
            onBlur: ({ value }) => validateGoals(value),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Sprint Goals
              </label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="Define key objectives and deliverables for this sprint..."
                rows={4}
                disabled={isLoading || isSubmitting}
              />
              <p className="text-xs text-slate-400 mt-1">
                {field.state.value.length}/1000 characters
              </p>
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Include Buffer Day Checkbox */}
        <form.Field name="includeBufferDay">
          {(field) => (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.setValue(e.target.checked)}
                  className="w-4 h-4 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:border-blue-500 cursor-pointer"
                  disabled={isLoading || isSubmitting}
                />
                <span className="text-sm font-medium">Include Buffer Day</span>
              </label>
              <p className="text-xs text-slate-400 mt-1 ml-7">
                Reserve last day for bug fixes and stabilization
              </p>
            </div>
          )}
        </form.Field>

        {/* Retrospective Date Field */}
        <form.Field
          name="retrospectiveDate"
          validators={{
            onBlur: ({ value }) => {
              if (value && endDate) {
                const retro = new Date(value)
                const end = new Date(endDate)
                if (retro < end) {
                  return 'Retrospective date must be after sprint end date'
                }
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
                Retrospective Date (Optional)
              </label>
              <input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.setValue(e.target.value || undefined)
                }
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? 'Creating Sprint...' : 'Create Sprint'}
          </button>
          <button
            type="reset"
            onClick={() => form.reset()}
            disabled={isLoading || isSubmitting}
            className="flex-1 px-6 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}
