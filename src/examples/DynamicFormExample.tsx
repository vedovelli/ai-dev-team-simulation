import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { Form, TextInput, Select, Checkbox, Textarea } from '@/components/Form'

/**
 * Example showing practical form usage with Zod validation
 *
 * Demonstrates:
 * - Form wrapper component integration
 * - Reusable field components (TextInput, Select, Checkbox, Textarea)
 * - Zod schema validation
 * - Error states and feedback
 * - Multiple field types
 */

// Define validation schema
const signupSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
  role: z
    .string()
    .min(1, 'Role is required'),
  bio: z
    .string()
    .max(500, 'Bio must not exceed 500 characters')
    .optional()
    .default(''),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, {
      message: 'You must agree to the terms and conditions',
    }),
})

type SignupFormData = z.infer<typeof signupSchema>

export function DynamicFormExample() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm<SignupFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      role: '',
      bio: '',
      agreeToTerms: false,
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null)
      setSubmitSuccess(false)

      try {
        // Simulate API call
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to create user')
        }

        setSubmitSuccess(true)
        form.reset()
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : 'An error occurred')
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: signupSchema,
    },
  })

  return (
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Create Account</h1>

      {submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {submitError}
        </div>
      )}

      {submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          Account created successfully!
        </div>
      )}

      <Form<SignupFormData>
        form={form}
        submitLabel="Create Account"
        isLoading={false}
      >
        {/* Full Name Field */}
        <form.Field name="fullName">
          {(field) => (
            <TextInput
              field={field}
              label="Full Name"
              placeholder="John Doe"
              type="text"
            />
          )}
        </form.Field>

        {/* Email Field */}
        <form.Field name="email">
          {(field) => (
            <TextInput
              field={field}
              label="Email Address"
              placeholder="john@example.com"
              type="email"
            />
          )}
        </form.Field>

        {/* Role Field */}
        <form.Field name="role">
          {(field) => (
            <Select
              field={field}
              label="Role"
              placeholder="Select a role"
              options={[
                { value: 'admin', label: 'Administrator' },
                { value: 'user', label: 'User' },
                { value: 'viewer', label: 'Viewer' },
              ]}
            />
          )}
        </form.Field>

        {/* Bio Field */}
        <form.Field name="bio">
          {(field) => (
            <Textarea
              field={field}
              label="Bio (Optional)"
              placeholder="Tell us about yourself..."
              rows={4}
            />
          )}
        </form.Field>

        {/* Terms Agreement */}
        <form.Field name="agreeToTerms">
          {(field) => (
            <Checkbox
              field={field}
              label="I agree to the Terms and Conditions"
              description="Please read our terms before proceeding"
            />
          )}
        </form.Field>
      </Form>
    </div>
  )
}

/**
 * Advanced example with async validation
 * Shows email availability checking
 */
const advancedSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Must be a valid email address'),
})

type AdvancedFormData = z.infer<typeof advancedSchema>

export function FormWithAsyncValidation() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<AdvancedFormData>({
    defaultValues: {
      username: '',
      email: '',
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
    validatorAdapter: zodValidator(),
    validators: {
      onChange: advancedSchema,
      onBlur: async ({ fieldValue, fieldName }) => {
        // Async validation for email availability
        if (fieldName === 'email' && fieldValue) {
          try {
            const response = await fetch('/api/validate/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: fieldValue }),
            })
            const result = await response.json()

            if (!result.available) {
              return result.message || 'Email is not available'
            }
          } catch (error) {
            // Silently fail on network errors for async validation
            console.error('Validation error:', error)
          }
        }

        // Async validation for username availability
        if (fieldName === 'username' && fieldValue) {
          try {
            const response = await fetch('/api/validate/username', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: fieldValue }),
            })
            const result = await response.json()

            if (!result.available) {
              return result.message || 'Username is not available'
            }
          } catch (error) {
            console.error('Validation error:', error)
          }
        }
      },
    },
  })

  return (
    <div className="max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Register with Async Validation</h1>

      <Form<AdvancedFormData>
        form={form}
        submitLabel="Register"
        isLoading={isSubmitting}
      >
        {/* Username with async availability check */}
        <form.Field name="username">
          {(field) => (
            <div className="flex flex-col gap-1">
              <label htmlFor={field.name} className="text-sm font-medium">
                Username
              </label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                placeholder="Choose a username"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {field.state.meta.isValidating && (
                <p className="text-xs text-blue-600">Checking availability...</p>
              )}
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-600">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Email with async availability check */}
        <form.Field name="email">
          {(field) => (
            <div className="flex flex-col gap-1">
              <label htmlFor={field.name} className="text-sm font-medium">
                Email
              </label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="your@email.com"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {field.state.meta.isValidating && (
                <p className="text-xs text-blue-600">Checking availability...</p>
              )}
              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-red-600">{field.state.meta.errors[0]}</p>
              )}
            </div>
          )}
        </form.Field>
      </Form>
    </div>
  )
}
