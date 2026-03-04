/**
 * React Hook Form custom hooks and utilities
 *
 * Provides a reusable abstraction layer over React Hook Form with consistent patterns for:
 * - Form field management (useFormField)
 * - Form submission and loading states (useFormSubmit)
 * - Validation rules and patterns (useValidation, validationRules)
 *
 * @example
 * ```tsx
 * import { useFormField, useFormSubmit, validationRules } from '@/hooks/forms'
 * import { useForm } from 'react-hook-form'
 *
 * function MyForm() {
 *   const { control, handleSubmit, setError } = useForm({
 *     defaultValues: { email: '', password: '' }
 *   })
 *
 *   const { isLoading, error, onSubmit } = useFormSubmit({
 *     handleSubmit,
 *     setError,
 *     onSuccess: async (data) => {
 *       await api.login(data)
 *     }
 *   })
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <input
 *         {...register('email', validationRules.email())}
 *       />
 *       <button type="submit" disabled={isLoading}>
 *         {isLoading ? 'Logging in...' : 'Log in'}
 *       </button>
 *     </form>
 *   )
 * }
 * ```
 */

export { useFormField } from './useFormField'
export { useFormSubmit } from './useFormSubmit'
export { useValidation, validationRules } from './useValidation'
export { ExampleForm } from './ExampleForm'

export type { UseFormSubmitReturn } from './useFormSubmit'
