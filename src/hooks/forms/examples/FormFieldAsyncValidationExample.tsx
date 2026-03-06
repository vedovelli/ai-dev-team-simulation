'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFormField } from '../useFormField'
import { FormErrorBoundary } from '@/components/FormErrorBoundary'

/**
 * Comprehensive example demonstrating form validation infrastructure:
 * - Sync validation (required, minLength, pattern)
 * - Async validation with debouncing (username/email availability)
 * - Error boundary for form submission errors
 * - Real-time feedback during validation
 * - Integration with MSW validation endpoints
 */
export function FormFieldAsyncValidationExample() {
  const { control, handleSubmit } = useForm({
    defaultValues: {
      username: '',
      email: '',
    },
    mode: 'onChange',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<string | null>(null)

  // Username field with async availability check
  const usernameField = useFormField({
    control,
    name: 'username',
    rules: {
      required: 'Username is required',
      minLength: {
        value: 3,
        message: 'Username must be at least 3 characters',
      },
      pattern: {
        value: /^[a-zA-Z0-9_-]+$/,
        message: 'Username can only contain letters, numbers, underscores, and hyphens',
      },
    },
    asyncValidate: async (value: string) => {
      if (!value || value.length < 3) return undefined

      try {
        const response = await fetch('/api/validate/username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: value }),
        })
        const result = await response.json()
        return result.available ? undefined : result.message
      } catch {
        return 'Failed to check username availability'
      }
    },
    asyncValidatorConfig: { debounce: 500 },
  })

  // Email field with async uniqueness check
  const emailField = useFormField({
    control,
    name: 'email',
    rules: {
      required: 'Email is required',
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address',
      },
    },
    asyncValidate: async (value: string) => {
      if (!value || !value.includes('@')) return undefined

      try {
        const response = await fetch('/api/validate/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: value }),
        })
        const result = await response.json()
        return result.available ? undefined : result.message
      } catch {
        return 'Failed to check email availability'
      }
    },
    asyncValidatorConfig: { debounce: 500 },
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSubmitResult(`Successfully created account: ${data.username}`)
    } catch (error) {
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormErrorBoundary>
      <div className="mx-auto max-w-md space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Form Validation Example</h2>
          <p className="mt-1 text-sm text-gray-600">
            Fill out the form below. Async validators run after 500ms debounce to check availability.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Username</label>
            <div className="relative mt-1">
              <input
                {...usernameField.field}
                type="text"
                placeholder="john_doe"
                className={`block w-full rounded-lg border px-4 py-2 outline-none transition-colors ${
                  usernameField.hasError
                    ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />

              {/* Validation Status Indicator */}
              <div className="absolute right-3 top-2.5">
                {usernameField.isValidating ? (
                  <div className="flex items-center space-x-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  </div>
                ) : usernameField.hasError ? (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18.364 5.364l-12.728 12.728M5.364 5.364l12.728 12.728"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : usernameField.field.value ? (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>
            </div>

            {/* Error Display */}
            {usernameField.errorMessage && (
              <p className="mt-1 text-sm text-red-600">{usernameField.errorMessage}</p>
            )}

            {/* Validation Status Message */}
            {usernameField.isValidating && (
              <p className="mt-1 text-sm text-blue-600">Checking availability...</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-900">Email</label>
            <div className="relative mt-1">
              <input
                {...emailField.field}
                type="email"
                placeholder="john@example.com"
                className={`block w-full rounded-lg border px-4 py-2 outline-none transition-colors ${
                  emailField.hasError
                    ? 'border-red-500 bg-red-50 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                }`}
              />

              {/* Validation Status Indicator */}
              <div className="absolute right-3 top-2.5">
                {emailField.isValidating ? (
                  <div className="flex items-center space-x-1">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                  </div>
                ) : emailField.hasError ? (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18.364 5.364l-12.728 12.728M5.364 5.364l12.728 12.728"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : emailField.field.value ? (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </div>
            </div>

            {/* Error Display */}
            {emailField.errorMessage && (
              <p className="mt-1 text-sm text-red-600">{emailField.errorMessage}</p>
            )}

            {/* Validation Status Message */}
            {emailField.isValidating && (
              <p className="mt-1 text-sm text-blue-600">Checking availability...</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              usernameField.hasError ||
              emailField.hasError ||
              usernameField.isValidating ||
              emailField.isValidating
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Success Message */}
        {submitResult && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            <p className="font-medium">Success!</p>
            <p className="mt-1">{submitResult}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-gray-900">Test data:</p>
          <ul className="mt-2 space-y-1">
            <li>• Available usernames: new_user, john_dev, alice123</li>
            <li>• Taken usernames: alice_dev, bob_engineer, carlos_senior</li>
            <li>• Available emails: newemail@example.com</li>
            <li>• Taken emails: alice@example.com, bob@example.com</li>
          </ul>
        </div>
      </div>
    </FormErrorBoundary>
  )
}
