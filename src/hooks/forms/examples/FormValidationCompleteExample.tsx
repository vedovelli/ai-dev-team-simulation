import { useState } from 'react'
import { z } from 'zod'
import { useFormValidation } from '../useFormValidation'
import { FormError } from '@/components/Form'

/**
 * Complete form validation example demonstrating:
 * - Multiple field validations
 * - Combination of sync and async validators
 * - Schema validation with Zod
 * - Form-level validation
 * - Proper error handling and display
 */

const registrationSchema = z
  .object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

interface FormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export function FormValidationCompleteExample() {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [success, setSuccess] = useState(false)

  const { validateForm, validateField, getFieldErrors, markFieldDirty, clearErrors } =
    useFormValidation<FormData>({
      schema: registrationSchema,
      validators: {
        username: {
          sync: [
            (value) => (!value ? 'Username is required' : true),
            (value) =>
              /^[a-zA-Z0-9_-]{3,20}$/.test(value)
                ? true
                : 'Username must be 3-20 characters (alphanumeric, _, -)',
          ],
          async: [
            async (value) => {
              const response = await fetch('/api/validate/username', {
                method: 'POST',
                body: JSON.stringify({ username: value }),
              })
              const { available } = await response.json()
              return available ? true : 'Username already taken'
            },
          ],
          debounce: 400,
        },
        email: {
          sync: [
            (value) => (!value ? 'Email is required' : true),
            (value) =>
              /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? true : 'Invalid email format',
          ],
          async: [
            async (value) => {
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
        password: {
          sync: [
            (value) => (!value ? 'Password is required' : true),
            (value) => (value.length < 8 ? 'Minimum 8 characters' : true),
            (value) =>
              !/[A-Z]/.test(value) ? 'Must contain uppercase letters' : true,
            (value) => (!/[a-z]/.test(value) ? 'Must contain lowercase letters' : true),
            (value) => (!/\d/.test(value) ? 'Must contain numbers' : true),
          ],
        },
        confirmPassword: {
          sync: [
            (value) => (!value ? 'Confirm password is required' : true),
            (value) =>
              value !== formData.password
                ? 'Passwords do not match'
                : true,
          ],
        },
      },
    })

  const handleFieldChange = async (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (submitted) {
      await validateField(field, value)
    }
  }

  const handleFieldBlur = (field: keyof FormData) => {
    markFieldDirty(field)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setSuccess(false)
    clearErrors()

    const isValid = await validateForm(formData)
    if (isValid) {
      // Simulate API call
      console.log('Form submitted:', formData)
      setSuccess(true)
      setFormData({ username: '', email: '', password: '', confirmPassword: '' })
      setSubmitted(false)
    }
  }

  const fields = (['username', 'email', 'password', 'confirmPassword'] as const).map(
    (field) => ({
      name: field,
      label:
        field === 'confirmPassword'
          ? 'Confirm Password'
          : field.charAt(0).toUpperCase() + field.slice(1),
      type:
        field === 'password' || field === 'confirmPassword' ? 'password' : 'text',
      errors: getFieldErrors(field),
    }),
  )

  return (
    <div className="mx-auto max-w-md space-y-4">
      <h2 className="text-2xl font-bold">Register Account</h2>

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-green-800">
          ✓ Account created successfully! Check your email to verify.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            <input
              type={field.type}
              value={formData[field.name]}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              onBlur={() => handleFieldBlur(field.name)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                field.errors.length > 0
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {field.errors.length > 0 && (
              <FormError errors={field.errors} variant="inline" />
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          disabled={submitted}
        >
          {submitted ? 'Validating...' : 'Create Account'}
        </button>
      </form>

      <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
        <p>
          <strong>Demo accounts:</strong> Try usernames like alice_dev (taken) or
          new_user (available)
        </p>
        <p className="mt-1">
          <strong>Demo emails:</strong> alice@example.com (registered) or new@example.com
          (available)
        </p>
      </div>
    </div>
  )
}
