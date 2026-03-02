import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import type { AgentRole, AgentStatus } from '../types/agent'

interface AgentProfileFormData {
  name: string
  role: AgentRole
  email: string
  startDate: string
  isActive: boolean
  bio?: string
  status: AgentStatus
}

interface AgentProfileFormProps {
  initialData?: Partial<AgentProfileFormData>
  onSubmit: (data: AgentProfileFormData) => Promise<void> | void
  isLoading?: boolean
}

export const AgentProfileForm = ({
  initialData,
  onSubmit,
  isLoading = false,
}: AgentProfileFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AgentProfileFormData>({
    defaultValues: {
      name: initialData?.name ?? '',
      role: initialData?.role ?? 'junior',
      email: initialData?.email ?? '',
      startDate: initialData?.startDate ?? new Date().toISOString().split('T')[0],
      isActive: initialData?.isActive ?? true,
      bio: initialData?.bio ?? '',
      status: initialData?.status ?? 'idle',
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

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    return undefined
  }

  const validateName = (name: string): string | undefined => {
    if (!name || name.trim().length === 0) {
      return 'Name is required'
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters'
    }
    if (name.length > 100) {
      return 'Name must not exceed 100 characters'
    }
    return undefined
  }

  const validateStartDate = (date: string): string | undefined => {
    if (!date) {
      return 'Start date is required'
    }
    const selectedDate = new Date(date)
    if (selectedDate > new Date()) {
      return 'Start date cannot be in the future'
    }
    return undefined
  }

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

        {/* Name Field */}
        <form.Field
          name="name"
          validators={{
            onBlur: ({ value }) => validateName(value),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Full Name
              </label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="Enter full name"
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

        {/* Email Field */}
        <form.Field
          name="email"
          validators={{
            onBlur: ({ value }) => validateEmail(value),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Email Address
              </label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="agent@example.com"
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

        {/* Role Select Field */}
        <form.Field
          name="role"
          validators={{
            onBlur: ({ value }) => {
              if (!value) {
                return 'Role is required'
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
                Role
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value as AgentRole)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              >
                <option value="junior">Junior Developer</option>
                <option value="sr-dev">Senior Developer</option>
                <option value="pm">Product Manager</option>
              </select>
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
            onBlur: ({ value }) => validateStartDate(value),
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
            </div>
          )}
        </form.Field>

        {/* Status Select Field */}
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
                Current Status
              </label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value as AgentStatus)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              >
                <option value="idle">Idle</option>
                <option value="working">Working</option>
                <option value="blocked">Blocked</option>
                <option value="completed">Completed</option>
              </select>
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Bio Textarea Field */}
        <form.Field
          name="bio"
          validators={{
            onBlur: ({ value }) => {
              if (value && value.length > 500) {
                return 'Bio must not exceed 500 characters'
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
                Bio (Optional)
              </label>
              <textarea
                id={field.name}
                name={field.name}
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value || undefined)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="Tell us about yourself..."
                rows={4}
                disabled={isLoading || isSubmitting}
              />
              <p className="text-xs text-slate-400 mt-1">
                {field.state.value?.length ?? 0}/500 characters
              </p>
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-400 text-sm mt-1">
                  {field.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* Is Active Checkbox */}
        <form.Field
          name="isActive"
          validators={{
            onBlur: ({ value }) => {
              if (!value && form.getFieldValue('status') !== 'idle') {
                return 'Cannot deactivate an agent that is not idle'
              }
              return undefined
            },
          }}
        >
          {(field) => (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.setValue(e.target.checked)}
                  className="w-4 h-4 bg-slate-700 border border-slate-600 rounded focus:outline-none focus:border-blue-500 cursor-pointer"
                  disabled={isLoading || isSubmitting}
                />
                <span className="text-sm font-medium">Active Agent</span>
              </label>
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
            {isSubmitting ? 'Saving...' : 'Save Profile'}
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
