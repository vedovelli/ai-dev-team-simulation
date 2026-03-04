import { useLoginForm, type LoginFormData } from '../useLoginForm'
import { useState } from 'react'

/**
 * Example component demonstrating useLoginForm hook
 * Shows email/password validation with error handling
 */
export function LoginFormExample() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const form = useLoginForm({
    onSubmit: async (data: LoginFormData) => {
      try {
        setIsSubmitting(true)
        setSubmitError(null)
        setSuccessMessage(null)

        // Simulate API call to MSW mock login endpoint
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Login failed')
        }

        setSuccessMessage('Login successful!')
        form.reset()
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'An error occurred',
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="max-w-md mx-auto space-y-4"
    >
      <h2 className="text-2xl font-bold">Login</h2>

      {submitError && (
        <div className="bg-red-50 text-red-700 p-3 rounded" role="alert">
          {submitError}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 text-green-700 p-3 rounded" role="alert">
          {successMessage}
        </div>
      )}

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={form.state.values.email}
          onChange={(e) => form.setFieldValue('email', e.target.value)}
          onBlur={() => form.validateFieldIfNeeded('email')}
          className={`w-full px-3 py-2 border rounded ${
            form.state.fieldMeta('email')?.errors?.length
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
        />
        {form.state.fieldMeta('email')?.errors?.length > 0 && (
          <span className="text-red-500 text-sm mt-1">
            {form.state.fieldMeta('email')?.errors?.[0]}
          </span>
        )}
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={form.state.values.password}
          onChange={(e) => form.setFieldValue('password', e.target.value)}
          onBlur={() => form.validateFieldIfNeeded('password')}
          className={`w-full px-3 py-2 border rounded ${
            form.state.fieldMeta('password')?.errors?.length
              ? 'border-red-500'
              : 'border-gray-300'
          }`}
        />
        {form.state.fieldMeta('password')?.errors?.length > 0 && (
          <span className="text-red-500 text-sm mt-1">
            {form.state.fieldMeta('password')?.errors?.[0]}
          </span>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || !form.state.isValid}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
