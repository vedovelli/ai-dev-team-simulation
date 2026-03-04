import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

/**
 * Validation schema for login form
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginFormData = z.infer<typeof loginSchema>

interface UseLoginFormOptions {
  onSubmit: (data: LoginFormData) => Promise<void>
}

/**
 * Custom hook for login form with email/password validation
 * Integrates with MSW mock for auth endpoint
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   const form = useLoginForm({
 *     onSubmit: async (data) => {
 *       // Make API call
 *       await api.login(data)
 *     }
 *   })
 *
 *   return (
 *     <form
 *       onSubmit={(e) => {
 *         e.preventDefault()
 *         form.handleSubmit()
 *       }}
 *     >
 *       {form.state.errors?.email && (
 *         <span>{form.state.errors.email[0]}</span>
 *       )}
 *       <input
 *         type="email"
 *         value={form.state.values.email}
 *         onChange={(e) =>
 *           form.setFieldValue('email', e.target.value)
 *         }
 *       />
 *       <button type="submit">Login</button>
 *     </form>
 *   )
 * }
 * ```
 */
export function useLoginForm({ onSubmit }: UseLoginFormOptions) {
  return useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: loginSchema,
      onChangeAsync: loginSchema,
      onBlur: loginSchema,
    },
  })
}
