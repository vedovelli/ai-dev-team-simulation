import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { HookForm, HookFormInput } from '../index'

const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => Promise<void> | void
  isLoading?: boolean
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const { control, handleSubmit, formState } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onFormSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      setIsSubmitting(true)
      await onSubmit?.(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Sign In</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <HookForm
        onSubmit={handleSubmit(onFormSubmit)}
        submitLabel="Sign In"
        isLoading={isLoading || isSubmitting}
      >
        <HookFormInput
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          required
        />

        <HookFormInput
          control={control}
          name="password"
          label="Password"
          type="password"
          placeholder="Enter your password"
          required
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            {...control.register('rememberMe')}
          />
          <span>Remember me</span>
        </label>
      </HookForm>

      <p className="text-center text-sm text-gray-600 mt-4">
        Don't have an account?{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  )
}
