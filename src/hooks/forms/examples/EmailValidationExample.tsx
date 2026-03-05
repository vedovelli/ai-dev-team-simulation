import { useState } from 'react'
import { useFormValidation } from '../useFormValidation'
import { FormError } from '@/components/Form'

/**
 * Email validation example demonstrating:
 * - Sync validation (format check)
 * - Async validation (uniqueness check with debouncing)
 * - Field dirty state tracking
 * - Multiple error display
 */
export function EmailValidationExample() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { validateField, getFieldErrors, isFieldValidating, markFieldDirty } =
    useFormValidation({
      validators: {
        email: {
          sync: [
            (value) => (!value ? 'Email is required' : true),
            (value) =>
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Invalid email format',
          ],
          async: [
            async (value) => {
              // Simulate API call
              const response = await fetch('/api/validate/email', {
                method: 'POST',
                body: JSON.stringify({ email: value }),
              })
              const { available } = await response.json()
              return available ? true : 'Email already registered'
            },
          ],
          debounce: 500,
        },
      },
    })

  const handleEmailChange = async (value: string) => {
    setEmail(value)
    if (submitted) {
      await validateField('email', value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    markFieldDirty('email')
    const isValid = await validateField('email', email)
    if (isValid) {
      console.log('Form submitted with email:', email)
      setSubmitted(false)
      setEmail('')
    }
  }

  const errors = getFieldErrors('email')
  const isValidating = isFieldValidating('email')

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Email Validation Example</h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="Enter email address"
              className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                errors.length > 0
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {isValidating && (
              <span className="absolute right-3 top-3 text-gray-400">
                <svg className="inline h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            )}
          </div>

          {errors.length > 0 && <FormError errors={errors} variant="inline" />}
        </div>

        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={isValidating}
        >
          Submit
        </button>
      </form>

      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
        <p>
          <strong>Hint:</strong> Try emails like alice@example.com (registered) or
          new@example.com (available)
        </p>
      </div>
    </div>
  )
}
