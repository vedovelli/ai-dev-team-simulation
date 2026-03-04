/**
 * Form hooks and utilities
 *
 * Provides reusable abstraction layers for form handling:
 * - React Hook Form: useFormField, useFormSubmit, useValidation, validationRules, ExampleForm
 * - TanStack Form: useLoginForm, useFilterForm, useCrudForm
 *
 * React Hook Form is used for traditional form patterns with fine-grained control.
 * TanStack Form is used for more complex patterns like filter forms and CRUD operations.
 *
 * @example
 * ```tsx
 * // TanStack Form example
 * import { useLoginForm } from '@/hooks/forms'
 *
 * function LoginPage() {
 *   const form = useLoginForm({
 *     onSubmit: async (data) => {
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
 *         <span>{form.state.errors.email}</span>
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

// React Hook Form exports
export { useFormField } from './useFormField'
export { useFormSubmit } from './useFormSubmit'
export { useValidation, validationRules } from './useValidation'
export { ExampleForm } from './ExampleForm'

// TanStack Form exports
export { useLoginForm } from './useLoginForm'
export { useFilterForm } from './useFilterForm'
export { useCrudForm } from './useCrudForm'

export type { UseFormSubmitReturn } from './useFormSubmit'
export type { LoginFormData } from './useLoginForm'
export type { FilterFormData } from './useFilterForm'
export type { CrudFormMode } from './useCrudForm'
