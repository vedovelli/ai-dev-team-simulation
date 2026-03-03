import { useForm } from '@tanstack/react-form'
import { useState } from 'react'

/**
 * Simple example demonstrating TanStack Form usage
 *
 * This example shows:
 * - Setting up a form with default values
 * - Defining field validators
 * - Handling form submission
 * - Displaying field errors
 *
 * @example
 * <FormExample onSuccess={(data) => console.log('Submitted:', data)} />
 */
export function FormExample({ onSuccess }: { onSuccess?: (data: any) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  interface FormData {
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
  }

  const form = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // In real app, would call API here:
        // const response = await fetch('/api/tasks', {
        //   method: 'POST',
        //   body: JSON.stringify(value),
        // })
        // if (!response.ok) throw new Error('Failed to save')

        console.log('Form submitted:', value)
        form.reset()
        onSuccess?.(value)
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <div className="p-6 max-w-md mx-auto bg-white border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Create Task</h2>

      {submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {submitError}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        {/* Title Field */}
        <form.Field
          name="title"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return 'Title is required'
              if (value.length < 3) return 'Title must be at least 3 characters'
              return undefined
            },
          }}
        >
          {(field) => (
            <div>
              <label className="block font-medium mb-1">
                Title
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Enter task title"
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value)}
                onBlur={field.handleBlur}
                className={`w-full p-2 border rounded ${
                  field.state.meta.errors?.length ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Description Field */}
        <form.Field name="description">
          {(field) => (
            <div>
              <label className="block font-medium mb-1">Description</label>
              <textarea
                placeholder="Enter task description (optional)"
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value)}
                rows={4}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
          )}
        </form.Field>

        {/* Priority Field */}
        <form.Field name="priority">
          {(field) => (
            <div>
              <label className="block font-medium mb-1">Priority</label>
              <select
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
        </form.Field>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded font-medium transition ${
            isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Create Task'}
        </button>
      </form>
    </div>
  )
}

/**
 * Example with validation patterns
 *
 * Shows:
 * - Multiple validators per field
 * - Async validation
 * - Cross-field validation
 */
export function FormExampleWithAdvancedValidation() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  interface FormData {
    email: string
    password: string
    confirmPassword: string
  }

  const form = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        console.log('Form submitted:', value)
        form.reset()
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <div className="p-6 max-w-md mx-auto bg-white border rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Register</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        {/* Email with async validation */}
        <form.Field
          name="email"
          validators={{
            onBlur: async ({ value }) => {
              if (!value) return 'Email is required'
              if (!value.includes('@')) return 'Invalid email format'

              // Simulate server validation
              await new Promise((resolve) => setTimeout(resolve, 300))
              if (value === 'taken@example.com') {
                return 'Email already registered'
              }
              return undefined
            },
          }}
        >
          {(field) => (
            <div>
              <label className="block font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value)}
                onBlur={field.handleBlur}
                className={`w-full p-2 border rounded ${
                  field.state.meta.errors?.length ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {field.state.meta.isTouched && field.state.meta.isValidating && (
                <p className="text-blue-500 text-sm mt-1">Checking...</p>
              )}
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Password with multiple validators */}
        <form.Field
          name="password"
          validators={{
            onBlur: ({ value }) => {
              if (!value) return 'Password is required'
              if (value.length < 8) return 'Password must be at least 8 characters'
              if (!/[A-Z]/.test(value)) return 'Must contain uppercase letter'
              if (!/[0-9]/.test(value)) return 'Must contain number'
              return undefined
            },
          }}
        >
          {(field) => (
            <div>
              <label className="block font-medium mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value)}
                onBlur={field.handleBlur}
                className={`w-full p-2 border rounded ${
                  field.state.meta.errors?.length ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <ul className="text-red-500 text-sm mt-1 space-y-1">
                  {field.state.meta.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </form.Field>

        {/* Confirm password with cross-field validation */}
        <form.Field
          name="confirmPassword"
          validators={{
            onBlur: ({ value }) => {
              const password = form.getFieldValue('password')
              if (!value) return 'Please confirm password'
              if (value !== password) return 'Passwords do not match'
              return undefined
            },
          }}
        >
          {(field) => (
            <div>
              <label className="block font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm password"
                value={field.state.value}
                onChange={(e) => field.setValue(e.target.value)}
                onBlur={field.handleBlur}
                className={`w-full p-2 border rounded ${
                  field.state.meta.errors?.length ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 rounded font-medium transition ${
            isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
