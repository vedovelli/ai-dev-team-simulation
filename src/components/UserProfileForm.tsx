import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { useState } from 'react'
import { userProfileSchema, type UserProfileInput } from '@/types/forms/user'

interface UserProfileFormProps {
  initialData?: Partial<UserProfileInput>
  onSubmit: (data: UserProfileInput) => Promise<void> | void
  isLoading?: boolean
}

export const UserProfileForm = ({
  initialData,
  onSubmit,
  isLoading = false,
}: UserProfileFormProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UserProfileInput>({
    defaultValues: {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      bio: initialData?.bio ?? '',
      avatarUrl: initialData?.avatarUrl ?? '',
      role: initialData?.role ?? 'user',
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      setSubmitError(null)
      setSubmitSuccess(false)
      try {
        await onSubmit(value)
        setSubmitSuccess(true)
        form.reset()
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error.message : 'Failed to submit form'
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: userProfileSchema,
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

  const validateAvatarUrl = (url: string): string | undefined => {
    if (!url) {
      return undefined
    }
    try {
      new URL(url)
      return undefined
    } catch {
      return 'Avatar URL must be a valid URL'
    }
  }

  const validateBio = (bio: string): string | undefined => {
    if (bio && bio.length > 500) {
      return 'Bio must not exceed 500 characters'
    }
    return undefined
  }

  const validateRole = (role: string): string | undefined => {
    if (!['admin', 'user', 'viewer'].includes(role)) {
      return 'Invalid role selected'
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
        {/* Error Message */}
        {submitError && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{submitError}</p>
          </div>
        )}

        {/* Success Message */}
        {submitSuccess && (
          <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
            <p className="text-green-400 text-sm">Profile updated successfully!</p>
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
                Name *
              </label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="Enter your full name"
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
                Email *
              </label>
              <input
                id={field.name}
                name={field.name}
                type="email"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="user@example.com"
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

        {/* Bio Field */}
        <form.Field
          name="bio"
          validators={{
            onBlur: ({ value }) => validateBio(value ?? ''),
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

        {/* Avatar URL Field */}
        <form.Field
          name="avatarUrl"
          validators={{
            onBlur: ({ value }) => validateAvatarUrl(value ?? ''),
          }}
        >
          {(field) => (
            <div>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium mb-2"
              >
                Avatar URL (Optional)
              </label>
              <input
                id={field.name}
                name={field.name}
                type="url"
                value={field.state.value ?? ''}
                onBlur={field.handleBlur}
                onChange={(e) => field.setValue(e.target.value || undefined)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder:text-slate-400"
                placeholder="https://example.com/avatar.jpg"
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
            onBlur: ({ value }) => validateRole(value),
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
                onChange={(e) => field.setValue(e.target.value as 'admin' | 'user' | 'viewer')}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:border-blue-500 text-white"
                disabled={isLoading || isSubmitting}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
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
