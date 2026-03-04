import { useForm } from 'react-hook-form'
import { useFormField } from './useFormField'
import { useFormSubmit } from './useFormSubmit'
import { validationRules } from './useValidation'

interface ExampleFormData {
  name: string
  email: string
  password: string
  website?: string
}

/**
 * Example form component demonstrating the custom form hooks pattern.
 * Shows how to combine useForm, useFormField, useFormSubmit, and validationRules
 * for a complete form solution.
 *
 * @example
 * ```tsx
 * <ExampleForm
 *   onSuccess={(data) => {
 *     console.log('Form submitted:', data)
 *     // Handle successful submission
 *   }}
 * />
 * ```
 */
export function ExampleForm({
  onSuccess,
}: {
  onSuccess?: (data: ExampleFormData) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<ExampleFormData>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      website: '',
    },
  })

  const { isLoading, error, onSubmit } = useFormSubmit({
    handleSubmit,
    setError,
    onSuccess: async (data) => {
      // Example: send data to API
      console.log('Submitting form data:', data)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (onSuccess) {
        await onSuccess(data)
      }
    },
    onError: (error) => {
      console.error('Form submission error:', error)
    },
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded" role="alert">
          {error}
        </div>
      )}

      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register('name', validationRules.required('Name'))}
          className={`w-full px-3 py-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="John Doe"
        />
        {errors.name && <span className="text-red-500 text-sm mt-1">{errors.name.message}</span>}
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', validationRules.email())}
          className={`w-full px-3 py-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="john@example.com"
        />
        {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email.message}</span>}
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password', validationRules.password())}
          className={`w-full px-3 py-2 border rounded ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="••••••••"
        />
        {errors.password && (
          <span className="text-red-500 text-sm mt-1">{errors.password.message}</span>
        )}
      </div>

      {/* Website field (optional) */}
      <div>
        <label htmlFor="website" className="block text-sm font-medium mb-1">
          Website (Optional)
        </label>
        <input
          id="website"
          type="url"
          {...register('website')}
          className="w-full px-3 py-2 border border-gray-300 rounded"
          placeholder="https://example.com"
        />
        {errors.website && (
          <span className="text-red-500 text-sm mt-1">{errors.website.message}</span>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Saving...' : 'Submit'}
      </button>
    </form>
  )
}
