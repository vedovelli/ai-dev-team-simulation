import { useCrudForm, type CrudFormMode } from '../useCrudForm'
import { z } from 'zod'
import { useState } from 'react'

/**
 * Schema for user CRUD form
 */
const userSchema = z.object({
  name: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().default(''),
  bio: z.string().optional().default(''),
})

type UserFormData = z.infer<typeof userSchema>

interface CrudFormExampleProps {
  initialData?: UserFormData
  userId?: string
}

/**
 * Example component demonstrating useCrudForm hook
 * Shows create/update mode handling with field-level validation
 */
export function CrudFormExample({ initialData, userId }: CrudFormExampleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [mode, setMode] = useState<CrudFormMode>(userId ? 'update' : 'create')

  const form = useCrudForm({
    schema: userSchema,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
    },
    initialData,
    mode,
    onSubmit: async (data: UserFormData, formMode: CrudFormMode) => {
      try {
        setIsSubmitting(true)
        setSubmitError(null)
        setSuccessMessage(null)

        const endpoint =
          formMode === 'create'
            ? '/api/users'
            : `/api/users/${userId}`

        const method = formMode === 'create' ? 'POST' : 'PUT'

        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || `Failed to ${formMode} user`)
        }

        const successMsg =
          formMode === 'create'
            ? 'User created successfully!'
            : 'User updated successfully!'
        setSuccessMessage(successMsg)

        if (formMode === 'create') {
          form.reset()
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'An error occurred',
        )
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  const handleModeChange = (newMode: CrudFormMode) => {
    setMode(newMode)
    if (newMode === 'create') {
      form.reset()
    } else if (initialData) {
      // Reset to initial data for update mode
      Object.entries(initialData).forEach(([key, value]) => {
        form.setFieldValue(key as keyof UserFormData, value)
      })
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange('create')}
          className={`px-4 py-2 rounded ${
            mode === 'create'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => handleModeChange('update')}
          disabled={!userId}
          className={`px-4 py-2 rounded ${
            mode === 'update'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          } disabled:opacity-50`}
        >
          Update
        </button>
      </div>

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

      <form
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold">
          {mode === 'create' ? 'Create User' : 'Edit User'}
        </h2>

        {/* Name field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name *
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            value={form.state.values.name}
            onChange={(e) => form.setFieldValue('name', e.target.value)}
            onBlur={() => form.validateFieldIfNeeded('name')}
            className={`w-full px-3 py-2 border rounded ${
              form.state.fieldMeta('name')?.errors?.length
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
          />
          {form.state.fieldMeta('name')?.errors?.length > 0 && (
            <span className="text-red-500 text-sm mt-1">
              {form.state.fieldMeta('name')?.errors?.[0]}
            </span>
          )}
        </div>

        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            placeholder="john@example.com"
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

        {/* Phone field (optional) */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={form.state.values.phone}
            onChange={(e) => form.setFieldValue('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* Bio field (optional) */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={form.state.values.bio}
            onChange={(e) => form.setFieldValue('bio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
            rows={4}
          />
        </div>

        {/* Form state info */}
        {mode === 'update' && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {form.state.isDirty ? (
              <span className="text-blue-600">Form has been modified</span>
            ) : (
              <span>No changes made</span>
            )}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || !form.state.isValid}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
        </button>
      </form>
    </div>
  )
}
