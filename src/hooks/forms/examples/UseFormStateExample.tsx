/**
 * Complete example of useFormState hook usage
 *
 * Demonstrates:
 * - Basic form with validation
 * - Async field validation
 * - Server-side error handling
 * - Custom form components
 * - Error states and loading indicators
 */

import { useFormState } from '../useFormState'
import { z } from 'zod'

// Example 1: Simple Login Form
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginFormExample() {
  const { form, handleSubmit, getFieldError, isSubmitting, submitError } =
    useFormState<LoginFormData>({
      defaultValues: {
        email: '',
        password: '',
      },
      schema: loginSchema,
      onSubmit: async (data) => {
        const response = await fetch('/api/forms/login/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        return result.success
          ? { success: true, data: result.data }
          : {
              success: false,
              fieldErrors: result.fieldErrors,
              serverError: result.serverError,
            }
      },
    })

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.state.values.email}
          onChange={(e) => form.setFieldValue('email', e.target.value)}
          onBlur={() => form.validateFieldIfNeeded('email')}
          disabled={isSubmitting}
        />
        {getFieldError('email') && (
          <p className="error-text">{getFieldError('email')}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.state.values.password}
          onChange={(e) => form.setFieldValue('password', e.target.value)}
          onBlur={() => form.validateFieldIfNeeded('password')}
          disabled={isSubmitting}
        />
        {getFieldError('password') && (
          <p className="error-text">{getFieldError('password')}</p>
        )}
      </div>

      {submitError && <div className="error-banner">{submitError}</div>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

// Example 2: Registration Form with Async Validation
const registrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegistrationFormData = z.infer<typeof registrationSchema>

export function RegistrationFormExample() {
  const { form, handleSubmit, getFieldError, isSubmitting, isValidating } =
    useFormState<RegistrationFormData>({
      defaultValues: {
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
      },
      schema: registrationSchema,
      onSubmit: async (data) => {
        const response = await fetch('/api/forms/registration/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        return result.success
          ? { success: true, data: result.data }
          : {
              success: false,
              fieldErrors: result.fieldErrors,
              serverError: result.serverError,
            }
      },
      onAsyncValidate: {
        email: async (email) => {
          if (!email) return undefined

          const response = await fetch('/api/validate/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          const result = await response.json()
          return result.available ? undefined : result.message
        },
        username: async (username) => {
          if (!username) return undefined

          const response = await fetch('/api/validate/username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
          })
          const result = await response.json()
          return result.available ? undefined : result.message
        },
      },
    })

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.state.values.email}
          onChange={(e) => form.setFieldValue('email', e.target.value)}
          disabled={isSubmitting}
        />
        {isValidating && <p className="validating">Checking availability...</p>}
        {getFieldError('email') && (
          <p className="error-text">{getFieldError('email')}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={form.state.values.username}
          onChange={(e) => form.setFieldValue('username', e.target.value)}
          disabled={isSubmitting}
        />
        {isValidating && <p className="validating">Checking availability...</p>}
        {getFieldError('username') && (
          <p className="error-text">{getFieldError('username')}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.state.values.password}
          onChange={(e) => form.setFieldValue('password', e.target.value)}
          disabled={isSubmitting}
        />
        {getFieldError('password') && (
          <p className="error-text">{getFieldError('password')}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={form.state.values.confirmPassword}
          onChange={(e) => form.setFieldValue('confirmPassword', e.target.value)}
          disabled={isSubmitting}
        />
        {getFieldError('confirmPassword') && (
          <p className="error-text">{getFieldError('confirmPassword')}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting || isValidating}>
        {isSubmitting ? 'Creating account...' : 'Register'}
      </button>
    </form>
  )
}

// Example 3: Profile Update Form
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileFormExample() {
  const { form, handleSubmit, getFieldError, isSubmitting, submitError, reset } =
    useFormState<ProfileFormData>({
      defaultValues: {
        name: 'John Doe',
        bio: 'Developer and designer',
        website: '',
      },
      schema: profileSchema,
      onSubmit: async (data) => {
        const response = await fetch('/api/forms/profile/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        const result = await response.json()

        return result.success
          ? { success: true, data: result.data }
          : {
              success: false,
              fieldErrors: result.fieldErrors,
              serverError: result.serverError,
            }
      },
      onError: (error) => {
        console.error('Profile update error:', error)
        // Could show toast notification here
      },
    })

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }}>
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={form.state.values.name}
          onChange={(e) => form.setFieldValue('name', e.target.value)}
          disabled={isSubmitting}
        />
        {getFieldError('name') && (
          <p className="error-text">{getFieldError('name')}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          value={form.state.values.bio}
          onChange={(e) => form.setFieldValue('bio', e.target.value)}
          disabled={isSubmitting}
          rows={4}
        />
        <p className="char-count">
          {form.state.values.bio.length} / 500 characters
        </p>
        {getFieldError('bio') && (
          <p className="error-text">{getFieldError('bio')}</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="url"
          value={form.state.values.website}
          onChange={(e) => form.setFieldValue('website', e.target.value)}
          disabled={isSubmitting}
          placeholder="https://example.com"
        />
        {getFieldError('website') && (
          <p className="error-text">{getFieldError('website')}</p>
        )}
      </div>

      {submitError && <div className="error-banner">{submitError}</div>}

      <div className="button-group">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        <button type="button" onClick={() => reset()} disabled={isSubmitting}>
          Reset
        </button>
      </div>
    </form>
  )
}

// Export all examples
export const useFormStateExamples = {
  LoginFormExample,
  RegistrationFormExample,
  ProfileFormExample,
}
